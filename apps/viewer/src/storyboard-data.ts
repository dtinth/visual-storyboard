import type { StoryboardCheckpointEvent, StoryboardEvent } from "@visual-storyboard/core";

export interface ResolvedStoryboardCheckpoint extends StoryboardCheckpointEvent {
  resolvedScreenshotUrl: string;
}

export function parseNdjsonDocument(document: string): StoryboardEvent[] {
  return document
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StoryboardEvent);
}

export function resolveStoryboardAssetUrl(documentUrl: string, assetUrl: string) {
  return new URL(assetUrl, documentUrl).toString();
}

export async function loadStoryboard(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<ResolvedStoryboardCheckpoint[]> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`Unable to load storyboard from ${url}: ${response.status}`);
  }
  const document = await response.text();
  return parseNdjsonDocument(document)
    .filter((event): event is StoryboardCheckpointEvent => event.type === "checkpoint")
    .map((event) => ({
      ...event,
      resolvedScreenshotUrl: resolveStoryboardAssetUrl(url, event.screenshot.url),
    }));
}
