import { expect, test } from "@playwright/test";

test.describe("Admin portal auth guards", () => {
  test("/admin/leads redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/admin/leads");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("/admin/analytics redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/admin/analytics");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("/admin/tasks redirects unauthenticated visitors to login", async ({
    page,
  }) => {
    await page.goto("/admin/tasks");
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("Admin CRM API guards", () => {
  test("PATCH /api/admin/leads/[id]/status requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.patch(
      "/api/admin/leads/00000000-0000-0000-0000-000000000000/status",
      { data: { status: "quoted" } },
    );
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("POST /api/admin/leads/[id]/convert requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/admin/leads/00000000-0000-0000-0000-000000000000/convert",
    );
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("POST /api/admin/tasks requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.post("/api/admin/tasks", {
      data: { title: "Test task" },
    });
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("PATCH /api/admin/tasks/[id]/status requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.patch(
      "/api/admin/tasks/00000000-0000-0000-0000-000000000000/status",
      { data: { columnStatus: "done" } },
    );
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});
