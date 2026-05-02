import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { findSimilarIncidents } from "@/lib/database-simple";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description } = await req.json();
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Generate embedding by calling the ML service
    const mlServiceUrl = process.env.ML_SERVICE_URL?.replace(/\/$/, "");
    if (!mlServiceUrl) {
      return NextResponse.json({ error: "ML service not configured" }, { status: 503 });
    }

    const embRes = await fetch(`${mlServiceUrl}/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: description }),
    });

    if (!embRes.ok) {
      throw new Error("Failed to generate embedding");
    }

    const { embedding } = await embRes.json();
    
    // Find similar incidents in Supabase
    const similar = await findSimilarIncidents(embedding);

    return NextResponse.json({ similar });

  } catch (error) {
    console.error('Error fetching similar incidents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
