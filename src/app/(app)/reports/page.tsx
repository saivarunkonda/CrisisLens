"use client";

import { useEffect, useState } from "react";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} days ago`;
}

type Report = {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: number;
  location_address?: string;
  country?: string;
  state?: string;
  city?: string;
  created_at: string;
  sources?: { reported_by?: string };
  regions?: { name?: string };
};

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/report");
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      } catch (e) {
        console.error("Failed to fetch reports:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-12 w-full">
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-8 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 drop-shadow-sm">Internal Field Reports</h1>
        <p className="text-indigo-200">Master ledger of global intelligence reports and agent transmissions.</p>
      </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800/50 rounded-xl w-full border border-slate-100 dark:border-slate-800"></div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center p-16 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            No field reports found.
          </div>
        ) : (
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 shadow-xl w-full overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left">
                <thead className="bg-indigo-600 dark:bg-indigo-900 text-white shadow-sm border-b border-indigo-700 dark:border-indigo-950">
                  <tr>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Incident Details</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider whitespace-nowrap min-w-[200px]">Risk Profile</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider">Location</th>
                    <th className="px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider text-right whitespace-nowrap">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 dark:divide-indigo-900/50 w-full">
                  {reports.map((r, idx) => (
                    <tr key={r.id} className={`hover:bg-white/60 dark:hover:bg-slate-900/40 transition duration-150 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-indigo-500/5 dark:bg-slate-800/20'}`}>
                      <td className="px-4 md:px-6 py-4 min-w-[250px]">
                        <div className="font-bold text-indigo-950 dark:text-indigo-100">{r.title}</div>
                        <div className="text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed text-xs">{r.description}</div>
                      </td>
                      <td className="px-4 md:px-6 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 w-fit shadow-sm">
                            {r.category?.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-1.5 pl-0.5">
                            {[...Array(5)].map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-2.5 w-5 rounded-[2px] transition-colors ${i < r.severity ? (r.severity >= 4 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : r.severity === 3 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-800'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 align-top text-indigo-900 dark:text-indigo-200 font-semibold">
                        {r.location_address || r.regions?.name || "Global Entity"}
                      </td>
                      <td className="px-4 md:px-6 py-4 align-top text-right whitespace-nowrap min-w-[140px]">
                        <div className="text-indigo-950 dark:text-indigo-100 font-bold">{timeAgo(r.created_at)}</div>
                        <div className="text-[11px] mt-1 text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[120px] truncate ml-auto uppercase tracking-wide font-medium" title={r.sources?.reported_by || "anonymous"}>
                          {r.sources?.reported_by || "anonymous"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}
