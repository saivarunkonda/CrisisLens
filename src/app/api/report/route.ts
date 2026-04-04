import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createIncidentReport, getRegions, getIncidentReports, logUserActivity } from "@/lib/database-simple";

type ReportBody = {
  regionId?: string;
  category?: "flood" | "heat" | "health" | "supply" | "infrastructure" | "security";
  severity?: number;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
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
    
    // Validate required fields
    if (!body.regionId || !body.category || !body.severity || !body.title || !body.description) {
      return NextResponse.json({ error: "Missing required fields: regionId, category, severity, title, description" }, { status: 400 });
    }
    
    if (body.severity < 1 || body.severity > 5) {
      return NextResponse.json({ error: "Severity must be between 1 and 5." }, { status: 400 });
    }

    // Validate region exists
    const regions = await getRegions();
    const region = regions.find((r: any) => r.name === body.regionId || r.id === body.regionId);
    if (!region) {
      return NextResponse.json({ error: "Invalid region ID" }, { status: 400 });
    }

    // Create the incident report
    const report = await createIncidentReport({
      regionId: region.id, // Use the actual UUID from the found region
      category: body.category,
      severity: body.severity,
      title: body.title,
      description: body.description,
      latitude: body.latitude,
      longitude: body.longitude,
      locationAddress: body.locationAddress,
      images: body.images,
      sources: body.sources || {
        reported_by: session.user.email,
        user_role: session.user.role,
        submission_method: 'web_dashboard'
      }
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

  } catch (error) {
    console.error('Error creating incident report:', error);
    console.error('Error type:', typeof error);
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : JSON.stringify(error, null, 2);
    console.error('Error details:', errorDetails);
    return NextResponse.json(
      { error: 'Internal server error', details: typeof errorDetails === 'string' ? errorDetails : errorDetails.message }, 
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
