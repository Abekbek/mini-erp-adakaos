import { auth } from "@/lib/auth";
import { getOrders } from "@/server/actions/order.actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { redirect } from "next/navigation";
import type { OrderStatus } from "@prisma/client";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getOrders();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Riwayat Pesanan</h1>
        <p className="text-muted-foreground mt-1">
          Daftar semua pesanan yang masuk
        </p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">No. Pesanan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Cabang</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Item</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Total</th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];
                return (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-primary">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {order.branch.name}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {order.orderItems.map((item) => (
                          <p key={item.id} className="text-xs text-muted-foreground">
                            {item.inventory.itemName} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold">
                        {formatCurrency(order.totalPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`status-badge ${statusConfig.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada pesanan
          </div>
        )}
      </div>
    </div>
  );
}
