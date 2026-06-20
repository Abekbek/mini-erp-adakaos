import { PrismaClient, Role, ItemType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create Branches
  const branches = await Promise.all([
    prisma.branch.create({
      data: { name: "Purwakarta", location: "Jl. Veteran No. 45, Purwakarta" },
    }),
    prisma.branch.create({
      data: { name: "Karawang", location: "Jl. Tuparev No. 88, Karawang" },
    }),
    prisma.branch.create({
      data: { name: "Cikampek", location: "Jl. A. Yani No. 12, Cikampek" },
    }),
  ]);

  console.log("🏢 Created 3 branches");

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create Users
  await prisma.user.create({
    data: {
      name: "Pak Adi (Owner)",
      email: "owner@adakaos.com",
      password: hashedPassword,
      role: Role.OWNER,
      branchId: null,
    },
  });

  const branchUsers = branches.flatMap((branch) => [
    {
      name: `Admin ${branch.name}`,
      email: `admin.${branch.name.toLowerCase()}@adakaos.com`,
      password: hashedPassword,
      role: Role.BRANCH_ADMIN,
      branchId: branch.id,
    },
    {
      name: `Operator ${branch.name}`,
      email: `operator.${branch.name.toLowerCase()}@adakaos.com`,
      password: hashedPassword,
      role: Role.PRODUCTION_OPERATOR,
      branchId: branch.id,
    },
  ]);

  for (const userData of branchUsers) {
    await prisma.user.create({ data: userData });
  }

  console.log("👤 Created 7 users (1 owner + 3 admins + 3 operators)");

  // Create Inventory for each branch
  const inventoryTemplate = [
    // Garments
    { itemName: "Kaos Polos Putih S", itemType: ItemType.GARMENT, stockQuantity: 50, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Kaos Polos Putih M", itemType: ItemType.GARMENT, stockQuantity: 75, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Kaos Polos Putih L", itemType: ItemType.GARMENT, stockQuantity: 60, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Kaos Polos Putih XL", itemType: ItemType.GARMENT, stockQuantity: 45, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Kaos Polos Hitam M", itemType: ItemType.GARMENT, stockQuantity: 80, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Kaos Polos Hitam L", itemType: ItemType.GARMENT, stockQuantity: 65, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Kaos Polos Hitam XL", itemType: ItemType.GARMENT, stockQuantity: 40, unit: "pcs", lowStockThreshold: 10 },
    { itemName: "Hoodie Polos Hitam M", itemType: ItemType.GARMENT, stockQuantity: 25, unit: "pcs", lowStockThreshold: 5 },
    { itemName: "Hoodie Polos Hitam L", itemType: ItemType.GARMENT, stockQuantity: 20, unit: "pcs", lowStockThreshold: 5 },
    // Consumables
    { itemName: "PET Film Roll", itemType: ItemType.FILM, stockQuantity: 5000, unit: "cm", lowStockThreshold: 500 },
    { itemName: "Tinta Putih DTF", itemType: ItemType.INK, stockQuantity: 3000, unit: "ml", lowStockThreshold: 300 },
    { itemName: "Tinta CMYK DTF", itemType: ItemType.INK, stockQuantity: 2000, unit: "ml", lowStockThreshold: 200 },
    { itemName: "DTF Powder", itemType: ItemType.POWDER, stockQuantity: 5000, unit: "gram", lowStockThreshold: 500 },
  ];

  for (const branch of branches) {
    for (const item of inventoryTemplate) {
      await prisma.inventory.create({
        data: {
          branchId: branch.id,
          ...item,
        },
      });
    }
  }

  console.log("📦 Created inventory for all 3 branches");

  // Create some sample orders
  const sampleCustomers = [
    { name: "Budi Santoso", phone: "081234567890" },
    { name: "Siti Rahma", phone: "082345678901" },
    { name: "Ahmad Fauzi", phone: "083456789012" },
    { name: "Dewi Lestari", phone: "084567890123" },
    { name: "Rizky Pratama", phone: "085678901234" },
  ];

  const statuses = ["PENDING", "PRINTING", "PRESSING", "READY", "COMPLETED"] as const;

  let orderCount = 0;
  for (const branch of branches) {
    const branchInventory = await prisma.inventory.findMany({
      where: { branchId: branch.id, itemType: ItemType.GARMENT },
    });

    for (let i = 0; i < 5; i++) {
      const customer = sampleCustomers[i];
      const garment = branchInventory[i % branchInventory.length];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const price = garment.itemName.includes("Hoodie") ? 185000 : 75000;
      const status = statuses[i % statuses.length];

      const hoursAgo = i === 0 ? 5 : i; // First order is 5 hours old (overdue)
      const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

      await prisma.order.create({
        data: {
          orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(orderCount + 1).padStart(4, "0")}`,
          branchId: branch.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          status: status,
          totalPrice: price * quantity,
          createdAt: createdAt,
          orderItems: {
            create: {
              inventoryId: garment.id,
              quantity: quantity,
              price: price,
              printSize: "A3",
            },
          },
        },
      });
      orderCount++;
    }
  }

  console.log(`📋 Created ${orderCount} sample orders`);
  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
