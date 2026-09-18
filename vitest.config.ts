import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        // next-intl's ESM build imports "next/server" without an extension,
        // which Node's resolver rejects; inlining lets Vite resolve it so the
        // middleware can be tested against the real routing.
        inline: ["next-intl"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
