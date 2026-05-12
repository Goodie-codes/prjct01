import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDatabase } from "../config/db.js";
import { seedItems } from "../data/seedItems.js";
import { Booking } from "../models/Booking.js";
import { InviteCode } from "../models/InviteCode.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";
import { getTrustProgress } from "../lib/trust.js";

const passwordHash = await bcrypt.hash("password123", 12);

const verified = {
  status: "verified",
  selfieUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  idNumberMasked: "*******1234",
  submittedAt: new Date(),
  verifiedAt: new Date()
};

function trust(completedRentals) {
  return {
    ...getTrustProgress(completedRentals),
    frozen: false
  };
}

async function seed() {
  await connectDatabase();

  await Promise.all([
    Booking.deleteMany({}),
    Item.deleteMany({}),
    User.deleteMany({}),
    InviteCode.deleteMany({})
  ]);

  const inviteCode = await InviteCode.create({
    code: "ESTATE-ALPHA",
    estateName: "Greenfield Estate",
    maxUses: 250,
    uses: 4
  });

  const users = await User.create([
    {
      name: "Admin Ada",
      email: "admin@rentit.test",
      passwordHash,
      estateName: inviteCode.estateName,
      inviteCodeUsed: inviteCode.code,
      role: "admin",
      verification: verified,
      trust: trust(8)
    },
    {
      name: "Chuks Okafor",
      email: "chuks@rentit.test",
      passwordHash,
      estateName: inviteCode.estateName,
      inviteCodeUsed: inviteCode.code,
      verification: verified,
      trust: trust(4)
    },
    {
      name: "Ayo Bello",
      email: "ayo@rentit.test",
      passwordHash,
      estateName: inviteCode.estateName,
      inviteCodeUsed: inviteCode.code,
      verification: verified,
      trust: trust(1)
    },
    {
      name: "Nneka James",
      email: "nneka@rentit.test",
      passwordHash,
      estateName: inviteCode.estateName,
      inviteCodeUsed: inviteCode.code,
      verification: verified,
      trust: trust(6)
    }
  ]);

  const listers = users.filter((user) => user.role !== "admin");

  await Item.create(
    seedItems.map((item, index) => ({
      ...item,
      owner: listers[index % listers.length]._id
    }))
  );

  console.log("RentIt seed complete.");
  console.log("Invite code: ESTATE-ALPHA");
  console.log("Demo password for all seeded users: password123");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
