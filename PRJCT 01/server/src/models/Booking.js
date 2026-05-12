import mongoose from "mongoose";

const handoverChecklistSchema = new mongoose.Schema(
  {
    videoUrl: String,
    conditionAccepted: { type: Boolean, default: false },
    notes: String,
    acceptedAt: Date
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["simulated_authorized", "released", "refunded"],
      default: "simulated_authorized"
    },
    provider: { type: String, default: "simulated" },
    reference: String,
    totalAmount: Number,
    ownerPayout: Number,
    platformFee: Number
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    days: { type: Number, required: true, min: 1 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "returned", "disputed", "cancelled"],
      default: "active"
    },
    termsAccepted: { type: Boolean, required: true },
    handoverChecklist: { type: handoverChecklistSchema, required: true },
    payment: { type: paymentSchema, required: true },
    returnedAt: Date
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
