/**
 * Deterministic shuffle for randomized item order.
 * Seed = userId + taskId ensures each user sees a stable order per task.
 */

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h);
}

/** Seeded PRNG (mulberry32) */
function createSeededRandom(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle. Modifies array in place, returns it. */
function shuffleWithRandom<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns display order: array of actual item_index values.
 * displayOrder[0] = first item user sees, displayOrder[1] = second, etc.
 * 1-based: displayOrder is for "display index 1" -> actual item_index.
 */
export function getDisplayOrder(
  taskId: string,
  userId: string,
  totalItems: number
): number[] {
  const seed = hashString(userId + taskId);
  const random = createSeededRandom(seed);
  const indices = Array.from({ length: totalItems }, (_, i) => i + 1);
  return shuffleWithRandom(indices, random);
}

/**
 * Maps display index (1-based, what user sees as "Item 1", "Item 2", ...)
 * to actual item_index in the database.
 */
export function displayIndexToItemIndex(
  displayIndex: number,
  displayOrder: number[]
): number {
  return displayOrder[displayIndex - 1] ?? displayIndex;
}

/**
 * Maps actual item_index to display index (1-based).
 */
export function itemIndexToDisplayIndex(
  itemIndex: number,
  displayOrder: number[]
): number {
  const idx = displayOrder.indexOf(itemIndex);
  return idx >= 0 ? idx + 1 : itemIndex;
}
