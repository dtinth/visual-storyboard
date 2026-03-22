import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "vite-plus/test";

import { FileTransport } from "../src/transports/file.ts";
import { StoryboardWriter } from "../src";

test("FileTransport writes a viewer-compatible storyboard", async () => {
  const directory = await mkdtemp(join(tmpdir(), "visual-storyboard-e2e-"));
  const outputDir = join(directory, "storyboards", "basic");
  const writer = new StoryboardWriter({
    storyboardId: "Basic",
    transport: new FileTransport({ outputDir }),
  });

  await writer.createFrame("Landing state", {
    imageBuffer: Buffer.from("<svg></svg>"),
    imageContentType: "image/svg+xml",
    highlights: [],
    viewport: { width: 960, height: 540 },
  });
  await writer.finalize();

  const ndjson = await readFile(join(outputDir, "storyboard.ndjson"), "utf8");
  expect(JSON.parse(ndjson.trim())).toMatchObject({
    type: "frame",
    screenshot: { url: "landing-state.svg" },
  });
});
