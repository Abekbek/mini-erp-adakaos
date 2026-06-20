"use client";

import { useState, useTransition } from "react";
import { updateStock, getInventory } from "@/server/actions/inventory.actions";
import { formatCurrency } from "@/lib/utils";
import { ITEM_TYPE_CONFIG } from "@/lib/constants";
import type { Role, ItemType } from "@prisma/client";

interface InventoryItem {
  id: string;
  itemName: string;
  itemType: ItemType;
  stockQuantity: number;
  unit: string;
  lowStockThreshold: number;
  branch: { id: string; name: string };
}

interface InventoryClientProps {
  initialInventory: InventoryItem[];
  branches: { id: string; name: string }[];
  userRole: Role;
}

export function InventoryClient({
  initialInventory,
  branches,
  userRole,
}: InventoryClientProps) {
  const [inventory, setInventory] = useState(initialInventory);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredInventory = inventory.filter((item) => {
    if (selectedBranch !== "all" && item.branch.id !== selectedBranch) return false;
    if (selectedType !== "all" && item.itemType !== selectedType) return false;
    return true;
  });

  const handleUpdateStock = (id: string) => {
    const newQty = parseFloat(editValue);
    if (isNaN(newQty) || newQty < 0) return;

    startTransition(async () => {
      const result = await updateStock(id, newQty);
      if (result.success) {
        const refreshed = await getInventory();
        setInventory(refreshed);
      }
      setEditingId(null);
    });
  };

  const lowStockCount = inventory.filter(
    (i) => i.stockQuantity <= i.lowStockThreshold
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Item</p>
          <p className="text-2xl font-bold text-foreground mt-1">{inventory.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stok Rendah</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? "text-red-500" : "text-emerald-500"}`}>
            {lowStockCount}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cabang</p>
          <p className="text-2xl font-bold text-foreground mt-1">{branches.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipe</p>
          <p className="text-2xl font-bold text-foreground mt-1">4</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 rounded-lg border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Semua Tipe</option>
          {Object.entries(ITEM_TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.icon} {config.label}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Item</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tipe</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Cabang</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Stok</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Threshold</th>
                <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                {userRole !== "PRODUCTION_OPERATOR" && (
                  <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const isLowStock = item.stockQuantity <= item.lowStockThreshold;
                const typeConfig = ITEM_TYPE_CONFIG[item.itemType];

                return (
                  <tr key={item.id} className={`border-b last:border-0 transition-colors hover:bg-slate-50/50 ${isLowStock ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{typeConfig.icon}</span>
                        <span className="font-medium text-sm">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.branch.name}</td>
                    <td className="px-4 py-3 text-right">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateStock(item.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="w-24 px-2 py-1 rounded border text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      ) : (
                        <span className={`text-sm font-semibold ${isLowStock ? "text-red-600" : "text-foreground"}`}>
                          {item.stockQuantity} {item.unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {item.lowStockThreshold} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Rendah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aman
                        </span>
                      )}
                    </td>
                    {userRole !== "PRODUCTION_OPERATOR" && (
                      <td className="px-4 py-3 text-center">
                        {editingId === item.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleUpdateStock(item.id)}
                              disabled={isPending}
                              className="px-2 py-1 rounded text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 rounded text-xs font-semibold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue(String(item.stockQuantity));
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredInventory.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Tidak ada data inventaris
          </div>
        )}
      </div>
    </div>
  );
}
