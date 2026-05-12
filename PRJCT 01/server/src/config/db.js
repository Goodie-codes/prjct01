import mongoose from "mongoose";

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error("MONGODB_URI is required. Add it to server/.env.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}
