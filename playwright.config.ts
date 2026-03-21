import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        "cd /home/runner/work/visual-storyboard/visual-storyboard/apps/e2e && ../../node_modules/.bin/vp run generate && ../../node_modules/.bin/vp dev --host 127.0.0.1 --port 4174",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:4174",
    },
    {
      command:
        "cd /home/runner/work/visual-storyboard/visual-storyboard/apps/viewer && ../../node_modules/.bin/vp dev --host 127.0.0.1 --port 4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:4173",
    },
  ],
});
