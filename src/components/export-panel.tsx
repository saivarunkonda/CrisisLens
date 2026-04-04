"use client";

import { useState } from "react";
import type { Role } from "@/lib/rbac";

interface ExportPanelProps {
  data: {
    risks?: Array<{
      region: string;
      overallRisk: number;
      floodRisk: number;
      heatRisk: number;
      healthRisk: number;
      supplyRisk: number;
      recommendation: string;
    }>;
    summary?: {
      regions: number;
      reports: number;
      highRiskRegions: number;
    };
  } | null;
  userRole: Role;
}

export function ExportPanel({ data, userRole }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const canExport = userRole === "admin" || userRole === "analyst";

  const exportToCSV = () => {
    if (!data?.risks?.length) {
      setMessage("No data to export");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setExporting(true);

    // Create CSV content
    const headers = [
      "Region",
      "Overall Risk",
      "Flood Risk",
      "Heat Risk",
      "Health Risk",
      "Supply Risk",
      "Recommendation",
    ];

    const rows = data.risks.map((risk) => [
      risk.region,
      risk.overallRisk,
      risk.floodRisk,
      risk.heatRisk,
      risk.healthRisk,
      risk.supplyRisk,
      risk.recommendation,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `crisislens-risk-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);
    setMessage("CSV exported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const exportToJSON = () => {
    if (!data) {
      setMessage("No data to export");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setExporting(true);

    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: data.summary,
      risks: data.risks,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `crisislens-data-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExporting(false);
    setMessage("JSON exported successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  const printReport = () => {
    window.print();
  };

  if (!canExport) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Export functionality requires Analyst or Admin role.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Export Data</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Download risk reports and analytics
          </p>
        </div>
        {message && (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {message}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={exportToCSV}
          disabled={exporting || !data?.risks?.length}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>

        <button
          onClick={exportToJSON}
          disabled={exporting || !data}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Export JSON
        </button>

        <button
          onClick={printReport}
          className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {!data?.risks?.length && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          No risk data available to export. Load the dashboard first.
        </p>
      )}
    </div>
  );
}
