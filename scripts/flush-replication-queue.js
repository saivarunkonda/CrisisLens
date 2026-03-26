#!/usr/bin/env node
// Flush replication_queue -> raw_reports
const { MongoClient, ObjectId } = require('mongodb')
require('dotenv').config()

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('set MONGODB_URI in env')
  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || 'crisislens')
  const q = db.collection('replication_queue')
  const raw = db.collection('raw_reports')

  const items = await q.find({}).toArray()
  if (!items.length) {
    console.log('No queued replication items')
    await client.close()
    return
  }
  console.log('Found', items.length, 'items')
  for (const it of items) {
    try {
      const report = it.report
      const doc = { ...report, created_at: report.createdAt ? new Date(report.createdAt) : new Date(), raw_payload: it.rawPayload || null, replicated_at: new Date() }
      await raw.insertOne(doc)
      await q.deleteOne({ _id: it._id })
      console.log('Replicated and removed queue item', it._id)
    } catch (e) {
      console.warn('Failed to replicate item', it._id, e.message || e)
    }
  }
  await client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
