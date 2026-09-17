import { afterEach, describe, expect, it } from "vitest";
import {
  PayTRAdapter,
  StripeAdapter,
  decodeMerchantOrderId,
  encodeAppointmentOrderId,
  encodeOrganizationOrderId,
  getPaymentAdapter,
  resolvePaymentProvider,
} from "./adapter";

const ORG_ID = "11111111-2222-3333-4444-555555555555";
const APPOINTMENT_ID = "66666666-7777-8888-9999-000000000000";

describe("merchant order id encode/decode", () => {
  it("round-trips an organization-only order id", () => {
    const encoded = encodeOrganizationOrderId(ORG_ID);
    expect(encoded).toHaveLength(32);
    expect(decodeMerchantOrderId(encoded)).toEqual({
      type: "organization",
      organizationId: ORG_ID,
    });
  });

  it("round-trips an appointment order id", () => {
    const encoded = encodeAppointmentOrderId(ORG_ID, APPOINTMENT_ID);
    expect(encoded).toHaveLength(64);
    expect(decodeMerchantOrderId(encoded)).toEqual({
      type: "appointment",
      organizationId: ORG_ID,
      appointmentId: APPOINTMENT_ID,
    });
  });

  it("returns null for an unrecognized length", () => {
    expect(decodeMerchantOrderId("not-a-valid-order-id")).toBeNull();
  });
});

describe("resolvePaymentProvider", () => {
  const originalValue = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
    } else {
      process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = originalValue;
    }
  });

  it("defaults to stripe when unset", () => {
    delete process.env.NEXT_PUBLIC_PAYMENT_PROVIDER;
    expect(resolvePaymentProvider()).toBe("stripe");
  });

  it("resolves paytr when explicitly configured", () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "paytr";
    expect(resolvePaymentProvider()).toBe("paytr");
  });

  it("falls back to stripe for an unknown value", () => {
    process.env.NEXT_PUBLIC_PAYMENT_PROVIDER = "unknown-provider";
    expect(resolvePaymentProvider()).toBe("stripe");
  });
});

describe("getPaymentAdapter", () => {
  it("returns a StripeAdapter for 'stripe'", () => {
    const adapter = getPaymentAdapter("stripe");
    expect(adapter).toBeInstanceOf(StripeAdapter);
    expect(adapter.provider).toBe("stripe");
  });

  it("returns a PayTRAdapter for 'paytr'", () => {
    const adapter = getPaymentAdapter("paytr");
    expect(adapter).toBeInstanceOf(PayTRAdapter);
    expect(adapter.provider).toBe("paytr");
  });

  it("caches and returns the same instance for repeated calls", () => {
    expect(getPaymentAdapter("stripe")).toBe(getPaymentAdapter("stripe"));
  });
});
