import type { LocatorLike } from "visual-storyboard/integrations/playwright";

/**
 * Scrolls the element into view and waits for its position to stop changing
 * across animation frames before taking a screenshot.
 *
 * Injects a temporary red outline overlay so the element is visible in the
 * screenshot even before the stabilization loop completes.
 */
export async function stabilize(locator: LocatorLike): Promise<void> {
  await locator.evaluate(async (el) => {
    const element = el as HTMLElement;
    let lastRect: DOMRect | null = null;
    let stableCount = 0;

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.zIndex = "9999";
    overlay.style.pointerEvents = "none";
    document.body.appendChild(overlay);

    const updateOverlay = (rect: DOMRect) => {
      overlay.style.left = `${rect.x}px`;
      overlay.style.top = `${rect.y}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.outline = `${(6 - stableCount) * 2}px solid red`;
    };

    for (let i = 0; i < 100; i++) {
      element.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
      const rect = element.getBoundingClientRect();
      updateOverlay(rect);
      if (lastRect && rect.x === lastRect.x && rect.y === lastRect.y) {
        stableCount++;
        if (stableCount > 5) break;
      } else {
        stableCount = 0;
        lastRect = rect;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    overlay.remove();
  });
}
