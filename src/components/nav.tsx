"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Übersicht" },
  { href: "/leads/new", label: "Neuer Lead" },
  { href: "/leads/quick-add", label: "Inserat einfügen" },
  { href: "/leads/import", label: "CSV-Import" },
  { href: "/settings", label: "Einstellungen" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-4 text-lg font-semibold">
          LeadFlow
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
                pathname === link.href &&
                  "bg-neutral-900 text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
