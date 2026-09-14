import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PlaywrightStoryboard,
  createPlaywrightFileOutputTransportFactory,
} from "visual-storyboard/integrations/playwright";

import { stabilize } from "./stabilize";

const storyboardDir = join(dirname(fileURLToPath(import.meta.url)), "../storyboards");

export const storyboard = new PlaywrightStoryboard({
  transport: createPlaywrightFileOutputTransportFactory(storyboardDir),
  beforeCapture: stabilize,
});
