import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "LeadFlow – Immobilien-Verkaufs-Leads",
  description: "Leads für verkaufsbereite Immobilien-Eigentümer erfassen, bewerten und verwalten.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <Nav />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
