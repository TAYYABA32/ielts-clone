import { defineConfig } from "vitest/config";

/**
 * Node environment (no DOM) — everything under test here is pure business
 * logic (grading, band math, Zod schemas), not React components, so jsdom
 * isn't needed and isn't installed. Add a jsdom-environment project
 * separately if/when component tests are introduced.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/scoring/**/*.ts", "lib/validation/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
  },
  resolve: {
    // Mirrors tsconfig.json's "@/*" -> "./*" path mapping.
    alias: {
      "@": import.meta.dirname,
    },
  },
});
