#!/usr/bin/env node
// Create collection validators and indexes in MongoDB to mirror Postgres schema constraints.

const { MongoClient } = require('mongodb')
require('dotenv').config()

async function ensureValidator(db, name, schema) {
  const collInfos = await db.listCollections({ name }).toArray()
  if (collInfos.length === 0) {
    console.log('Creating collection', name)
    await db.createCollection(name, { validator: { $jsonSchema: schema } })
  } else {
    console.log('Updating validator for', name)
    await db.command({ collMod: name, validator: { $jsonSchema: schema }, validationLevel: 'moderate' })
  }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('set MONGODB_URI in env')
  const client = new MongoClient(uri)
  await client.connect()
  const dbName = process.env.MONGODB_DB || 'crisislens'
  const db = client.db(dbName)

  // reports schema
  const reportsSchema = {
    bsonType: 'object',
    required: ['id', 'region', 'category', 'severity', 'note', 'created_at'],
    properties: {
      id: { bsonType: 'string' },
      region: { bsonType: 'string' },
      category: { bsonType: 'string' },
      severity: { bsonType: 'int', minimum: 1, maximum: 5 },
      note: { bsonType: 'string' },
      created_at: { bsonType: 'date' },
    },
  }
  await ensureValidator(db, 'reports', reportsSchema)
  await db.collection('reports').createIndex({ region: 1, category: 1, created_at: -1 }, { name: 'idx_reports_region_category_createdat' })

  // users schema
  const usersSchema = {
    bsonType: 'object',
    required: ['id'],
    properties: { id: { bsonType: 'string' }, email: { bsonType: 'string' }, name: { bsonType: 'string' }, role: { bsonType: 'string' }, created_at: { bsonType: 'date' } }
  }
  await ensureValidator(db, 'users', usersSchema)

  // risk_snapshots
  const risksSchema = {
    bsonType: 'object',
    required: ['id', 'region'],
    properties: { id: { bsonType: 'string' }, region: { bsonType: 'string' }, generated_at: { bsonType: 'date' } }
  }
  await ensureValidator(db, 'risk_snapshots', risksSchema)
  await db.collection('risk_snapshots').createIndex({ region: 1 }, { name: 'idx_risk_snapshots_region' })

  // ml_models
  const mlSchema = {
    bsonType: 'object',
    required: ['id'],
    properties: { id: { bsonType: 'string' }, tag: { bsonType: 'string' }, description: { bsonType: 'string' }, created_at: { bsonType: 'date' }, metrics: { bsonType: 'object' } }
  }
  await ensureValidator(db, 'ml_models', mlSchema)

  // audit_logs
  const auditSchema = {
    bsonType: 'object',
    required: ['id'],
    properties: { id: { bsonType: 'string' }, user_id: { bsonType: 'string' }, action: { bsonType: 'string' }, detail: { bsonType: 'object' }, created_at: { bsonType: 'date' } }
  }
  await ensureValidator(db, 'audit_logs', auditSchema)
  await db.collection('audit_logs').createIndex({ user_id: 1 }, { name: 'idx_audit_logs_user' })

  console.log('Validators and indexes applied')
  await client.close()
}

main().catch(e => { console.error(e); process.exit(1) })
