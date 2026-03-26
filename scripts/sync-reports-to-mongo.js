#!/usr/bin/env node
// One-off ETL: fetch reports from Supabase (service role) and write to MongoDB collection `raw_reports`.
// Optionally write CSV files to ./out and produce a manifest JSON.

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { MongoClient } = require('mongodb')
require('dotenv').config()

async function fetchAllReports(supabase) {
  const perPage = 1000
  let page = 0
  let all = []
  while (true) {
    const from = page * perPage
    const to = from + perPage - 1
    const { data, error } = await supabase.from('reports').select('*').range(from, to)
    if (error) throw error
    if (!data || data.length === 0) break
    all = all.concat(data)
    if (data.length < perPage) break
    page++
  }
  return all
}

async function toCsv(rows, outPath) {
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = r[h]
      if (v === null || v === undefined) return ''
      return String(v).replace(/"/g, '""')
    })
    lines.push(vals.join(','))
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, lines.join('\n'))
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env')
  const supabase = createClient(supabaseUrl, supabaseKey)

  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) throw new Error('set MONGODB_URI in env')
  const mc = new MongoClient(mongoUri)
  await mc.connect()
  const dbName = process.env.MONGODB_DB || 'crisislens'
  const db = mc.db(dbName)

  console.log('Fetching reports from Supabase...')
  const rows = await fetchAllReports(supabase)
  console.log('Fetched', rows.length, 'rows')

  if (rows.length === 0) {
    console.log('No rows to migrate')
    await mc.close()
    return
  }

  // Insert into Mongo raw_reports
  const docs = rows.map(r => ({ ...r, created_at: r.created_at ? new Date(r.created_at) : new Date() }))
  const coll = db.collection('raw_reports')
  try {
    const res = await coll.insertMany(docs, { ordered: false })
    console.log('Inserted', res.insertedCount, 'docs into raw_reports')
  } catch (e) {
    console.warn('InsertMany warning/error', e.message || e)
  }

  // Optionally write CSV
  const outDir = path.join(process.cwd(), 'out', 'training')
  const outFile = path.join(outDir, `reports-${new Date().toISOString().slice(0,10)}.csv`)
  try {
    await toCsv(rows, outFile)
    console.log('Wrote CSV to', outFile)
  } catch (e) {
    console.warn('CSV write failed', e.message || e)
  }

  // Produce a manifest
  const manifest = {
    generated_at: new Date().toISOString(),
    file: outFile,
    row_count: rows.length,
  }
  const manifestPath = path.join(outDir, `manifest-${new Date().toISOString().slice(0,10)}.json`)
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('Wrote manifest to', manifestPath)

  // Optional upload to object storage (S3 or GCS)
  try {
    if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('Uploading files to S3...')
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
      const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
      const keyPrefix = process.env.S3_PREFIX || `crisislens/training/${new Date().toISOString().slice(0,10)}`
      const upload = async (filePath, targetName) => {
        const body = fs.readFileSync(filePath)
        await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${keyPrefix}/${targetName}`, Body: body }))
        return `s3://${process.env.S3_BUCKET}/${keyPrefix}/${targetName}`
      }
      const csvUrl = await upload(outFile, path.basename(outFile))
      const manifestUrl = await upload(manifestPath, path.basename(manifestPath))
      console.log('Uploaded to S3:', csvUrl, manifestUrl)
    } else if (process.env.GCS_BUCKET && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Uploading files to GCS...')
      const { Storage } = require('@google-cloud/storage')
      const storage = new Storage()
      const bucket = storage.bucket(process.env.GCS_BUCKET)
      const prefix = process.env.GCS_PREFIX || `crisislens/training/${new Date().toISOString().slice(0,10)}`
      await bucket.upload(outFile, { destination: `${prefix}/${path.basename(outFile)}` })
      await bucket.upload(manifestPath, { destination: `${prefix}/${path.basename(manifestPath)}` })
      console.log('Uploaded to GCS:', `gs://${process.env.GCS_BUCKET}/${prefix}/`)
    } else {
      console.log('No object storage configured (set S3_BUCKET or GCS_BUCKET to enable upload)')
    }
  } catch (e) {
    console.warn('Upload to object storage failed', e.message || e)
  }

  await mc.close()
}

main().catch(e => { console.error(e); process.exit(1) })
