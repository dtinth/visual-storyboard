import type {
  CreateStoryboardFrameOptions,
  StoryboardFrameEvent,
  StoryboardInfoEvent,
  StoryboardOutputTransport,
  WriteStoryboardInfoOptions,
} from "./types.ts";

function slugifySegment(value: string, fallback: string) {
  const slug = value.toLowerCase().replace(/\W+/g, " ").trim().replace(/\s+/g, "-");
  return slug || fallback;
}

function fileExtensionForContentType(contentType: string) {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/svg+xml":
      return "svg";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

/**
 * Options for constructing a {@link StoryboardWriter}.
 */
export interface StoryboardWriterOptions {
  /**
   * A unique identifier for this storyboard, e.g. a test title or run ID.
   * Slugified and used as the prefix for asset file names.
   */
  storyboardId: string;
  /** The transport that handles persisting events and assets. */
  transport: StoryboardOutputTransport;
}

/**
 * High-level helper for producing a visual storyboard.
 *
 * `StoryboardWriter` manages slug uniqueness, asset naming, and event ordering.
 * It delegates all I/O to the provided {@link StoryboardOutputTransport}, keeping
 * the writer itself free of any filesystem or network concerns.
 *
 * @example
 * ```ts
 * const writer = new StoryboardWriter({
 *   storyboardId: "user-login",
 *   transport: new FileTransport({ outputFile: "out/storyboard.ndjson" }),
 * });
 *
 * await writer.writeInfo({ title: "User login flow" });
 * await writer.createFrame("Landing page", { imageBuffer, highlights, viewport });
 * await writer.finalize();
 * ```
 */
export class StoryboardWriter {
  private readonly usedSlugs = new Set<string>();
  private readonly storyboardSlug: string;
  private readonly transport: StoryboardOutputTransport;

  constructor(options: StoryboardWriterOptions) {
    this.storyboardSlug = slugifySegment(options.storyboardId, "storyboard");
    this.transport = options.transport;
  }

  /**
   * Write an info event describing the storyboard.
   *
   * Call this once at the beginning, before any frames, to give the storyboard
   * a title and optional metadata (description, suite name, CI run ID, etc.).
   *
   * @param options - Title, description, and annotations for this storyboard.
   * @returns The info event that was written.
   */
  async writeInfo(options: WriteStoryboardInfoOptions): Promise<StoryboardInfoEvent> {
    const event: StoryboardInfoEvent = {
      version: 1,
      type: "info",
      time: new Date().toISOString(),
      title: options.title,
      ...(options.description !== undefined && { description: options.description }),
      ...(options.annotations !== undefined && { annotations: options.annotations }),
    };
    await this.transport.writeEvent(event);
    return event;
  }

  /**
   * Capture a frame — upload the screenshot asset and append the frame event.
   *
   * The frame's slug is derived from `name` and made unique within this storyboard
   * by appending a counter suffix if needed (e.g. `"login-2"`, `"login-3"`).
   *
   * @param name - Human-readable name for this frame, e.g. `"After clicking Submit"`.
   * @param options - Screenshot buffer, highlights, viewport, and optional annotations.
   * @returns The frame event that was written.
   */
  async createFrame(
    name: string,
    options: CreateStoryboardFrameOptions,
  ): Promise<StoryboardFrameEvent> {
    const slugBase = slugifySegment(name, "frame");
    let slug = slugBase;
    let counter = 1;
    while (this.usedSlugs.has(slug)) {
      counter += 1;
      slug = `${slugBase}-${counter}`;
    }
    this.usedSlugs.add(slug);

    const contentType = options.imageContentType ?? "image/png";
    const extension = fileExtensionForContentType(contentType);
    const screenshot = await this.transport.writeAsset({
      path: `${this.storyboardSlug}/${slug}.${extension}`,
      contentType,
      data: options.imageBuffer,
    });

    const event: StoryboardFrameEvent = {
      version: 1,
      type: "frame",
      time: new Date().toISOString(),
      name,
      slug,
      annotations: options.annotations ?? {},
      highlights: options.highlights,
      viewport: options.viewport,
      screenshot,
    };
    await this.transport.writeEvent(event);
    return event;
  }

  /**
   * Flush and close the transport.
   *
   * Call this once after all frames have been written to ensure any buffered
   * data is flushed and open resources (file handles, connections) are released.
   */
  async finalize() {
    await this.transport.close?.();
  }
}
