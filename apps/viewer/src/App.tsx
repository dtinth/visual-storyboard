import { useEffect, useMemo, useRef, useState } from "react";

import { getNextFrameIndex } from "./frame-navigation";
import type { ResolvedStoryboardFrame } from "./storyboard-data";
import { loadStoryboard } from "./storyboard-data";

function useStoryboardUrl() {
  return useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("url") ?? "";
  }, []);
}

export function App() {
  const storyboardUrl = useStoryboardUrl();
  const [inputUrl, setInputUrl] = useState("");
  const [frames, setFrames] = useState<ResolvedStoryboardFrame[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(Boolean(storyboardUrl));
  const frameButtons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!storyboardUrl) {
      setFrames([]);
      setActiveIndex(-1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadStoryboard(storyboardUrl)
      .then((loadedFrames) => {
        if (!cancelled) {
          setFrames(loadedFrames);
          setError("");
          const hash = window.location.hash;
          const match = /^#frame-(\d+)$/.exec(hash);
          let initialIndex = 0;
          if (match) {
            const idx = parseInt(match[1], 10);
            if (idx >= 0 && idx < loadedFrames.length) {
              initialIndex = idx;
            }
          }
          setActiveIndex(loadedFrames.length > 0 ? initialIndex : -1);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
          setFrames([]);
          setActiveIndex(-1);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storyboardUrl]);

  useEffect(() => {
    if (activeIndex >= 0) {
      history.replaceState(null, "", `#frame-${activeIndex}`);
    }
  }, [activeIndex]);

  const activeFrame = activeIndex >= 0 ? frames[activeIndex] : undefined;

  function handleFrameKeyDown(index: number, key: string) {
    const nextIndex = getNextFrameIndex(index, frames.length, key);
    if (nextIndex === index || nextIndex < 0) return;
    setActiveIndex(nextIndex);
    frameButtons.current[nextIndex]?.focus();
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputUrl.trim()) {
      const params = new URLSearchParams(window.location.search);
      params.set("url", inputUrl.trim());
      window.location.search = params.toString();
    }
  }

  if (!storyboardUrl) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="card shadow-lg" style={{ width: "100%", maxWidth: "480px" }}>
          <div className="card-body p-4">
            <h1 className="h4 fw-semibold mb-2">visual-storyboard</h1>
            <p className="text-body-secondary mb-3 small">
              Enter a storyboard NDJSON URL to get started.
            </p>
            <form className="d-flex gap-2" onSubmit={handleUrlSubmit}>
              <input
                autoFocus
                className="form-control"
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://…/storyboard.ndjson"
                type="url"
                value={inputUrl}
              />
              <button className="btn btn-primary" type="submit">
                Load
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="sidebar-panel d-flex flex-column border-end overflow-hidden">
        <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0">
          <span className="text-uppercase fw-semibold small text-body-secondary">
            visual-storyboard
          </span>
          <span className="badge text-bg-secondary">{frames.length}</span>
        </div>

        {loading && (
          <div className="px-3 py-2 text-body-secondary small flex-shrink-0">Loading…</div>
        )}
        {error && <div className="px-3 py-2 text-danger small flex-shrink-0">{error}</div>}

        <div
          aria-label="Storyboard frames"
          aria-orientation="vertical"
          className="list-group list-group-flush overflow-y-auto flex-grow-1"
          role="tablist"
        >
          {frames.map((frame, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={`${frame.slug}-${frame.time}`}
                ref={(el) => {
                  frameButtons.current[index] = el;
                }}
                aria-controls="storyboard-details"
                aria-selected={isActive}
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 text-start py-2 px-3 ${
                  isActive ? "active" : ""
                }`}
                id={`frame-tab-${index}`}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => {
                  const nextIndex = getNextFrameIndex(index, frames.length, e.key);
                  if (nextIndex !== index) {
                    e.preventDefault();
                    handleFrameKeyDown(index, e.key);
                  }
                }}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                <span
                  className={`small text-end flex-shrink-0 frame-number ${isActive ? "text-white-50" : "text-body-tertiary"}`}
                >
                  {index + 1}
                </span>
                <img
                  alt=""
                  className="object-fit-cover rounded flex-shrink-0 frame-thumb"
                  src={frame.resolvedScreenshotUrl}
                />
                <span className="small frame-name">{frame.name}</span>
              </button>
            );
          })}
        </div>

        <div className="px-3 py-2 border-top flex-shrink-0">
          <span className="small text-body-tertiary">
            Powered by{" "}
            <a
              className="text-body-tertiary"
              href="https://visual-storyboard.vercel.app/"
              rel="noopener noreferrer"
              target="_blank"
            >
              visual-storyboard
            </a>{" "}
            ·{" "}
            <a
              className="text-body-tertiary"
              href="https://github.com/dtinth/visual-storyboard"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main
        aria-labelledby={activeFrame ? `frame-tab-${activeIndex}` : undefined}
        className="flex-grow-1 overflow-y-auto"
        id="storyboard-details"
        role="tabpanel"
        tabIndex={0}
      >
        {activeFrame ? (
          <div className="p-4" style={{ maxWidth: "1200px" }}>
            <h2 className="h5 mb-1">{activeFrame.name}</h2>
            <div className="text-body-secondary small mb-3 d-flex flex-wrap gap-2">
              <span>{activeFrame.slug}</span>
              <span>·</span>
              <span>{new Date(activeFrame.time).toLocaleString()}</span>
              <span>·</span>
              <span>
                {activeFrame.viewport.width}×{activeFrame.viewport.height}
              </span>
            </div>

            <img
              alt={activeFrame.name}
              className="rounded border frame-screenshot"
              src={activeFrame.resolvedScreenshotUrl}
            />

            {Object.entries(activeFrame.annotations).map(([key, value]) => (
              <div key={key} className="mt-4">
                <h3 className="text-uppercase small fw-semibold text-body-secondary mb-2">{key}</h3>
                <pre className="viewer-pre">{value}</pre>
              </div>
            ))}

            {activeFrame.highlights.length > 0 && (
              <div className="mt-4">
                <h3 className="text-uppercase small fw-semibold text-body-secondary mb-2">
                  Highlights
                </h3>
                <pre className="viewer-pre">{JSON.stringify(activeFrame.highlights, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          !loading && (
            <div className="d-flex align-items-center justify-content-center h-100 text-body-secondary small">
              Select a frame from the sidebar.
            </div>
          )
        )}
      </main>
    </div>
  );
}
