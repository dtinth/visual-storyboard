export interface StoryboardViewport {
  width: number;
  height: number;
}

export interface StoryboardHighlight {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

export interface StoryboardAssetInput {
  path: string;
  contentType: string;
  data: Uint8Array;
}

export interface StoryboardAssetReference {
  url: string;
  contentType: string;
  byteLength: number;
  sha256: string;
}

export interface StoryboardCheckpointEvent {
  version: 1;
  type: "checkpoint";
  time: string;
  name: string;
  slug: string;
  ariaSnapshot: string;
  highlights: StoryboardHighlight[];
  viewport: StoryboardViewport;
  screenshot: StoryboardAssetReference;
}

export type StoryboardEvent = StoryboardCheckpointEvent;

export interface StoryboardOutputTransport {
  writeAsset(asset: StoryboardAssetInput): Promise<StoryboardAssetReference>;
  writeEvent(event: StoryboardEvent): Promise<void>;
  close?(): Promise<void>;
}

export interface CreateStoryboardCheckpointOptions {
  imageBuffer: Uint8Array;
  imageContentType?: string;
  ariaSnapshot: string;
  highlights: StoryboardHighlight[];
  viewport: StoryboardViewport;
}
