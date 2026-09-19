import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SystemStatus from "@/components/marketing/SystemStatus";
import { withIntl } from "@/components/marketing/testing";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function mount(): Promise<void> {
  await act(async () => {
    root.render(withIntl(<SystemStatus />));
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SystemStatus", () => {
  it("reports the platform online only after /api/health answers ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await mount();

    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.objectContaining({ cache: "no-store" }));
    expect(container.textContent).toBe("Platform online");
  });

  it("shows the checking state until the request settles", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    await mount();

    expect(container.textContent).toBe("Checking platform status…");
  });

  it.each([
    ["a non-2xx response", () => Promise.resolve({ ok: false })],
    ["a network error", () => Promise.reject(new Error("offline"))],
  ])("falls back to unavailable on %s, without claiming the platform is up", async (_label, respond) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(respond));

    await mount();

    expect(container.textContent).toBe("Status unavailable");
  });
});
