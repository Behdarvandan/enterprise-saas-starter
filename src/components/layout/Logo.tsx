import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Chahar Bagh mark geometry on a 48-unit grid: gated garden wall (corner
 * brackets), a diamond pool, double water channels on both axes. Three
 * optical weights ported verbatim from the approved Pasargad design system
 * (`project/components/bundle.js`) — never redraw or approximate these paths.
 */
type OpticalSize = "fine" | "regular" | "micro";

const MARK: Record<OpticalSize, { strokeWidth: number; d: [string, string, string] }> = {
  fine: {
    strokeWidth: 2,
    d: [
      "M15 2H2V15M33 2H46V15M46 33V46H33M15 46H2V33",
      "M24 15L33 24L24 33L15 24Z",
      "M21 2V18M27 2V18M21 30V46M27 30V46M2 21H18M2 27H18M30 21H46M30 27H46",
    ],
  },
  regular: {
    strokeWidth: 3,
    d: [
      "M15 2H2V15M33 2H46V15M46 33V46H33M15 46H2V33",
      "M24 15L33 24L24 33L15 24Z",
      "M21 2V18M27 2V18M21 30V46M27 30V46M2 21H18M2 27H18M30 21H46M30 27H46",
    ],
  },
  micro: {
    strokeWidth: 4,
    d: [
      "M14 3H3V14M34 3H45V14M45 34V45H34M14 45H3V34",
      "M24 15L33 24L24 33L15 24Z",
      "M24 3V15M24 33V45M3 24H15M33 24H45",
    ],
  },
};

/** fine >= 96px, regular 24-95px (also every lockup regardless of scale), micro < 24px. */
function opticalFor(px: number): OpticalSize {
  return px >= 96 ? "fine" : px >= 24 ? "regular" : "micro";
}

function MarkGroup({ optical, x = 0, y = 0 }: { optical: OpticalSize; x?: number; y?: number }) {
  const mark = MARK[optical];
  return (
    <g
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke="currentColor"
      strokeWidth={mark.strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d={mark.d[0]} />
      <path d={mark.d[1]} />
      <path d={mark.d[2]} />
    </g>
  );
}

interface GardenGridProps {
  /** Rendered size in px (minimum 16, default 32). */
  size?: number;
  /** Accessible name — only when the mark is the sole thing naming Pasargad; otherwise leave decorative. */
  title?: string;
  /** Overrides the automatic optical-size selection. */
  optical?: OpticalSize;
  className?: string;
  style?: CSSProperties;
}

/** The mark alone: app chrome, avatars, slide dividers, in-page favicons. Colour it through its parent. */
export function GardenGrid({ size = 32, title, optical, className, style }: GardenGridProps) {
  const resolved = Math.max(16, size);
  return (
    <svg
      viewBox="0 0 48 48"
      width={resolved}
      height={resolved}
      className={cn("pg-mark", className)}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <MarkGroup optical={optical ?? opticalFor(resolved)} />
    </svg>
  );
}

/**
 * Outlined wordmark glyphs (Geist SemiBold -2% tracking for "Pasargad",
 * Vazirmatn Bold for پاسارگاد), so the logo renders identically with no
 * fonts loaded. Ported verbatim from the approved design system.
 */
const WORD: Record<"en" | "fa", string> = {
  en: "M3.25 0V-28.8H14.4Q19.43 -28.8 22.29 -26.37Q25.15 -23.93 25.15 -19.63Q25.15 -15.29 22.29 -12.84Q19.43 -10.38 14.4 -10.38H8.52V0ZM8.52 -14.97H14.16Q16.83 -14.97 18.27 -16.14Q19.71 -17.32 19.71 -19.63Q19.71 -21.9 18.27 -23.06Q16.83 -24.22 14.16 -24.22H8.52ZM34.36 0.49Q30.95 0.49 28.88 -1.05Q26.81 -2.6 26.81 -5.44Q26.81 -8.23 28.56 -9.82Q30.3 -11.4 33.87 -12.09L41.05 -13.51Q41.05 -18.13 36.87 -18.13Q35.01 -18.13 33.91 -17.26Q32.82 -16.39 32.45 -14.77L27.18 -15.01Q27.83 -18.42 30.34 -20.28Q32.86 -22.15 36.87 -22.15Q41.5 -22.15 43.87 -19.82Q46.24 -17.48 46.24 -13.14V-5.27Q46.24 -4.42 46.55 -4.1Q46.85 -3.77 47.46 -3.77H48.15V0Q47.46 0.16 46.24 0.16Q44.5 0.16 43.28 -0.57Q42.06 -1.3 41.74 -3.29V-3.33Q40.93 -1.62 38.96 -0.57Q36.99 0.49 34.36 0.49ZM35.41 -3.29Q38.01 -3.29 39.53 -4.79Q41.05 -6.29 41.05 -8.76V-9.98L35.45 -8.84Q33.71 -8.48 32.96 -7.77Q32.21 -7.06 32.21 -5.92Q32.21 -3.29 35.41 -3.29ZM59.26 0.49Q54.31 0.49 51.88 -1.58Q49.45 -3.65 49.2 -6.81L54.52 -7.06Q54.8 -5.35 55.88 -4.42Q56.95 -3.49 59.3 -3.49Q61.13 -3.49 62.08 -4.08Q63.04 -4.66 63.04 -5.92Q63.04 -6.65 62.69 -7.14Q62.35 -7.63 61.35 -7.99Q60.36 -8.36 58.45 -8.72Q55.17 -9.29 53.3 -10.12Q51.43 -10.95 50.68 -12.21Q49.93 -13.47 49.93 -15.33Q49.93 -18.33 52.27 -20.24Q54.6 -22.15 59.1 -22.15Q62.22 -22.15 64.23 -21.15Q66.24 -20.16 67.27 -18.52Q68.31 -16.87 68.47 -14.85L63.2 -14.6Q63.12 -16.14 62.14 -17.16Q61.17 -18.17 59.02 -18.17Q57.19 -18.17 56.24 -17.44Q55.29 -16.71 55.29 -15.5Q55.29 -14.2 56.2 -13.57Q57.11 -12.94 59.55 -12.53Q62.87 -12.05 64.82 -11.2Q66.77 -10.34 67.6 -9.07Q68.43 -7.79 68.43 -6Q68.43 -2.88 65.94 -1.2Q63.44 0.49 59.26 0.49ZM78.29 0.49Q74.88 0.49 72.81 -1.05Q70.74 -2.6 70.74 -5.44Q70.74 -8.23 72.49 -9.82Q74.23 -11.4 77.8 -12.09L84.98 -13.51Q84.98 -18.13 80.8 -18.13Q78.94 -18.13 77.84 -17.26Q76.75 -16.39 76.38 -14.77L71.11 -15.01Q71.76 -18.42 74.27 -20.28Q76.79 -22.15 80.8 -22.15Q85.43 -22.15 87.8 -19.82Q90.17 -17.48 90.17 -13.14V-5.27Q90.17 -4.42 90.48 -4.1Q90.78 -3.77 91.39 -3.77H92.08V0Q91.39 0.16 90.17 0.16Q88.43 0.16 87.21 -0.57Q85.99 -1.3 85.67 -3.29V-3.33Q84.86 -1.62 82.89 -0.57Q80.92 0.49 78.29 0.49ZM79.34 -3.29Q81.94 -3.29 83.46 -4.79Q84.98 -6.29 84.98 -8.76V-9.98L79.38 -8.84Q77.64 -8.48 76.89 -7.77Q76.14 -7.06 76.14 -5.92Q76.14 -3.29 79.34 -3.29ZM94.63 0V-21.66H99.5L99.62 -17.44Q100.27 -19.63 101.53 -20.65Q102.79 -21.66 104.82 -21.66H106.8V-17.2H104.78Q102.3 -17.2 101.06 -16.08Q99.83 -14.97 99.83 -12.49V0ZM118.04 6.57Q113.78 6.57 111.35 4.87Q108.91 3.16 108.18 0.41L113.54 0.04Q113.94 1.3 114.94 1.97Q115.93 2.64 118.04 2.64Q120.43 2.64 121.73 1.56Q123.03 0.49 123.03 -1.78V-4.54Q122.26 -2.96 120.55 -2.01Q118.85 -1.05 116.74 -1.05Q114.06 -1.05 111.98 -2.37Q109.89 -3.69 108.71 -6.06Q107.53 -8.44 107.53 -11.56Q107.53 -14.68 108.71 -17.06Q109.89 -19.43 111.93 -20.79Q113.98 -22.15 116.66 -22.15Q118.97 -22.15 120.68 -21.09Q122.38 -20.04 123.19 -18.29V-21.66H128.26V-1.91Q128.26 2.27 125.46 4.42Q122.66 6.57 118.04 6.57ZM117.96 -5.11Q120.27 -5.11 121.67 -6.83Q123.07 -8.56 123.07 -11.6Q123.11 -14.6 121.71 -16.35Q120.31 -18.09 117.96 -18.09Q115.57 -18.09 114.25 -16.33Q112.93 -14.56 112.93 -11.6Q112.93 -8.64 114.29 -6.88Q115.65 -5.11 117.96 -5.11ZM139.42 0.49Q136.01 0.49 133.94 -1.05Q131.87 -2.6 131.87 -5.44Q131.87 -8.23 133.62 -9.82Q135.36 -11.4 138.93 -12.09L146.11 -13.51Q146.11 -18.13 141.93 -18.13Q140.07 -18.13 138.97 -17.26Q137.87 -16.39 137.51 -14.77L132.24 -15.01Q132.89 -18.42 135.4 -20.28Q137.92 -22.15 141.93 -22.15Q146.56 -22.15 148.93 -19.82Q151.3 -17.48 151.3 -13.14V-5.27Q151.3 -4.42 151.61 -4.1Q151.91 -3.77 152.52 -3.77H153.21V0Q152.52 0.16 151.3 0.16Q149.56 0.16 148.34 -0.57Q147.12 -1.3 146.8 -3.29V-3.33Q145.99 -1.62 144.02 -0.57Q142.05 0.49 139.42 0.49ZM140.47 -3.29Q143.07 -3.29 144.59 -4.79Q146.11 -6.29 146.11 -8.76V-9.98L140.51 -8.84Q138.77 -8.48 138.02 -7.77Q137.27 -7.06 137.27 -5.92Q137.27 -3.29 140.47 -3.29ZM163.23 0.49Q160.47 0.49 158.46 -0.89Q156.45 -2.27 155.36 -4.81Q154.26 -7.34 154.26 -10.83Q154.26 -14.28 155.38 -16.83Q156.49 -19.39 158.5 -20.77Q160.51 -22.15 163.23 -22.15Q165.5 -22.15 167.22 -21.21Q168.95 -20.28 169.84 -18.58V-28.8H175.03V0H170.08L169.96 -3.2Q169.07 -1.46 167.28 -0.49Q165.5 0.49 163.23 0.49ZM164.81 -3.73Q167.2 -3.73 168.52 -5.58Q169.84 -7.42 169.84 -10.83Q169.84 -14.28 168.54 -16.1Q167.24 -17.93 164.81 -17.93Q162.46 -17.93 161.06 -16.04Q159.66 -14.16 159.66 -10.83Q159.66 -7.59 161.06 -5.66Q162.46 -3.73 164.81 -3.73Z",
  fa: "M5.28 -4.05Q6.69 -4.05 7.9 -4.26Q9.11 -4.47 9.87 -5Q10.63 -5.53 10.63 -6.47Q10.63 -7.43 9.76 -8.51Q8.89 -9.59 7.39 -10.66Q5.89 -11.72 4.02 -12.64L5.77 -16.3Q8.03 -15.19 9.96 -13.78Q11.89 -12.37 13.08 -10.59Q14.27 -8.82 14.27 -6.61Q14.27 -3.1 11.92 -1.56Q9.57 -0.03 5.51 -0.03Q4.34 -0.03 3.31 -0.12Q2.27 -0.21 1.3 -0.41V-4.5Q2.29 -4.31 3.38 -4.18Q4.47 -4.05 5.28 -4.05ZM17.71 -21.33H21.54V-7.25Q21.54 -5.53 22.07 -4.82Q22.59 -4.11 24.11 -4.11H24.49V0H24.11Q20.79 0 19.25 -1.73Q17.71 -3.47 17.71 -6.96ZM25.13 -18.34V-20.52L37.39 -25.51V-23.31ZM29.05 -14.24Q31.04 -13.02 32.68 -11.8Q34.32 -10.58 35.3 -9.17Q36.29 -7.76 36.29 -5.97Q36.29 -3.66 35.24 -2.36Q34.18 -1.05 32.24 -0.53Q30.29 0 27.6 0H23.88V-4.11H27.59Q30.14 -4.11 31.36 -4.49Q32.59 -4.87 32.59 -6.03Q32.59 -6.63 31.85 -7.35Q31.11 -8.08 29.99 -8.85Q28.87 -9.62 27.68 -10.38Q26.49 -11.14 25.57 -11.82Q24.96 -12.26 24.65 -12.97Q24.33 -13.68 24.33 -14.43Q24.33 -15.24 24.72 -15.95Q25.11 -16.67 25.92 -16.99L37.56 -21.74V-17.69ZM36.2 8.3 34.76 4.55Q38.15 3.82 39.99 2.24Q41.83 0.67 41.83 -2.37Q41.83 -3.74 41.43 -5.41Q41.02 -7.08 40.52 -8.58L44.32 -9.83Q44.9 -8.18 45.21 -6.34Q45.52 -4.5 45.52 -2.78Q45.52 1.83 43.03 4.64Q40.53 7.45 36.2 8.3ZM48.91 -21.33H52.75V-7.25Q52.75 -5.53 53.27 -4.82Q53.8 -4.11 55.31 -4.11H55.69V0H55.31Q52 0 50.46 -1.73Q48.91 -3.47 48.91 -6.96ZM65.72 0Q64.13 0 63.1 -0.54Q62.07 -1.08 61.43 -2Q60.61 -1.07 59.46 -0.53Q58.32 0 56.49 0H55.08V-4.11H56.52Q58.24 -4.11 58.99 -4.57Q59.74 -5.04 59.74 -6.69Q59.74 -7.04 59.68 -7.99Q59.63 -8.95 59.55 -9.82L63.13 -10.26L63.45 -6.31Q63.58 -4.11 65.75 -4.11Q67.1 -4.11 67.55 -4.7Q68 -5.3 68 -6.69Q68 -7.02 67.94 -7.98Q67.89 -8.95 67.81 -9.82L71.39 -10.26L71.71 -6.31Q71.77 -5.31 72.21 -4.71Q72.65 -4.11 73.69 -4.11Q74.67 -4.11 75.03 -4.87Q75.4 -5.63 75.4 -6.69Q75.4 -7.54 75.26 -8.43Q75.11 -9.33 74.93 -10.08Q74.74 -10.82 74.65 -11.19L78.33 -12.2Q78.64 -11.02 78.84 -9.7Q79.03 -8.38 79.03 -7.07Q79.03 -5.22 78.55 -3.61Q78.06 -2 76.89 -1Q75.72 0 73.71 0Q72.32 0 71.39 -0.57Q70.45 -1.14 69.83 -2.03Q69.04 -1.13 68.04 -0.56Q67.04 0 65.72 0ZM82.47 -21.33H86.3V-7.25Q86.3 -5.53 86.83 -4.82Q87.35 -4.11 88.87 -4.11H89.25V0H88.87Q85.55 0 84.01 -1.73Q82.47 -3.47 82.47 -6.96ZM91.9 0H88.61V-4.11H91.9Q93.14 -4.11 93.59 -4.85Q94.04 -5.6 94.04 -6.76Q94.04 -7.8 93.81 -9.01Q93.58 -10.23 93.32 -11.39L97.06 -12.35Q97.35 -10.96 97.52 -9.59Q97.69 -8.23 97.69 -6.99Q97.69 -4.99 97.16 -3.41Q96.62 -1.83 95.35 -0.92Q94.09 0 91.9 0ZM94.18 1.59 96.56 3.97 94.18 6.35 91.81 3.97ZM88.87 1.59 91.25 3.97 88.87 6.35 86.48 3.97ZM91.52 5.5 93.9 7.86 91.52 10.24 89.14 7.86Z",
};

type LogoVariant = "horizontal" | "stacked" | "mark" | "wordmark";
type LogoLang = "en" | "fa";

const LAYOUTS: Record<
  string,
  { vb: [number, number, number, number]; mark: [number, number] | null; word: [LogoLang, number, number] }
> = {
  "horizontal-en": { vb: [0, 0, 235.79, 48], mark: [0, 0], word: ["en", 60.75, 38.4] },
  "horizontal-fa": { vb: [0, 0, 160.39, 48], mark: [112.39, 0], word: ["fa", -1.3, 34.66] },
  "stacked-en": { vb: [0, 0, 171.79, 99.37], mark: [61.89, 0], word: ["en", -3.25, 92.8] },
  "stacked-fa": { vb: [0, 0, 96.39, 95.57], mark: [24.2, 0], word: ["fa", -1.3, 85.33] },
  "wordmark-en": { vb: [3.25, -28.8, 171.79, 35.37], mark: null, word: ["en", 0, 0] },
  "wordmark-fa": { vb: [1.3, -25.51, 96.39, 35.75], mark: null, word: ["fa", 0, 0] },
};

interface LogoProps {
  /** horizontal (default: header, deck cover, documents) / stacked (square, social, print) / mark (app icon, avatars) / wordmark (tight spaces). */
  variant?: LogoVariant;
  lang?: LogoLang;
  /** Mark height in px (minimum 16; a horizontal lockup needs size >= 20 to stay >= 96px wide). */
  size?: number;
  /** CSS hook for a solid-panel background swap; the mark itself is always monochrome via currentColor. */
  tone?: "auto" | "ink" | "paper";
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Approved Pasargad lockups — the line-art mark with the outlined wordmark,
 * in Latin or Persian. Monochrome only: colour it through the parent's
 * `color` (text on Paper, or zinc-50 on Ink); never place on photography.
 */
export default function Logo({
  variant = "horizontal",
  lang = "en",
  size = 32,
  tone = "auto",
  title,
  className,
  style,
}: LogoProps) {
  const resolved = Math.max(16, size);
  const label = title || (lang === "fa" ? "پاسارگاد" : "Pasargad");
  const common = {
    className: cn("pg-logo", className),
    "data-variant": variant,
    "data-lang": lang,
    "data-tone": tone,
    role: "img" as const,
    "aria-label": label,
    focusable: "false" as const,
    style,
  };

  if (variant === "mark") {
    return (
      <svg {...common} viewBox="0 0 48 48" width={resolved} height={resolved}>
        <MarkGroup optical={opticalFor(resolved)} />
      </svg>
    );
  }

  const layout = LAYOUTS[`${variant === "wordmark" ? "wordmark" : variant === "stacked" ? "stacked" : "horizontal"}-${lang}`];
  const scale = resolved / 48;
  const [vx, vy, vw, vh] = layout.vb;

  return (
    <svg
      {...common}
      viewBox={`${vx} ${vy} ${vw} ${vh}`}
      width={+(vw * scale).toFixed(2)}
      height={+(vh * scale).toFixed(2)}
    >
      {layout.mark ? <MarkGroup optical="regular" x={layout.mark[0]} y={layout.mark[1]} /> : null}
      <path
        transform={`translate(${layout.word[1]} ${layout.word[2]})`}
        fill="currentColor"
        d={WORD[layout.word[0]]}
      />
    </svg>
  );
}
