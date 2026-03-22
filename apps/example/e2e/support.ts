import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@playwright/test";
import { PlaywrightStoryboard } from "visual-storyboard/integrations/playwright";
import { FileTransport } from "visual-storyboard/transports/file";

import { stabilize } from "./stabilize";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");

export const storyboard = new PlaywrightStoryboard({
  test,
  transport: (testInfo) => {
    const slug = testInfo.titlePath
      .join(" ")
      .toLowerCase()
      .replace(/\W+/g, " ")
      .trim()
      .replace(/\s+/g, "-");
    return new FileTransport({
      outputFile: join(publicDir, "storyboards", `${slug}.ndjson`),
    });
  },
  beforeCapture: stabilize,
}).install();
