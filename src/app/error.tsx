"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-muted-foreground text-sm">
            {error.message || "Terjadi kesalahan yang tidak terduga. Silakan coba lagi."}
          </p>
        </div>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                     hover:bg-primary/90 transition-colors shadow-sm"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
