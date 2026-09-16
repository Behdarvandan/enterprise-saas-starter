import { expect, test } from "@playwright/test";

test("booking page 404s for an organization slug that doesn't exist", async ({
  page,
}) => {
  const response = await page.goto("/book/no-such-organization-slug");
  expect(response?.status()).toBe(404);
});

test.describe("GET /api/booking/slots", () => {
  test("rejects a request missing required query params", async ({ request }) => {
    const response = await request.get("/api/booking/slots");
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("rejects non-UUID organizationId/serviceId", async ({ request }) => {
    const response = await request.get("/api/booking/slots", {
      params: {
        organizationId: "not-a-uuid",
        serviceId: "not-a-uuid",
        date: "2030-01-01",
      },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("POST /api/checkout/booking", () => {
  test("rejects a booking request missing required fields", async ({ request }) => {
    const response = await request.post("/api/checkout/booking", {
      data: {},
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
