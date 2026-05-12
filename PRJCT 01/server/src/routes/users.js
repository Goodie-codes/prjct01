import express from "express";
import { requireAuth } from "../middleware/auth.js";

export const usersRouter = express.Router();

function maskIdNumber(value = "") {
  const cleanValue = String(value).replace(/\s/g, "");

  if (cleanValue.length <= 4) {
    return "****";
  }

  return `${"*".repeat(cleanValue.length - 4)}${cleanValue.slice(-4)}`;
}

usersRouter.patch("/me/verification", requireAuth, async (req, res, next) => {
  try {
    const { selfieUrl, idNumber } = req.body;

    if (!selfieUrl || !idNumber) {
      return res.status(400).json({ message: "Selfie URL and ID number are required" });
    }

    req.user.verification = {
      status: "verified",
      selfieUrl,
      idNumberMasked: maskIdNumber(idNumber),
      submittedAt: new Date(),
      verifiedAt: new Date()
    };

    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
});
