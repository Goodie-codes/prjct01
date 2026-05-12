import test from "node:test";
import assert from "node:assert/strict";
import { canRentTier, getTrustProgress } from "../src/lib/trust.js";

test("moves a user to level 2 after three completed returns", () => {
  const trust = getTrustProgress(3);

  assert.equal(trust.level, 2);
  assert.equal(trust.progressToNextLevel, 0);
  assert.equal(trust.returnsUntilNextLevel, 3);
});

test("blocks high value rentals until trust level 3", () => {
  const check = canRentTier(2, "high");

  assert.equal(check.allowed, false);
  assert.equal(check.requiredLevel, 3);
});
