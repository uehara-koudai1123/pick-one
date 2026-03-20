import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.item.deleteMany();

  // Seed initial items
  await prisma.item.createMany({
    data: [
      {
        title: "🌊 海派",
        description:
          "波の音、潮風、青い水平線。海の無限の広がりに心が解き放たれる。",
        emoji: "🌊",
        color: "#0ea5e9",
      },
      {
        title: "🏔️ 山派",
        description:
          "静寂な森、清澄な空気、頂上からの絶景。山は魂を浄化してくれる。",
        emoji: "🏔️",
        color: "#10b981",
      },
    ],
  });

  console.log("Seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
