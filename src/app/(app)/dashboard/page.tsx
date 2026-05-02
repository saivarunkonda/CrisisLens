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
import { getCountries, getStates, getCities, getDefaultCountry } from "@/lib/location-data";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, ZAxis
} from "recharts";

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000; // 5 minutes warning

type RegionRisk = {
  region: string;
  overallRisk: number;
  recommendation: string;
  dynamicFactors: Record<string, number>;
  floodRisk: number;
  heatRisk: number;
  healthRisk: number;
  supplyRisk: number;
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

const categories = [
  "flood", "extreme_heat", "rain_storm", "earthquake", "hurricane",
  "health", "pollution", "food_scarcity", "water_scarcity", "pandemic", "fatalities",
  "political_unrest", "war_conflict", "economic_crash", "security", "violent_crime", "property_crime", "cyber_attack",
  "supply_chain", "traffic", "power_outage", "network_outage", "fuel_shortage"
] as const;

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
  const [country, setCountry] = useState(getDefaultCountry());
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [similarIncidents, setSimilarIncidents] = useState<any[]>([]);
  const [fetchingSimilar, setFetchingSimilar] = useState(false);
  
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
    const res = await fetch("/api/risk?limit=5", { cache: "no-store", credentials: "include" });
    if (res.status === 401) {
      setMessage("Session expired — sign in again.");
      return;
    }
    const json = (await res.json()) as ApiResponse;
    setData(json);
    
    // Safety check for region selection
    if (json.risks && json.risks.length > 0) {
      const regionExists = json.risks.some((r) => r.region === region);
      if (!regionExists) {
        setRegion(json.risks[0].region);
      }
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
        category,
        severity,
        title: `${category.replace(/_/g, " ")} incident`,
        description: note,
        country,
        state,
        city
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
    // After refresh, fetch similar incidents for the new report's context
    fetchSimilar(region, note);
    setLoading(false);
  }

  async function fetchSimilar(regionName: string, description: string) {
    if (!description) return;
    setFetchingSimilar(true);
    try {
      const res = await fetch("/api/similar-incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      });
      if (res.ok) {
        const json = await res.json();
        setSimilarIncidents(json.similar || []);
      }
    } catch (err) {
      console.error("Failed to fetch similar incidents:", err);
    } finally {
      setFetchingSimilar(false);
    }
  }

  useEffect(() => {
    if (selected && note) {
       // Debounced fetch could be here, but for now we'll trigger on submit or selection change
    }
  }, [selected]);

  const card = "rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:border-indigo-900 dark:bg-gradient-to-br dark:from-indigo-950 dark:to-purple-950";
  const innerCard =
  "rounded-xl border border-indigo-100 bg-white/80 p-4 dark:border-indigo-800 dark:bg-slate-900/80";

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
          {/* Top bar with status only — region selector removed */}
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
            <div className="text-xs bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white/80 border border-white/20">
              {data?.summary?.regions ?? 0} regions · {data?.summary?.reports ?? 0} reports · {data?.summary?.highRiskRegions ?? 0} high risk
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
          <div className="rounded-xl bg-indigo-600 p-4 text-white shadow-lg dark:bg-indigo-800">
            <h2 className="text-xl font-semibold">
              Submit incident report
            </h2>
          </div>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">
            {canSubmit
              ? "Reports feed the risk score engine and update recommendations in real time."
              : "Your role is view-only — you cannot submit reports."}
          </p>
          <form className="mt-4 grid gap-3" onSubmit={submitReport}>

            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              Country
              <select
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={country}
                disabled={!canSubmit}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setState("");
                  setCity("");
                }}
              >
                {getCountries().map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              State
              <select
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={state}
                disabled={!canSubmit}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity("");
                }}
              >
                <option value="">Select state</option>
                {getStates(country).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              City
              <select
                className="rounded-lg border border-slate-300 bg-white p-2 dark:border-slate-600 dark:bg-slate-950"
                value={city}
                disabled={!canSubmit}
                onChange={(e) => setCity(e.target.value)}
              >
                <option value="">Select city</option>
                {getCities(country, state).map((c) => (
                  <option key={c} value={c}>
                    {c}
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

      {/* Similar Incidents (RAG) */}
      {similarIncidents.length > 0 && (
        <section className={card}>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Historical context (RAG)
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Past incidents with similar descriptions to help inform response.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {similarIncidents.map((inc, i) => (
              <div key={i} className={innerCard}>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    inc.severity >= 4 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    Severity {inc.severity}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Math.round(inc.similarity * 100)}% match
                  </span>
                </div>
                <h4 className="mt-2 font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{inc.title}</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{inc.description}</p>
                <div className="mt-2 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                  Category: {inc.category}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Advanced Analytics Charts */}
      <section className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Pie Chart — Risk Level Distribution */}
        {data?.risks && data.risks.length > 0 && (() => {
          const critical = data.risks.filter(r => r.overallRisk >= 80).length;
          const high = data.risks.filter(r => r.overallRisk >= 60 && r.overallRisk < 80).length;
          const medium = data.risks.filter(r => r.overallRisk >= 40 && r.overallRisk < 60).length;
          const low = data.risks.filter(r => r.overallRisk < 40).length;
          const pieData = [
            { name: "Critical", value: critical },
            { name: "High", value: high },
            { name: "Medium", value: medium },
            { name: "Low", value: low },
          ].filter(d => d.value > 0);
          const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
          return (
            <div className={card}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Risk Level Distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "none", borderRadius: 8, color: "#fff" }} />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          );
        })()}

        {/* Bar Chart — Overall Risk by Region */}
        {data?.risks && data.risks.length > 0 && (
          <div className={card}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Overall Risk by Region</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.risks.slice(0, 8).map(r => ({ name: r.region.split(" ")[0], risk: r.overallRisk }))} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "none", borderRadius: 8, color: "#fff" }} cursor={{ fill: "transparent" }} />
                <Bar dataKey="risk" name="Overall Risk" radius={[4, 4, 0, 0]}>
                  {data.risks.slice(0, 8).map((r, i) => (
                    <Cell key={i} fill={r.overallRisk >= 80 ? "#ef4444" : r.overallRisk >= 60 ? "#f97316" : r.overallRisk >= 40 ? "#eab308" : "#22c55e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Scatter Plot — Risk Score vs Reports */}
        {data?.risks && data.risks.length > 0 && (
          <div className={card}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Risk Score vs Report Volume</h2>
            <p className="text-xs text-slate-500 mb-3">Bubble size = relative population</p>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis type="number" dataKey="x" name="Reports" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: "Reports", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Overall Risk" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <ZAxis type="number" dataKey="z" range={[40, 200]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(v, name) => [v, name]} />
                <Scatter
                  name="Regions"
                  data={data.risks.map((r, i) => ({ x: i + 1, y: r.overallRisk, z: r.overallRisk, name: r.region }))}
                  fill="#6366f1"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Heatmap Table — Category Risk Matrix */}
        {data?.risks && data.risks.length > 0 && (
          <div className={card}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Category Risk Heatmap</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-slate-500 font-medium pb-2 pr-4">Region</th>
                    {["Flood", "Heat", "Health", "Supply", "Overall"].map(h => (
                      <th key={h} className="text-center text-slate-500 font-medium pb-2 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.risks.slice(0, 8).map((r) => {
                    const vals = [
                      r.dynamicFactors?.flood ?? r.floodRisk ?? 0,
                      r.dynamicFactors?.extreme_heat ?? r.heatRisk ?? 0,
                      r.dynamicFactors?.health ?? r.healthRisk ?? 0,
                      r.dynamicFactors?.supply_chain ?? r.supplyRisk ?? 0,
                      r.overallRisk
                    ];
                    return (
                      <tr key={r.region} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.region}</td>
                        {vals.map((v, i) => (
                          <td key={i} className="text-center py-1 px-2">
                            <span className={`inline-block rounded px-2 py-0.5 font-bold text-white text-[10px] ${
                              v >= 70 ? "bg-red-500" : v >= 40 ? "bg-amber-500" : "bg-emerald-500"
                            }`}>{Math.round(v)}</span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Legacy RiskAnalytics (Pie + Bar aggregate) */}
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
