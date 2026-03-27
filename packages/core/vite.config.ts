import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts", "src/transports/file.ts", "src/integrations/playwright.ts"],
    dts: {
      tsgo: true,
      sourcemap: true,
    },
    exports: true,
    sourcemap: true,
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
