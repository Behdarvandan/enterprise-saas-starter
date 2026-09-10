import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { ensureOrganization } from "@/lib/billing";

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

    const { priceId } = await request.json();
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json(
        { error: "A valid priceId is required." },
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

    const stripe = getStripe();

    // Create or reuse the organization's Stripe customer.
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: organization.id,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { organization_id: organization.id },
      },
      success_url: `${new URL(request.url).origin}/dashboard?checkout=success`,
      cancel_url: `${new URL(request.url).origin}/pricing?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout." },
      { status: 500 },
    );
  }
}
