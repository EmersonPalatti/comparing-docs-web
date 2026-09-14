import assert from "node:assert/strict";
import { test } from "node:test";
import { maxWeightAssignment } from "./assignment.ts";

test("hungarian prefers global sum over greedy", () => {
  // Greedy: A→X (0.82), B→Y (0.20) = 1.02
  // Optimal: A→Y (0.79), B→X (0.80) = 1.59
  const weights = [
    [0.82, 0.79],
    [0.8, 0.2],
  ];
  const assignment = maxWeightAssignment(weights, 0.5);
  assert.deepEqual(assignment, [1, 0]);
});

test("scores below threshold stay unassigned", () => {
  const assignment = maxWeightAssignment([[0.4, 0.3]], 0.5);
  assert.deepEqual(assignment, [-1]);
});

test("two origins and one destination keep the better pair", () => {
  const assignment = maxWeightAssignment([[0.9], [0.8]], 0.5);
  assert.equal(assignment[0], 0);
  assert.equal(assignment[1], -1);
});

test("empty matrix", () => {
  assert.deepEqual(maxWeightAssignment([]), []);
});
