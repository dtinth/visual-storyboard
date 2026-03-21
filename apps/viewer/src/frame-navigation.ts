const NEXT_KEYS = new Set(["ArrowDown", "ArrowRight"]);
const PREVIOUS_KEYS = new Set(["ArrowUp", "ArrowLeft"]);

export function getNextFrameIndex(currentIndex: number, total: number, key: string) {
  if (total < 1) {
    return -1;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return total - 1;
  }
  if (NEXT_KEYS.has(key)) {
    return (currentIndex + 1 + total) % total;
  }
  if (PREVIOUS_KEYS.has(key)) {
    return (currentIndex - 1 + total) % total;
  }
  return currentIndex;
}
