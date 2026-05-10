export const DEAD_ITEM_THRESHOLD = 3;

/**
 * Given current consecutive404 + outcome, return next state.
 *   { nextCount, markInactive }
 */
export function nextDeadState(current404, found, status) {
  if (found) {
    return { nextCount: 0, markInactive: false };
  }
  if (status === 404 || status === 500) {
    const next = (current404 ?? 0) + 1;
    return { nextCount: next, markInactive: next >= DEAD_ITEM_THRESHOLD };
  }
  return { nextCount: current404 ?? 0, markInactive: false };
}
