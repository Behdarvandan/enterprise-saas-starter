import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { ensureOrganization } from "@/lib/billing";
import { getPaymentAdapter, resolvePaymentProvider } from "@/lib/payment/adapter";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      priceId?: unknown;
      amount?: unknown;
    } | null;

    const priceId = typeof body?.priceId === "string" ? body.priceId : "";
    if (!priceId) {
      return NextResponse.json(
        { error: "A valid priceId is required." },
        { status: 400 },
      );
    }

    const amount =
      typeof body?.amount === "number" && body.amount > 0 ? body.amount : null;

    const organization = await ensureOrganization(user);
    if (!organization) {
      return NextResponse.json(
        { error: "Could not determine your organization." },
        { status: 400 },
      );
    }

    const provider = resolvePaymentProvider();
    const origin = new URL(request.url).origin;

    // Stripe subscription checkout needs a reusable customer; other providers
    // skip customer provisioning.
    let existingCustomerId: string | null = null;
    if (provider === "stripe") {
      const stripe = getStripe();

      let customerId = organization.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email ?? undefined,
          metadata: { organization_id: organization.id },
        });
        customerId = customer.id;

        const admin = createAdminClient();
        await admin
          .from("organizations")
          .update({ stripe_customer_id: customerId })
          .eq("id", organization.id);
      }
      existingCustomerId = customerId;
    }

    // PayTR has no native subscription API, so a plan purchase is a one-time
    // activation charge that requires an explicit amount in minor units.
    if (provider === "paytr" && !amount) {
      return NextResponse.json(
        { error: "PayTR plan activation requires an amount in minor units." },
        { status: 400 },
      );
    }

    const result = await getPaymentAdapter(provider).createCheckoutSession({
      mode: "subscription",
      priceId,
      amount,
      organizationId: organization.id,
      existingCustomerId,
      customerEmail: user.email,
      successUrl: `${origin}/dashboard?checkout=success`,
      cancelUrl: `${origin}/pricing?checkout=canceled`,
    });

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout." },
      { status: 500 },
    );
  }
}

