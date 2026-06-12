import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  oxc: false,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    // @ts-expect-error Vite accepts the esbuild JSX transform option at runtime.
    jsx: "automatic",
  },
});
