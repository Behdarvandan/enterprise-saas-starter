import { expect, test } from "@playwright/test";

test.describe("Client portal auth guards", () => {
  test("/client redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/client");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("/client/invoices redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/client/invoices");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("/client/files redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/client/files");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("/client/settings redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/client/settings");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("Client portal API guards", () => {
  test("POST /api/client/license/rotate requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.post("/api/client/license/rotate");
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("GET /api/client/invoices/[id]/pdf requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/client/invoices/00000000-0000-0000-0000-000000000000/pdf",
    );
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
