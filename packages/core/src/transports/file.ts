import { createHash } from "node:crypto";
import { mkdir, appendFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";

import type {
  StoryboardAssetInput,
  StoryboardAssetReference,
  StoryboardEvent,
  StoryboardOutputTransport,
} from "../types.ts";

function toPosixPath(value: string) {
  return value.split(sep).join("/");
}

export interface FileTransportOptions {
  /** Directory that will contain `storyboard.ndjson` and all screenshot assets. */
  outputDir: string;
}

export class FileTransport implements StoryboardOutputTransport {
  readonly outputFile: string;
  readonly assetDirectory: string;

  constructor(options: FileTransportOptions) {
    this.outputFile = join(options.outputDir, "storyboard.ndjson");
    this.assetDirectory = options.outputDir;
  }

  async writeAsset(asset: StoryboardAssetInput): Promise<StoryboardAssetReference> {
    const targetFile = join(this.assetDirectory, basename(asset.path));
    await mkdir(dirname(targetFile), { recursive: true });
    await writeFile(targetFile, asset.data);
    const sha256 = createHash("sha256").update(asset.data).digest("hex");
    const relativeUrl = toPosixPath(relative(dirname(this.outputFile), targetFile));
    return {
      url: relativeUrl,
      contentType: asset.contentType,
      byteLength: asset.data.byteLength,
      sha256,
    };
  }

  async writeEvent(event: StoryboardEvent): Promise<void> {
    await mkdir(dirname(this.outputFile), { recursive: true });
    await appendFile(this.outputFile, `${JSON.stringify(event)}\n`, "utf8");
  }

  async close() {}
}
