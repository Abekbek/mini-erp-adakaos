"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { DTF_CONSUMABLES, CONSUMABLE_NAMES } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import type { ActionResponse, StockAlert } from "@/types";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

interface CreateOrderInput {
  branchId: string;
  customerName: string;
  customerPhone: string;
  items: {
    inventoryId: string;
    quantity: number;
    price: number;
    printSize: string;
  }[];
}

export async function createOrder(
  input: CreateOrderInput,
  formData?: FormData
): Promise<ActionResponse<{ orderNumber: string; stockAlerts: StockAlert[] }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Determine branch - use user's branch if not OWNER
    const branchId =
      session.user.role === "OWNER"
        ? input.branchId
        : session.user.branchId;

    if (!branchId) {
      return { success: false, error: "Branch tidak ditemukan" };
    }

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Tambahkan minimal 1 item" };
    }

    // Handle file upload if present
    let designFilePath: string | null = null;
    if (formData) {
      const file = formData.get("designFile") as File | null;
      if (file && file.size > 0) {
        const ext = path.extname(file.name) || ".png";
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        const uploadDir = process.env.NODE_ENV === "production" 
          ? "/tmp" 
          : path.join(process.cwd(), "public", "uploads", "designs");

        await mkdir(uploadDir, { recursive: true });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(path.join(uploadDir, safeName), buffer);

        // Path yang disimpan ke database tetap menyesuaikan agar setidaknya tidak error
        designFilePath = process.env.NODE_ENV === "production"
          ? `/tmp/${safeName}`
          : `/uploads/designs/${safeName}`;
      }
    }

    const totalPrice = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderNumber = generateOrderNumber();

    // Execute everything in a Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order with items
      const order = await tx.order.create({
        data: {
          orderNumber,
          branchId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          designFilePath,
          totalPrice,
          status: "PENDING",
          orderItems: {
            create: input.items.map((item) => ({
              inventoryId: item.inventoryId,
              quantity: item.quantity,
              price: item.price,
              printSize: item.printSize,
            })),
          },
        },
      });

      // 2. Deduct garment stock for each item
      for (const item of input.items) {
        const inventory = await tx.inventory.findUnique({
          where: { id: item.inventoryId },
        });

        if (!inventory) {
          throw new Error(`Item inventaris tidak ditemukan: ${item.inventoryId}`);
        }

        if (inventory.stockQuantity < item.quantity) {
          throw new Error(
            `Stok ${inventory.itemName} tidak cukup. Tersedia: ${inventory.stockQuantity}`
          );
        }

        // Deduct garment stock
        await tx.inventory.update({
          where: { id: item.inventoryId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        // 3. Auto-deduct DTF consumables based on print size
        const printSize = item.printSize as keyof typeof DTF_CONSUMABLES;
        const consumables = DTF_CONSUMABLES[printSize] || DTF_CONSUMABLES.A3;

        // Deduct PET Film Roll
        const filmItem = await tx.inventory.findFirst({
          where: {
            branchId,
            itemName: CONSUMABLE_NAMES.film,
          },
        });

        if (filmItem) {
          await tx.inventory.update({
            where: { id: filmItem.id },
            data: {
              stockQuantity: {
                decrement: consumables.filmDeduction * item.quantity,
              },
            },
          });
        }

        // Deduct Tinta Putih DTF
        const inkItem = await tx.inventory.findFirst({
          where: {
            branchId,
            itemName: CONSUMABLE_NAMES.ink,
          },
        });

        if (inkItem) {
          await tx.inventory.update({
            where: { id: inkItem.id },
            data: {
              stockQuantity: {
                decrement: consumables.inkDeduction * item.quantity,
              },
            },
          });
        }
      }

      // 4. Check for low stock alerts in this branch
      const lowStockItems = await tx.inventory.findMany({
        where: {
          branchId,
          stockQuantity: { lte: prisma.inventory.fields.lowStockThreshold },
        },
        include: { branch: true },
      });

      // Workaround: fetch and filter manually
      const allBranchInventory = await tx.inventory.findMany({
        where: { branchId },
        include: { branch: true },
      });

      const stockAlerts: StockAlert[] = allBranchInventory
        .filter((inv) => inv.stockQuantity <= inv.lowStockThreshold)
        .map((inv) => ({
          id: inv.id,
          branchName: inv.branch.name,
          itemName: inv.itemName,
          itemType: inv.itemType,
          stockQuantity: inv.stockQuantity,
          lowStockThreshold: inv.lowStockThreshold,
          unit: inv.unit,
        }));

      return { order, stockAlerts };
    });

    revalidatePath("/pos");
    revalidatePath("/inventory");
    revalidatePath("/production");
    revalidatePath("/orders");

    return {
      success: true,
      data: {
        orderNumber: result.order.orderNumber,
        stockAlerts: result.stockAlerts,
      },
    };
  } catch (error) {
    console.error("Create order error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal membuat pesanan. Silakan coba lagi.",
    };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    revalidatePath("/production");
    revalidatePath("/orders");

    return { success: true };
  } catch (error) {
    console.error("Update order status error:", error);
    return {
      success: false,
      error: "Gagal mengubah status pesanan.",
    };
  }
}

export async function getOrders(branchId?: string | null) {
  const session = await auth();
  if (!session?.user) return [];

  const where: Record<string, unknown> = {};

  if (session.user.role !== "OWNER" && session.user.branchId) {
    where.branchId = session.user.branchId;
  } else if (branchId) {
    where.branchId = branchId;
  }

  return prisma.order.findMany({
    where,
    include: {
      branch: true,
      orderItems: {
        include: {
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrdersByStatus(branchId?: string | null) {
  const session = await auth();
  if (!session?.user) return {};

  const where: Record<string, unknown> = {};

  if (session.user.role !== "OWNER" && session.user.branchId) {
    where.branchId = session.user.branchId;
  } else if (branchId) {
    where.branchId = branchId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      branch: true,
      orderItems: {
        include: {
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, typeof orders> = {
    PENDING: [],
    PRINTING: [],
    PRESSING: [],
    READY: [],
    COMPLETED: [],
  };

  for (const order of orders) {
    if (grouped[order.status]) {
      grouped[order.status].push(order);
    }
  }

  return grouped;
}
