import express from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { Booking } from "../models/Booking.js";
import { InviteCode } from "../models/InviteCode.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";

export const adminRouter = express.Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/summary", async (req, res, next) => {
  try {
    const [users, items, bookings, inviteCodes] = await Promise.all([
      User.find().select("-passwordHash").sort({ createdAt: -1 }),
      Item.find().populate("owner", "name estateName").sort({ createdAt: -1 }),
      Booking.find()
        .populate("item", "title")
        .populate("renter", "name")
        .populate("owner", "name")
        .sort({ createdAt: -1 }),
      InviteCode.find().sort({ createdAt: -1 })
    ]);

    res.json({
      stats: {
        users: users.length,
        items: items.length,
        activeBookings: bookings.filter((booking) => booking.status === "active").length,
        inviteCodes: inviteCodes.length
      },
      users,
      items,
      bookings,
      inviteCodes
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.post("/invite-codes", async (req, res, next) => {
  try {
    const inviteCode = await InviteCode.create({
      code: req.body.code,
      estateName: req.body.estateName,
      maxUses: req.body.maxUses || 100
    });

    res.status(201).json({ inviteCode });
  } catch (error) {
    next(error);
  }
});
