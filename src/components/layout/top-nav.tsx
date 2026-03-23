"use client";

import { signOut } from "next-auth/react";
import type { Role } from "@/lib/rbac";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopNav({
  email,
  name,
  role,
}: {
  email: string | null | undefined;
  name: string | null | undefined;
  role: Role;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {name ?? "User"}
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-700 sm:inline dark:bg-slate-800 dark:text-slate-300">
          {role}
        </span>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
