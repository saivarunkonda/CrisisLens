"use client";

import { useMemo } from "react";

interface RiskChartProps {
  data: {
    risks?: Array<{
      region: string;
      overallRisk: number;
      floodRisk: number;
      heatRisk: number;
      healthRisk: number;
      supplyRisk: number;
    }>;
  } | null;
}

export function RiskAnalytics({ data }: RiskChartProps) {
  const stats = useMemo(() => {
    if (!data?.risks?.length) return null;

    const risks = data.risks;
    const totalRegions = risks.length;
    
    // Calculate averages
    const avgOverall = Math.round(risks.reduce((sum, r) => sum + r.overallRisk, 0) / totalRegions);
    const avgFlood = Math.round(risks.reduce((sum, r) => sum + r.floodRisk, 0) / totalRegions);
    const avgHeat = Math.round(risks.reduce((sum, r) => sum + r.heatRisk, 0) / totalRegions);
    const avgHealth = Math.round(risks.reduce((sum, r) => sum + r.healthRisk, 0) / totalRegions);
    const avgSupply = Math.round(risks.reduce((sum, r) => sum + r.supplyRisk, 0) / totalRegions);

    // Find highest risk region
    const highestRisk = risks.reduce((max, r) => r.overallRisk > max.overallRisk ? r : max, risks[0]);
    
    // Count risk levels
    const critical = risks.filter(r => r.overallRisk >= 80).length;
    const high = risks.filter(r => r.overallRisk >= 60 && r.overallRisk < 80).length;
    const medium = risks.filter(r => r.overallRisk >= 40 && r.overallRisk < 60).length;
    const low = risks.filter(r => r.overallRisk < 40).length;

    return {
      avgOverall,
      avgFlood,
      avgHeat,
      avgHealth,
      avgSupply,
      highestRisk,
      critical,
      high,
      medium,
      low,
      totalRegions,
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">No data available for analytics</p>
      </div>
    );
  }

  const getBarColor = (value: number) => {
    if (value >= 80) return "bg-red-500";
    if (value >= 60) return "bg-amber-500";
    if (value >= 40) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        Risk Analytics & Trends
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Overview of crisis risk across all monitored regions
      </p>

      {/* Summary Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Average Overall Risk</p>
          <p className={`mt-1 text-2xl font-bold ${stats.avgOverall >= 60 ? 'text-red-600' : stats.avgOverall >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {stats.avgOverall}%
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Highest Risk Region</p>
          <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
            {stats.highestRisk.region}
          </p>
          <p className="text-xs text-red-600">{stats.highestRisk.overallRisk}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Critical Regions</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.critical}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">Low Risk Regions</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.low}</p>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
          Risk Level Distribution
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs text-slate-500">Critical</span>
            <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-4 rounded-full bg-red-500 transition-all"
                style={{ width: `${(stats.critical / stats.totalRegions) * 100}%` }}
              />
            </div>
            <span className="w-8 text-xs font-medium">{stats.critical}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs text-slate-500">High</span>
            <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-4 rounded-full bg-amber-500 transition-all"
                style={{ width: `${(stats.high / stats.totalRegions) * 100}%` }}
              />
            </div>
            <span className="w-8 text-xs font-medium">{stats.high}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs text-slate-500">Medium</span>
            <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-4 rounded-full bg-yellow-400 transition-all"
                style={{ width: `${(stats.medium / stats.totalRegions) * 100}%` }}
              />
            </div>
            <span className="w-8 text-xs font-medium">{stats.medium}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-xs text-slate-500">Low</span>
            <div className="flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-4 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(stats.low / stats.totalRegions) * 100}%` }}
              />
            </div>
            <span className="w-8 text-xs font-medium">{stats.low}</span>
          </div>
        </div>
      </div>

      {/* Risk Type Breakdown */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-medium text-slate-900 dark:text-slate-100">
          Average Risk by Type
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Flood", value: stats.avgFlood, color: "bg-blue-500" },
            { label: "Heat", value: stats.avgHeat, color: "bg-orange-500" },
            { label: "Health", value: stats.avgHealth, color: "bg-rose-500" },
            { label: "Supply", value: stats.avgSupply, color: "bg-amber-500" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                <span className={`text-sm font-bold ${item.value >= 60 ? 'text-red-600' : item.value >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {item.value}%
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-2 rounded-full ${item.color} transition-all`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
