import { expect, test } from "@playwright/test";

test.describe("Marketing lead pages", () => {
  test("/saas renders the demo lead form", async ({ page }) => {
    await page.goto("/saas");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("/freelance renders services and the project lead form", async ({
    page,
  }) => {
    await page.goto("/freelance");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("/freelance/portfolio/[slug] 404s for an unknown case study", async ({
    page,
  }) => {
    const response = await page.goto("/freelance/portfolio/no-such-project");
    expect(response?.status()).toBe(404);
  });

  test("/contact toggles between freelance and SaaS lead forms", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(page.locator("form")).toBeVisible();

    await page.getByRole("button", { name: "SaaS inquiry" }).click();
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("POST /api/leads", () => {
  test("rejects a request missing required fields", async ({ request }) => {
    const response = await request.post("/api/leads", { data: {} });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("rejects an invalid kind", async ({ request }) => {
    const response = await request.post("/api/leads", {
      data: {
        kind: "not-a-kind",
        fullName: "Ada Lovelace",
        email: "ada@example.com",
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
      },
    });
    expect(response.status()).toBe(400);
  });
});
