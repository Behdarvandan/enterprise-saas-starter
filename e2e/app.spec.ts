import { expect, test } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Booking infrastructure/i }),
  ).toBeVisible();
});

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("pricing page renders", async ({ page }) => {
  await page.goto("/pricing");
  await expect(
    page.getByRole("heading", { name: /Simple, transparent pricing/i }),
  ).toBeVisible();
});

test("dashboard redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
