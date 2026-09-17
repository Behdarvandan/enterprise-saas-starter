import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureOrganization } from "@/lib/billing";
import { getPaymentAdapter } from "@/lib/payment/adapter";
import { getPlans } from "@/lib/plans";
import { getPricingRegion } from "@/lib/geo";
import { firstIssueMessage } from "@/lib/validation";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiErrorHandling } from "@/lib/api-error";

const checkoutSchema = z.object({
  tier: z.enum(["starter", "pro"]),
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

    const { tier } = parsedBody.data;

    // The region — and therefore the plan's price/provider — is re-derived
    // server-side from the request's own geo header, never trusted from the
    // client. This is also what closes the plan/checkout amount to a fixed,
    // canonical server-side value instead of accepting a client-supplied
    // price or amount.
    const region = await getPricingRegion();
    const plan = getPlans(region).find((candidate) => candidate.tier === tier);

    if (!plan || plan.checkout.kind === "contact") {
      return NextResponse.json(
        { error: "This plan is not available for self-service checkout." },
        { status: 400 },
      );
    }

    const organization = await ensureOrganization(user);
    if (!organization) {
      return NextResponse.json(
        { error: "Could not determine your organization." },
        { status: 400 },
      );
    }

    const { checkout } = plan;
    const origin = new URL(request.url).origin;

    if (checkout.kind === "stripe" && !checkout.priceId) {
      return NextResponse.json(
        { error: "This plan is not configured for checkout yet." },
        { status: 500 },
      );
    }

    // Customer provisioning (Stripe-specific) happens inside the adapter;
    // this route only decides whether the resulting id needs to be saved.
    const result = await getPaymentAdapter(checkout.kind).createCheckoutSession({
      mode: "subscription",
      priceId: checkout.kind === "stripe" ? checkout.priceId : undefined,
      amount: checkout.amount,
      currency: checkout.currency,
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
