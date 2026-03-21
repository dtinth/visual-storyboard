# visual-storyboard monorepo

This repository now contains the initial monorepo layout for visual-storyboard:

- `packages/core` — reusable TypeScript types, transport interfaces, a storyboard writer, and a default file transport
- `apps/viewer` — a React viewer that loads storyboard NDJSON from a URL and resolves asset URLs relative to that NDJSON document
- `apps/example` — an example workspace showing how to integrate visual-storyboard into a Playwright end-to-end test suite

## Development

- Install dependencies:

```bash
curl -fsSL https://vite.plus | bash
source ~/.bashrc
vp install
```

- Run the checks:

```bash
vp check
```

- Run the tests:

```bash
vp test
```

- Start the viewer:

```bash
vp run viewer#dev
```

- Start the example app:

```bash
vp run example#dev
```
