import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      exclude: [
        ...(configDefaults.coverage?.exclude ?? []),
        // shadcn/Radix wrappers scaffolded by `shadcn add`: no project logic, and no
        // route/component imports any of them (all 46 files, incl. button.tsx).
        "src/components/ui/**",
        // TanStack Router codegen, rewritten on every build ("do not edit").
        "src/routeTree.gen.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
