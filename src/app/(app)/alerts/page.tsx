"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, CheckCircle, Bell, RefreshCw, X, Globe, Clock, TrendingUp, Filter } from "lucide-react";

type AlertSeverity = "critical" | "high" | "medium" | "low";

interface Alert {
  id: string;
  region: string;
  country: string;
  category: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  triggeredAt: string;
  acknowledged: boolean;
  riskScore: number;
}

const MOCK_ALERTS: Alert[] = [
  { id: "a1", region: "South Asia", country: "Bangladesh", category: "flood", severity: "critical", title: "Catastrophic Flood Risk Detected", description: "Water levels in Brahmaputra river have exceeded 94th percentile in last 6 hours. Immediate evacuation recommended for low-lying districts.", triggeredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), acknowledged: false, riskScore: 96 },
  { id: "a2", region: "Middle East", country: "Yemen", category: "war_conflict", severity: "critical", title: "Armed Conflict Escalation", description: "Satellite intelligence shows armed troop movements in 3 provinces. Casualty reports now exceeding 340 over 48 hours.", triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), acknowledged: false, riskScore: 91 },
  { id: "a3", region: "Sub-Saharan Africa", country: "Nigeria", category: "food_scarcity", severity: "high", title: "Food Supply Disruption", description: "Maize and sorghum reserves in northern states have dropped below 15-day buffer. Aid convoy routes blocked.", triggeredAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(), acknowledged: false, riskScore: 78 },
  { id: "a4", region: "Southeast Asia", country: "Philippines", category: "hurricane", severity: "high", title: "Typhoon Landfall Imminent", description: "Category 4 typhoon approaching Luzon coastline. Projected to make landfall within 18 hours. Wind speeds 210km/h.", triggeredAt: new Date(Date.now() - 1.2 * 60 * 60 * 1000).toISOString(), acknowledged: true, riskScore: 82 },
  { id: "a5", region: "Central Europe", country: "Germany", category: "cyber_attack", severity: "high", title: "Critical Infrastructure Cyber Breach", description: "Repeated intrusion attempts detected across energy grid SCADA systems — likely state-sponsored actor.", triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), acknowledged: false, riskScore: 74 },
  { id: "a6", region: "South America", country: "Brazil", category: "extreme_heat", severity: "medium", title: "Record Heat Anomaly", description: "Temperatures in Amazon basin exceeding 46°C — 3.2°C above 30-year mean. Dehydration risk elevated for field workers.", triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), acknowledged: true, riskScore: 61 },
  { id: "a7", region: "East Africa", country: "Somalia", category: "political_unrest", severity: "high", title: "Political Stability Warning", description: "Government coalition breakdown imminent. Protest activity spiking in Mogadishu CBD. Emergency assembly enacted.", triggeredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), acknowledged: false, riskScore: 69 },
  { id: "a8", region: "South Asia", country: "India", category: "pollution", severity: "medium", title: "AQI Hazardous Level Threshold", description: "Delhi AQI breached 475 (Hazardous) for the 3rd consecutive day. Particulate matter PM2.5 reaching toxic concentrations.", triggeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), acknowledged: false, riskScore: 55 },
];

const severityConfig: Record<AlertSeverity, { color: string; bg: string; border: string; icon: any; label: string }> = {
  critical: { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", icon: AlertCircle, label: "CRITICAL" },
  high: { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", icon: AlertTriangle, label: "HIGH" },
  medium: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", icon: Bell, label: "MEDIUM" },
  low: { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", icon: CheckCircle, label: "LOW" },
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<"all" | AlertSeverity>("all");
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const totalCritical = alerts.filter(a => a.severity === "critical" && !a.acknowledged).length;
  const totalHigh = alerts.filter(a => a.severity === "high" && !a.acknowledged).length;
  const totalUnacked = alerts.filter(a => !a.acknowledged).length;

  const displayed = alerts.filter(a =>
    (filter === "all" || a.severity === filter) &&
    (showAcknowledged ? true : !a.acknowledged)
  );

  const acknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const acknowledgeAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
  };

  const refresh = () => {
    setLastRefreshed(new Date());
  };

  return (
    <div className="p-6 w-full min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <div className="relative">
              <Bell className="w-8 h-8 text-red-500" />
              {totalUnacked > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {totalUnacked}
                </span>
              )}
            </div>
            Global Alert Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Real-time alerts triggered by risk threshold breaches across 20+ crisis vectors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Refreshed {timeAgo(lastRefreshed.toISOString())}
          </span>
          <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {totalUnacked > 0 && (
            <button onClick={acknowledgeAll} className="flex items-center gap-2 px-3 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-all">
              <CheckCircle className="w-4 h-4" /> Acknowledge All
            </button>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Unacknowledged", value: totalUnacked, color: "text-slate-700 dark:text-slate-200", bg: "bg-white dark:bg-slate-800" },
          { label: "Critical", value: totalCritical, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: "High Priority", value: totalHigh, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "Total Active", value: alerts.filter(a => !a.acknowledged).length, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm ${card.bg}`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {(["all", "critical", "high", "medium", "low"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              filter === f
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
        <label className="ml-4 flex items-center gap-2 cursor-pointer text-sm text-slate-500 dark:text-slate-400">
          <input type="checkbox" checked={showAcknowledged} onChange={e => setShowAcknowledged(e.target.checked)} className="rounded" />
          Show acknowledged
        </label>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayed.map((alert, idx) => {
            const cfg = severityConfig[alert.severity];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ delay: idx * 0.04 }}
                className={`relative rounded-xl border p-5 shadow-sm ${cfg.bg} ${cfg.border} ${alert.acknowledged ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-lg bg-white dark:bg-slate-800 ${cfg.color} shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-bold tracking-widest ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {alert.country} · {alert.region}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(alert.triggeredAt)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">{alert.category.replace("_", " ")}</span>
                      </div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{alert.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`w-3 h-3 ${cfg.color}`} />
                      <span className={`text-lg font-bold ${cfg.color}`}>{alert.riskScore}</span>
                    </div>
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledge(alert.id)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                      >
                        <CheckCircle className="w-3 h-3" /> Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {displayed.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <p className="font-semibold">All clear — no alerts match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
