import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: ["cypress/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      exclude: [
        "cypress/**", 
        "cypress.config.ts",
        "eslint.config.js",
        "vite.config.ts",
        "node_modules/**", 
        "**/*.d.ts", 
        "src/components/ui/**", 
        "src/main.tsx",
        "src/components/dashboard/BlocksTxChart.tsx",
        "src/components/transaction/BlockTransactions.tsx"
      ],
      thresholds: {
        statements: 84,
        branches: 69,
        functions: 75,
        lines: 84
      }
    }
  },
});
