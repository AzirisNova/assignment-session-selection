// Session-selection feature for a fictional client booking website.

export const sessions = [
  { id: "B2", startsAt: "2026-10-01T10:00:00Z", remaining: 3 },
  { id: "A1", startsAt: "2026-10-01T10:00:00Z", remaining: 2 },
  { id: "C3", startsAt: "2026-10-01T09:00:00Z", remaining: 1 },
  { id: "D4", startsAt: "2026-10-01T11:00:00Z", remaining: 6 }
];

const MIN_REQUEST = 1;
const MAX_REQUEST = 6;

/**
 * Return sessions with enough places for the request, earliest first,
 * with ties broken by ID (ascending). The input array and its objects
 * are never modified.
 *
 * @param {Array<{id: string, startsAt: string, remaining: number}>} sessions
 * @param {number} requested - places wanted (integer 1–6)
 * @returns {Array} a new array of matching sessions
 * @throws {RangeError} if requested is not an integer from 1 to 6 (R1)
 */
export function selectSessions(sessions, requested) {
  // R1: Number.isInteger rejects strings ("2"), decimals (1.5), NaN and Infinity.
  if (
    !Number.isInteger(requested) ||
    requested < MIN_REQUEST ||
    requested > MAX_REQUEST
  ) {
    throw new RangeError(
      `requested must be an integer from ${MIN_REQUEST} to ${MAX_REQUEST}; received ${JSON.stringify(requested)}`
    );
  }

  // R2 + R5: filter() returns a NEW array, so sorting it cannot reorder the original.
  // R4: an empty input or no matches naturally produces [].
  const matches = sessions.filter((s) => s.remaining >= requested);

  // R3: earliest start first; equal times fall back to ID ascending.
  return matches.sort((a, b) => {
    const timeDiff = Date.parse(a.startsAt) - Date.parse(b.startsAt);
    if (timeDiff !== 0) return timeDiff;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
}

/**
 * Build a Map from session ID to session for fast repeated lookups.
 *
 * @param {Array<{id: string}>} sessions
 * @returns {Map<string, object>}
 * @throws {Error} if any ID appears more than once (R6)
 */
export function createSessionIndex(sessions) {
  const index = new Map();
  for (const session of sessions) {
    if (index.has(session.id)) {
      throw new Error(`Duplicate session ID: ${session.id}`);
    }
    index.set(session.id, session);
  }
  return index;
}
