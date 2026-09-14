import { expect, test } from "vite-plus/test";

import {
  PlaywrightStoryboard,
  type PageLike,
  type TestInfoLike,
  type TestLike,
} from "../src/integrations/playwright.ts";
import type { StoryboardEvent } from "../src/types.ts";

/**
 * Shared ambient "currently running test" tracker, module-scoped rather than
 * per-fake-test-object — mirroring real Playwright, where `test.info()` on
 * *any* `test`/extended-`test` variant resolves the same worker-wide current
 * test, not something scoped to whichever `test` object happens to be asked.
 */
let currentTestInfo: TestInfoLike | undefined;

/**
 * A fake Playwright `test` object. Each instance stands in for a distinct
 * spec file: it records whatever `beforeEach`/`afterEach` callbacks get
 * registered on it, and `runTest` drives them the way Playwright would drive
 * a single test — this is what lets the test below simulate "two spec files
 * sharing one `storyboard` instance" without needing a real Playwright
 * process per spec file.
 */
function createFakeTest(): TestLike<TestInfoLike> & {
  runTest(testInfo: TestInfoLike, fn: () => Promise<void>): Promise<void>;
} {
  const beforeEachCallbacks: Array<(fixtures: object, testInfo: TestInfoLike) => Promise<void>> =
    [];
  const afterEachCallbacks: Array<(fixtures: object, testInfo: TestInfoLike) => Promise<void>> = [];

  const fakeTest = ((_title: string, _fn: unknown) => {}) as TestLike<TestInfoLike> & {
    runTest(testInfo: TestInfoLike, fn: () => Promise<void>): Promise<void>;
  };
  fakeTest.beforeEach = (fn) => {
    beforeEachCallbacks.push(fn);
  };
  fakeTest.afterEach = (fn) => {
    afterEachCallbacks.push(fn);
  };
  fakeTest.info = () => {
    if (!currentTestInfo) throw new Error("not currently running a test");
    return currentTestInfo;
  };
  fakeTest.runTest = async (testInfo, fn) => {
    currentTestInfo = testInfo;
    for (const cb of beforeEachCallbacks) await cb({}, testInfo);
    await fn();
    for (const cb of afterEachCallbacks) await cb({}, testInfo);
    currentTestInfo = undefined;
  };
  return fakeTest;
}

function createFakePage(): PageLike {
  return {
    async screenshot() {
      return new Uint8Array([1, 2, 3]);
    },
    viewportSize() {
      return { width: 800, height: 600 };
    },
    locator() {
      return {
        page: () => createFakePage(),
        async boundingBox() {
          return null;
        },
        async evaluate() {
          return undefined as never;
        },
        async ariaSnapshot() {
          return "";
        },
        toString() {
          return "body";
        },
      };
    },
  };
}

function collectFrameNames(events: StoryboardEvent[]): string[] {
  return events.filter((e) => e.type === "frame").map((e) => e.name);
}

test("enable() registers hooks scoped to the calling spec file, so two spec files sharing one instance both capture", async () => {
  const eventsByTitle = new Map<string, StoryboardEvent[]>();
  const storyboard = new PlaywrightStoryboard({
    transport: (testInfo) => {
      const events: StoryboardEvent[] = [];
      eventsByTitle.set(testInfo.title, events);
      return {
        async writeAsset(asset) {
          return {
            url: asset.path,
            contentType: asset.contentType,
            byteLength: asset.data.byteLength,
            sha256: "fake",
          };
        },
        async writeEvent(event) {
          events.push(event);
        },
        async close() {},
      };
    },
  });

  // Two fake `test` objects stand in for two distinct spec files.
  const testA = createFakeTest();
  const testB = createFakeTest();
  storyboard.enable(testA);
  storyboard.enable(testB);

  await testA.runTest({ title: "a test", titlePath: ["a.spec.ts", "a test"] }, async () => {
    await storyboard.capture("frame-a", createFakePage());
  });
  await testB.runTest({ title: "b test", titlePath: ["b.spec.ts", "b test"] }, async () => {
    await storyboard.capture("frame-b", createFakePage());
  });

  expect(collectFrameNames(eventsByTitle.get("a test")!)).toEqual(["frame-a", "End of test"]);
  expect(collectFrameNames(eventsByTitle.get("b test")!)).toEqual(["frame-b", "End of test"]);
});

test("capture() is a no-op when enable() was never called for the running test's spec file", async () => {
  let transportCalls = 0;
  const storyboard = new PlaywrightStoryboard({
    transport: () => ({
      async writeAsset(asset) {
        transportCalls++;
        return { url: asset.path, contentType: asset.contentType, byteLength: 0, sha256: "" };
      },
      async writeEvent() {
        transportCalls++;
      },
      async close() {},
    }),
  });

  // No call to storyboard.enable() here — simulates a spec file that forgot it.
  await expect(storyboard.capture("frame", createFakePage())).resolves.toBeUndefined();
  expect(transportCalls).toBe(0);
});
