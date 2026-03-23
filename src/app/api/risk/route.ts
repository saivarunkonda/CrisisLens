import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRegionDimensions, getReports, recommendationFor } from "@/lib/mockStore";
import { predictOverallRisk } from "@/lib/mlClient";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dimensions = getRegionDimensions();
  const results = await Promise.all(
    dimensions.map(async (d) => {
      const { overallRisk, source } = await predictOverallRisk(
        d.floodRisk,
        d.heatRisk,
        d.healthRisk,
        d.supplyRisk
      );
      return {
        region: d.region,
        floodRisk: d.floodRisk,
        heatRisk: d.heatRisk,
        healthRisk: d.healthRisk,
        supplyRisk: d.supplyRisk,
        overallRisk,
        recommendation: recommendationFor(overallRisk),
        inferenceSource: source,
      };
    })
  );

  const mlCount = results.filter((r) => r.inferenceSource === "ml").length;
  const risks = results.map((r) => {
    const { inferenceSource: _src, ...row } = r;
    void _src;
    return row;
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    ml: {
      serviceConfigured: Boolean(process.env.ML_SERVICE_URL),
      regionsFromMlService: mlCount,
      regionsFromFallback: results.length - mlCount,
    },
    summary: {
      regions: risks.length,
      reports: getReports().length,
      highRiskRegions: risks.filter((r) => r.overallRisk >= 60).length,
    },
    risks,
  });
}
