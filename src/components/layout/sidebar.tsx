"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/rbac";

const links: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/map", label: "Live Map" },
  { href: "/reports", label: "Reports" },
  { href: "/alerts", label: "Global Alerts" },
  { href: "/agents", label: "Intel Agents" },
  { href: "/ml/retrain", label: "ML & Kubeflow", adminOnly: true },
  { href: "/settings", label: "Settings" },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          CrisisLens
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Operations</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {links
          .filter((l) => !l.adminOnly || role === "admin")
          .map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
