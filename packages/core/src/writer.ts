import type {
  CreateStoryboardCheckpointOptions,
  StoryboardCheckpointEvent,
  StoryboardOutputTransport,
} from "./types";

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

export interface StoryboardWriterOptions {
  storyboardId: string;
  transport: StoryboardOutputTransport;
}

export class StoryboardWriter {
  private readonly usedSlugs = new Set<string>();
  private readonly storyboardSlug: string;
  private readonly transport: StoryboardOutputTransport;

  constructor(options: StoryboardWriterOptions) {
    this.storyboardSlug = slugifySegment(options.storyboardId, "storyboard");
    this.transport = options.transport;
  }

  async createCheckpoint(
    name: string,
    options: CreateStoryboardCheckpointOptions,
  ): Promise<StoryboardCheckpointEvent> {
    const slugBase = slugifySegment(name, "checkpoint");
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

    const event: StoryboardCheckpointEvent = {
      version: 1,
      type: "checkpoint",
      time: new Date().toISOString(),
      name,
      slug,
      ariaSnapshot: options.ariaSnapshot,
      highlights: options.highlights,
      viewport: options.viewport,
      screenshot,
    };
    await this.transport.writeEvent(event);
    return event;
  }

  async finalize() {
    await this.transport.close?.();
  }
}
