import { auth } from "@/lib/auth";
import { getOrdersByStatus } from "@/server/actions/order.actions";
import { KanbanBoard } from "@/components/production/KanbanBoard";
import { redirect } from "next/navigation";

export default async function ProductionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ordersByStatus = await getOrdersByStatus();

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Papan Produksi</h1>
        <p className="text-muted-foreground mt-1">
          Lacak dan kelola status produksi pesanan
        </p>
      </div>
      <KanbanBoard initialOrders={ordersByStatus} />
    </div>
  );
}
