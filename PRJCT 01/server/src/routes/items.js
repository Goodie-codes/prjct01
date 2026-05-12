import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Item } from "../models/Item.js";

export const itemsRouter = express.Router();

itemsRouter.get("/", async (req, res, next) => {
  try {
    const { q, category, status = "available" } = req.query;
    const query = {};

    if (status !== "all") {
      query.status = status;
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (q) {
      query.$text = { $search: q };
    }

    const items = await Item.find(query)
      .populate("owner", "name estateName trust verification")
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

itemsRouter.get("/:id", async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate("owner", "name estateName trust verification");

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

itemsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    if (req.user.verification.status !== "verified") {
      return res.status(403).json({ message: "Verify your identity before listing items" });
    }

    const item = await Item.create({
      ...req.body,
      owner: req.user._id
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

itemsRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const isOwner = item.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the owner or admin can edit this item" });
    }

    const allowedFields = [
      "title",
      "description",
      "category",
      "pricePerDay",
      "valueTier",
      "trustLevelRequired",
      "location",
      "imageUrl",
      "status"
    ];

    for (const field of allowedFields) {
      if (field in req.body) {
        item[field] = req.body[field];
      }
    }

    await item.save();
    res.json({ item });
  } catch (error) {
    next(error);
  }
});
