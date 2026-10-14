import { test } from "node:test";
import assert from "node:assert/strict";
import { sessions, selectSessions, createSessionIndex } from "./sessions.mjs";

const ids = (list) => list.map((s) => s.id);

test("T1 (R2, R3) normal valid request returns matching sessions in order", () => {
  assert.deepEqual(ids(selectSessions(sessions, 2)), ["A1", "B2", "D4"]);
});

test("T2 (R2) exactly enough remaining places is included", () => {
  // A1 has exactly 2 remaining; D4 has exactly 6 remaining.
  assert.ok(ids(selectSessions(sessions, 2)).includes("A1"));
  assert.deepEqual(ids(selectSessions(sessions, 6)), ["D4"]);
});

test("T3 (R3) equal start times use ID as tie-breaker", () => {
  // B2 appears before A1 in the source, both start at 10:00.
  assert.deepEqual(ids(selectSessions(sessions, 1)), ["C3", "A1", "B2", "D4"]);
});

test("T4 (R4) empty array returns []", () => {
  assert.deepEqual(selectSessions([], 3), []);
});

test("T5 (R4) no matching sessions returns []", () => {
  const few = [{ id: "Z1", startsAt: "2026-10-01T10:00:00Z", remaining: 1 }];
  assert.deepEqual(selectSessions(few, 5), []);
});

test("T6 (R1) invalid requests throw RangeError", () => {
  for (const bad of [0, 7, 1.5, "2", -1, NaN, null, undefined]) {
    assert.throws(() => selectSessions(sessions, bad), RangeError, `input: ${String(bad)}`);
  }
});

test("T7 (R1) boundary values 1 and 6 are accepted", () => {
  assert.doesNotThrow(() => selectSessions(sessions, 1));
  assert.doesNotThrow(() => selectSessions(sessions, 6));
});

test("T8 (R5) original array order and object values are preserved", () => {
  const before = structuredClone(sessions);
  selectSessions(sessions, 1);
  selectSessions(sessions, 2);
  assert.deepEqual(sessions, before);
  assert.deepEqual(ids(sessions), ["B2", "A1", "C3", "D4"]);
});

test("T9 (R6) index returns a Map and finds an existing ID", () => {
  const index = createSessionIndex(sessions);
  assert.ok(index instanceof Map);
  assert.equal(index.size, 4);
  assert.equal(index.get("C3"), sessions[2]);
});

test("T10 (R6) missing ID lookup returns undefined", () => {
  assert.equal(createSessionIndex(sessions).get("X9"), undefined);
});

test("T11 (R6) duplicate IDs throw Error", () => {
  const dupes = [...sessions, { id: "A1", startsAt: "2026-10-02T10:00:00Z", remaining: 4 }];
  assert.throws(() => createSessionIndex(dupes), { name: "Error", message: /Duplicate session ID: A1/ });
});

test("T12 (R6) empty array gives an empty Map", () => {
  assert.equal(createSessionIndex([]).size, 0);
});
