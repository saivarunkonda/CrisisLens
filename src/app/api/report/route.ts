import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createIncidentReport, getRegions, getIncidentReports, logUserActivity } from "@/lib/database-simple";

// Maps the 23 dynamic risk factor IDs → valid Supabase DB category enum values
const CATEGORY_MAP: Record<string, string> = {
  // Environment
  flood: "flood",
  extreme_heat: "heat",
  rain_storm: "flood",
  earthquake: "infrastructure",
  hurricane: "flood",
  // Health
  health: "health",
  pollution: "health",
  food_scarcity: "health",
  water_scarcity: "health",
  pandemic: "health",
  fatalities: "health",
  // Society
  political_unrest: "security",
  war_conflict: "security",
  economic_crash: "supply",
  security: "security",
  violent_crime: "security",
  property_crime: "security",
  cyber_attack: "security",
  // Infrastructure
  supply_chain: "supply",
  traffic: "infrastructure",
  power_outage: "infrastructure",
  network_outage: "infrastructure",
  fuel_shortage: "supply",
};

type ReportBody = {
  regionId?: string;
  category?: string; // Accepts all 23 dynamic factor IDs
  severity?: number;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  country?: string;
  state?: string;
  city?: string;
  images?: string[];
  sources?: Record<string, any>;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role === "viewer") {
      return NextResponse.json({ error: "Forbidden — viewers cannot submit reports" }, { status: 403 });
    }

    const body = (await req.json()) as ReportBody;
    
    // Validate required fields (regionId is optional — auto-assigned)
    if (!body.category || !body.severity || !body.description) {
      return NextResponse.json({ error: "Missing required fields: category, severity, description" }, { status: 400 });
    }
    
    if (body.severity < 1 || body.severity > 5) {
      return NextResponse.json({ error: "Severity must be between 1 and 5." }, { status: 400 });
    }

    // Generate embedding for RAG if description exists
    let embedding: number[] | undefined = undefined;
    const mlServiceUrl = process.env.ML_SERVICE_URL?.replace(/\/$/, "");
    if (mlServiceUrl && body.description) {
      try {
        const embRes = await fetch(`${mlServiceUrl}/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: body.description }),
        });
        if (embRes.ok) {
          const { embedding: emb } = await embRes.json();
          embedding = emb;
        }
      } catch (embError) {
        console.error("Failed to generate embedding:", embError);
      }
    }

    const rawCategory = body.category ?? "flood";
    const dbCategory = CATEGORY_MAP[rawCategory] ?? "security";
    const prettyCategory = rawCategory.replace(/_/g, " ");
    const locationLabel = [body.city, body.state, body.country].filter(Boolean).join(", ") || "unknown location";
    const reportTitle = body.title ?? `${prettyCategory} incident in ${locationLabel}`;

    // Auto-assign region — look up by name/id if provided, else use first available
    let regionId: string | null = null;
    try {
      const regions = await getRegions();
      const matched = body.regionId
        ? regions.find((r: any) => r.name === body.regionId || r.id === body.regionId)
        : null;
      regionId = (matched ?? regions[0])?.id ?? null;
    } catch (regionErr) {
      console.warn("Could not fetch regions, proceeding without region_id:", regionErr);
    }

    // Create the incident report with normalized DB category
    const report = await createIncidentReport({
      regionId: regionId as string,
      category: dbCategory,
      severity: body.severity,
      title: reportTitle,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      locationAddress: body.locationAddress,
      country: body.country,
      state: body.state,
      city: body.city,
      images: body.images,
      embedding,
      sources: body.sources ?? {
        reported_by: session.user.email,
        user_role: session.user.role,
        original_category: rawCategory,
        submission_method: "web_dashboard",
      },
    });

    // Log user activity (non-blocking - don't fail if this errors)
    try {
      if (session.user.id) {
        await logUserActivity({
          userId: session.user.id,
          action: 'submit_report',
          resourceType: 'incident_report',
          resourceId: (report as any).id,
          details: {
            category: body.category,
            severity: body.severity,
            regionId: body.regionId,
          },
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        });
      }
    } catch (logError) {
      console.error('Failed to log activity:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json(report, { status: 201 });

  } catch (error: any) {
    console.error("Error creating incident report:", error);
    
    // Pass raw database error to the client if available
    const errorMsg = error?.message || error?.details || "Internal server error";
    
    return NextResponse.json(
      { error: errorMsg, rawError: String(error) }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await getIncidentReports({ limit: 100 });
    
    return NextResponse.json({
      reports,
      total: reports.length,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching incident reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
