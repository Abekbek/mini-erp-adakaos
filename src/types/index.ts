import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth/jwt";
// ============================================
// NextAuth Type Extensions
// ============================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      branchId: string | null;
      branchName: string | null;
    };
  }

  interface User {
    role: Role;
    branchId: string | null;
    branchName: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    branchId: string | null;
    branchName: string | null;
  }
}

// ============================================
// Application Types
// ============================================

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StockAlert {
  id: string;
  branchName: string;
  itemName: string;
  itemType: string;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  stockAlerts: StockAlert[];
}

export interface BranchRevenue {
  branchName: string;
  revenue: number;
  orderCount: number;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  designFilePath: string | null;
  status: string;
  totalPrice: number;
  createdAt: Date;
  branch: {
    id: string;
    name: string;
  };
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    printSize: string;
    inventory: {
      id: string;
      itemName: string;
      itemType: string;
    };
  }[];
}

export interface CartItem {
  inventoryId: string;
  itemName: string;
  quantity: number;
  price: number;
  printSize: string;
  availableStock: number;
}
