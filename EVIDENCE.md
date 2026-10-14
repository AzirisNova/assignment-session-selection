# Session Selection – Evidence

**Files:** `sessions.mjs` (implementation), `sessions.test.mjs` (automated tests), `test-results.txt` (raw `node --test` output).
**Environment:** Node.js v22.22.0, built-in `node:test` runner, `node:assert/strict`.

## 1. Requirements

| ID | Requirement |
|----|-------------|
| R1 | Accept only integer requests 1–6 inclusive; otherwise throw `RangeError`. |
| R2 | Include sessions with `remaining >= requested`. |
| R3 | Sort by start time ascending; equal times sorted by ID ascending. |
| R4 | Return `[]` for an empty list or no matches. |
| R5 | Preserve the original array order and object values. |
| R6 | Return a `Map` for ID lookups; throw `Error` on duplicate IDs. |

## 2. Test scenarios and results

All 12 scenarios are automated. Run with `node --test`.

| Test | Req | Input | Expected | Actual | Result |
|------|-----|-------|----------|--------|--------|
| T1 | R2, R3 | dataset, `2` | `["A1","B2","D4"]` | `["A1","B2","D4"]` | Pass |
| T2 | R2 | dataset, `2` and `6` | A1 (exactly 2) included; `6` → `["D4"]` | A1 included; `["D4"]` | Pass |
| T3 | R3 | dataset, `1` | `["C3","A1","B2","D4"]` (A1 before B2 at 10:00) | `["C3","A1","B2","D4"]` | Pass |
| T4 | R4 | `[]`, `3` | `[]` | `[]` | Pass |
| T5 | R4 | one session with 1 place, `5` | `[]` | `[]` | Pass |
| T6 | R1 | `0, 7, 1.5, "2", -1, NaN, null, undefined` | `RangeError` for each | `RangeError` for each | Pass |
| T7 | R1 | `1` and `6` (boundaries) | No error | No error | Pass |
| T8 | R5 | dataset, `1` then `2` | Dataset unchanged, order `B2,A1,C3,D4` | Unchanged | Pass |
| T9 | R6 | dataset | `Map` of size 4; `get("C3")` returns C3 | As expected | Pass |
| T10 | R6 | dataset, `get("X9")` | `undefined` | `undefined` | Pass |
| T11 | R6 | dataset + second `A1` | `Error: Duplicate session ID: A1` | Same error | Pass |
| T12 | R6 | `[]` | Empty `Map` | Empty `Map` | Pass |

**Summary:** `# tests 12 · # pass 12 · # fail 0` (see `test-results.txt`).

## 3. Race condition

The final value of zero hides the fault: one place was sold twice, so a customer holds a confirmation the venue cannot honour. Each request did a **read → check `remaining >= 1` → write `remaining - 1`** sequence, and the two sequences interleaved, so both checks saw the stale value 1. That check-and-decrement must happen as one atomic operation. In production, use a single conditional update inside the database, e.g. `UPDATE sessions SET remaining = remaining - 1 WHERE id = ? AND remaining >= 1`, and treat "0 rows affected" as sold out (or use a transaction with a row lock). Test: fire two concurrent bookings at a session with `remaining = 1`, `await Promise.allSettled`, and assert exactly one success, one rejection and `remaining === 0`.

## 4. Design decisions

**Array for selection and sorting.** Selecting sessions means visiting every item, keeping some and putting them in order. Arrays are built for this: `filter` checks each session once (O(n)) and returns a new array, and `sort` takes a comparator for the time-then-ID rule. Arrays also keep order, which a result list needs. Because `filter` returns a copy, sorting it never touches the original data (R5).

**Map for repeated ID lookups.** Finding a session by ID in an array means scanning it each time (O(n) per lookup). A `Map` costs one O(n) pass to build, then each `get(id)` is about O(1). It also returns `undefined` for missing keys, and building it is a natural point to detect duplicate IDs.

**Validation.** `Number.isInteger` was chosen because it rejects `"2"`, `1.5`, `NaN` and `Infinity` without type coercion. Using `typeof` or `parseInt` would have let `"2"` through.

**Tie-breaking.** IDs are compared with `<`/`>` rather than `localeCompare` so the order is the same on every machine and locale.

**Why binary search needs data sorted by the search key.** Binary search works by checking the middle item and throwing away the half that *cannot* contain the target. That only works if the data is ordered by the key being searched. Our result list is sorted by `startsAt`, not by `id`. Searching it for `"B2"` could look at a middle item, decide "B2" must be to the left, and discard the half where B2 really is. To binary-search by ID, the data would need re-sorting by ID first, which costs O(n log n). For repeated ID lookups, the `Map` is simpler and faster.
