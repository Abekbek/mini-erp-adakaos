export const APP_NAME = "Adakaos ERP";
export const APP_DESCRIPTION = "Mini ERP for DTF Screen Printing Business";

export const BRANCHES = [
  { name: "Purwakarta", location: "Jl. Veteran No. 45, Purwakarta" },
  { name: "Karawang", location: "Jl. Tuparev No. 88, Karawang" },
  { name: "Cikampek", location: "Jl. A. Yani No. 12, Cikampek" },
] as const;

export const ORDER_STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dotColor: "bg-amber-500",
  },
  PRINTING: {
    label: "Printing",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  PRESSING: {
    label: "Pressing",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  READY: {
    label: "Ready",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    dotColor: "bg-emerald-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    dotColor: "bg-slate-400",
  },
} as const;

export const ITEM_TYPE_CONFIG = {
  GARMENT: {
    label: "Garment",
    icon: "👕",
    color: "bg-indigo-500/10 text-indigo-500",
  },
  INK: {
    label: "Tinta",
    icon: "🎨",
    color: "bg-pink-500/10 text-pink-500",
  },
  FILM: {
    label: "Film",
    icon: "📜",
    color: "bg-cyan-500/10 text-cyan-500",
  },
  POWDER: {
    label: "Powder",
    icon: "✨",
    color: "bg-yellow-500/10 text-yellow-500",
  },
} as const;

// DTF consumable deduction constants per print
export const DTF_CONSUMABLES = {
  A3: {
    filmDeduction: 42,   // cm of PET Film Roll
    inkDeduction: 15,    // ml of Tinta Putih DTF
  },
  A4: {
    filmDeduction: 30,   // cm of PET Film Roll
    inkDeduction: 10,    // ml of Tinta Putih DTF
  },
} as const;

export const CONSUMABLE_NAMES = {
  film: "PET Film Roll",
  ink: "Tinta Putih DTF",
  powder: "DTF Powder",
} as const;
