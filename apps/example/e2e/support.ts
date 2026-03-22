import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@playwright/test";
import {
  PlaywrightStoryboard,
  createPlaywrightFileOutputTransportFactory,
} from "visual-storyboard/integrations/playwright";

import { stabilize } from "./stabilize";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "../public");

export const storyboard = new PlaywrightStoryboard({
  test,
  transport: createPlaywrightFileOutputTransportFactory(join(publicDir, "storyboards")),
  beforeCapture: stabilize,
}).install();
