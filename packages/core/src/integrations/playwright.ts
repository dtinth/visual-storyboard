import type { StoryboardOutputTransport } from "../types.ts";
import { StoryboardWriter } from "../writer.ts";

/**
 * Minimal interface for a Playwright Locator.
 * The actual `@playwright/test` Locator satisfies this structurally.
 */
export interface LocatorLike {
  /** Returns the Page this locator belongs to. */
  page(): PageLike;
  /** Returns the bounding box of the first matching element, or null. */
  boundingBox(): Promise<{ x: number; y: number; width: number; height: number } | null>;
  /**
   * Evaluates a function in the browser context on the located element.
   * The element is typed as `unknown`; cast it inside the callback as needed.
   */
  evaluate<T>(fn: (el: unknown) => T | Promise<T>): Promise<T>;
  /** Returns an ARIA snapshot of the located element's subtree. */
  ariaSnapshot(): Promise<string>;
  /** Returns a human-readable string representation, e.g. the selector. */
  toString(): string;
}

/**
 * Minimal interface for a Playwright Page.
 * The actual `@playwright/test` Page satisfies this structurally.
 */
export interface PageLike {
  /** Takes a full-page screenshot and returns it as a buffer. */
  screenshot(): Promise<Uint8Array>;
  /** Returns the current viewport dimensions, or null if unset. */
  viewportSize(): { width: number; height: number } | null;
  /** Returns a Locator for the given selector. */
  locator(selector: string): LocatorLike;
}

/**
 * Minimal interface for Playwright's TestInfo.
 * The actual `@playwright/test` TestInfo satisfies this structurally.
 */
export interface TestInfoLike {
  /** Full title path, e.g. `["Suite name", "test name"]`. */
  titlePath: string[];
  /** The leaf test title. */
  title: string;
}

/**
 * Minimal interface for the Playwright `test` object.
 * The actual `@playwright/test` test object satisfies this structurally.
 */
export interface TestLike {
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires object destructuring
  beforeEach(fn: (fixtures: object, testInfo: TestInfoLike) => Promise<void>): void;
  // oxlint-disable-next-line no-empty-pattern -- Playwright requires object destructuring
  afterEach(fn: (fixtures: object, testInfo: TestInfoLike) => Promise<void>): void;
  info(): TestInfoLike;
}

export interface PlaywrightStoryboardOptions {
  /**
   * Transport instance, or a factory called once per test.
   * Use a factory to give each test its own output file.
   */
  transport: StoryboardOutputTransport | ((testInfo: TestInfoLike) => StoryboardOutputTransport);
  /**
   * Return `false` to disable capture entirely, e.g. based on an env variable.
   * Defaults to always enabled.
   */
  enabled?: () => boolean;
  /**
   * Called before each capture when a `LocatorLike` is passed to `capture()`.
   * Use this to inject a stabilization wait (e.g. wait for animations to settle).
   */
  beforeCapture?: (locator: LocatorLike) => Promise<void>;
}

interface TestState {
  writer: StoryboardWriter;
  pages: Set<PageLike>;
}

/**
 * Playwright integration for visual-storyboard.
 *
 * Wires `beforeEach`/`afterEach` hooks into a Playwright test object to
 * automatically create and finalize a {@link StoryboardWriter} per test.
 * Individual test steps call {@link capture} to record frames.
 *
 * @example
 * ```ts
 * // support.ts
 * import { test } from "@playwright/test";
 * import { PlaywrightStoryboard } from "visual-storyboard/integrations/playwright";
 * import { FileTransport } from "visual-storyboard/transports/file";
 *
 * export const storyboard = new PlaywrightStoryboard({
 *   transport: (testInfo) =>
 *     new FileTransport({ outputFile: `out/${testInfo.title}.ndjson` }),
 * }).install(test);
 *
 * // my.spec.ts
 * import { test } from "@playwright/test";
 * import { storyboard } from "./support";
 *
 * test("user login", async ({ page }) => {
 *   await page.goto("/login");
 *   await storyboard.capture("Login page", page.getByRole("heading"));
 * });
 * ```
 */
export class PlaywrightStoryboard {
  private readonly options: PlaywrightStoryboardOptions;
  private readonly state = new WeakMap<TestInfoLike, TestState>();
  private testRef?: TestLike;

  constructor(options: PlaywrightStoryboardOptions) {
    this.options = options;
  }

  /**
   * Registers `beforeEach`/`afterEach` hooks on the given Playwright test object.
   *
   * - `beforeEach`: creates a {@link StoryboardWriter} and writes an info event.
   * - `afterEach`: captures a final frame for every page touched during the test,
   *   then finalizes the writer.
   *
   * Returns `this` for chaining.
   */
  install(test: TestLike): this {
    this.testRef = test;

    // oxlint-disable-next-line no-empty-pattern -- Playwright requires object destructuring
    test.beforeEach(async ({}, testInfo) => {
      if (this.options.enabled && !this.options.enabled()) return;
      const transport =
        typeof this.options.transport === "function"
          ? this.options.transport(testInfo)
          : this.options.transport;
      const writer = new StoryboardWriter({ storyboardId: testInfo.title, transport });
      await writer.writeInfo({ title: testInfo.title });
      this.state.set(testInfo, { writer, pages: new Set() });
    });

    // oxlint-disable-next-line no-empty-pattern -- Playwright requires object destructuring
    test.afterEach(async ({}, testInfo) => {
      const entry = this.state.get(testInfo);
      if (!entry) return;
      for (const page of entry.pages) {
        await this.captureImpl("End of test", page, entry);
      }
      await entry.writer.finalize();
      this.state.delete(testInfo);
    });

    return this;
  }

  /**
   * Captures a visual frame at the current moment in the test.
   *
   * - **`LocatorLike`**: runs `beforeCapture` (e.g. stabilize), takes a screenshot,
   *   records the element's bounding box as a highlight, and captures an ARIA
   *   snapshot. Registers the locator's page for the end-of-test capture.
   * - **`PageLike`**: takes a full-page screenshot and ARIA snapshot with no
   *   highlight. Registers the page for the end-of-test capture.
   *
   * No-op when capture is disabled or `install()` has not been called.
   */
  async capture(name: string, subject: LocatorLike | PageLike): Promise<void> {
    if (!this.testRef) return;
    const entry = this.state.get(this.testRef.info());
    if (!entry) return;
    await this.captureImpl(name, subject, entry);
  }

  private async captureImpl(
    name: string,
    subject: LocatorLike | PageLike,
    entry: TestState,
  ): Promise<void> {
    if (isLocatorLike(subject)) {
      const page = subject.page();
      entry.pages.add(page);
      await this.options.beforeCapture?.(subject);
      const [screenshot, ariaSnapshot, box] = await Promise.all([
        page.screenshot(),
        page.locator("body").ariaSnapshot(),
        subject.boundingBox(),
      ]);
      await entry.writer.createFrame(name, {
        imageBuffer: screenshot,
        highlights: box ? [{ ...box, text: subject.toString() }] : [],
        viewport: page.viewportSize() ?? { width: 0, height: 0 },
        annotations: { ariaSnapshot },
      });
    } else {
      entry.pages.add(subject);
      const [screenshot, ariaSnapshot] = await Promise.all([
        subject.screenshot(),
        subject.locator("body").ariaSnapshot(),
      ]);
      await entry.writer.createFrame(name, {
        imageBuffer: screenshot,
        highlights: [],
        viewport: subject.viewportSize() ?? { width: 0, height: 0 },
        annotations: { ariaSnapshot },
      });
    }
  }
}

function isLocatorLike(subject: LocatorLike | PageLike): subject is LocatorLike {
  return typeof (subject as LocatorLike).page === "function";
}
