import { describe, expect, it } from "vitest";
import {
  decodeAgencyContext,
  encodeAgencyContext,
  getBrandingCssVars,
  parseAgencyBranding,
  type AgencyContext,
} from "./branding";

describe("parseAgencyBranding", () => {
  it("keeps valid fields", () => {
    expect(
      parseAgencyBranding({
        logo_url: "https://cdn.acme.com/logo.svg",
        primary_color: "#7c3aed",
        title: "  Acme AI  ",
      }),
    ).toEqual({
      logo_url: "https://cdn.acme.com/logo.svg",
      primary_color: "#7c3aed",
      title: "Acme AI",
    });
  });

  it("drops unsafe or malformed fields one by one, keeping the rest", () => {
    expect(
      parseAgencyBranding({
        logo_url: "javascript:alert(1)",
        primary_color: "red; background: url(x)",
        title: "Acme",
      }),
    ).toEqual({ title: "Acme" });
  });

  it("rejects non-https logo urls", () => {
    expect(parseAgencyBranding({ logo_url: "http://acme.com/logo.png" }).logo_url).toBeUndefined();
    expect(parseAgencyBranding({ logo_url: "data:image/svg+xml,<svg/>" }).logo_url).toBeUndefined();
  });

  it("returns an empty object for non-object input", () => {
    expect(parseAgencyBranding(null)).toEqual({});
    expect(parseAgencyBranding(undefined)).toEqual({});
    expect(parseAgencyBranding(["x"])).toEqual({});
    expect(parseAgencyBranding("x")).toEqual({});
  });

  it("ignores keys outside the branding whitelist", () => {
    expect(parseAgencyBranding({ title: "Acme", api_key: "sk-secret" })).toEqual({
      title: "Acme",
    });
  });
});

describe("agency context header encoding", () => {
  const context: AgencyContext = {
    id: "99999999-0000-0000-0000-000000000009",
    masterTenantId: "11111111-0000-0000-0000-000000000001",
    // Non-Latin title must survive a header-safe round trip.
    branding: { title: "آژانس نمونه — Ajans Çözümleri", primary_color: "#112233" },
  };

  it("round-trips, producing an ASCII-only header value", () => {
    const encoded = encodeAgencyContext(context);
    expect(encoded).toMatch(/^[\x20-\x7e]+$/);
    expect(decodeAgencyContext(encoded)).toEqual(context);
  });

  it("returns null for missing, garbage, or structurally invalid values", () => {
    expect(decodeAgencyContext(null)).toBeNull();
    expect(decodeAgencyContext("")).toBeNull();
    expect(decodeAgencyContext("%E0%A4%A")).toBeNull(); // bad percent-encoding
    expect(decodeAgencyContext("not-json")).toBeNull();
    expect(decodeAgencyContext(encodeURIComponent(JSON.stringify({ id: 1 })))).toBeNull();
  });

  it("re-validates branding on decode", () => {
    const tampered = encodeURIComponent(
      JSON.stringify({
        id: "a",
        masterTenantId: "b",
        branding: { logo_url: "javascript:alert(1)", title: "ok" },
      }),
    );
    expect(decodeAgencyContext(tampered)?.branding).toEqual({ title: "ok" });
  });
});

describe("getBrandingCssVars", () => {
  it("returns nothing without a primary color", () => {
    expect(getBrandingCssVars({ title: "Acme" })).toEqual({});
  });

  it("sets the alias and the design-system variables", () => {
    const vars = getBrandingCssVars({ primary_color: "#7c3aed" });
    expect(vars["--primary-color"]).toBe("#7c3aed");
    expect(vars["--primary"]).toBe("#7c3aed");
    expect(vars["--ring"]).toBe("#7c3aed");
  });

  it("picks a readable foreground for dark and light colors", () => {
    expect(getBrandingCssVars({ primary_color: "#1e1b4b" })["--primary-foreground"]).toBe("#ffffff");
    expect(getBrandingCssVars({ primary_color: "#fde68a" })["--primary-foreground"]).toBe("#1a1520");
  });
});
