/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy alias kept only for the still-unstyled public booking flow
        // (app/book/**) and the global error boundary, which are out of
        // scope for this dark-theme pass; maps to the new violet accent.
        brand: {
          50: "#f5f7ff",
          100: "#ebf0ff",
          500: "#5B4FE0",
          600: "#5B4FE0",
          700: "#4a3fc9",
        },
        canvas: "#0D0E13",
        surface: "#181A22",
        "surface-raised": "#20222D",
        subtle: "#2A2D3A",
        violet: {
          DEFAULT: "#5B4FE0",
          dim: "#8B7FE8",
        },
        ink: {
          primary: "#E9EAF0",
          muted: "#8C90A0",
        },
        status: {
          success: "#3FBF7F",
          warn: "#E0A63F",
          error: "#E0574F",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0px",
        control: "6px",
        interactive: "8px",
      },
      keyframes: {
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "reveal-up": "reveal-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
