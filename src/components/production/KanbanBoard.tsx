"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/server/actions/order.actions";
import { formatCurrency, getTimeElapsed } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { OrderStatus } from "@prisma/client";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  printSize: string;
  inventory: {
    id: string;
    itemName: string;
    itemType: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: string | Date;
  branch: { id: string; name: string };
  orderItems: OrderItem[];
}

interface KanbanBoardProps {
  initialOrders: Record<string, Order[]>;
}

const STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "PRINTING",
  "PRESSING",
  "READY",
  "COMPLETED",
];

export function KanbanBoard({ initialOrders }: KanbanBoardProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  // Poll for updates every 30 seconds
  const refreshData = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        // Optimistic update
        const updatedOrders = { ...orders };
        for (const status of STATUS_FLOW) {
          const orderIndex = updatedOrders[status]?.findIndex(
            (o) => o.id === orderId
          );
          if (orderIndex !== undefined && orderIndex >= 0) {
            const [movedOrder] = updatedOrders[status].splice(orderIndex, 1);
            movedOrder.status = newStatus;
            if (!updatedOrders[newStatus]) updatedOrders[newStatus] = [];
            updatedOrders[newStatus].push(movedOrder);
            break;
          }
        }
        setOrders(updatedOrders);
      }
      setUpdatingId(null);
    });
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const currentIndex = STATUS_FLOW.indexOf(current);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[currentIndex + 1];
    }
    return null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
      {STATUS_FLOW.map((status) => {
        const config = ORDER_STATUS_CONFIG[status];
        const columnOrders = orders[status] || [];

        return (
          <div
            key={status}
            className="flex-shrink-0 w-72 flex flex-col"
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
              <h3 className="font-semibold text-sm text-foreground">
                {config.label}
              </h3>
              <span className="ml-auto text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {columnOrders.length}
              </span>
            </div>

            {/* Column Body */}
            <div className="flex-1 space-y-3 min-h-[200px] p-2 rounded-xl bg-slate-50/80 border border-dashed border-slate-200">
              {columnOrders.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                  Tidak ada pesanan
                </div>
              ) : (
                columnOrders.map((order) => {
                  const timeInfo = getTimeElapsed(order.createdAt);
                  const isOverdue =
                    timeInfo.isOverdue &&
                    status !== "READY" &&
                    status !== "COMPLETED";
                  const nextStatus = getNextStatus(status as OrderStatus);
                  const isUpdating = updatingId === order.id;

                  return (
                    <div
                      key={order.id}
                      className={`kanban-card ${isOverdue ? "overdue" : ""}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-primary">
                          {order.orderNumber}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded animate-pulse">
                            ⏰ TERLAMBAT
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-sm text-foreground truncate">
                        {order.customerName}
                      </p>

                      <div className="mt-2 space-y-1">
                        {order.orderItems.map((item) => (
                          <p
                            key={item.id}
                            className="text-xs text-muted-foreground"
                          >
                            {item.inventory.itemName} × {item.quantity} ({item.printSize})
                          </p>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {formatCurrency(order.totalPrice)}
                          </p>
                          <p
                            className={`text-[10px] mt-0.5 ${
                              isOverdue
                                ? "text-red-500 font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {timeInfo.label}
                          </p>
                        </div>

                        {nextStatus && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(order.id, nextStatus)
                            }
                            disabled={isPending && isUpdating}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold
                                       bg-primary/10 text-primary hover:bg-primary hover:text-white
                                       disabled:opacity-50 transition-all duration-200"
                          >
                            {isUpdating ? (
                              <span className="flex items-center gap-1">
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              </span>
                            ) : (
                              `→ ${ORDER_STATUS_CONFIG[nextStatus].label}`
                            )}
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        📍 {order.branch.name}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
