import { expect, test, type Page } from "@playwright/test";

/**
 * Logs in via the real /login form using E2E_TEST_EMAIL/E2E_TEST_PASSWORD.
 * No seeded test user exists in this repo yet, so tests that need it are
 * skipped (not faked) when those env vars aren't set — see the
 * "B2B module content (authenticated)" describe block below.
 */
async function loginAsTenantUser(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_TEST_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
}

test.describe("B2B module auth guards", () => {
  test("/dashboard/settings redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("/dashboard redirects unauthenticated visitors to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("B2B module content (authenticated)", () => {
  test.skip(
    !process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD,
    "Requires E2E_TEST_EMAIL/E2E_TEST_PASSWORD for a seeded tenant user — none configured in this environment.",
  );

  test("dashboard settings page renders the audit-logs and usage-tracker slot contributions", async ({ page }) => {
    await loginAsTenantUser(page);
    await page.goto("/dashboard/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    // audit-logs module (SETTINGS_TAB slot contribution)
    await expect(page.getByText("No audit log entries yet.")).toBeVisible();
    // billing module (SETTINGS_TAB slot contribution)
    await expect(page.getByText("Usage Tracker")).toBeVisible();
    await expect(page.getByText("No active usage tracking metrics.")).toBeVisible();
  });

  test("dashboard overview lists the agent approval queue", async ({ page }) => {
    await loginAsTenantUser(page);
    await page.goto("/dashboard");

    await expect(page.getByText("Agent Approval Queue")).toBeVisible();
    // pasargad-core's GET /api/v1/agent/approvals is still a disclosed
    // placeholder returning [] (7.1/8.3) — no environment has a real
    // pending task to assert Approve/Reject button interactions against,
    // so this test covers the (real, current) empty state only.
    await expect(page.getByText("No pending agent approvals.")).toBeVisible();
  });
});
