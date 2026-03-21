import { useEffect, useMemo, useState } from "react";

import type { ResolvedStoryboardCheckpoint } from "./storyboard-data";
import { loadStoryboard } from "./storyboard-data";

function useStoryboardUrl() {
  return useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("url") ?? "";
  }, []);
}

export function App() {
  const storyboardUrl = useStoryboardUrl();
  const [events, setEvents] = useState<ResolvedStoryboardCheckpoint[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(Boolean(storyboardUrl));

  useEffect(() => {
    if (!storyboardUrl) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadStoryboard(storyboardUrl)
      .then((loadedEvents) => {
        if (!cancelled) {
          setEvents(loadedEvents);
          setError("");
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown error");
          setEvents([]);
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

  return (
    <main className="container py-4">
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

      <section className="vstack gap-4">
        {events.map((event) => (
          <article key={`${event.slug}-${event.time}`} className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between gap-2 align-items-start mb-3">
                <div>
                  <h2 className="h4 mb-1">{event.name}</h2>
                  <div className="text-body-secondary small">
                    {event.slug} · {new Date(event.time).toLocaleString()}
                  </div>
                </div>
                <span className="badge text-bg-dark">
                  {event.viewport.width}×{event.viewport.height}
                </span>
              </div>

              <img
                className="img-fluid rounded border checkpoint-image"
                src={event.resolvedScreenshotUrl}
                alt={event.name}
              />

              <div className="row row-cols-1 row-cols-lg-2 g-3 mt-1">
                <div className="col">
                  <h3 className="h6 text-uppercase text-body-secondary">ARIA snapshot</h3>
                  <pre className="viewer-pre">{event.ariaSnapshot}</pre>
                </div>
                <div className="col">
                  <h3 className="h6 text-uppercase text-body-secondary">Highlights</h3>
                  <pre className="viewer-pre">{JSON.stringify(event.highlights, null, 2)}</pre>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
