// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  brandingFormSchema,
  quotaTotalSchema,
  tenantNameSchema,
  tenantSlugSchema,
} from "./schemas";

describe("tenantSlugSchema", () => {
  it("normalizes case and whitespace", () => {
    expect(tenantSlugSchema.parse("  Acme-Repairs ")).toBe("acme-repairs");
  });

  it.each(["ab", "-acme", "acme-", "acme--repairs", "acme repairs", "acme_repairs", "a".repeat(49)])(
    "rejects %j",
    (value) => {
      expect(tenantSlugSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe("tenantNameSchema", () => {
  it("trims and requires a value", () => {
    expect(tenantNameSchema.parse("  Acme ")).toBe("Acme");
    expect(tenantNameSchema.safeParse("   ").success).toBe(false);
    expect(tenantNameSchema.safeParse("x".repeat(81)).success).toBe(false);
  });
});

describe("quotaTotalSchema", () => {
  it("accepts whole non-negative numbers, including zero", () => {
    expect(quotaTotalSchema.parse("0")).toBe(0);
    expect(quotaTotalSchema.parse(" 1500 ")).toBe(1500);
    expect(quotaTotalSchema.parse("2147483647")).toBe(2_147_483_647);
  });

  it.each(["", "abc", "-1", "1.5", "1e3", "12 34", "2147483648"])("rejects %j", (value) => {
    expect(quotaTotalSchema.safeParse(value).success).toBe(false);
  });
});

describe("brandingFormSchema", () => {
  const empty = { title: "", logo_url: "", primary_color: "", cname_domain: "" };

  it("treats empty fields as not provided", () => {
    expect(brandingFormSchema.parse(empty)).toEqual({
      title: undefined,
      logo_url: undefined,
      primary_color: undefined,
      cname_domain: undefined,
    });
  });

  it("accepts and normalizes valid input", () => {
    expect(
      brandingFormSchema.parse({
        title: " Acme AI ",
        logo_url: "https://cdn.acme.com/logo.svg",
        primary_color: "#52525B",
        cname_domain: "https://AI.Acme.com/some/path?x=1",
      }),
    ).toEqual({
      title: "Acme AI",
      logo_url: "https://cdn.acme.com/logo.svg",
      primary_color: "#52525b",
      cname_domain: "ai.acme.com",
    });
  });

  it("strips a port and trailing dot from the domain", () => {
    expect(brandingFormSchema.parse({ ...empty, cname_domain: "ai.acme.com.:8443" }).cname_domain).toBe(
      "ai.acme.com",
    );
  });

  it("reports which field is invalid", () => {
    const result = brandingFormSchema.safeParse({
      title: "x".repeat(81),
      logo_url: "http://acme.com/logo.png",
      primary_color: "purple",
      cname_domain: "not a domain",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const invalid = result.error.issues.map((issue) => issue.path[0]);
    expect(invalid).toEqual(expect.arrayContaining(["title", "logo_url", "primary_color", "cname_domain"]));
  });

  it("rejects javascript: and data: logo URLs", () => {
    for (const logo_url of ["javascript:alert(1)", "data:image/svg+xml,<svg/>"]) {
      expect(brandingFormSchema.safeParse({ ...empty, logo_url }).success).toBe(false);
    }
  });

  it("rejects the platform's own domains", () => {
    for (const cname_domain of ["pasargad.app", "www.pasargad.app", "localhost", "x.vercel.app", "127.0.0.1"]) {
      expect(brandingFormSchema.safeParse({ ...empty, cname_domain }).success).toBe(false);
    }
  });
});
