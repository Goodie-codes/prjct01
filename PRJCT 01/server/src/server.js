import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = process.env.PORT || 5001;

try {
  await connectDatabase();
  const app = createApp();

  app.listen(port, () => {
    console.log(`RentIt API running on http://localhost:${port}`);
  });
} catch (error) {
  console.error("Failed to start RentIt API:", error.message);
  process.exit(1);
}
