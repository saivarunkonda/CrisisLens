import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mlPipeline } from "@/lib/ml-pipeline";
import { createRiskAssessment, calculateRiskLevel, generateRecommendation } from "@/lib/database-simple";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { features, modelId, regionId } = body;

    if (!features || typeof features !== 'object') {
      return NextResponse.json({ error: "Features object is required" }, { status: 400 });
    }

    // Validate required features
    const requiredFeatures = ['flood_risk', 'heat_risk', 'health_risk', 'supply_risk'];
    const missingFeatures = requiredFeatures.filter(f => !(f in features));
    
    if (missingFeatures.length > 0) {
      return NextResponse.json({ 
        error: `Missing required features: ${missingFeatures.join(', ')}` 
      }, { status: 400 });
    }

    // Validate feature ranges
    for (const [feature, value] of Object.entries(features)) {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        return NextResponse.json({ 
          error: `Feature ${feature} must be a number between 0 and 100` 
        }, { status: 400 });
      }
    }

    // Make prediction
    const prediction = await mlPipeline.predict(features, modelId);

    // If regionId is provided, save the risk assessment
    let riskAssessment = null;
    if (regionId) {
      try {
        riskAssessment = await createRiskAssessment({
          regionId,
          overallRisk: prediction.overallRisk,
          confidenceScore: prediction.confidence,
          riskLevel: calculateRiskLevel(prediction.overallRisk),
          modelVersion: prediction.modelVersion,
          dynamicFactors: {
            floodRisk: features.flood_risk,
            heatRisk: features.heat_risk,
            healthRisk: features.health_risk,
            supplyRisk: features.supply_risk,
            infrastructureRisk: features.infrastructure_risk || 20,
            securityRisk: features.security_risk || 20,
          },
          features: {
            ...features,
            prediction_source: 'ml_api',
            predicted_by: session.user.email
          },
          featureImportance: prediction.featureImportance
        });
      } catch (error) {
        console.error('Error saving risk assessment:', error);
        // Continue without saving assessment
      }
    }

    return NextResponse.json({
      success: true,
      prediction: {
        overallRisk: prediction.overallRisk,
        confidence: prediction.confidence,
        riskLevel: calculateRiskLevel(prediction.overallRisk),
        recommendation: generateRecommendation(calculateRiskLevel(prediction.overallRisk)),
        featureImportance: prediction.featureImportance,
        modelVersion: prediction.modelVersion,
        predictionType: prediction.predictionType
      },
      inputFeatures: features,
      riskAssessment: riskAssessment ? {
        id: (riskAssessment as any).id,
        createdAt: (riskAssessment as any).created_at
      } : null,
      predictedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in ML prediction API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'detect_anomalies') {
      const { features, historicalData } = await req.json();
      
      if (!features) {
        return NextResponse.json({ error: "Features object is required" }, { status: 400 });
      }

      const anomalyResult = await mlPipeline.detectAnomalies(
        features, 
        historicalData || []
      );

      return NextResponse.json({
        success: true,
        anomaly: anomalyResult
      });
    }

    // Get available models
    const modelsInfo = mlPipeline.getModelInfo();
    
    return NextResponse.json({
      availableModels: modelsInfo.availableModels,
      totalModels: modelsInfo.totalModels,
      supportedFeatures: [
        'flood_risk', 'heat_risk', 'health_risk', 'supply_risk',
        'infrastructure_score', 'population_density', 'incident_frequency',
        'weather_severity', 'time_of_day', 'day_of_week'
      ]
    });

  } catch (error) {
    console.error('Error in ML predict API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
