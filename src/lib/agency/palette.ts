/**
 * Derives the palette a tenant experience gets from an agency's single
 * primary colour. Kept in one place so the live preview and the CSS variables
 * applied on the agency's domain (`getBrandingCssVars`) agree.
 */

const HEX = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value);
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Mixes `hex` toward white (`amount` > 0) or black (`amount` < 0). */
export function shade(hex: string, amount: number): string {
  const target = amount >= 0 ? 255 : 0;
  const weight = Math.abs(amount);
  const [r, g, b] = channels(hex);
  return toHex([r + (target - r) * weight, g + (target - g) * weight, b + (target - b) * weight]);
}

export const LIGHT_FOREGROUND = "#ffffff";
export const DARK_FOREGROUND = "#1a1520";
/** WCAG AA for normal-size text. */
export const AA_CONTRAST = 4.5;

export interface BrandPalette {
  base: string;
  /** Hover / pressed shade of the primary. */
  hover: string;
  /** Text colour that reads best on `base`. */
  foreground: string;
  /** Contrast of `foreground` on `base`. */
  contrast: number;
  /** Whether `foreground` on `base` meets WCAG AA. */
  passesAA: boolean;
  /** Translucent tint for active nav items and badges. */
  subtle: string;
}

export function deriveBrandPalette(hex: string): BrandPalette {
  const base = hex.toLowerCase();
  // Pick whichever foreground contrasts more; ties never happen in practice.
  const light = contrastRatio(base, LIGHT_FOREGROUND);
  const dark = contrastRatio(base, DARK_FOREGROUND);
  const foreground = light >= dark ? LIGHT_FOREGROUND : DARK_FOREGROUND;
  const contrast = Math.max(light, dark);

  const [r, g, b] = channels(base);
  return {
    base,
    // Hover is lighter on dark colours and darker on light ones, so it always moves visibly.
    hover: shade(base, relativeLuminance(base) > 0.4 ? -0.12 : 0.14),
    foreground,
    contrast,
    passesAA: contrast >= AA_CONTRAST,
    subtle: `rgb(${r} ${g} ${b} / 0.15)`,
  };
}
