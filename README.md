# visual-storyboard monorepo

This repository now contains the initial monorepo layout for visual-storyboard:

- `packages/core` — reusable TypeScript types, transport interfaces, a storyboard writer, and a default file transport
- `apps/viewer` — a React viewer that loads storyboard NDJSON from a URL and resolves asset URLs relative to that NDJSON document
- `apps/e2e` — a small sample producer workspace that generates storyboard fixtures for local development and integration testing

## Development

- Install dependencies:

```bash
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

- Start the sample producer:

```bash
vp run e2e#dev
```
