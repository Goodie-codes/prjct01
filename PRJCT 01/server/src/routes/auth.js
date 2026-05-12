import bcrypt from "bcryptjs";
import express from "express";
import { InviteCode } from "../models/InviteCode.js";
import { User } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

export const authRouter = express.Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: "Name, email, password, and invite code are required" });
    }

    const code = await InviteCode.findOne({ code: inviteCode.toUpperCase(), active: true });

    if (!code || code.uses >= code.maxUses) {
      return res.status(400).json({ message: "Invite code is invalid or full" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      estateName: code.estateName,
      inviteCodeUsed: code.code
    });

    code.uses += 1;
    await code.save();

    res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password || "", user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});
