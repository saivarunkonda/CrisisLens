// Mock data store for CrisisLens development
// In production, this would be replaced with actual database operations

export interface RegionData {
  region: string;
  floodRisk: number;
  heatRisk: number;
  healthRisk: number;
  supplyRisk: number;
}

export interface Report {
  id: string;
  region: string;
  category: 'flood' | 'heat' | 'health' | 'supply';
  severity: number;
  note: string;
  createdAt: Date;
}

// Mock region data
export const mockRegions: RegionData[] = [
  {
    region: "North District",
    floodRisk: 45,
    heatRisk: 60,
    healthRisk: 30,
    supplyRisk: 25,
  },
  {
    region: "South District", 
    floodRisk: 70,
    heatRisk: 40,
    healthRisk: 55,
    supplyRisk: 35,
  },
  {
    region: "East District",
    floodRisk: 25,
    heatRisk: 75,
    healthRisk: 40,
    supplyRisk: 30,
  },
  {
    region: "West District",
    floodRisk: 55,
    heatRisk: 35,
    healthRisk: 45,
    supplyRisk: 60,
  },
  {
    region: "Central District",
    floodRisk: 40,
    heatRisk: 50,
    healthRisk: 35,
    supplyRisk: 40,
  },
];

// Mock reports storage
const mockReports: Report[] = [
  {
    id: "1",
    region: "North District",
    category: "flood",
    severity: 3,
    note: "Minor flooding in low-lying areas",
    createdAt: new Date("2026-04-03T10:00:00Z"),
  },
  {
    id: "2", 
    region: "South District",
    category: "heat",
    severity: 4,
    note: "Heat wave affecting elderly population",
    createdAt: new Date("2026-04-03T11:30:00Z"),
  },
];

export function getRegionDimensions(): RegionData[] {
  return mockRegions;
}

export function getReports(): Report[] {
  return mockReports;
}

export function addReport(report: Omit<Report, 'id' | 'createdAt'>): Report {
  const newReport: Report = {
    ...report,
    id: String(mockReports.length + 1),
    createdAt: new Date(),
  };
  mockReports.push(newReport);
  return newReport;
}

export function recommendationFor(overallRisk: number): string {
  if (overallRisk >= 80) {
    return "🚨 CRITICAL: Immediate evacuation recommended. Emergency services activated.";
  } else if (overallRisk >= 60) {
    return "⚠️ HIGH: Prepare for potential evacuation. Monitor situation closely.";
  } else if (overallRisk >= 40) {
    return "🟡 MEDIUM: Increase awareness. Prepare emergency supplies.";
  } else {
    return "✅ LOW: Normal operations. Continue routine monitoring.";
  }
}
