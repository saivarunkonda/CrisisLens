"use client";

import type { Role } from "@/lib/rbac";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    email?: string | null;
    name?: string | null;
    role: Role;
  };
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav email={user.email} name={user.name} role={user.role} />
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
