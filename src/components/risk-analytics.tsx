"use client";

import { useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

interface RiskChartProps {
  data: {
    risks?: Array<{
      region: string;
      overallRisk: number;
      dynamicFactors: Record<string, number>;
    }>;
  } | null;
}

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#10b981'];

export function RiskAnalytics({ data }: RiskChartProps) {
  const stats = useMemo(() => {
    if (!data?.risks?.length) return null;

    const risks = data.risks;
    const totalRegions = risks.length;
    
    // Calculate averages using the dynamic factors JSONB struct
    const avgOverall = Math.round(risks.reduce((sum, r) => sum + r.overallRisk, 0) / totalRegions);
    const avgFlood = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.flood || 0), 0) / totalRegions);
    const avgHeat = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.extreme_heat || 0), 0) / totalRegions);
    const avgHealth = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.health || 0), 0) / totalRegions);
    const avgSupply = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.supply_chain || 0), 0) / totalRegions);
    const avgCrime = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.violent_crime || 0), 0) / totalRegions);
    const avgCyber = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.cyber_attack || 0), 0) / totalRegions);
    const avgTraffic = Math.round(risks.reduce((sum, r) => sum + (r.dynamicFactors.traffic || 0), 0) / totalRegions);

    const highestRisk = risks.reduce((max, r) => r.overallRisk > max.overallRisk ? r : max, risks[0]);
    
    const critical = risks.filter(r => r.overallRisk >= 80).length;
    const high = risks.filter(r => r.overallRisk >= 60 && r.overallRisk < 80).length;
    const medium = risks.filter(r => r.overallRisk >= 40 && r.overallRisk < 60).length;
    const low = risks.filter(r => r.overallRisk < 40).length;

    // Format for Recharts
    const pieData = [
      { name: 'Critical (>80)', value: critical },
      { name: 'High (60-79)', value: high },
      { name: 'Medium (40-59)', value: medium },
      { name: 'Low (<40)', value: low },
    ].filter(d => d.value > 0);

    const barData = [
      { name: 'Flood', score: avgFlood },
      { name: 'Heat', score: avgHeat },
      { name: 'Health', score: avgHealth },
      { name: 'Supply', score: avgSupply },
      { name: 'Crime', score: avgCrime },
      { name: 'Cyber', score: avgCyber },
      { name: 'Traffic', score: avgTraffic }
    ];

    return {
      avgOverall, highestRisk, totalRegions, pieData, barData
    };
  }, [data]);

  if (!stats) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">No data available for analytics</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
        Advanced Risk Diagnostics
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Volumetric analysis and category breakdowns across all {stats.totalRegions} monitored regions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pie Chart Representation */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 h-80 flex flex-col items-center">
          <h3 className="w-full text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2 text-center">
            Global Incident Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={stats.pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {stats.pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                 itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart Representation */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 h-80 flex flex-col items-center">
          <h3 className="w-full text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2 text-center">
            Aggregate Category Vectors
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                 cursor={{fill: 'transparent'}}
                 contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
              />
              <Bar dataKey="score" name="Average Risk %" radius={[4, 4, 0, 0]}>
                {stats.barData.map((entry, index) => {
                   const color = entry.score >= 60 ? '#ef4444' : entry.score >= 40 ? '#f59e0b' : '#3b82f6';
                   return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      <div className="mt-8 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <div>
          <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium tracking-wide">SYSTEM DIAGNOSTIC</p>
          <p className="text-indigo-900 dark:text-indigo-200 font-bold mt-1">Average Aggregate Threat Level: {stats.avgOverall}%</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium tracking-wide">HIGHEST VOLATILITY REGION</p>
          <p className="text-indigo-900 dark:text-indigo-200 font-bold mt-1 text-red-600 dark:text-red-400">{stats.highestRisk.region} ({stats.highestRisk.overallRisk}%)</p>
        </div>
      </div>
    </div>
  );
}
