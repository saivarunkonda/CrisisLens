/**
 * Calls the CrisisLens FastAPI service POST /predict.
 * Set ML_SERVICE_URL (e.g. http://localhost:8000 or http://crisislens-ml:8000).
 */

const ML_TIMEOUT_MS = 5000;

/** Same weighting as ml-service/app.py */
export function localWeightedOverall(
  floodRisk: number,
  heatRisk: number,
  healthRisk: number,
  supplyRisk: number
): number {
  const score =
    floodRisk * 0.3 + heatRisk * 0.25 + healthRisk * 0.25 + supplyRisk * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export type PredictResult = {
  overallRisk: number;
  source: "ml" | "fallback";
};

export async function predictOverallRisk(
  floodRisk: number,
  heatRisk: number,
  healthRisk: number,
  supplyRisk: number
): Promise<PredictResult> {
  const baseUrl = process.env.ML_SERVICE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    return {
      overallRisk: localWeightedOverall(floodRisk, heatRisk, healthRisk, supplyRisk),
      source: "fallback",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flood_risk: floodRisk,
        heat_risk: heatRisk,
        health_risk: healthRisk,
        supply_risk: supplyRisk,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        overallRisk: localWeightedOverall(floodRisk, heatRisk, healthRisk, supplyRisk),
        source: "fallback",
      };
    }

    const data = (await res.json()) as { overall_risk?: number };
    const raw = data.overall_risk;
    if (typeof raw !== "number" || Number.isNaN(raw)) {
      return {
        overallRisk: localWeightedOverall(floodRisk, heatRisk, healthRisk, supplyRisk),
        source: "fallback",
      };
    }

    return {
      overallRisk: Math.max(0, Math.min(100, Math.round(raw))),
      source: "ml",
    };
  } catch {
    return {
      overallRisk: localWeightedOverall(floodRisk, heatRisk, healthRisk, supplyRisk),
      source: "fallback",
    };
  } finally {
    clearTimeout(timer);
  }
}
