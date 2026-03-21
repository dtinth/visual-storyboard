import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "vite-plus/test";

import { StoryboardWriter, type StoryboardEvent, type StoryboardFrameEvent } from "../src";
import { FileTransport } from "../src/transports/file.ts";

class MemoryTransport {
  readonly assets: Array<{ path: string; contentType: string; data: Uint8Array }> = [];
  readonly events: StoryboardEvent[] = [];

  async writeAsset(asset: { path: string; contentType: string; data: Uint8Array }) {
    this.assets.push(asset);
    return {
      url: asset.path,
      contentType: asset.contentType,
      byteLength: asset.data.byteLength,
      sha256: "memory",
    };
  }

  async writeEvent(event: StoryboardEvent) {
    this.events.push(event);
  }
}

test("StoryboardWriter emits unique frame events through the transport", async () => {
  const transport = new MemoryTransport();
  const writer = new StoryboardWriter({
    storyboardId: "Checkout flow",
    transport,
  });

  await writer.createFrame("Open dialog", {
    imageBuffer: Buffer.from("first"),
    highlights: [{ x: 1, y: 2, width: 3, height: 4, text: "dialog" }],
    viewport: { width: 1280, height: 720 },
  });
  const second = await writer.createFrame("!!!", {
    imageBuffer: Buffer.from("second"),
    highlights: [],
    viewport: { width: 1280, height: 720 },
  });

  expect(transport.assets).toHaveLength(2);
  expect(transport.events).toHaveLength(2);
  expect(transport.assets[0]?.path).toBe("checkout-flow/open-dialog.png");
  expect(second.slug).toBe("frame");
  expect((transport.events[1] as StoryboardFrameEvent)?.screenshot.url).toBe(
    "checkout-flow/frame.png",
  );
});

test("FileTransport writes NDJSON events and binary assets using relative URLs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "visual-storyboard-core-"));
  const outputFile = join(directory, "storyboards", "basic.ndjson");
  const writer = new StoryboardWriter({
    storyboardId: "Sample Storyboard",
    transport: new FileTransport({ outputFile }),
  });

  const event = await writer.createFrame("First step", {
    imageBuffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    imageContentType: "image/svg+xml",
    highlights: [],
    viewport: { width: 800, height: 600 },
  });
  await writer.finalize();

  expect(event.screenshot.url).toBe("sample-storyboard/first-step.svg");

  const ndjson = await readFile(outputFile, "utf8");
  const [line] = ndjson.trim().split("\n");
  expect(line).toBeTruthy();
  expect(JSON.parse(line)).toMatchObject({
    type: "frame",
    screenshot: { url: "sample-storyboard/first-step.svg" },
  });

  const assetFile = join(directory, "storyboards", "sample-storyboard", "first-step.svg");
  expect(await readFile(assetFile, "utf8")).toContain("<svg");
});
