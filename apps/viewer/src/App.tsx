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
  const [events, setEvents] = useState<ResolvedStoryboardFrame[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(Boolean(storyboardUrl));
  const frameButtons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!storyboardUrl) {
      setEvents([]);
      setActiveIndex(-1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadStoryboard(storyboardUrl)
      .then((loadedEvents) => {
        if (!cancelled) {
          setEvents(loadedEvents);
          setActiveIndex(loadedEvents.length > 0 ? 0 : -1);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
          setEvents([]);
          setActiveIndex(-1);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [storyboardUrl]);

  const activeEvent = activeIndex >= 0 ? events[activeIndex] : undefined;

  function handleFrameKeyDown(index: number, key: string) {
    const nextIndex = getNextFrameIndex(index, events.length, key);
    if (nextIndex === index || nextIndex < 0) {
      return;
    }
    setActiveIndex(nextIndex);
    frameButtons.current[nextIndex]?.focus();
  }

  return (
    <main className="container py-4">
      <a
        className="btn btn-outline-primary visually-hidden-focusable mb-3"
        href="#storyboard-details"
      >
        Skip to storyboard details
      </a>
      <section className="mb-4">
        <h1 className="display-6 fw-semibold mb-3">visual-storyboard viewer</h1>
        <p className="text-body-secondary mb-2">
          Load a storyboard by passing an NDJSON URL in the <code>?url=</code> query parameter.
        </p>
        <code className="viewer-url">
          {storyboardUrl || "?url=http://localhost:4174/storyboards/basic.ndjson"}
        </code>
      </section>

      {loading ? <div className="alert alert-info">Loading storyboard…</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {!storyboardUrl ? (
        <div className="alert alert-secondary">
          No storyboard URL was provided yet. Start the sample E2E app and open the viewer with the
          URL shown above.
        </div>
      ) : null}

      <section className="row g-4 align-items-start">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h5 mb-0">Frames</h2>
                <span className="badge text-bg-secondary">{events.length}</span>
              </div>
              <p className="text-body-secondary small mb-3">
                Use <kbd>↑</kbd>, <kbd>↓</kbd>, <kbd>Home</kbd>, and <kbd>End</kbd> to move between
                frames.
              </p>
              <div
                aria-label="Storyboard frames"
                aria-orientation="vertical"
                className="list-group"
                role="tablist"
              >
                {events.map((event, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`${event.slug}-${event.time}`}
                      ref={(element) => {
                        frameButtons.current[index] = element;
                      }}
                      aria-controls={`frame-panel-${index}`}
                      aria-selected={isActive}
                      className={`list-group-item list-group-item-action text-start ${
                        isActive ? "active" : ""
                      }`}
                      id={`frame-tab-${index}`}
                      onClick={() => setActiveIndex(index)}
                      onKeyDown={(eventKey) => {
                        const nextIndex = getNextFrameIndex(index, events.length, eventKey.key);
                        if (nextIndex !== index) {
                          eventKey.preventDefault();
                          handleFrameKeyDown(index, eventKey.key);
                        }
                      }}
                      role="tab"
                      tabIndex={isActive ? 0 : -1}
                      type="button"
                    >
                      <span className="d-block fw-semibold">{event.name}</span>
                      <span
                        className={`d-block small ${isActive ? "text-white-50" : "text-body-secondary"}`}
                      >
                        {new Date(event.time).toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {activeEvent ? (
            <article
              aria-labelledby={`frame-tab-${activeIndex}`}
              className="card shadow-sm"
              id="storyboard-details"
              role="tabpanel"
              tabIndex={0}
            >
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start mb-3">
                  <div>
                    <h2 className="h4 mb-1">{activeEvent.name}</h2>
                    <div className="text-body-secondary small">
                      {activeEvent.slug} · {new Date(activeEvent.time).toLocaleString()}
                    </div>
                  </div>
                  <span className="badge text-bg-dark">
                    {activeEvent.viewport.width}×{activeEvent.viewport.height}
                  </span>
                </div>

                <img
                  alt={activeEvent.name}
                  className="img-fluid rounded border frame-image"
                  src={activeEvent.resolvedScreenshotUrl}
                />

                <div className="row row-cols-1 row-cols-lg-2 g-3 mt-1">
                  {activeEvent.annotations["ariaSnapshot"] ? (
                    <div className="col">
                      <h3 className="h6 text-uppercase text-body-secondary">ARIA snapshot</h3>
                      <pre className="viewer-pre">{activeEvent.annotations["ariaSnapshot"]}</pre>
                    </div>
                  ) : null}
                  <div className="col">
                    <h3 className="h6 text-uppercase text-body-secondary">Highlights</h3>
                    <pre className="viewer-pre">
                      {JSON.stringify(activeEvent.highlights, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </main>
  );
}
