import { auth } from "@/lib/auth";
import { getInventory, getBranches } from "@/server/actions/inventory.actions";
import { InventoryClient } from "@/components/inventory/InventoryClient";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [inventory, branches] = await Promise.all([
    getInventory(),
    getBranches(),
  ]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manajemen Inventaris</h1>
        <p className="text-muted-foreground mt-1">
          Pantau stok garment dan bahan DTF di semua cabang
        </p>
      </div>
      <InventoryClient
        initialInventory={inventory}
        branches={branches}
        userRole={session.user.role}
      />
    </div>
  );
}
