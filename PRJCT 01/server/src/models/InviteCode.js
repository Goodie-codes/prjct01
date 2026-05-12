import mongoose from "mongoose";

const inviteCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    estateName: { type: String, required: true },
    active: { type: Boolean, default: true },
    maxUses: { type: Number, default: 100 },
    uses: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const InviteCode = mongoose.model("InviteCode", inviteCodeSchema);
