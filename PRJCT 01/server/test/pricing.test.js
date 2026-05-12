import test from "node:test";
import assert from "node:assert/strict";
import { calculateRentalPricing } from "../src/lib/pricing.js";

test("calculates RentIt commission and owner payout", () => {
  const pricing = calculateRentalPricing(5000, 2);

  assert.equal(pricing.totalAmount, 10000);
  assert.equal(pricing.platformFee, 1000);
  assert.equal(pricing.ownerPayout, 9000);
});

test("rejects invalid rental days", () => {
  assert.throws(() => calculateRentalPricing(5000, 0), /days/);
});
