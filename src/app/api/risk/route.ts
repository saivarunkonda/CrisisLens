import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  getRegions, 
  getRiskAssessments, 
  createRiskAssessment, 
  getIncidentReports,
  calculateRiskLevel,
  generateRecommendation
} from "@/lib/database-simple";
import { mlPipeline } from "@/lib/ml-pipeline";
import { predictOverallRisk } from "@/lib/mlClient";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get regions (apply optional limit to prevent initial overload)
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    let regions = await getRegions();
    if (limit && limit > 0) {
      // Sort regions by some heuristic or just slice if we want top priority
      // Here we just slice the array directly to avoid O(N) downstream loops on heavy pages
      regions = regions.slice(0, limit);
    }
    
    const latestAssessments = await getRiskAssessments();
    
    // Get incident reports for additional context
    const reports = await getIncidentReports({ limit: 50 });

    // Create region risk data
    const regionRisks = await Promise.all(regions.map(async (region: any) => {
      // Find latest assessment for this region
      const latestAssessment = (latestAssessments as any[])
        .filter((assessment: any) => assessment.region_id === region.id)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      // Get recent reports for this region
      const regionReports = (reports as any[]).filter((report: any) => report.region_id === region.id);

      // Calculate unified 23-dimensional dynamic metrics across region history
      const dynamicFactors: Record<string, number> = {};
      const matrixKeys = [
        "flood", "extreme_heat", "rain_storm", "earthquake", "hurricane",
        "health", "pollution", "food_scarcity", "water_scarcity", "pandemic", "fatalities",
        "political_unrest", "war_conflict", "economic_crash", "security", "violent_crime", "property_crime", "cyber_attack",
        "supply_chain", "traffic", "power_outage", "network_outage", "fuel_shortage"
      ];

      matrixKeys.forEach(key => {
         const reports = regionReports.filter((r: any) => r.category === key);
         const intensityImpact = reports.reduce((sum: number, r: any) => sum + (r.severity * 4.5), 0);
         dynamicFactors[key] = Math.min(100, Math.max(0, 15 + intensityImpact + (region.population > 500000 ? 5 : 0)));
      });

      // Use ML service for prediction if available, otherwise use latest assessment
      let overallRisk: number;
      let source: 'ml' | 'database' | 'fallback';
      
      if (latestAssessment && new Date(latestAssessment.valid_until || 0) > new Date()) {
        // Use valid database assessment natively resolving JSONB structure
        overallRisk = latestAssessment.overall_risk;
        source = 'database';
      } else {
        // Use real ML pipeline prediction against the robust 20D matrix
        try {
          // Instead of hardcoded properties, pass the entire flattened dynamic properties to PyTorch
          const mlPrediction = await mlPipeline.predict(dynamicFactors as any, 'risk_prediction_v1');
          overallRisk = mlPrediction.overallRisk;
          source = 'ml';
          
          // Save new deeply-unified assessment to database (now supports standard JSONB payload)
          await createRiskAssessment({
            regionId: region.id,
            overallRisk,
            confidenceScore: mlPrediction.confidence,
            riskLevel: calculateRiskLevel(overallRisk),
            modelVersion: mlPrediction.modelVersion,
            dynamicFactors,
            features: {
              ...dynamicFactors,
              infrastructureScore: region.infrastructure_score,
              ml_feature_importance: mlPrediction.featureImportance,
              prediction_confidence: mlPrediction.confidence
            },
            featureImportance: mlPrediction.featureImportance
          });
        } catch (mlError) {
          console.warn('ML pipeline failed, using fallback heuristic algorithms:', mlError);
          const compositeRawScore = (dynamicFactors.flood + dynamicFactors.extreme_heat + dynamicFactors.health + dynamicFactors.supply_chain) / 4;
          overallRisk = Math.min(100, Math.round(compositeRawScore));
          source = 'fallback';
        }
      }

      return {
        region: region.name,
        regionId: region.id,
        dynamicFactors,
        // Legacy compat fields expected by RegionRisk type
        floodRisk: dynamicFactors.flood ?? 0,
        heatRisk: dynamicFactors.extreme_heat ?? 0,
        healthRisk: dynamicFactors.health ?? 0,
        supplyRisk: dynamicFactors.supply_chain ?? 0,
        overallRisk,
        riskLevel: calculateRiskLevel(overallRisk),
        recommendation: generateRecommendation(calculateRiskLevel(overallRisk)),
        inferenceSource: source,
        lastUpdated: latestAssessment?.created_at || new Date().toISOString(),
        recentReports: regionReports.length,
        population: region.population,
        infrastructureScore: region.infrastructure_score
      };
    }));

    // Calculate summary statistics
    const summary = {
      regions: regions.length,
      reports: reports.length,
      highRiskRegions: regionRisks.filter(r => r.overallRisk >= 60).length,
      criticalRegions: regionRisks.filter(r => r.overallRisk >= 80).length,
      totalPopulation: (regions as any[]).reduce((sum, r) => sum + r.population, 0),
      averageInfrastructureScore: (regions as any[]).reduce((sum, r) => sum + r.infrastructure_score, 0) / regions.length
    };

    // ML service status
    const mlServiceStatus = {
      serviceConfigured: Boolean(process.env.ML_SERVICE_URL),
      regionsFromMlService: regionRisks.filter(r => r.inferenceSource === 'ml').length,
      regionsFromDatabase: regionRisks.filter(r => r.inferenceSource === 'database').length,
      regionsFromFallback: regionRisks.filter(r => r.inferenceSource === 'fallback').length
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      ml: mlServiceStatus,
      summary,
      risks: regionRisks
    });

  } catch (error) {
    console.error('Error in risk API:', error);
    console.error('Error type:', typeof error);
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : JSON.stringify(error, null, 2);
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { error: 'Internal server error', details: typeof errorDetails === 'string' ? errorDetails : errorDetails.message }, 
      { status: 500 }
    );
  }
}

// Helper functions to calculate base risks
function calculateBaseFloodRisk(region: any, reports: any[]): number {
  const floodReports = reports.filter(r => r.category === 'flood');
  const baseRisk = region.infrastructure_score < 0.5 ? 30 : 15;
  const reportImpact = floodReports.reduce((sum, report) => sum + (report.severity * 5), 0);
  return Math.min(100, Math.max(0, baseRisk + reportImpact));
}

function calculateBaseHeatRisk(region: any, reports: any[]): number {
  const heatReports = reports.filter(r => r.category === 'heat');
  const baseRisk = 25; // Base heat risk
  const reportImpact = heatReports.reduce((sum, report) => sum + (report.severity * 4), 0);
  return Math.min(100, Math.max(0, baseRisk + reportImpact));
}

function calculateBaseHealthRisk(region: any, reports: any[]): number {
  const healthReports = reports.filter(r => r.category === 'health');
  const populationFactor = region.population > 200000 ? 20 : 10;
  const reportImpact = healthReports.reduce((sum, report) => sum + (report.severity * 3), 0);
  return Math.min(100, Math.max(0, populationFactor + reportImpact));
}

function calculateBaseSupplyRisk(region: any, reports: any[]): number {
  const supplyReports = reports.filter(r => r.category === 'supply');
  const infrastructureFactor = (1 - region.infrastructure_score) * 30;
  const reportImpact = supplyReports.reduce((sum, report) => sum + (report.severity * 4), 0);
  return Math.min(100, Math.max(0, infrastructureFactor + reportImpact));
}

function calculateBaseSecurityRisk(region: any, reports: any[]): number {
  const securityReports = reports.filter(r => r.category === 'security');
  const populationFactor = region.population > 250000 ? 15 : 5;
  const reportImpact = securityReports.reduce((sum, report) => sum + (report.severity * 6), 0);
  return Math.min(100, Math.max(0, populationFactor + reportImpact));
}
