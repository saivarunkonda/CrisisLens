import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Appearance and your access level (RBAC).
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Switch between light and dark theme. System follows OS preference by default.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <ThemeToggle />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Role (RBAC)</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your signed-in role controls what you can do. OAuth users get roles from{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ADMIN_EMAILS</code> /{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ANALYST_EMAILS</code> env
          lists.
        </p>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {session?.user?.email ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-mono font-medium uppercase text-blue-700 dark:text-blue-300">
              {session?.user?.role ?? "—"}
            </dd>
          </div>
        </dl>
        <ul className="mt-4 list-inside list-disc text-sm text-slate-600 dark:text-slate-400">
          <li>
            <strong>admin</strong> — Kubeflow retrain, full reports
          </li>
          <li>
            <strong>analyst</strong> — dashboard + submit reports
          </li>
          <li>
            <strong>viewer</strong> — read-only dashboard
          </li>
        </ul>
      </section>
    </div>
  );
}
