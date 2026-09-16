import { NextResponse } from "next/server";
import { getUserOrganization } from "@/lib/billing";
import { getPaymentAdapter, UnsupportedFeatureError } from "@/lib/payment/adapter";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiErrorHandling } from "@/lib/api-error";

export const POST = withApiErrorHandling(
  "Billing portal error",
  "Failed to open the billing portal.",
  async (request: Request) => {
    const auth = await requireUserOrResponse();
    if ("response" in auth) return auth.response;
    const { user } = auth;

    const organization = await getUserOrganization(user.id);
    if (!organization?.provider_customer_id) {
      return NextResponse.json(
        { error: "No billing account found." },
        { status: 400 },
      );
    }

    try {
      const session = await getPaymentAdapter().createBillingPortalSession({
        customerId: organization.provider_customer_id,
        returnUrl: `${new URL(request.url).origin}/dashboard`,
      });
      return NextResponse.json({ url: session.url });
    } catch (error) {
      if (error instanceof UnsupportedFeatureError) {
        return NextResponse.json({ error: error.message }, { status: 501 });
      }
      throw error;
    }
  },
);
