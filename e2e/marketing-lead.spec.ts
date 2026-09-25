import { expect, test } from "@playwright/test";

test.describe("Marketing lead pages", () => {
  test("/product renders its hero and links to /solutions, no lead form", async ({
    page,
  }) => {
    await page.goto("/product");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Looking for something tailored to your business instead?" }),
    ).toBeVisible();
  });

  test("/solutions renders the segments and the quote lead form", async ({
    page,
  }) => {
    await page.goto("/solutions");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("/solutions/portfolio/[slug] 404s for an unknown case study", async ({
    page,
  }) => {
    const response = await page.goto("/solutions/portfolio/no-such-project");
    expect(response?.status()).toBe(404);
  });

  test("/repair-shops redirects to /solutions", async ({ page }) => {
    const response = await page.goto("/repair-shops");
    expect(new URL(page.url()).pathname).toBe("/solutions");
    expect(response?.status()).toBe(200);
  });

  test("/contact no longer exists", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(404);
  });
});

test.describe("POST /api/leads", () => {
  test("rejects a request missing required fields", async ({ request }) => {
    const response = await request.post("/api/leads", { data: {} });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("rejects an invalid project category", async ({ request }) => {
    const response = await request.post("/api/leads", {
      data: {
        kind: "freelance",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        projectCategory: "not-a-category",
        message: "A short description.",
      },
    });
    expect(response.status()).toBe(400);
  });

  test("rejects an invalid email", async ({ request }) => {
    const response = await request.post("/api/leads", {
      data: {
        kind: "freelance",
        fullName: "Ada Lovelace",
        email: "not-an-email",
        projectCategory: "fullstack_saas",
        message: "A short description.",
      },
    });
    expect(response.status()).toBe(400);
  });
});
