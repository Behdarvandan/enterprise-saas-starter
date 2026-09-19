// @vitest-environment node
//
// Render smoke tests for the landing sections: server-render each one with
// the real English catalog and assert the content the page must carry. The
// interactive islands have their own tests.
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { withIntl } from "@/components/marketing/testing";

vi.mock("next-intl/server", async () => (await import("@/test/intl")).nextIntlServerMock());
vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  return {
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href, ...rest }, children),
  };
});
vi.mock("@/lib/geo", () => ({ getPricingRegion: async () => "global" }));

const { default: Hero } = await import("@/components/marketing/Hero");
const { default: TrustStrip } = await import("@/components/marketing/TrustStrip");
const { default: RoiSection } = await import("@/components/marketing/RoiSection");
const { default: DualCrew } = await import("@/components/marketing/DualCrew");
const { default: PricingSection } = await import("@/components/marketing/PricingSection");
const { default: WhiteLabelSection } = await import("@/components/marketing/WhiteLabelSection");
const { default: FinalCta } = await import("@/components/marketing/FinalCta");

// React's SSR separates adjacent text nodes with `<!-- -->`; strip them so
// assertions read like the text a visitor sees.
async function render(section: () => Promise<ReactElement>): Promise<string> {
  return renderToString(withIntl(await section())).replace(/<!-- -->/g, "");
}

describe("landing sections", () => {
  it("hero leads with the value proposition and both calls to action", async () => {
    const html = await render(Hero);

    expect(html).toContain("The autonomous customer agent &amp; AI Agent OS for your business");
    expect(html).toContain('href="/signup"');
    expect(html).toContain('href="/services#quote"');
    // The simulator is labelled as a sample and starts idle on the server.
    expect(html).toContain("Sample simulation");
    // No trial promise the backend cannot honour.
    expect(html).not.toMatch(/14[- ]day|credit card/i);
  });

  it("trust strip reuses the reviewer-facing security controls", async () => {
    const html = await render(TrustStrip);
    expect(html).toContain("Row Level Security on every tenant table");
  });

  it("ROI section starts from the default sliders with the model's numbers", async () => {
    const html = await render(RoiSection);

    // 2,500 conversations x 6 min x 70% = 175 h; x $14 = $2,450; minus the $50 plan.
    expect(html).toContain(">175<");
    expect(html).toContain("$2,400");
    expect(html).toContain("99.1%");
    expect(html).toContain("not a measurement or a guarantee");
  });

  it("dual crew section anchors the capabilities link", async () => {
    const html = await render(DualCrew);

    expect(html).toContain('id="capabilities"');
    expect(html).toContain("Ops Crew");
    expect(html).toContain("dev_crew.recommendation");
  });

  it("pricing section anchors #pricing with the real global prices", async () => {
    const html = await render(PricingSection);

    expect(html).toContain('id="pricing"');
    expect(html).toContain("$20");
    expect(html).toContain("$50");
    expect(html).not.toContain("$29");
    expect(html).not.toContain("$79");
  });

  it("white-label section anchors #agency and shows the platform CNAME target", async () => {
    const html = await render(WhiteLabelSection);

    expect(html).toContain('id="agency"');
    expect(html).toContain("cname.pasargad.app");
    expect(html).toContain('href="/services#quote"');
    // The agency plan has no price in the plan data, so none is advertised.
    expect(html).not.toContain("$199");
  });

  it("closing call to action links to sign-up and the demo form", async () => {
    const html = await render(FinalCta);

    expect(html).toContain('href="/signup"');
    expect(html).toContain('href="/services#quote"');
  });
});
