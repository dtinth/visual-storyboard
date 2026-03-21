import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./apps/viewer/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "cd apps/example && vp dev --host 127.0.0.1 --port 4174",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:4174",
    },
    {
      command: "cd apps/viewer && vp dev --host 127.0.0.1 --port 4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:4173",
    },
  ],
});
