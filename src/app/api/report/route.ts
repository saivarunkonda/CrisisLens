import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addReport, getReports } from "@/lib/mockStore";

type ReportBody = {
  region?: string;
  category?: "flood" | "heat" | "health" | "supply";
  severity?: number;
  note?: string;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "viewer") {
    return NextResponse.json({ error: "Forbidden — viewers cannot submit reports" }, { status: 403 });
  }

  const body = (await req.json()) as ReportBody;
  if (!body.region || !body.category || !body.severity || !body.note) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (body.severity < 1 || body.severity > 5) {
    return NextResponse.json({ error: "Severity must be between 1 and 5." }, { status: 400 });
  }

  const report = addReport({
    region: body.region,
    category: body.category,
    severity: body.severity,
    note: body.note,
  });
  return NextResponse.json({ report }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ reports: getReports() });
}
