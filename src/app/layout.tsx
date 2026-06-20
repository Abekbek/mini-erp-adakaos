import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Adakaos ERP — DTF Screen Printing Management",
  description:
    "Mini ERP platform for Adakaos multi-branch DTF screen printing business. Manage orders, production, inventory, and analytics across Purwakarta, Karawang, and Cikampek.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
