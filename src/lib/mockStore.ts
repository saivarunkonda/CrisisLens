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

const baseRisk: Omit<RegionRisk, "overallRisk" | "recommendation">[] = [
  { region: "North District", floodRisk: 36, heatRisk: 52, healthRisk: 41, supplyRisk: 28 },
  { region: "Central District", floodRisk: 28, heatRisk: 63, healthRisk: 49, supplyRisk: 37 },
  { region: "South District", floodRisk: 61, heatRisk: 45, healthRisk: 38, supplyRisk: 32 },
  { region: "East District", floodRisk: 44, heatRisk: 59, healthRisk: 51, supplyRisk: 42 },
];

const reports: IncidentReport[] = [];

function reportBoost(region: string, category: IncidentReport["category"]) {
  return reports
    .filter((r) => r.region === region && r.category === category)
    .reduce((sum, report) => sum + report.severity * 2.5, 0);
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

export function getRegionDimensions(): RegionDimensions[] {
  return baseRisk.map((row) => ({
    region: row.region,
    floodRisk: clamp(row.floodRisk + reportBoost(row.region, "flood")),
    heatRisk: clamp(row.heatRisk + reportBoost(row.region, "heat")),
    healthRisk: clamp(row.healthRisk + reportBoost(row.region, "health")),
    supplyRisk: clamp(row.supplyRisk + reportBoost(row.region, "supply")),
  }));
}

/** Legacy sync snapshot: simple average (no ML). Prefer GET /api/risk for ML inference. */
export function getRiskSnapshot(): RegionRisk[] {
  return getRegionDimensions().map((d) => {
    const overallRisk = clamp(
      (d.floodRisk + d.heatRisk + d.healthRisk + d.supplyRisk) / 4
    );
    return {
      ...d,
      overallRisk,
      recommendation: recommendationFor(overallRisk),
    };
  });
}

export function getReports() {
  return reports;
}

export function addReport(input: Omit<IncidentReport, "id" | "createdAt">) {
  const report: IncidentReport = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  reports.unshift(report);
  return report;
}
