import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["unverified", "reviewing", "verified"],
      default: "unverified"
    },
    selfieUrl: String,
    idNumberMasked: String,
    submittedAt: Date,
    verifiedAt: Date
  },
  { _id: false }
);

const trustSchema = new mongoose.Schema(
  {
    level: { type: Number, default: 1 },
    completedRentals: { type: Number, default: 0 },
    progressToNextLevel: { type: Number, default: 0 },
    frozen: { type: Boolean, default: false }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    estateName: { type: String, required: true },
    inviteCodeUsed: { type: String, required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    verification: { type: verificationSchema, default: () => ({}) },
    trust: { type: trustSchema, default: () => ({}) }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

export const User = mongoose.model("User", userSchema);
