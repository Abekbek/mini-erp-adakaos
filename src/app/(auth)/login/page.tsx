"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/pos";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah. Silakan coba lagi.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">3 Cabang Aktif</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              Adakaos
              <span className="block text-3xl font-normal text-indigo-400 mt-1">
                DTF Print Management
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              Platform ERP terpadu untuk mengelola pesanan, produksi,
              inventaris, dan analitik bisnis sablon DTF Anda.
            </p>
          </div>

          {/* Branch indicators */}
          <div className="flex flex-col gap-3">
            {["Purwakarta", "Karawang", "Cikampek"].map((branch, i) => (
              <div
                key={branch}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    i === 0
                      ? "bg-indigo-400"
                      : i === 1
                      ? "bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                />
                <span className="text-sm text-slate-300 font-medium">
                  Cabang {branch}
                </span>
                <span className="ml-auto text-xs text-slate-500">Online</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Adakaos</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              DTF Print Management
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Masuk ke Akun Anda
            </h2>
            <p className="text-muted-foreground mt-2">
              Masukkan email dan password untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@adakaos.com"
                required
                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground
                           placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           transition-all duration-200"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg border bg-background text-foreground
                           placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                           transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold
                         hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30
                         transition-all duration-200 shadow-lg shadow-primary/25
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Akun Demo
            </p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Owner:</span>
                <code className="text-foreground">owner@adakaos.com / password123</code>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <code className="text-foreground">admin.pwk@adakaos.com / password123</code>
              </div>
              <div className="flex justify-between">
                <span>Operator:</span>
                <code className="text-foreground">operator.pwk@adakaos.com / password123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
