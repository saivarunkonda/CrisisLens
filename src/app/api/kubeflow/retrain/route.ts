import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { triggerRetrainPipeline } from "@/lib/kubeflow";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin role required" }, { status: 403 });
  }

  const result = await triggerRetrainPipeline("crisislens-retrain");

  if (!result.ok) {
    return NextResponse.json(
      { error: "Kubeflow API error", status: result.status, detail: result.body },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    configured: Boolean(process.env.KFP_API_BASE_URL && process.env.KFP_PIPELINE_ID),
    pipelineId: process.env.KFP_PIPELINE_ID ?? null,
    apiBase: process.env.KFP_API_BASE_URL ? "[set]" : null,
  });
}
