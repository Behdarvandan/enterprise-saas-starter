// @vitest-environment node
import { describe, expect, it } from "vitest";
import { contrastRatio, deriveBrandPalette, isHexColor, shade } from "./palette";

describe("contrastRatio", () => {
  it("matches the WCAG extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });
});

describe("deriveBrandPalette", () => {
  it("uses white text on the default violet and passes AA", () => {
    const palette = deriveBrandPalette("#7c3aed");
    expect(palette.foreground).toBe("#ffffff");
    expect(palette.passesAA).toBe(true);
    expect(palette.hover).not.toBe(palette.base);
  });

  it("switches to dark text on light colours", () => {
    const palette = deriveBrandPalette("#fde047");
    expect(palette.foreground).toBe("#1a1520");
    expect(palette.passesAA).toBe(true);
  });

  it("flags colours where neither foreground reaches AA", () => {
    expect(deriveBrandPalette("#7a7a7a").passesAA).toBe(false);
  });

  it("normalizes case and emits a translucent tint", () => {
    const palette = deriveBrandPalette("#7C3AED");
    expect(palette.base).toBe("#7c3aed");
    expect(palette.subtle).toBe("rgb(124 58 237 / 0.15)");
  });
});

describe("shade / isHexColor", () => {
  it("mixes toward white and black", () => {
    expect(shade("#000000", 0.5)).toBe("#808080");
    expect(shade("#ffffff", -0.5)).toBe("#808080");
  });

  it("validates 6-digit hex only", () => {
    expect(isHexColor("#7c3aed")).toBe(true);
    expect(isHexColor("#7c3")).toBe(false);
    expect(isHexColor("7c3aed")).toBe(false);
  });
});
