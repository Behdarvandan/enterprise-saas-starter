import { expect, test } from "@playwright/test";

test.describe("GET /api/chat/rag", () => {
  test("rejects a request missing organizationId/sessionId", async ({ request }) => {
    const response = await request.get("/api/chat/rag");
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeTruthy();
  });
});

test.describe("POST /api/chat/rag", () => {
  test("rejects a request missing organizationId", async ({ request }) => {
    const response = await request.post("/api/chat/rag", {
      data: { message: "Hello" },
    });
    expect(response.status()).toBe(400);
  });

  test("rejects a request missing a message", async ({ request }) => {
    const response = await request.post("/api/chat/rag", {
      data: { organizationId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(response.status()).toBe(400);
  });
});

test("dashboard chatbot page redirects unauthenticated visitors to login", async ({
  page,
}) => {
  await page.goto("/dashboard/chatbot");
  await page.waitForURL("**/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
