import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getUserOrganization } from "@/lib/billing";

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

    const organization = await getUserOrganization(user.id);
    if (!organization?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found." },
        { status: 400 },
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: `${new URL(request.url).origin}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to open the billing portal." },
      { status: 500 },
    );
  }
}
