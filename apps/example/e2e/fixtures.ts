import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test as base } from "@playwright/test";
import { FileTransport } from "visual-storyboard/transports/file";
import { StoryboardWriter } from "visual-storyboard";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");

/**
 * Extended Playwright test fixture that provides a {@link StoryboardWriter}
 * pre-configured to write to `public/storyboards/<slug>.ndjson`.
 *
 * The writer is automatically finalized after the test body completes,
 * so the only requirement in test code is calling `storyboard.createFrame()`
 * at each step of interest.
 */
export const test = base.extend<{ storyboard: StoryboardWriter }>({
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires object destructuring here
  storyboard: async ({}, use, testInfo) => {
    const slug = testInfo.title.toLowerCase().replace(/\W+/g, "-").replace(/^-|-$/g, "");
    const outputFile = join(publicDir, "storyboards", `${slug}.ndjson`);
    const writer = new StoryboardWriter({
      storyboardId: testInfo.title,
      transport: new FileTransport({ outputFile }),
    });
    await writer.writeInfo({ title: testInfo.title });
    await use(writer);
    await writer.finalize();
  },
});
