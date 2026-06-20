"use client";

import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

interface TopbarProps {
  user: {
    name: string;
    role: Role;
    branchName: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        {user.branchName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-primary">
              Cabang {user.branchName}
            </span>
          </div>
        )}
        {user.role === "OWNER" && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <span className="text-sm font-medium text-amber-600">Semua Cabang</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right mr-2 hidden sm:block">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {user.role === "OWNER"
              ? "Owner"
              : user.role === "BRANCH_ADMIN"
              ? "Admin Cabang"
              : "Operator Produksi"}
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                     text-muted-foreground hover:text-destructive hover:bg-destructive/5
                     transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
