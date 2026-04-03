import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Simple internal endpoint for replication flush
  const key = req.headers.get('x-internal-key') || ''
  if (process.env.INTERNAL_API_KEY && key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Mock replication response
  return NextResponse.json({ 
    replicated: 0,
    message: 'Replication endpoint - no database configured'
  })
}

export const runtime = 'nodejs'
