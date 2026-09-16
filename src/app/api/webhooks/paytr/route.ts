import { NextResponse } from "next/server";
import { getPaymentAdapter } from "@/lib/payment/adapter";
import { mapWebhookError } from "@/lib/payment/webhook-error";

/**
 * POST /api/webhooks/paytr
 *
 * PayTR callback ("Bildirim URL") endpoint. PayTR sends the payment result as
 * an `application/x-www-form-urlencoded` POST containing `merchant_oid`,
 * `status`, `total_amount`, and a `hash` (also referred to as `paytr_token` in
 * some documentation) used to prove the request originated from PayTR.
 *
 * The response body must be the literal text "OK" so PayTR stops retrying.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const callbackFields = parseFormUrlEncoded(rawBody);

  try {
    await getPaymentAdapter("paytr").handleWebhookEvent({
      rawBody,
      callbackFields,
    });
  } catch (error) {
    const mapped = mapWebhookError("paytr", error);
    const body = mapped.kind === "signature" ? "INVALID" : "ERROR";

    return new NextResponse(body, {
      status: mapped.status,
      headers: { "content-type": "text/plain" },
    });
  }

  return new NextResponse("OK", {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

function parseFormUrlEncoded(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const fields: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    fields[key] = value;
  }
  return fields;
}
