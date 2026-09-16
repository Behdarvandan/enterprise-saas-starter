import { expect, test } from "@playwright/test";

test("invite page prompts an anonymous visitor to sign in first", async ({
  page,
}) => {
  // The token doesn't need to exist: the page checks for a session before it
  // ever looks at the invitation's state.
  await page.goto("/invite/does-not-exist-token");

  await expect(
    page.getByRole("heading", { name: "Sign in to accept" }),
  ).toBeVisible();

  // Scoped to <main>: the header/footer also have generic "Sign in" links.
  await expect(
    page.getByRole("main").getByRole("link", { name: "Sign in" }),
  ).toHaveAttribute("href", /login.*next.*invite.*does-not-exist-token/);
});
