import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getDashboardMetrics,
  getBranchRevenues,
  getOrdersTrend,
} from "@/server/actions/analytics.actions";
import { formatCurrency } from "@/lib/utils";
import { ITEM_TYPE_CONFIG } from "@/lib/constants";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import type { ItemType } from "@prisma/client";

export default async function OwnerDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    redirect("/pos");
  }

  const [metrics, branchRevenues, ordersTrend] = await Promise.all([
    getDashboardMetrics(),
    getBranchRevenues(),
    getOrdersTrend(),
  ]);

  if (!metrics) redirect("/login");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Owner</h1>
        <p className="text-muted-foreground mt-1">
          Ringkasan performa bisnis di semua cabang
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card animate-slide-up">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Dari pesanan yang selesai
          </p>
        </div>

        <div className="metric-card animate-slide-up-delay-1">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Pesanan</p>
          <p className="text-2xl font-bold text-foreground mt-2">
            {metrics.totalOrders}
          </p>
          <p className="text-xs text-blue-600 font-medium mt-1">
            {metrics.pendingOrders} pesanan aktif
          </p>
        </div>

        <div className="metric-card animate-slide-up-delay-2">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peringatan Stok</p>
          <p className={`text-2xl font-bold mt-2 ${metrics.stockAlerts.length > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {metrics.stockAlerts.length}
          </p>
          <p className="text-xs text-amber-600 font-medium mt-1">
            Item di bawah threshold
          </p>
        </div>

        <div className="metric-card animate-slide-up-delay-3">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cabang Aktif</p>
          <p className="text-2xl font-bold text-foreground mt-2">3</p>
          <p className="text-xs text-purple-600 font-medium mt-1">
            Purwakarta, Karawang, Cikampek
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Revenue per Cabang</h3>
          <RevenueChart data={branchRevenues} />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Tren Pesanan (30 Hari)</h3>
          <TrendChart data={ordersTrend} />
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-semibold text-foreground">Performa Cabang</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Cabang</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Revenue</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Pesanan</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {branchRevenues.map((branch) => (
                <tr key={branch.branchName} className="border-b last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm">{branch.branchName}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">
                    {formatCurrency(branch.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {branch.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {branch.orderCount > 0
                      ? formatCurrency(branch.revenue / branch.orderCount)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Alerts */}
      {metrics.stockAlerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-red-200 bg-red-50">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Peringatan Stok Rendah
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metrics.stockAlerts.map((alert) => {
                const typeConfig = ITEM_TYPE_CONFIG[alert.itemType as ItemType];
                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white border border-red-100"
                  >
                    <span className="text-lg">{typeConfig?.icon || "📦"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{alert.itemName}</p>
                      <p className="text-xs text-muted-foreground">{alert.branchName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {alert.stockQuantity} {alert.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        min: {alert.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
