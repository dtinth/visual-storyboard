import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "vite-plus/test";

import { FileTransport } from "visual-storyboard/transports/file";
import { StoryboardWriter } from "visual-storyboard";

test("the sample producer setup can create a viewer-compatible storyboard", async () => {
  const directory = await mkdtemp(join(tmpdir(), "visual-storyboard-e2e-"));
  const outputFile = join(directory, "storyboards", "basic.ndjson");
  const writer = new StoryboardWriter({
    storyboardId: "Basic",
    transport: new FileTransport({ outputFile }),
  });

  await writer.createFrame("Landing state", {
    imageBuffer: Buffer.from("<svg></svg>"),
    imageContentType: "image/svg+xml",
    highlights: [],
    viewport: { width: 960, height: 540 },
  });
  await writer.finalize();

  const ndjson = await readFile(outputFile, "utf8");
  expect(JSON.parse(ndjson.trim())).toMatchObject({
    type: "frame",
    screenshot: { url: "basic/landing-state.svg" },
  });
});
