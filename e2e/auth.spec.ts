import { expect, test } from "@playwright/test";

test.describe("signup form", () => {
  test("enforces a minimum 8-character password via the native input constraint", async ({
    page,
  }) => {
    // The <input minLength={8}> constraint blocks form submission (and thus
    // the app's own "too short" JS check) before it ever fires, so this
    // exercises the actual guard the browser applies rather than dead code.
    await page.goto("/signup");

    const password = page.getByLabel("Password", { exact: true });
    await password.fill("short1");

    const isValid = await password.evaluate(
      (el: HTMLInputElement) => el.checkValidity(),
    );
    expect(isValid).toBe(false);
  });

  test("rejects mismatched passwords before hitting the network", async ({
    page,
  }) => {
    await page.goto("/signup");

    await page.getByLabel("Email").fill(`test-${Date.now()}@example.com`);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("password456");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });
});

test.describe("login form", () => {
  test("shows an error and stays on the page for invalid credentials", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(`no-such-user-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Supabase rejects the credentials; the page must not navigate away and
    // must surface some error text rather than failing silently.
    await expect(page.locator("p.text-status-error")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("forgot password form", () => {
  test("always reports generic success, regardless of whether the email exists", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await page.getByLabel("Email").fill(`no-such-user-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(
      page.getByText(
        "If an account exists for this email, a password reset link has been sent.",
      ),
    ).toBeVisible();
  });
});
