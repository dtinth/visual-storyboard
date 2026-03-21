/**
 * The viewport dimensions of the browser at the time a frame was captured.
 */
export interface StoryboardViewport {
  /** Viewport width in CSS pixels. */
  width: number;
  /** Viewport height in CSS pixels. */
  height: number;
}

/**
 * A highlighted region on a screenshot, typically corresponding to a UI element
 * that was interacted with or is relevant to the frame.
 */
export interface StoryboardHighlight {
  /** Left edge of the highlight in CSS pixels, relative to the viewport origin. */
  x: number;
  /** Top edge of the highlight in CSS pixels, relative to the viewport origin. */
  y: number;
  /** Width of the highlight in CSS pixels. */
  width: number;
  /** Height of the highlight in CSS pixels. */
  height: number;
  /** Human-readable label for this highlight, e.g. a Playwright locator string. */
  text: string;
}

/**
 * A binary asset (e.g. a screenshot image) to be written by a transport.
 */
export interface StoryboardAssetInput {
  /**
   * Suggested relative path for the asset, e.g. `"my-test/step-1.png"`.
   * The transport may use this as a filename hint or key.
   */
  path: string;
  /** MIME type of the asset, e.g. `"image/png"`. */
  contentType: string;
  /** Raw binary content of the asset. */
  data: Uint8Array;
}

/**
 * A reference to a binary asset that has been written by a transport.
 * Stored inside storyboard events so the viewer can resolve and fetch the asset.
 */
export interface StoryboardAssetReference {
  /**
   * URL of the asset. When stored in an NDJSON file, this is a relative URL
   * resolved against the URL of that NDJSON file.
   */
  url: string;
  /** MIME type of the asset, e.g. `"image/png"`. */
  contentType: string;
  /** Size of the asset in bytes. */
  byteLength: number;
  /** SHA-256 hex digest of the asset content, useful for deduplication and integrity checks. */
  sha256: string;
}

/**
 * An info event carrying storyboard-level metadata.
 *
 * Typically emitted once at the beginning of a storyboard to describe what it
 * represents — e.g. the test title, suite name, or run identifier. The viewer
 * can display this prominently as the storyboard's header.
 *
 * @example
 * ```ts
 * await writer.writeInfo({
 *   title: "User login flow",
 *   description: "End-to-end test: logs in and lands on the dashboard",
 *   annotations: { suite: "auth", runId: process.env.CI_RUN_ID ?? "local" },
 * });
 * ```
 */
export interface StoryboardInfoEvent {
  /** Event schema version. Always `1` for this interface. */
  version: 1;
  /** Discriminant for the event union type. */
  type: "info";
  /** ISO 8601 timestamp of when the event was created. */
  time: string;
  /** Short human-readable title for the storyboard, e.g. the test name. */
  title: string;
  /** Optional longer description of what this storyboard covers. */
  description?: string;
  /**
   * Arbitrary key-value annotations attached to the storyboard.
   * Use this for structured metadata such as suite name, CI run ID, branch, etc.
   */
  annotations?: Record<string, string>;
}

/**
 * A frame event — a visual snapshot of the application at a specific moment.
 *
 * Frames are the primary building blocks of a visual storyboard. Each frame captures:
 * - a full-page screenshot
 * - highlighted elements (e.g. the element being interacted with)
 * - the viewport size at the time of capture
 * - arbitrary key-value annotations (e.g. an accessibility tree snapshot)
 *
 * @example
 * ```ts
 * await writer.createFrame("After clicking Submit", {
 *   imageBuffer: await page.screenshot(),
 *   highlights: [{ x: 100, y: 200, width: 80, height: 32, text: "Submit button" }],
 *   viewport: page.viewportSize()!,
 *   annotations: { ariaSnapshot: await page.locator("body").ariaSnapshot() },
 * });
 * ```
 */
export interface StoryboardFrameEvent {
  /** Event schema version. Always `1` for this interface. */
  version: 1;
  /** Discriminant for the event union type. */
  type: "frame";
  /** ISO 8601 timestamp of when the frame was captured. */
  time: string;
  /** Human-readable name for this frame, e.g. `"After clicking Submit"`. */
  name: string;
  /**
   * URL-safe slug derived from `name`, unique within the storyboard.
   * Used to construct asset file names.
   */
  slug: string;
  /**
   * Arbitrary key-value annotations attached to this frame.
   *
   * Any string metadata can be stored here. Common entries:
   * - `"ariaSnapshot"` — the accessibility tree as produced by Playwright's
   *   `locator.ariaSnapshot()`, useful for accessibility review and diffing
   * - `"url"` — the page URL at the time of capture
   * - `"consoleErrors"` — any console errors logged during the step
   */
  annotations: Record<string, string>;
  /** Highlighted regions overlaid on the screenshot in the viewer. */
  highlights: StoryboardHighlight[];
  /** Browser viewport dimensions at the time of capture. */
  viewport: StoryboardViewport;
  /** Reference to the screenshot asset written by the transport. */
  screenshot: StoryboardAssetReference;
}

/**
 * Union of all storyboard event types.
 *
 * Events are serialized as newline-delimited JSON (NDJSON). The `type` field
 * acts as the discriminant for narrowing to a specific event type.
 */
export type StoryboardEvent = StoryboardInfoEvent | StoryboardFrameEvent;

/**
 * The pluggable I/O interface for persisting storyboard events and binary assets.
 *
 * A transport is responsible for accepting events and assets and handling them
 * according to the chosen strategy — writing to the local filesystem, uploading
 * to a cloud bucket, keeping in memory, discarding entirely, etc.
 *
 * The `visual-storyboard` package ships a {@link FileTransport} implementation.
 * Implement this interface to build custom transports (e.g. S3, in-memory).
 */
export interface StoryboardOutputTransport {
  /**
   * Persist a binary asset and return a reference that can be embedded in events.
   *
   * @param asset - The asset to write, including its suggested path, MIME type, and raw data.
   * @returns A reference containing the URL and metadata needed to retrieve the asset later.
   */
  writeAsset(asset: StoryboardAssetInput): Promise<StoryboardAssetReference>;

  /**
   * Persist a storyboard event (e.g. append it to an NDJSON file or send it to a stream).
   *
   * @param event - The event to write. Assets referenced by the event should already
   *   have been written via {@link writeAsset} before this is called.
   */
  writeEvent(event: StoryboardEvent): Promise<void>;

  /**
   * Flush and release any resources held by the transport (open file handles, network
   * connections, etc.). Call this once after all events have been written.
   */
  close?(): Promise<void>;
}

/**
 * Options passed to {@link StoryboardWriter.createFrame}.
 */
export interface CreateStoryboardFrameOptions {
  /** Raw screenshot image bytes. Defaults to PNG if `imageContentType` is not provided. */
  imageBuffer: Uint8Array;
  /**
   * MIME type of `imageBuffer`.
   * @default "image/png"
   */
  imageContentType?: string;
  /**
   * Arbitrary key-value annotations for this frame.
   * Pass `{ ariaSnapshot: await page.locator("body").ariaSnapshot() }` to include
   * a Playwright accessibility snapshot, or add any other string metadata.
   */
  annotations?: Record<string, string>;
  /** Regions of the screenshot to highlight in the viewer. */
  highlights: StoryboardHighlight[];
  /** Browser viewport dimensions at the time of capture. */
  viewport: StoryboardViewport;
}

/**
 * Options passed to {@link StoryboardWriter.writeInfo}.
 */
export interface WriteStoryboardInfoOptions {
  /** Short human-readable title for the storyboard, e.g. the test name. */
  title: string;
  /** Optional longer description of what this storyboard covers. */
  description?: string;
  /**
   * Arbitrary key-value annotations attached to the storyboard.
   * Use this for structured metadata such as suite name, CI run ID, branch, etc.
   */
  annotations?: Record<string, string>;
}
