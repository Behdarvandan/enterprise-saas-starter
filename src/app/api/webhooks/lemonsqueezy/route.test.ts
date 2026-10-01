// @vitest-environment node
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const applyMock = vi.fn();

vi.mock("@/core/db", () => ({ createCoreAdminClient: vi.fn() }));

const billing = await import("@/modules/billing/lemonsqueezy");
vi.spyOn(billing, "applyLemonSqueezySubscriptionEvent").mockImplementation(applyMock);

const { POST } = await import("./route");

const SECRET = "whsec_test_secret";
const sign = (body: string, secret = SECRET) =>
  createHmac("sha256", secret).update(body).digest("hex");

const post = (body: string, signature?: string) =>
  POST(
    new Request("http://localhost/api/webhooks/lemonsqueezy", {
      method: "POST",
      body,
      headers: signature ? { "X-Signature": signature } : {},
    }),
  );

describe("POST /api/webhooks/lemonsqueezy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    applyMock.mockResolvedValue({ status: "updated", event: "subscription_created" });
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  });

  it("fails closed with a 500 when the signing secret is not configured", async () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });

    const response = await post(body, sign(body));

    expect(response.status).toBe(500);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or wrong signature with 401", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });

    expect((await post(body)).status).toBe(401);
    expect((await post(body, sign(body, "other-secret"))).status).toBe(401);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("rejects a signed but malformed payload with 400", async () => {
    const notJson = "not json";
    expect((await post(notJson, sign(notJson))).status).toBe(400);

    const wrongShape = JSON.stringify({ meta: { event_name: 42 } });
    expect((await post(wrongShape, sign(wrongShape))).status).toBe(400);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it("applies a correctly signed event", async () => {
    const body = JSON.stringify({
      meta: { event_name: "subscription_created", custom_data: { tenant_id: "x" } },
      data: { id: 1 },
    });

    const response = await post(body, sign(body));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      received: true,
      status: "updated",
      event: "subscription_created",
    });
    expect(applyMock).toHaveBeenCalledOnce();
  });
});
