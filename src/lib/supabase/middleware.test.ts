// @vitest-environment node
import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const createServerClientMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

const { updateSession } = await import("@/lib/supabase/middleware");

describe("updateSession", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockReturnValue({ auth: { getUser: getUserMock } });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the response it was given after refreshing the session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const response = NextResponse.next();

    const result = await updateSession(new NextRequest("http://localhost/tr"), response);

    expect(result).toBe(response);
  });

  it("does not throw when the session refresh fails", async () => {
    getUserMock.mockRejectedValue(new Error("network down"));
    const response = NextResponse.next();

    const result = await updateSession(new NextRequest("http://localhost/tr"), response);

    expect(result).toBe(response);
    expect(console.error).toHaveBeenCalled();
  });

  it("does not throw when the client cannot be created", async () => {
    createServerClientMock.mockImplementation(() => {
      throw new Error("Invalid supabaseUrl");
    });

    await expect(updateSession(new NextRequest("http://localhost/tr"))).resolves.toBeDefined();
  });
});
