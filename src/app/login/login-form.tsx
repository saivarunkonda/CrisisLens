"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  showGoogle: boolean;
  showGitHub: boolean;
};

export function LoginForm({ showGoogle, showGitHub }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [email, setEmail] = useState("analyst@crisislens.local");
  const [password, setPassword] = useState("DemoUser2026!");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const oauthError = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  async function onCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setMessage("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const showOAuth = showGoogle || showGitHub;

  return (
    <div className="mx-auto w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            CrisisLens
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Use a <strong>demo account</strong> below for local testing. OAuth is optional.
          </p>
        </div>
        <ThemeToggle />
      </div>

      {showOAuth ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            {showGoogle ? (
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Google
              </button>
            ) : null}
            {showGitHub ? (
              <button
                type="button"
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                GitHub
              </button>
            ) : null}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                Or email
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          SSO is not configured. Add{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">AUTH_GOOGLE_*</code> /{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">AUTH_GITHUB_*</code> to{" "}
          <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">.env.local</code> to enable
          Google or GitHub.
        </p>
      )}

      <form className="space-y-4" onSubmit={onCredentials}>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700 dark:text-slate-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700 dark:text-slate-300">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
        {message || oauthError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {message ?? (oauthError ? `Sign-in error: ${oauthError}` : "")}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <p className="font-semibold text-slate-800 dark:text-slate-200">Demo accounts</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <button
              type="button"
              className="text-left text-blue-700 underline hover:opacity-80 dark:text-blue-300"
              onClick={() => {
                setEmail("admin@crisislens.local");
                setPassword("CrisisLens2026!");
              }}
            >
              Admin
            </button>
            : admin@crisislens.local / CrisisLens2026!
          </li>
          <li>
            <button
              type="button"
              className="text-left text-blue-700 underline hover:opacity-80 dark:text-blue-300"
              onClick={() => {
                setEmail("analyst@crisislens.local");
                setPassword("DemoUser2026!");
              }}
            >
              Analyst
            </button>
            : analyst@crisislens.local / DemoUser2026!
          </li>
          <li>
            <button
              type="button"
              className="text-left text-blue-700 underline hover:opacity-80 dark:text-blue-300"
              onClick={() => {
                setEmail("viewer@crisislens.local");
                setPassword("ViewOnly2026!");
              }}
            >
              Viewer
            </button>
            : viewer@crisislens.local / ViewOnly2026!
          </li>
        </ul>
      </div>
    </div>
  );
}
