import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { calculateRentalPricing } from "../lib/pricing.js";
import { canRentTier, getTrustProgress } from "../lib/trust.js";
import { Booking } from "../models/Booking.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";

export const bookingsRouter = express.Router();

bookingsRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [asRenter, asOwner] = await Promise.all([
      Booking.find({ renter: req.user._id })
        .populate("item", "title imageUrl category location")
        .populate("owner", "name estateName")
        .sort({ createdAt: -1 }),
      Booking.find({ owner: req.user._id })
        .populate("item", "title imageUrl category location")
        .populate("renter", "name estateName trust")
        .sort({ createdAt: -1 })
    ]);

    res.json({ asRenter, asOwner });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { itemId, days, termsAccepted, handoverChecklist = {} } = req.body;

    if (req.user.verification.status !== "verified") {
      return res.status(403).json({ message: "Verify your identity before renting items" });
    }

    if (!termsAccepted) {
      return res.status(400).json({ message: "Terms of Service must be accepted" });
    }

    if (!handoverChecklist.conditionAccepted || !handoverChecklist.videoUrl) {
      return res.status(400).json({ message: "Complete the handover checklist before the rental starts" });
    }

    const item = await Item.findById(itemId);

    if (!item || item.status !== "available") {
      return res.status(404).json({ message: "Item is not available" });
    }

    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot rent your own item" });
    }

    const trustCheck = canRentTier(req.user.trust.level, item.valueTier);

    if (!trustCheck.allowed) {
      return res.status(403).json({
        message: `This item requires Trust Level ${trustCheck.requiredLevel}`
      });
    }

    const pricing = calculateRentalPricing(item.pricePerDay, days);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + Number(days));

    const booking = await Booking.create({
      item: item._id,
      renter: req.user._id,
      owner: item.owner,
      days,
      endDate,
      termsAccepted,
      handoverChecklist: {
        ...handoverChecklist,
        acceptedAt: new Date()
      },
      payment: {
        ...pricing,
        reference: `SIM-${Date.now()}`
      }
    });

    item.status = "rented";
    await item.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("item", "title imageUrl category location")
      .populate("owner", "name estateName")
      .populate("renter", "name estateName trust");

    res.status(201).json({ booking: populatedBooking });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isOwner = booking.owner.toString() === req.user._id.toString();
    const isRenter = booking.renter.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isRenter && !isAdmin) {
      return res.status(403).json({ message: "You cannot update this booking" });
    }

    if (!["returned", "disputed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Unsupported booking status" });
    }

    booking.status = status;

    if (status === "returned" && !booking.returnedAt) {
      booking.returnedAt = new Date();
      booking.payment.status = "released";

      await Item.findByIdAndUpdate(booking.item, { status: "available" });

      const renter = await User.findById(booking.renter);
      renter.trust.completedRentals += 1;
      const trustProgress = getTrustProgress(renter.trust.completedRentals);
      renter.trust.level = trustProgress.level;
      renter.trust.progressToNextLevel = trustProgress.progressToNextLevel;
      await renter.save();
    }

    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("item", "title imageUrl category location")
      .populate("owner", "name estateName")
      .populate("renter", "name estateName trust");

    res.json({ booking: populatedBooking });
  } catch (error) {
    next(error);
  }
});
