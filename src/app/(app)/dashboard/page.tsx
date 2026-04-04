"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { NotificationPanel } from "@/components/notification-panel";
import { RBACPanel } from "@/components/rbac-panel";
import { RegistrationForm } from "@/components/registration-form";
import { ExportPanel } from "@/components/export-panel";
import { RiskAnalytics } from "@/components/risk-analytics";
import type { Role } from "@/lib/rbac";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000; // 5 minutes warning

type RegionRisk = {
  region: string;
  floodRisk: number;
  heatRisk: number;
  healthRisk: number;
  supplyRisk: number;
  overallRisk: number;
  recommendation: string;
};

type ApiResponse = {
  ml?: {
    serviceConfigured: boolean;
    regionsFromMlService: number;
    regionsFromFallback: number;
  };
  summary: {
    regions: number;
    reports: number;
    highRiskRegions: number;
  };
  risks: RegionRisk[];
};

const categories = ["flood", "heat", "health", "supply"] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [region, setRegion] = useState("North District");
  const [category, setCategory] = useState<(typeof categories)[number]>("flood");
  const [severity, setSeverity] = useState(3);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const canSubmit = session?.user?.role !== "viewer";

  // Auto-logout functionality
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);
    
    // Set warning timer (5 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);
    
    // Set logout timer
    inactivityTimerRef.current = setTimeout(() => {
      signOut({ callbackUrl: "/login" });
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Handle user activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handleActivity = () => resetInactivityTimer();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetInactivityTimer();
    
    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [resetInactivityTimer]);

  // Handle tab close - clear session
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear any sensitive data from memory
      setData(null);
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  async function refresh() {
    const res = await fetch("/api/risk", { cache: "no-store", credentials: "include" });
    if (res.status === 401) {
      setMessage("Session expired — sign in again.");
      return;
    }
    const json = (await res.json()) as ApiResponse;
    setData(json);
    if (!json.risks?.some((r) => r.region === region)) {
      setRegion(json.risks?.[0]?.region ?? "North District");
    }
  }

  useEffect(() => {
    if (status !== "authenticated") return;
    refresh().catch(() => setMessage("Failed to load risk snapshot."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const selected = useMemo(
    () => data?.risks?.find((r) => r.region === region) ?? null,
    [data, region]
  );

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ 
        regionId: region, 
        category, 
        severity, 
        title: `${category} incident in ${region}`,
        description: note 
      }),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setMessage(json.error ?? "Unable to submit report.");
      setLoading(false);
      return;
    }
    setMessage("Report submitted. Risk model updated.");
    setNote("");
    await refresh();
    setLoading(false);
  }

  const card = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";
  const innerCard =
    "rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/50";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {/* Inactivity Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-amber-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold">Session Timeout Warning</h3>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              You will be logged out in <strong>5 minutes</strong> due to inactivity. 
              Click anywhere or press any key to stay logged in.
            </p>
            <button
              onClick={() => {
                resetInactivityTimer();
                setShowWarning(false);
              }}
              className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}

      {/* Hero Section with Region Selector */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl dark:border-indigo-900/50">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:20px_20px]" />
        </div>
        
        <div className="relative z-10">
          {/* Top bar with status and region selector */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-100">CrisisLens — live operations</p>
              {data?.ml ? (
                <p className="mt-1 text-xs text-indigo-50/90">
                  {data?.ml?.serviceConfigured && data?.ml?.regionsFromMlService > 0 ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      ML service live — {data?.ml?.regionsFromMlService}/{data?.summary?.regions} regions
                    </span>
                  ) : data?.ml?.serviceConfigured ? (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      ML service unreachable — using fallback
                    </span>
                  ) : (
                    <span>Set ML_SERVICE_URL for live inference</span>
                  )}
                </p>
              ) : null}
            </div>
            
            {/* Region Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white/90">Region:</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="rounded-lg border-0 bg-white/20 px-3 py-1.5 text-sm text-white backdrop-blur-sm focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {!data?.risks?.length && (
                  <option value="North District" className="text-slate-900">North District</option>
                )}
                {data?.risks?.map((r) => (
                  <option key={r.region} value={r.region} className="text-slate-900">
                    {r.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-bold md:text-4xl">
            Early crisis detection for faster community response
          </h1>
          <p className="mt-3 max-w-3xl text-white/90">
            Merge local incident reports and risk signals into one decision dashboard for NGOs,
            campus teams, and municipalities.
          </p>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric title="Regions monitored" value={String(data?.summary?.regions ?? 0)} />
        <Metric title="High risk regions" value={String(data?.summary?.highRiskRegions ?? 0)} />
        <Metric title="Citizen reports" value={String(data?.summary?.reports ?? 0)} />
      </section>

      <section className="grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <div className={card}>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Risk heatboard</h2>
          <div className="mt-4 grid gap-3">
            {data?.risks?.map((risk) => (
              <article key={risk.region} className={innerCard}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{risk.region}</h3>
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-sm dark:bg-slate-800">
                    Overall {risk.overallRisk}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                  <RiskBar label="Flood" value={risk.floodRisk} />
                  <RiskBar label="Heat" value={risk.heatRisk} />
                  <RiskBar label="Health" value={risk.healthRisk} />
                  <RiskBar label="Supply" value={risk.supplyRisk} />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {risk.recommendation}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className={card}>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Submit incident report
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {canSubmit
              ? "Reports feed the risk score engine and update recommendations in real time."
              : "Your role is view-only — you cannot submit reports."}
          </p>
          <form className="mt-4 grid gap-3" onSubmit={submitReport}>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              Region
              <select
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={region}
                disabled={!canSubmit}
                onChange={(e) => setRegion(e.target.value)}
              >
                {!data?.risks?.length && (
                  <option value="North District">North District</option>
                )}
                {data?.risks?.map((r) => (
                  <option key={r.region} value={r.region}>
                    {r.region}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              Category
              <select
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={category}
                disabled={!canSubmit}
                onChange={(e) => setCategory(e.target.value as (typeof categories)[number])}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              Severity (1-5)
              <input
                type="number"
                min={1}
                max={5}
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={severity}
                disabled={!canSubmit}
                onChange={(e) => setSeverity(Number(e.target.value))}
              />
            </label>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              Details
              <textarea
                rows={4}
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={note}
                disabled={!canSubmit}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what happened and where."
                required={canSubmit}
              />
            </label>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {loading ? "Submitting..." : "Submit report"}
            </button>
          </form>
          {message ? <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">{message}</p> : null}
          {selected ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {selected.region} next action
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{selected.recommendation}</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Analytics Section */}
      <section className="mt-6">
        <RiskAnalytics data={data} />
      </section>

      {/* Export Panel */}
      <section className="mt-6">
        <ExportPanel data={data} userRole={session?.user?.role as Role} />
      </section>

      {/* Registration Section - Admin Only */}
      {session?.user?.role === "admin" && (
        <section className="mt-6">
          <RegistrationForm allowRoles={["viewer", "analyst", "admin"]} />
        </section>
      )}

      {/* RBAC Panel - Admin Only */}
      <section className="mt-6">
        <RBACPanel currentUserRole={session?.user?.role as Role} />
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function RiskBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
