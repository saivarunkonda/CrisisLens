import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mlPipeline } from "@/lib/ml-pipeline";
import { logUserActivity } from "@/lib/database-simple";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { algorithm, features, hyperparameters } = body;

    if (!algorithm || !features) {
      return NextResponse.json({ error: "Missing required parameters: algorithm, features" }, { status: 400 });
    }

    // Validate algorithm
    const validAlgorithms = ['random_forest', 'gradient_boosting', 'neural_network'];
    if (!validAlgorithms.includes(algorithm)) {
      return NextResponse.json({ 
        error: `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}` 
      }, { status: 400 });
    }

    // Validate features
    const validFeatures = [
      'flood_risk', 'heat_risk', 'health_risk', 'supply_risk',
      'infrastructure_score', 'population_density', 'incident_frequency',
      'weather_severity', 'time_of_day', 'day_of_week'
    ];
    
    const invalidFeatures = features.filter((f: string) => !validFeatures.includes(f));
    if (invalidFeatures.length > 0) {
      return NextResponse.json({ 
        error: `Invalid features: ${invalidFeatures.join(', ')}` 
      }, { status: 400 });
    }

    // Log training initiation
    await logUserActivity({
      userId: session.user.id,
      action: 'train_ml_model',
      resourceType: 'ml_model',
      details: {
        algorithm,
        features,
        hyperparameters: hyperparameters || {},
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    });

    // Start training process
    console.log(`Starting ML training: ${algorithm} with ${features.length} features`);
    
    const trainingResult = await mlPipeline.trainModel({
      algorithm: algorithm as any,
      features,
      hyperparameters: hyperparameters || {
        n_estimators: 100,
        max_depth: 10,
        learning_rate: 0.1,
        random_state: 42
      }
    });

    return NextResponse.json({
      success: true,
      modelId: trainingResult.modelId,
      algorithm,
      features,
      hyperparameters: hyperparameters || {},
      trainingMetrics: {
        accuracy: trainingResult.accuracy,
        precision: trainingResult.precision,
        recall: trainingResult.recall,
        f1Score: trainingResult.f1Score,
        featureImportance: trainingResult.featureImportance,
        trainingTime: trainingResult.trainingTime,
        convergenceEpochs: trainingResult.convergenceEpochs,
        validationLoss: trainingResult.validationLoss
      },
      trainedAt: trainingResult.trainedAt,
      trainingDataSize: trainingResult.trainingDataSize
    });

  } catch (error) {
    console.error('Error in ML training API:', error);
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
    const modelId = searchParams.get('modelId');

    if (modelId) {
      // Get specific model info
      const modelInfo = mlPipeline.getModelInfo(modelId);
      if (!modelInfo) {
        return NextResponse.json({ error: "Model not found" }, { status: 404 });
      }

      // Evaluate model if requested
      const { searchParams } = new URL(req.url);
      if (searchParams.get('evaluate') === 'true') {
        const evaluation = await mlPipeline.evaluateModel(modelId);
        return NextResponse.json({
          model: modelInfo,
          evaluation
        });
      }

      return NextResponse.json({ model: modelInfo });
    } else {
      // Get all available models
      const modelsInfo = mlPipeline.getModelInfo();
      const trainingHistory = mlPipeline.getTrainingHistory();

      return NextResponse.json({
        models: modelsInfo,
        trainingHistory,
        totalModels: modelsInfo.totalModels
      });
    }

  } catch (error) {
    console.error('Error in ML models API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
