"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, LineChart, Line,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  CloudRain, ThermometerSun, Earth, ShieldAlert,
  Activity, Factory, Truck, MapPin,
  Lightbulb, Filter, Search,
} from "lucide-react";
import { getCountries, getStates, getCities } from "@/lib/location-data";

const allFactors = [
  { id: "flood", label: "Flood Risk", category: "environment", icon: CloudRain, baseScore: 60 },
  { id: "extreme_heat", label: "Extreme Heat", category: "environment", icon: ThermometerSun, baseScore: 40 },
  { id: "rain_storm", label: "Severe Rain/Storms", category: "environment", icon: CloudRain, baseScore: 45 },
  { id: "earthquake", label: "Seismic Activity", category: "environment", icon: Earth, baseScore: 10 },
  { id: "hurricane", label: "Hurricane/Typhoon", category: "environment", icon: CloudRain, baseScore: 20 },
  { id: "health", label: "Public Health", category: "health", icon: Activity, baseScore: 30 },
  { id: "pollution", label: "Air Pollution (AQI)", category: "health", icon: Factory, baseScore: 70 },
  { id: "food_scarcity", label: "Food Availability", category: "health", icon: Activity, baseScore: 40 },
  { id: "water_scarcity", label: "Water Security", category: "health", icon: Activity, baseScore: 25 },
  { id: "pandemic", label: "Pandemic Risk", category: "health", icon: Activity, baseScore: 15 },
  { id: "fatalities", label: "Casualties/Deaths", category: "health", icon: Activity, baseScore: 10 },
  { id: "political_unrest", label: "Political Instability", category: "society", icon: ShieldAlert, baseScore: 50 },
  { id: "war_conflict", label: "Armed Conflict", category: "society", icon: ShieldAlert, baseScore: 20 },
  { id: "economic_crash", label: "Economic Stability", category: "society", icon: Activity, baseScore: 55 },
  { id: "security", label: "General Security", category: "society", icon: ShieldAlert, baseScore: 40 },
  { id: "violent_crime", label: "Violent Crime", category: "society", icon: ShieldAlert, baseScore: 30 },
  { id: "property_crime", label: "Property Crime", category: "society", icon: ShieldAlert, baseScore: 50 },
  { id: "cyber_attack", label: "Cyber Activities", category: "society", icon: Activity, baseScore: 35 },
  { id: "supply_chain", label: "Supply Chain", category: "infrastructure", icon: Truck, baseScore: 50 },
  { id: "traffic", label: "Traffic Congestion", category: "infrastructure", icon: Truck, baseScore: 80 },
  { id: "power_outage", label: "Power Grid", category: "infrastructure", icon: Activity, baseScore: 15 },
  { id: "network_outage", label: "Telecom/Network", category: "infrastructure", icon: Activity, baseScore: 10 },
  { id: "fuel_shortage", label: "Fuel Availability", category: "infrastructure", icon: Factory, baseScore: 35 },
];

const CAT_COLORS: Record<string, string> = {
  environment: "#3b82f6",
  health: "#ef4444",
  society: "#f97316",
  infrastructure: "#8b5cf6",
};
const RISK_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const TOOLTIP_STYLE = { backgroundColor: "rgba(15,23,42,0.92)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 };
const CHART_TYPES = [
  { id: "bar", label: "Bar" },
  { id: "radar", label: "Radar" },
  { id: "pie", label: "Pie" },
  { id: "scatter", label: "Scatter" },
];

export default function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [country, setCountry] = useState("Global");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [selectedChart, setSelectedChart] = useState("bar");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const countries = useMemo(() => ["Global", ...Array.from(new Set(getCountries()))], []);
  const states = useMemo(() => country && country !== "Global" ? Array.from(new Set(getStates(country))) : [], [country]);
  const cities = useMemo(() => stateRegion ? Array.from(new Set(getCities(country, stateRegion))) : [], [country, stateRegion]);

  useEffect(() => { setMounted(true); handleAnalyze(); }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, stateRegion, city, selectedCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        const factorsWithIcons = (data.computedFactors || []).map((cf: any) => {
          const original = allFactors.find(f => f.id === cf.id);
          return { ...cf, icon: original?.icon || Activity };
        });
        data.computedFactors = factorsWithIcons;
        setAnalysisResult(data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsAnalyzing(false);
  };

  // Always visible factors based on category filter
  const displayFactors = useMemo(() =>
    allFactors.filter(f =>
      selectedCategory === "all" ||
      f.category === selectedCategory ||
      f.id === selectedCategory
    ),
    [selectedCategory]
  );

  // Build all chart datasets from either API result or baseline allFactors
  const { radarData, pieData, barData, scatterData, temporal, gridFactors } = useMemo(() => {
    const scoreMap: Record<string, number> = {};
    if (analysisResult?.computedFactors) {
      for (const cf of analysisResult.computedFactors) scoreMap[cf.id] = cf.score;
    }
    const score = (f: typeof allFactors[0]) => scoreMap[f.id] ?? f.baseScore;

    const filtered = displayFactors;

    const radarData = ["environment", "health", "society", "infrastructure"].map(cat => {
      const fs = filtered.filter(f => f.category === cat);
      const avg = fs.length ? Math.round(fs.reduce((s, f) => s + score(f), 0) / fs.length) : 0;
      return { subject: cat.charAt(0).toUpperCase() + cat.slice(1), A: avg, fullMark: 100 };
    }).filter(d => d.A > 0);

    const scores = filtered.map(f => score(f));
    const pieData = [
      { name: "Critical (>70)", value: scores.filter(s => s > 70).length },
      { name: "High (50-70)", value: scores.filter(s => s > 50 && s <= 70).length },
      { name: "Medium (30-50)", value: scores.filter(s => s > 30 && s <= 50).length },
      { name: "Low (≤30)", value: scores.filter(s => s <= 30).length },
    ].filter(d => d.value > 0);

    const barData = [...filtered]
      .sort((a, b) => score(b) - score(a))
      .slice(0, 12)
      .map(f => ({
        name: f.label.length > 16 ? f.label.slice(0, 15) + "…" : f.label,
        score: score(f),
        category: f.category,
      }));

    const scatterData = filtered.map(f => {
      const isUnanalyzed = !analysisResult?.computedFactors;
      const mockY = Math.min(100, Math.max(0, f.baseScore + ((f.baseScore * 7) % 30) - 15));
      return {
        x: f.baseScore,
        y: isUnanalyzed ? mockY : score(f),
        z: score(f),
        name: f.label,
        category: f.category,
      };
    });

    const catAvgs = ["environment", "health", "society", "infrastructure"].map(cat => {
      const fs = filtered.filter(f => f.category === cat);
      return fs.length ? Math.round(fs.reduce((s, f) => s + score(f), 0) / fs.length) : 0;
    });
    const temporal = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, idx) => ({
      name: month,
      Environment: Math.min(100, Math.max(0, catAvgs[0] + idx * 1.5 + (Math.random() * 6 - 3))),
      Health: Math.min(100, Math.max(0, catAvgs[1] + idx * 0.8 + (Math.random() * 6 - 3))),
      Society: Math.min(100, Math.max(0, catAvgs[2] - idx * 0.5 + (Math.random() * 6 - 3))),
      Infrastructure: Math.min(100, Math.max(0, catAvgs[3] + (Math.random() * 6 - 3))),
    }));

    const gridFactors = filtered.map(f => ({ ...f, score: score(f) }))
      .sort((a, b) => b.score - a.score);

    return { radarData, pieData, barData, scatterData, temporal, gridFactors };
  }, [displayFactors, analysisResult]);

  if (!mounted) return null;

  return (
    <div className="p-6 pb-32 w-full min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
          Analyst Command Center
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Interactive multi-dimensional risk intelligence. Charts render from baseline data immediately and update when you hit{" "}
          <strong>Analyze</strong>.
        </p>
      </div>

      {/* Query Panel */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
          <Filter className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Query Parameters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Country</label>
            <select value={country} onChange={e => { setCountry(e.target.value); setStateRegion(""); setCity(""); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">State / Region</label>
            <select value={stateRegion} onChange={e => { setStateRegion(e.target.value); setCity(""); }}
              disabled={country === "Global" || !states.length}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-40">
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">City</label>
            <select value={city} onChange={e => setCity(e.target.value)}
              disabled={!stateRegion || !cities.length}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-40">
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Risk Category</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="all">All 23 Factors</option>
              <optgroup label="── Macro Groups ──">
                <option value="environment">Environment &amp; Weather</option>
                <option value="health">Public Health &amp; Casualty</option>
                <option value="society">Societal &amp; Geopolitical</option>
                <option value="infrastructure">Infrastructure &amp; Logistics</option>
              </optgroup>
              <optgroup label="── Individual Factors ──">
                {allFactors.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              {isAnalyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><Search className="w-4 h-4" /> Analyze</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Insight Banner */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-4">
            <div className="p-2.5 bg-blue-600 rounded-full text-white shrink-0"><Lightbulb className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                Synopsis: {country}{stateRegion ? " › " + stateRegion : ""}{city ? " › " + city : ""}
              </h3>
              <p className="text-blue-800 dark:text-blue-200/80 mt-1 text-sm">{analysisResult.mlInsights}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Type Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Data Visualizations
          <span className="ml-2 text-sm font-normal text-slate-400">
            {analysisResult ? "(live data)" : "(baseline preview — click Analyze for live data)"}
          </span>
        </h2>
        <div className="flex flex-wrap bg-slate-200 dark:bg-slate-800 p-1 rounded-xl gap-1">
          {CHART_TYPES.map(ct => (
            <button key={ct.id} onClick={() => setSelectedChart(ct.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                selectedChart === ct.id
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}>
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Main chart (2/3) + Pie summary (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* PRIMARY chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 min-h-[500px]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            {CHART_TYPES.find(c => c.id === selectedChart)?.label} — Risk Analysis ({displayFactors.length} factors)
          </p>
          <ResponsiveContainer width="100%" height="90%">
            {selectedChart === "radar" ? (
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="#94a3b8" opacity={0.3} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Risk" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </RadarChart>
            ) : selectedChart === "pie" ? (
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={70} outerRadius={118} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            ) : selectedChart === "scatter" ? (
              <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis type="number" dataKey="x" name="Baseline Score" tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Baseline Score", position: "insideBottom", offset: -18, fill: "#64748b", fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Current Score" tick={{ fill: "#64748b", fontSize: 11 }}
                  label={{ value: "Current Score", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                <ZAxis type="number" dataKey="z" range={[40, 240]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any, name: any, props: any) => [`${v} — ${props?.payload?.name ?? ""}`, name]} />
                {["environment", "health", "society", "infrastructure"].map(cat => (
                  <Scatter key={cat} name={cat.charAt(0).toUpperCase() + cat.slice(1)}
                    data={scatterData.filter(d => d.category === cat)} fill={CAT_COLORS[cat]} />
                ))}
                <Legend />
              </ScatterChart>
            ) : selectedChart === "area" ? (
              <AreaChart data={temporal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {["Environment", "Health", "Society", "Infrastructure"].map((k, i) => (
                    <linearGradient key={k} id={`agrad${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={Object.values(CAT_COLORS)[i]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={Object.values(CAT_COLORS)[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" />
                {["Environment", "Health", "Society", "Infrastructure"].map((k, i) => (
                  <Area key={k} type="monotone" dataKey={k} stroke={Object.values(CAT_COLORS)[i]}
                    fill={`url(#agrad${k})`} strokeWidth={2} />
                ))}
              </AreaChart>
            ) : selectedChart === "line" ? (
              <LineChart data={temporal} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" />
                {["Environment", "Health", "Society", "Infrastructure"].map((k, i) => (
                  <Line key={k} type="monotone" dataKey={k} stroke={Object.values(CAT_COLORS)[i]}
                    strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                ))}
              </LineChart>
            ) : (
              /* BAR — default */
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 110, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={105} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                <Bar dataKey="score" name="Risk Score" radius={[0, 4, 4, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={CAT_COLORS[d.category] ?? "#6366f1"} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* SECONDARY: Pie distribution - always visible */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 min-h-[500px] flex flex-col">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Severity Distribution</p>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={RISK_COLORS[i % RISK_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[i] }} />
                  <span className="text-slate-600 dark:text-slate-400">{d.name}</span>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Radar + Line always shown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-72">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Radar — Category Averages</p>
          <ResponsiveContainer width="100%" height="90%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
              <PolarGrid stroke="#94a3b8" opacity={0.3} />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Risk" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-72">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">6-Month Temporal Projection</p>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={temporal} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" iconSize={8} />
              {["Environment", "Health", "Society", "Infrastructure"].map((k, i) => (
                <Line key={k} type="monotone" dataKey={k} stroke={Object.values(CAT_COLORS)[i]}
                  strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factor Grid */}
      <div className="mt-4 space-y-8">
        {["environment", "health", "society", "infrastructure"]
          .filter(cat => selectedCategory === "all" || selectedCategory === cat || displayFactors.some(f => f.category === cat))
          .map(cat => {
            const catFactors = gridFactors.filter(f => f.category === cat);
            if (!catFactors.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 capitalize mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: CAT_COLORS[cat] }} />
                  {cat} Vectors
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {catFactors.map((factor, idx) => (
                    <motion.div key={factor.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                          {factor.icon && <factor.icon className="w-4 h-4" />}
                        </div>
                        <span className={`text-sm font-bold ${
                          factor.score > 70 ? "text-red-600 dark:text-red-400" :
                          factor.score > 40 ? "text-amber-600 dark:text-amber-400" :
                          "text-emerald-600 dark:text-emerald-400"
                        }`}>{factor.score}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">{factor.label}</h4>
                      <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-100 dark:bg-slate-700">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${factor.score}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className={`h-full ${factor.score > 70 ? "bg-red-500" : factor.score > 40 ? "bg-amber-500" : "bg-emerald-500"}`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
