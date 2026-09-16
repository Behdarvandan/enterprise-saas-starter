import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureOrganization } from "@/lib/billing";
import { getPaymentAdapter, resolvePaymentProvider } from "@/lib/payment/adapter";
import { firstIssueMessage } from "@/lib/validation";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiErrorHandling } from "@/lib/api-error";

const checkoutSchema = z.object({
  priceId: z.string().min(1, "A valid priceId is required."),
  amount: z.number().positive().optional(),
});

export const POST = withApiErrorHandling(
  "Checkout error",
  "Failed to start checkout.",
  async (request: Request) => {
    const auth = await requireUserOrResponse();
    if ("response" in auth) return auth.response;
    const { user, supabase } = auth;

    const parsedBody = checkoutSchema.safeParse(
      await request.json().catch(() => null),
    );

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: firstIssueMessage(parsedBody.error) },
        { status: 400 },
      );
    }

    const { priceId } = parsedBody.data;
    const amount = parsedBody.data.amount ?? null;

    const organization = await ensureOrganization(user);
    if (!organization) {
      return NextResponse.json(
        { error: "Could not determine your organization." },
        { status: 400 },
      );
    }

    const provider = resolvePaymentProvider();
    const origin = new URL(request.url).origin;

    // PayTR has no native subscription API, so a plan purchase is a one-time
    // activation charge that requires an explicit amount in minor units.
    if (provider === "paytr" && !amount) {
      return NextResponse.json(
        { error: "PayTR plan activation requires an amount in minor units." },
        { status: 400 },
      );
    }

    // Customer provisioning (Stripe-specific) happens inside the adapter;
    // this route only decides whether the resulting id needs to be saved.
    const result = await getPaymentAdapter(provider).createCheckoutSession({
      mode: "subscription",
      priceId,
      amount,
      organizationId: organization.id,
      existingCustomerId: organization.provider_customer_id,
      customerEmail: user.email,
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=canceled`,
    });

    // Persist a newly-provisioned provider customer id. This uses the
    // caller's own RLS-scoped client rather than the service-role client:
    // `ensureOrganization()` only ever returns an organization the caller
    // already belongs to (or one it just created and owns), and
    // `organizations_update_admin` grants owners/admins update access.
    if (result.customerId && result.customerId !== organization.provider_customer_id) {
      await supabase
        .from("organizations")
        .update({ provider_customer_id: result.customerId })
        .eq("id", organization.id);
    }

    return NextResponse.json({ url: result.url });
  },
);
