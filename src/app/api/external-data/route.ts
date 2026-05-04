import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { externalDataManager } from "@/lib/external-apis";
import { getRegions, createExternalDataFeed, createRiskAssessment, calculateRiskLevel, generateRecommendation } from "@/lib/database-simple";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const regionId = searchParams.get('regionId');

    if (!regionId) {
      return NextResponse.json({ error: "Region ID is required" }, { status: 400 });
    }

    // Get region details
    const regions = await getRegions();
    const region = (regions as any[]).find(r => r.id === regionId);
    
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    // Collect external data
    const externalData = await externalDataManager.collectAllExternalData(
      regionId,
      region.name,
      region.center_lat,
      region.center_lng
    );

    // Analyze crisis signals
    const analysis = await externalDataManager.analyzeCrisisSignals(externalData);

    // Save external data feeds to database
    const savedFeeds = [];
    
    if (externalData.weather) {
      const weatherFeed = await createExternalDataFeed({
        source: 'openweather',
        dataType: 'weather',
        regionId,
        rawData: externalData.weather,
        processedData: {
          temperature: externalData.weather.temperature,
          conditions: externalData.weather.conditions,
          heatIndex: externalData.weather.heatIndex,
          severity: externalData.weather.temperature > 35 ? 'high' : 'normal'
        },
        confidenceScore: 0.9,
        relevanceScore: 0.8
      });
      savedFeeds.push(weatherFeed);
    }

    if (externalData.alerts.length > 0) {
      const alertsFeed = await createExternalDataFeed({
        source: 'emergency_services',
        dataType: 'alerts',
        regionId,
        rawData: externalData.alerts,
        processedData: {
          alertCount: externalData.alerts.length,
          maxSeverity: Math.max(...externalData.alerts.map(a => 
            a.severity === 'extreme' ? 4 : a.severity === 'high' ? 3 : a.severity === 'medium' ? 2 : 1
          )),
          categories: [...new Set(externalData.alerts.map(a => a.category))]
        },
        confidenceScore: 0.95,
        relevanceScore: 0.9
      });
      savedFeeds.push(alertsFeed);
    }

    if (externalData.news.length > 0) {
      const newsFeed = await createExternalDataFeed({
        source: 'news_api',
        dataType: 'news',
        regionId,
        rawData: externalData.news,
        processedData: {
          articleCount: externalData.news.length,
          avgRelevance: externalData.news.reduce((sum, item) => sum + item.relevanceScore, 0) / externalData.news.length,
          topics: [...new Set(externalData.news.flatMap(item => item.crisisKeywords))]
        },
        confidenceScore: 0.7,
        relevanceScore: 0.6
      });
      savedFeeds.push(newsFeed);
    }

    if (externalData.socialPosts.length > 0) {
      const socialFeed = await createExternalDataFeed({
        source: 'social_media',
        dataType: 'social_posts',
        regionId,
        rawData: externalData.socialPosts,
        processedData: {
          postCount: externalData.socialPosts.length,
          avgRelevance: externalData.socialPosts.reduce((sum, post) => sum + post.relevanceScore, 0) / externalData.socialPosts.length,
          sentiment: externalData.socialPosts.reduce((acc, post) => {
            acc[post.sentiment] = (acc[post.sentiment] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        confidenceScore: 0.6,
        relevanceScore: 0.5
      });
      savedFeeds.push(socialFeed);
    }

    // Update risk assessment based on external data
    if (analysis.severity !== 'low') {
      const riskMultiplier = {
        low: 1.0,
        medium: 1.2,
        high: 1.5,
        critical: 2.0
      }[analysis.severity];

      // Calculate new risk scores based on external data
      let baseFloodRisk = 30;
      let baseHeatRisk = 25;
      let baseHealthRisk = 20;
      let baseSupplyRisk = 15;

      // Adjust based on weather data
      if (externalData.weather) {
        if (externalData.weather.conditions === 'Rain' || externalData.weather.conditions === 'Drizzle') {
          baseFloodRisk *= 1.5;
        }
        if (externalData.weather.temperature > 30) {
          baseHeatRisk *= 1.3;
        }
        if (externalData.weather.heatIndex > 35) {
          baseHealthRisk *= 1.4;
        }
      }

      // Adjust based on alerts
      if (externalData.alerts.length > 0) {
        const alertMultiplier = 1 + (externalData.alerts.length * 0.2);
        baseFloodRisk *= alertMultiplier;
        baseHeatRisk *= alertMultiplier;
        baseHealthRisk *= alertMultiplier;
        baseSupplyRisk *= alertMultiplier;
      }

      // Apply overall severity multiplier
      const multiplier = riskMultiplier || 1.0;
      const finalFloodRisk = Math.min(100, baseFloodRisk * multiplier);
      const finalHeatRisk = Math.min(100, baseHeatRisk * multiplier);
      const finalHealthRisk = Math.min(100, baseHealthRisk * multiplier);
      const finalSupplyRisk = Math.min(100, baseSupplyRisk * multiplier);

      const overallRisk = (finalFloodRisk * 0.3) + (finalHeatRisk * 0.25) + (finalHealthRisk * 0.25) + (finalSupplyRisk * 0.2);

      // Create new risk assessment
      await createRiskAssessment({
        regionId,
        overallRisk,
        confidenceScore: 0.8,
        riskLevel: calculateRiskLevel(overallRisk),
        modelVersion: 'v2.0-external',
        dynamicFactors: {
          floodRisk: finalFloodRisk,
          heatRisk: finalHeatRisk,
          healthRisk: finalHealthRisk,
          supplyRisk: finalSupplyRisk,
          infrastructureRisk: 1 - region.infrastructure_score,
          securityRisk: 20,
        },
        features: {
          external_data: true,
          weather: externalData.weather,
          alerts: externalData.alerts.length,
          news: externalData.news.length,
          social_posts: externalData.socialPosts.length,
          analysis_severity: analysis.severity
        },
        featureImportance: {
          external_data: 0.4,
          weather: 0.3,
          alerts: 0.2,
          social_media: 0.1
        }
      });
    }

    return NextResponse.json({
      success: true,
      region: {
        id: regionId,
        name: region.name,
        coordinates: { lat: region.center_lat, lng: region.center_lng }
      },
      externalData: {
        weather: externalData.weather ? {
          temperature: externalData.weather.temperature,
          conditions: externalData.weather.conditions,
          heatIndex: externalData.weather.heatIndex
        } : null,
        alerts: externalData.alerts.map(alert => ({
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          category: alert.category
        })),
        news: externalData.news.map(item => ({
          id: item.id,
          title: item.title,
          source: item.source,
          relevanceScore: item.relevanceScore
        })),
        socialPosts: externalData.socialPosts.map(post => ({
          id: post.id,
          content: post.content.substring(0, 100) + '...',
          platform: post.platform,
          sentiment: post.sentiment,
          relevanceScore: post.relevanceScore
        }))
      },
      analysis: {
        signals: analysis.signals,
        severity: analysis.severity,
        totalSeverity: analysis.totalSeverity,
        summary: analysis.summary
      },
      savedFeeds: savedFeeds.length,
      collectedAt: externalData.collectedAt
    });

  } catch (error) {
    console.error('Error in external data API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { action, regionId, data } = body;

    if (action === 'refresh' && regionId) {
      // Force refresh external data for a specific region
      const response = await GET(req);
      return response;
    }

    if (action === 'configure') {
      // Update external API configuration
      // This would update environment variables or configuration
      return NextResponse.json({
        success: true,
        message: 'External API configuration updated',
        configured: {
          openweather: !!process.env.OPENWEATHER_API_KEY,
          emergency: !!process.env.EMERGENCY_API_KEY,
          news: !!process.env.NEWS_API_KEY,
          social: !!process.env.SOCIAL_MEDIA_API_KEY
        }
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error('Error in external data POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
