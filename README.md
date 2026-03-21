# visual-storyboard

A toolkit for capturing named screenshots during automated tests and viewing them as a visual storyboard. Works with any testing tool; ships with a built-in Playwright integration.

[![Example storyboard](https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/viewer-storyboards/viewer-supports-keyboard-navigation-between-frames/viewing-first-frame.png)](https://visual-storyboard.vercel.app/?url=https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/storyboards/example-spec-ts-swag-labs-checkout-flow.ndjson)

_Click the image to open the live example in the viewer._

At key points in your test, call `storyboard.capture("Step name", locator)`. After the run you get an NDJSON file with screenshots, highlights, and accessibility snapshots for each step — load it in the viewer to browse the test frame by frame.

## Packages

- [`packages/core`](packages/core) — TypeScript types, pluggable transport interface, `StoryboardWriter`, `FileTransport`, and the built-in Playwright integration. See the [core README](packages/core/README.md) for the full API.
- [`apps/viewer`](apps/viewer) — React viewer that loads a storyboard NDJSON from a URL
- [`apps/example`](apps/example) — example Playwright suite testing the [Swag Labs](https://www.saucedemo.com) checkout flow

## Development

```bash
curl -fsSL https://vite.plus | bash
source ~/.bashrc
vp install
vp check
vp test
```
