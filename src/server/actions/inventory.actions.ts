"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResponse, StockAlert } from "@/types";

export async function getInventory(branchId?: string | null) {
  const session = await auth();
  if (!session?.user) return [];

  const where: Record<string, unknown> = {};

  if (session.user.role !== "OWNER" && session.user.branchId) {
    where.branchId = session.user.branchId;
  } else if (branchId) {
    where.branchId = branchId;
  }

  return prisma.inventory.findMany({
    where,
    include: { branch: true },
    orderBy: [{ itemType: "asc" }, { itemName: "asc" }],
  });
}

export async function getGarments(branchId: string) {
  return prisma.inventory.findMany({
    where: {
      branchId,
      itemType: "GARMENT",
      stockQuantity: { gt: 0 },
    },
    orderBy: { itemName: "asc" },
  });
}

export async function updateStock(
  inventoryId: string,
  newQuantity: number
): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.role === "PRODUCTION_OPERATOR") {
      return { success: false, error: "Tidak memiliki izin" };
    }

    await prisma.inventory.update({
      where: { id: inventoryId },
      data: { stockQuantity: newQuantity },
    });

    revalidatePath("/inventory");
    revalidatePath("/pos");

    return { success: true };
  } catch (error) {
    console.error("Update stock error:", error);
    return { success: false, error: "Gagal mengubah stok." };
  }
}

export async function getStockAlerts(): Promise<StockAlert[]> {
  const session = await auth();
  if (!session?.user) return [];

  const allInventory = await prisma.inventory.findMany({
    include: { branch: true },
  });

  return allInventory
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
}

export async function getBranches() {
  return prisma.branch.findMany({
    orderBy: { name: "asc" },
  });
}
