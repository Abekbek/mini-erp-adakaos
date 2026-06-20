"use client";

import { useState, useTransition } from "react";
import { createOrder } from "@/server/actions/order.actions";
import { getGarments } from "@/server/actions/inventory.actions";
import { formatCurrency } from "@/lib/utils";
import type { Role } from "@prisma/client";
import type { CartItem, StockAlert } from "@/types";

interface Branch {
  id: string;
  name: string;
}

interface Garment {
  id: string;
  itemName: string;
  stockQuantity: number;
  unit: string;
}

interface POSClientProps {
  branches: Branch[];
  initialGarments: Garment[];
  userRole: Role;
  userBranchId: string | null;
}

const GARMENT_PRICES: Record<string, number> = {
  "Kaos Polos Putih S": 75000,
  "Kaos Polos Putih M": 75000,
  "Kaos Polos Putih L": 75000,
  "Kaos Polos Putih XL": 80000,
  "Kaos Polos Hitam M": 75000,
  "Kaos Polos Hitam L": 75000,
  "Kaos Polos Hitam XL": 80000,
  "Hoodie Polos Hitam M": 185000,
  "Hoodie Polos Hitam L": 185000,
};

export function POSClient({
  branches,
  initialGarments,
  userRole,
  userBranchId,
}: POSClientProps) {
  const [selectedBranch, setSelectedBranch] = useState(
    userBranchId || branches[0]?.id || ""
  );
  const [garments, setGarments] = useState<Garment[]>(initialGarments);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [printSize, setPrintSize] = useState("A3");
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    orderNumber?: string;
    stockAlerts?: StockAlert[];
    error?: string;
  } | null>(null);

  const handleBranchChange = async (branchId: string) => {
    setSelectedBranch(branchId);
    setCart([]);
    const newGarments = await getGarments(branchId);
    setGarments(newGarments);
  };

  const addToCart = (garment: Garment) => {
    const existing = cart.find((item) => item.inventoryId === garment.id);
    if (existing) {
      if (existing.quantity >= garment.stockQuantity) return;
      setCart(
        cart.map((item) =>
          item.inventoryId === garment.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          inventoryId: garment.id,
          itemName: garment.itemName,
          quantity: 1,
          price: GARMENT_PRICES[garment.itemName] || 75000,
          printSize,
          availableStock: garment.stockQuantity,
        },
      ]);
    }
  };

  const removeFromCart = (inventoryId: string) => {
    setCart(cart.filter((item) => item.inventoryId !== inventoryId));
  };

  const updateQuantity = (inventoryId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(inventoryId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.inventoryId === inventoryId ? { ...item, quantity } : item
      )
    );
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmit = () => {
    if (!customerName.trim() || !customerPhone.trim() || cart.length === 0) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (designFile) {
        formData.append("designFile", designFile);
      }

      const result = await createOrder(
        {
          branchId: selectedBranch,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          items: cart.map((item) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            price: item.price,
            printSize: item.printSize,
          })),
        },
        formData
      );

      if (result.success && result.data) {
        setOrderResult({
          success: true,
          orderNumber: result.data.orderNumber,
          stockAlerts: result.data.stockAlerts,
        });
        // Reset form
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setDesignFile(null);
        // Refresh garments
        const newGarments = await getGarments(selectedBranch);
        setGarments(newGarments);
      } else {
        setOrderResult({ success: false, error: result.error });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Success/Error notification */}
      {orderResult && (
        <div className="lg:col-span-3 animate-slide-up">
          {orderResult.success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-emerald-800">
                    Pesanan {orderResult.orderNumber} berhasil dibuat!
                  </p>
                  {orderResult.stockAlerts && orderResult.stockAlerts.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm font-semibold text-amber-800 mb-2">
                        ⚠️ Peringatan Stok Rendah:
                      </p>
                      {orderResult.stockAlerts.map((alert) => (
                        <p key={alert.id} className="text-sm text-amber-700">
                          {alert.itemName} ({alert.branchName}): {alert.stockQuantity} {alert.unit} tersisa
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setOrderResult(null)}
                  className="text-emerald-400 hover:text-emerald-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800 font-medium">
                ❌ {orderResult.error}
              </p>
              <button
                onClick={() => setOrderResult(null)}
                className="mt-2 text-sm text-red-600 underline"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      )}

      {/* Left Panel - Item Selection */}
      <div className="lg:col-span-2 space-y-6">
        {/* Branch selector for Owner */}
        {userRole === "OWNER" && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Cabang:</label>
            <select
              value={selectedBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="px-4 py-2 rounded-lg border bg-white text-foreground text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Print size selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">Ukuran Print:</label>
          <div className="flex gap-2">
            {["A3", "A4"].map((size) => (
              <button
                key={size}
                onClick={() => setPrintSize(size)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  printSize === size
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-white text-foreground border-border hover:border-primary/30"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Garment Grid */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pilih Garment
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {garments.map((garment) => {
              const isInCart = cart.some(
                (item) => item.inventoryId === garment.id
              );
              const price = GARMENT_PRICES[garment.itemName] || 75000;
              return (
                <button
                  key={garment.id}
                  onClick={() => addToCart(garment)}
                  disabled={garment.stockQuantity <= 0}
                  className={`pos-item-card text-left ${
                    isInCart ? "selected" : ""
                  } ${garment.stockQuantity <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">👕</span>
                    {garment.stockQuantity <= 10 && garment.stockQuantity > 0 && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Sisa {garment.stockQuantity}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm text-foreground truncate">
                    {garment.itemName}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(price)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {garment.stockQuantity} {garment.unit}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {garments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Tidak ada garment tersedia untuk cabang ini</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart & Checkout */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Cart Header */}
          <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Keranjang</h3>
              <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-1 rounded-full">
                {cart.length} item
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-4 space-y-3 border-b">
            <input
              type="text"
              placeholder="Nama Customer"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-white text-sm
                         placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="tel"
              placeholder="No. Telepon"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-white text-sm
                         placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                File Desain (PNG/TIF)
              </label>
              <input
                type="file"
                accept=".png,.tif,.tiff,.jpg,.jpeg"
                onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3
                           file:rounded-lg file:border-0 file:text-xs file:font-semibold
                           file:bg-primary/10 file:text-primary hover:file:bg-primary/20
                           file:cursor-pointer cursor-pointer"
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Keranjang kosong
              </p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.inventoryId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.itemName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        updateQuantity(item.inventoryId, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-md bg-white border text-sm font-bold
                                 hover:bg-slate-100 transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.inventoryId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.availableStock}
                      className="w-7 h-7 rounded-md bg-white border text-sm font-bold
                                 hover:bg-slate-100 transition-colors flex items-center justify-center
                                 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.inventoryId)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Total & Submit */}
          <div className="p-4 border-t bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={
                isPending ||
                cart.length === 0 ||
                !customerName.trim() ||
                !customerPhone.trim()
              }
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-600
                         text-white font-semibold shadow-lg shadow-primary/25
                         hover:shadow-xl hover:shadow-primary/30
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-300"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Memproses...
                </span>
              ) : (
                `Buat Pesanan — ${formatCurrency(totalPrice)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
