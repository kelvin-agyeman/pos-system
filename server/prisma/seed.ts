import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/prisma";

type MockProduct = {
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedProducts = async (): Promise<void> => {
  const filePath = path.resolve(__dirname, "../src/utils/mockProducts.json");
  const raw = await readFile(filePath, "utf-8");
  const mockProducts = JSON.parse(raw) as MockProduct[];

  const existingProducts = await prisma.product.findMany({
    select: { name: true },
  });
  const existingNames = new Set(
    existingProducts.map((product) => product.name.toLowerCase()),
  );

  const productsToInsert = mockProducts
    .filter((product) => !existingNames.has(product.name.toLowerCase()))
    .map(({ name, price, quantity, category }) => ({
      name,
      price,
      quantity,
      category,
    }));

  if (productsToInsert.length === 0) {
    console.log("All mock products are already seeded.");
    return;
  }

  const result = await prisma.product.createMany({
    data: productsToInsert,
  });

  console.log(`Seeded ${result.count} products successfully.`);
};

const main = async (): Promise<void> => {
  try {
    await seedProducts();
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void main();
