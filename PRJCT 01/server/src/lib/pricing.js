export const COMMISSION_RATE = 0.1;

export function calculateRentalPricing(pricePerDay, days, commissionRate = COMMISSION_RATE) {
  const dailyPrice = Number(pricePerDay);
  const rentalDays = Number(days);

  if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) {
    throw new Error("pricePerDay must be a positive number");
  }

  if (!Number.isInteger(rentalDays) || rentalDays < 1) {
    throw new Error("days must be a positive whole number");
  }

  const totalAmount = dailyPrice * rentalDays;
  const platformFee = Math.round(totalAmount * commissionRate);
  const ownerPayout = totalAmount - platformFee;

  return {
    totalAmount,
    platformFee,
    ownerPayout,
    commissionRate
  };
}
