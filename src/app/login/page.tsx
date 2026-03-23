import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const showGoogle = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );
  const showGitHub = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <Suspense fallback={<div className="text-slate-500">Loading…</div>}>
        <LoginForm showGoogle={showGoogle} showGitHub={showGitHub} />
      </Suspense>
    </div>
  );
}
