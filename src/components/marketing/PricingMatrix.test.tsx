import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PricingMatrix from "@/components/marketing/PricingMatrix";
import { withIntl } from "@/components/marketing/testing";
import { buildPricingView } from "@/lib/marketing/pricing-view";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href, ...rest }, children),
  };
});

let container: HTMLDivElement;
let root: Root;

async function mount(region: "global" | "eu" = "global"): Promise<void> {
  const { plans, skills } = buildPricingView(region);
  await act(async () => {
    root.render(withIntl(<PricingMatrix plans={plans} skills={skills} />));
  });
}

function lockedButton(labelPart: string): HTMLButtonElement {
  const button = [...container.querySelectorAll("button")].find((candidate) =>
    candidate.getAttribute("aria-label")?.includes(labelPart),
  );
  if (!button) throw new Error(`no button labelled "${labelPart}"`);
  return button;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = "";
});

describe("PricingMatrix", () => {
  it("shows each tier's real checkout price and localised quota copy", async () => {
    await mount();
    const text = container.textContent ?? "";

    expect(text).toContain("$20");
    expect(text).toContain("$50");
    expect(text).toContain("Custom quote");
    expect(text).toContain("500 AI conversations / month");
    expect(text).toContain("3,000 AI conversations / month");
    expect(text).toContain("Unlimited AI conversations");
    expect(text).toContain("1 knowledge-base document");
  });

  it("renders the euro price for EU visitors", async () => {
    await mount("eu");
    expect(container.textContent).toMatch(/49\s*€/);
  });

  it("marks included skills with a read-only switch and locks the rest", async () => {
    await mount();

    const included = container.querySelectorAll<HTMLButtonElement>('[role="switch"]');
    // rag_search: 3 tiers, calendar_booking: 2 (pro + enterprise), custom: 1 (enterprise).
    expect(included).toHaveLength(6);
    expect([...included].every((el) => el.disabled && el.getAttribute("aria-checked") === "true")).toBe(true);

    expect(lockedButton("Calendar booking assistant is locked on Starter")).toBeTruthy();
  });

  it("explains what unlocks a locked skill and links to the Pro plan", async () => {
    await mount();

    await act(async () => lockedButton("Calendar booking assistant is locked on Starter").click());

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Calendar booking assistant unlocks with Pro");
    const link = dialog?.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/pricing");
    expect(link?.textContent).toBe("See the Pro plan");
  });

  it("routes an Enterprise-only skill to sales", async () => {
    await mount();

    await act(async () => lockedButton("Custom skills & bring-your-own LLM is locked on Pro").click());

    const link = document.querySelector('[role="dialog"] a');
    expect(link?.getAttribute("href")).toBe("/solutions#quote");
    expect(link?.textContent).toBe("Talk to sales about Enterprise");
  });
});
