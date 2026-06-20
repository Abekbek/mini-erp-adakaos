"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { DashboardMetrics, BranchRevenue } from "@/types";

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return null;

  const [orders, allInventory] = await Promise.all([
    prisma.order.findMany({
      select: { totalPrice: true, status: true },
    }),
    prisma.inventory.findMany({
      include: { branch: true },
    }),
  ]);

  const totalRevenue = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status !== "COMPLETED"
  ).length;

  const stockAlerts = allInventory
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

  return { totalRevenue, totalOrders, pendingOrders, stockAlerts };
}

export async function getBranchRevenues(): Promise<BranchRevenue[]> {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return [];

  const branches = await prisma.branch.findMany({
    include: {
      orders: {
        select: { totalPrice: true, status: true },
      },
    },
  });

  return branches.map((branch) => ({
    branchName: branch.name,
    revenue: branch.orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + o.totalPrice, 0),
    orderCount: branch.orders.length,
  }));
}

export async function getOrdersTrend() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      totalPrice: true,
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyData: Record<string, { date: string; orders: number; revenue: number }> = {};

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().slice(0, 10);
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { date: dateKey, orders: 0, revenue: 0 };
    }
    dailyData[dateKey].orders++;
    dailyData[dateKey].revenue += order.totalPrice;
  }

  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}
