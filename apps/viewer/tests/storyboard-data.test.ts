import { expect, test } from "vite-plus/test";

import {
  loadStoryboard,
  parseNdjsonDocument,
  resolveStoryboardAssetUrl,
} from "../src/storyboard-data";

test("parseNdjsonDocument ignores blank lines and returns storyboard events", () => {
  const events = parseNdjsonDocument(
    [
      JSON.stringify({
        version: 1,
        type: "frame",
        time: "2026-03-21T00:00:00.000Z",
        name: "Welcome",
        slug: "welcome",
        annotations: {},
        highlights: [],
        viewport: { width: 800, height: 600 },
        screenshot: {
          url: "basic/welcome.svg",
          contentType: "image/svg+xml",
          byteLength: 10,
          sha256: "hash",
        },
      }),
      "",
    ].join("\n"),
  );

  expect(events).toHaveLength(1);
  expect(events[0]?.type).toBe("frame");
});

test("resolveStoryboardAssetUrl resolves relative asset URLs against the NDJSON URL", () => {
  expect(
    resolveStoryboardAssetUrl("https://example.com/storyboards/basic.ndjson", "basic/welcome.svg"),
  ).toBe("https://example.com/storyboards/basic/welcome.svg");
  expect(
    resolveStoryboardAssetUrl(
      "https://example.com/storyboards/basic.ndjson",
      "https://cdn.example.com/welcome.svg",
    ),
  ).toBe("https://cdn.example.com/welcome.svg");
});

test("loadStoryboard resolves screenshot URLs from the fetched NDJSON document", async () => {
  const storyboard = await loadStoryboard(
    "https://example.com/storyboards/basic.ndjson",
    async () =>
      new Response(
        `${JSON.stringify({
          version: 1,
          type: "frame",
          time: "2026-03-21T00:00:00.000Z",
          name: "Welcome",
          slug: "welcome",
          annotations: {},
          highlights: [],
          viewport: { width: 800, height: 600 },
          screenshot: {
            url: "basic/welcome.svg",
            contentType: "image/svg+xml",
            byteLength: 10,
            sha256: "hash",
          },
        })}\n`,
      ),
  );

  expect(storyboard).toHaveLength(1);
  expect(storyboard[0]?.resolvedScreenshotUrl).toBe(
    "https://example.com/storyboards/basic/welcome.svg",
  );
});
