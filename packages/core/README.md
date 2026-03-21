# visual-storyboard

A toolkit for capturing named screenshots during automated tests and viewing them as a visual storyboard. Works with any testing tool; ships with a built-in Playwright integration.

[![Example storyboard](https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/viewer-storyboards/viewer-supports-keyboard-navigation-between-frames/viewing-first-frame.png)](https://visual-storyboard.vercel.app/?url=https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/storyboards/example-spec-ts-swag-labs-checkout-flow.ndjson)

_Click the image to open the live example in the viewer._

Source and issue tracker: [github.com/dtinth/visual-storyboard](https://github.com/dtinth/visual-storyboard)

---

## Playwright integration

The quickest way to get started. Create a support file:

```ts
// e2e/support.ts
import { test } from "@playwright/test";
import { PlaywrightStoryboard } from "visual-storyboard/integrations/playwright";
import { FileTransport } from "visual-storyboard/transports/file";

export const storyboard = new PlaywrightStoryboard({
  transport: (testInfo) => new FileTransport({ outputFile: `out/${testInfo.title}.ndjson` }),
}).install(test);
```

Then call `capture` in your tests:

```ts
// e2e/my.spec.ts
import { test } from "@playwright/test";
import { storyboard } from "./support";

test("checkout flow", async ({ page }) => {
  await page.goto("/");
  await storyboard.capture("Login page", page.getByRole("button", { name: "Login" }));
  // ... interact ...
  await storyboard.capture("Order confirmation", page.locator(".confirmation"));
});
```

`capture` accepts a **locator** (records a bounding-box highlight and scrolls the element into view) or a **page** (full-page screenshot, no highlight). An ARIA snapshot is always captured alongside the screenshot.

After each test the integration automatically captures a final "End of test" frame and closes the transport.

### `PlaywrightStoryboardOptions`

| Option          | Type                                                                   | Description                                                                       |
| --------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `transport`     | `StoryboardOutputTransport \| (testInfo) => StoryboardOutputTransport` | Transport instance or per-test factory                                            |
| `enabled`       | `() => boolean`                                                        | Return `false` to disable capture (e.g. based on an env var)                      |
| `beforeCapture` | `(locator: LocatorLike) => Promise<void>`                              | Hook called before each locator capture — use it to wait for animations to settle |

---

## Core API (`visual-storyboard`)

### `StoryboardWriter`

High-level helper that manages slug uniqueness and delegates I/O to a transport.

```ts
import { StoryboardWriter } from "visual-storyboard";
import { FileTransport } from "visual-storyboard/transports/file";

const writer = new StoryboardWriter({
  storyboardId: "my-test",
  transport: new FileTransport({ outputFile: "out/storyboard.ndjson" }),
});

await writer.writeInfo({ title: "My test", annotations: { branch: "main" } });
await writer.createFrame("Step 1", { imageBuffer, highlights: [], viewport });
await writer.finalize();
```

**`writer.writeInfo(options)`** — writes an `info` event with a title, optional description, and arbitrary key-value annotations.

**`writer.createFrame(name, options)`** — uploads the screenshot asset and appends a `frame` event. Options: `imageBuffer`, `highlights`, `viewport`, `annotations` (e.g. `{ ariaSnapshot }`), `imageContentType`.

**`writer.finalize()`** — flushes and closes the transport.

### `FileTransport`

Writes assets alongside the NDJSON file on disk. Asset URLs in the NDJSON are relative to the NDJSON file, so the directory is self-contained and portable.

```ts
import { FileTransport } from "visual-storyboard/transports/file";

new FileTransport({ outputFile: "out/storyboard.ndjson" });
// assets go to out/<storyboard-slug>/<frame-slug>.png by default

new FileTransport({
  outputFile: "out/storyboard.ndjson",
  assetDirectory: "out/assets", // override asset directory
});
```

### Custom transports

Implement `StoryboardOutputTransport` to send storyboards anywhere:

```ts
import type { StoryboardOutputTransport } from "visual-storyboard";

class MyTransport implements StoryboardOutputTransport {
  async writeAsset(asset) {
    // upload asset.data (Uint8Array), return { url, contentType, byteLength, sha256 }
  }
  async writeEvent(event) {
    // append JSON line to your storage
  }
  async close() {
    // flush / release resources
  }
}
```

### NDJSON format

Each line is a JSON object with a `type` field:

- `{ type: "info", version: 1, time, title, description?, annotations? }` — storyboard metadata, written once at the start
- `{ type: "frame", version: 1, time, name, slug, screenshot, highlights, viewport, annotations }` — one per captured step; `screenshot.url` is relative to the NDJSON file
