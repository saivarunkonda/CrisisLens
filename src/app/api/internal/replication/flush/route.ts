import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
  // Simple internal endpoint to trigger a flush; restrict via env INTERNAL_API_KEY if set
  const key = req.headers.get('x-internal-key') || ''
  if (process.env.INTERNAL_API_KEY && key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const uri = process.env.MONGODB_URI
  if (!uri) return NextResponse.json({ error: 'MONGODB_URI not configured' }, { status: 500 })

  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || 'crisislens')
    const q = db.collection('replication_queue')
    const raw = db.collection('raw_reports')
    const items = await q.find({}).toArray()
    for (const it of items) {
      try {
        const report = it.report
        const doc = { ...report, created_at: report.createdAt ? new Date(report.createdAt) : new Date(), raw_payload: it.rawPayload || null, replicated_at: new Date() }
        await raw.insertOne(doc)
        await q.deleteOne({ _id: it._id as any })
      } catch (e) {
        // continue
      }
    }
    return NextResponse.json({ replicated: items.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 })
  } finally {
    await client.close()
  }
}

export const runtime = 'nodejs'
