# visual-storyboard

A toolkit for capturing named screenshots during Playwright tests and viewing them as a visual storyboard.

[![Example storyboard](https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/viewer-storyboards/viewer-supports-keyboard-navigation-between-frames/viewing-first-frame.png)](https://visual-storyboard.vercel.app/?url=https://storyboard.t3.storage.dev/dtinth/visual-storyboard/main/storyboards/example-spec-ts-swag-labs-checkout-flow.ndjson)

_Click the image to open the live example in the viewer._

## How it works

In your Playwright tests, call `storyboard.capture("Step name", locator)` at key moments. After the test run, you get an NDJSON file containing the screenshots and accessibility snapshots for each captured step. Load that file in the viewer to browse the test run frame by frame.

```ts
test("checkout flow", async ({ page }) => {
  await page.goto("/");
  await storyboard.capture("Login page", page.getByRole("button", { name: "Login" }));

  // ... interact with the page ...

  await storyboard.capture("Order confirmation", page.locator(".confirmation"));
});
```

## Packages

- [`packages/core`](packages/core) — TypeScript types, transport interfaces, storyboard writer, and file transport
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
