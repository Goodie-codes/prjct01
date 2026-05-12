import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    pricePerDay: { type: Number, required: true, min: 1 },
    valueTier: { type: String, enum: ["low", "medium", "high"], default: "low" },
    trustLevelRequired: { type: Number, default: 1 },
    location: { type: String, required: true },
    imageUrl: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["available", "rented", "paused"],
      default: "available"
    }
  },
  { timestamps: true }
);

itemSchema.index({ title: "text", description: "text", category: "text" });

export const Item = mongoose.model("Item", itemSchema);
