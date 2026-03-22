import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { test } from "@playwright/test";
import {
  PlaywrightStoryboard,
  createPlaywrightFileOutputTransportFactory,
} from "visual-storyboard/integrations/playwright";

import { stabilize } from "./stabilize";

const storyboardDir = join(dirname(fileURLToPath(import.meta.url)), "../storyboards");

export const storyboard = new PlaywrightStoryboard({
  test,
  transport: createPlaywrightFileOutputTransportFactory(storyboardDir),
  beforeCapture: stabilize,
}).install();
