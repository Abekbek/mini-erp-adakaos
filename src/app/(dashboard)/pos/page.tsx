import { auth } from "@/lib/auth";
import { getGarments } from "@/server/actions/inventory.actions";
import { getBranches } from "@/server/actions/inventory.actions";
import { POSClient } from "@/components/pos/POSClient";
import { redirect } from "next/navigation";

export default async function POSPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branches = await getBranches();

  // For non-owner users, get garments for their branch
  let initialGarments: any[] = [];
  const userBranchId = session.user.branchId;

  if (userBranchId) {
    initialGarments = await getGarments(userBranchId);
  } else if (branches.length > 0) {
    initialGarments = await getGarments(branches[0].id);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Point of Sale</h1>
        <p className="text-muted-foreground mt-1">
          Buat pesanan baru dan kelola transaksi
        </p>
      </div>
      <POSClient
        branches={branches}
        initialGarments={initialGarments}
        userRole={session.user.role}
        userBranchId={session.user.branchId}
      />
    </div>
  );
}
