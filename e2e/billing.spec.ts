import { expect, test } from "@playwright/test";

test("POST /api/checkout requires an authenticated session", async ({ request }) => {
  const response = await request.post("/api/checkout", {
    data: { tier: "pro" },
  });
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBeTruthy();
});

test("POST /api/billing-portal requires an authenticated session", async ({
  request,
}) => {
  const response = await request.post("/api/billing-portal");
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBeTruthy();
});

test("dashboard billing page redirects unauthenticated visitors to login", async ({
  page,
}) => {
  await page.goto("/dashboard/billing");
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
