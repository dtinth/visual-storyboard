import { expect, test } from "vite-plus/test";

import { getNextCheckpointIndex } from "../src/checkpoint-navigation";

test("getNextCheckpointIndex supports arrow, home, and end keys", () => {
  expect(getNextCheckpointIndex(0, 3, "ArrowDown")).toBe(1);
  expect(getNextCheckpointIndex(1, 3, "ArrowUp")).toBe(0);
  expect(getNextCheckpointIndex(0, 3, "ArrowLeft")).toBe(2);
  expect(getNextCheckpointIndex(2, 3, "Home")).toBe(0);
  expect(getNextCheckpointIndex(0, 3, "End")).toBe(2);
});

test("getNextCheckpointIndex leaves unsupported keys unchanged", () => {
  expect(getNextCheckpointIndex(1, 3, "Enter")).toBe(1);
  expect(getNextCheckpointIndex(0, 0, "ArrowDown")).toBe(-1);
});
