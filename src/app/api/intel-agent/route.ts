import { NextResponse } from 'next/server';
import { findSimilarIncidents } from '@/lib/database-simple';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing intel query parameter." }, { status: 400 });
    }

    // Step 1: Agentic Orchestration - Convert natural query to Vector Embedding
    console.log(`[Intel Agent] Processing embedding for query: "${query}"`);
    
    let vector: number[] = [];
    const mlServiceUrl = process.env.ML_SERVICE_URL?.replace(/\/$/, "") || "http://localhost:8000";
    try {
      const embRes = await fetch(`${mlServiceUrl}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      if (embRes.ok) {
        const { embedding: emb } = await embRes.json();
        vector = emb;
      } else {
        throw new Error("Failed to get embeddings from ML service.");
      }
    } catch (embError) {
      console.error("[Intel Agent] Embedding error:", embError);
      return NextResponse.json({ error: "Failed to connect to AI embedding service." }, { status: 500 });
    }

    // Step 2: RAG Vector Search across PostgreSQL
    console.log(`[Intel Agent] Querying Supabase pgvector 'match_incidents' function...`);
    let matchedContext: any[] = [];
    try {
        matchedContext = await findSimilarIncidents(vector, 0.3, 5);
    } catch (e) {
        console.warn("[Intel Agent] Supabase vector search unavailable or uninitialized", e);
    }

    // Step 3: Synthesis Engine (Agent Generation)
    let agentSynthesis = "";
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (matchedContext && matchedContext.length > 0) {
      if (groqApiKey && groqApiKey !== 'your-groq-api-key') {
        try {
          const groq = new Groq({ apiKey: groqApiKey });
          const contextStr = matchedContext.map(r => `Title: ${r.title}\nSeverity: ${r.severity}\nCategory: ${r.category}\nDescription: ${r.description}`).join('\n---\n');
          const prompt = `You are the CrisisLens Intel Agent, a highly capable emergency analysis AI. 
The user asked: "${query}"

Here are the most relevant historical incident reports we found in our vector database:
${contextStr}

Analyze these past incidents and provide a direct, professional, and insightful intelligence summary addressing the user's query.`;

          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
          });
          agentSynthesis = chatCompletion.choices[0]?.message?.content || "Failed to generate LLM response.";
        } catch (groqError: any) {
          console.error("[Intel Agent] Groq LLM error:", groqError);
          agentSynthesis = `Groq LLM error: ${groqError?.message || String(groqError)}`;
        }
      } else {
        agentSynthesis = `Based on historical correlations from the PostgreSQL pgvector engine, I found ${matchedContext.length} relevant reports.\\n\\n`;
        const summaries = matchedContext.map(r => `• ${r.title} (Severity: ${r.severity}, Category: ${r.category})`).join("\\n");
        agentSynthesis += `Key correlated incidents:\\n${summaries}`;
      }
    } else {
      if (groqApiKey && groqApiKey !== 'your-groq-api-key') {
         try {
           const groq = new Groq({ apiKey: groqApiKey });
           const chatCompletion = await groq.chat.completions.create({
             messages: [{ role: 'user', content: `Please briefly respond to the user query: "${query}" while noting that our internal PostgreSQL vector database found 0 relevant historical incidents matching this criteria.` }],
             model: 'llama-3.1-8b-instant',
           });
           agentSynthesis = chatCompletion.choices[0]?.message?.content || "No relevant correlations found.";
         } catch (e: any) {
           agentSynthesis = `Groq LLM error: ${e?.message || String(e)}`;
         }
      } else {
        agentSynthesis = `I processed your query using vector search, but did not find any highly relevant historical correlations in our intelligence database.`;
      }
    }
    
    return NextResponse.json({
      role: "agent",
      insight: agentSynthesis,
      references: matchedContext || [],
      vector_dimension: vector.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
