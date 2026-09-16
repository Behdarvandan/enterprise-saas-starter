import { expect, test } from "@playwright/test";

test.describe("Admin portal auth guards", () => {
  const GUARDED_ROUTES = [
    "/admin",
    "/admin/leads",
    "/admin/clients",
    "/admin/appointments",
    "/admin/payments",
    "/admin/settings",
    "/admin/analytics",
    "/admin/tasks",
  ];

  for (const route of GUARDED_ROUTES) {
    test(`${route} redirects unauthenticated visitors to login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL("**/login");
      await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    });
  }
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

  test("POST /api/admin/leads/[id]/send-invite requires an authenticated session", async ({
    request,
  }) => {
    const response = await request.post(
      "/api/admin/leads/00000000-0000-0000-0000-000000000000/send-invite",
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
