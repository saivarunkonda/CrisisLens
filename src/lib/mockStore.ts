export type RegionRisk = {
  region: string;
  floodRisk: number;
  heatRisk: number;
  healthRisk: number;
  supplyRisk: number;
  overallRisk: number;
  recommendation: string;
};

export type IncidentReport = {
  id: string;
  region: string;
  category: "flood" | "heat" | "health" | "supply";
  severity: number;
  note: string;
  createdAt: string;
};


import { getCollection } from "./mongo";
import { supabase } from "./supabase";

// Attempt to replicate a report to Mongo `raw_reports`. On failure, write to `replication_queue` for later retry.
async function replicateToMongo(report: any, rawPayload?: any) {
  try {
    const col = await getCollection('raw_reports')
    const doc = { ...report, created_at: report.createdAt ?? report.created_at ?? new Date().toISOString(), raw_payload: rawPayload || null, replicated_at: new Date() }
    await col.insertOne(doc)
    return true
  } catch (err) {
    try {
      const q = await getCollection('replication_queue')
      await q.insertOne({ report, rawPayload, error: String(err), queued_at: new Date() })
    } catch (e) {
      // last resort: log to console
      console.error('replication failed and queue insert failed', e)
    }
    return false
  }
}

const baseRisk: Omit<RegionRisk, "overallRisk" | "recommendation">[] = [
  { region: "North District", floodRisk: 36, heatRisk: 52, healthRisk: 41, supplyRisk: 28 },
  { region: "Central District", floodRisk: 28, heatRisk: 63, healthRisk: 49, supplyRisk: 37 },
  { region: "South District", floodRisk: 61, heatRisk: 45, healthRisk: 38, supplyRisk: 32 },
  { region: "East District", floodRisk: 44, heatRisk: 59, healthRisk: 51, supplyRisk: 42 },
];


// Switch between MongoDB and Supabase
const DB_BACKEND = (process.env.DB_BACKEND || "mongodb").replace(/"/g, ""); // "mongodb" or "supabase"

// Supabase helpers (note: Supabase/Postgres uses snake_case columns; map to camelCase)
async function supabaseFetchReports(): Promise<IncidentReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  // normalize created_at -> createdAt for app types
  return (data as any[]).map((r) => ({
    id: r.id,
    region: r.region,
    category: r.category,
    severity: r.severity,
    note: r.note,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
  }));
}

async function supabaseInsertReport(input: Omit<IncidentReport, "id" | "createdAt">): Promise<IncidentReport> {
  const report: IncidentReport = {
    id: (globalThis.crypto && (globalThis.crypto as any).randomUUID) ? (globalThis.crypto as any).randomUUID() : Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const dbRecord = {
    id: report.id,
    region: report.region,
    category: report.category,
    severity: report.severity,
    note: report.note,
    created_at: report.createdAt,
  };
  try {
    await supabase.from('reports').insert([dbRecord]);
    // best-effort replicate to Mongo for ML/raw storage
    replicateToMongo(report, input).catch(() => {})
  } catch (e) {
    // ignore insert errors, fall back to returning the report
  }
  return report;
}

async function supabaseReportBoost(region: string, category: IncidentReport["category"]): Promise<number> {
  const reports = await supabaseFetchReports();
  return reports
    .filter((r) => r.region === region && r.category === category)
    .reduce((sum, report) => sum + report.severity * 2.5, 0);
}

// MongoDB helpers (as before)
async function fetchReports(): Promise<IncidentReport[]> {
  try {
    const col = await getCollection<IncidentReport>("reports");
    return await col.find({}).sort({ createdAt: -1 }).toArray();
  } catch {
    return [];
  }
}

async function insertReport(input: Omit<IncidentReport, "id" | "createdAt">): Promise<IncidentReport> {
  const report: IncidentReport = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  try {
    const col = await getCollection<IncidentReport>("reports");
    await col.insertOne(report);
    // also write a raw copy for ML ingestion
    replicateToMongo(report, input).catch(() => {})
  } catch {
    // fallback: do nothing
  }
  return report;
}

async function reportBoost(region: string, category: IncidentReport["category"]): Promise<number> {
  const reports = await fetchReports();
  return reports
    .filter((r) => r.region === region && r.category === category)
    .reduce((sum, report) => sum + report.severity * 2.5, 0);
}
export async function getRegionDimensions(): Promise<RegionDimensions[]> {
  if (DB_BACKEND === "supabase") {
    return Promise.all(
      baseRisk.map(async (row) => ({
        region: row.region,
        floodRisk: clamp(row.floodRisk + (await supabaseReportBoost(row.region, "flood"))),
        heatRisk: clamp(row.heatRisk + (await supabaseReportBoost(row.region, "heat"))),
        healthRisk: clamp(row.healthRisk + (await supabaseReportBoost(row.region, "health"))),
        supplyRisk: clamp(row.supplyRisk + (await supabaseReportBoost(row.region, "supply"))),
      }))
    );
  }
  return Promise.all(
    baseRisk.map(async (row) => ({
      region: row.region,
      floodRisk: clamp(row.floodRisk + (await reportBoost(row.region, "flood"))),
      heatRisk: clamp(row.heatRisk + (await reportBoost(row.region, "heat"))),
      healthRisk: clamp(row.healthRisk + (await reportBoost(row.region, "health"))),
      supplyRisk: clamp(row.supplyRisk + (await reportBoost(row.region, "supply"))),
    }))
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function recommendationFor(overallRisk: number) {
  if (overallRisk >= 75) return "Open emergency response cell and prioritize supplies.";
  if (overallRisk >= 60) return "Deploy targeted field checks and pre-position resources.";
  if (overallRisk >= 45) return "Send public advisory and monitor trend every 6 hours.";
  return "Maintain routine monitoring and encourage community reporting.";
}


/** Per-region dimension scores (reports applied). Overall is filled by ML API or fallback. */
export type RegionDimensions = {
  region: string;
  floodRisk: number;
  heatRisk: number;
  healthRisk: number;
  supplyRisk: number;
};


export async function getReports() {
  if (DB_BACKEND === "supabase") {
    return await supabaseFetchReports();
  } else {
    return await fetchReports();
  }
}

export async function addReport(input: Omit<IncidentReport, "id" | "createdAt">) {
  if (DB_BACKEND === "supabase") {
    return await supabaseInsertReport(input);
  } else {
    return await insertReport(input);
  }
}
