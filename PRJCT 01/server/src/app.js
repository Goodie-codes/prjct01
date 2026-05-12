import cors from "cors";
import express from "express";
import morgan from "morgan";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { bookingsRouter } from "./routes/bookings.js";
import { itemsRouter } from "./routes/items.js";
import { usersRouter } from "./routes/users.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, service: "RentIt API" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/items", itemsRouter);
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/admin", adminRouter);

  app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((error, req, res, next) => {
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Something went wrong"
    });
  });

  return app;
}
