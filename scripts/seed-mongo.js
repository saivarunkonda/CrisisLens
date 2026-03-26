// scripts/seed-mongo.js
// Usage: node scripts/seed-mongo.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'crisislens';

if (!uri) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const reports = db.collection('reports');
    const users = db.collection('users');
    const snapshots = db.collection('risk_snapshots');
    const models = db.collection('ml_models');
    const logs = db.collection('audit_logs');

    // Insert sample report
    await reports.updateOne(
      { id: 'test-1' },
      {
        $setOnInsert: {
          id: 'test-1',
          region: 'North District',
          category: 'flood',
          severity: 3,
          note: 'sample report',
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Insert sample user
    await users.updateOne(
      { id: 'admin@crisislens.local' },
      {
        $setOnInsert: {
          id: 'admin@crisislens.local',
          email: 'admin@crisislens.local',
          name: 'admin',
          role: 'admin',
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    // Insert sample snapshot
    await snapshots.updateOne(
      { id: 'snapshot-1' },
      {
        $setOnInsert: {
          id: 'snapshot-1',
          region: 'North District',
          flood_risk: 36,
          heat_risk: 52,
          health_risk: 41,
          supply_risk: 28,
          overall_risk: 39,
          generated_at: new Date(),
        },
      },
      { upsert: true }
    );

    // Insert sample model
    await models.updateOne(
      { id: 'model-1' },
      {
        $setOnInsert: {
          id: 'model-1',
          tag: 'baseline',
          created_at: new Date(),
          metrics: { mse: 12.3 },
        },
      },
      { upsert: true }
    );

    // Insert sample audit log
    await logs.updateOne(
      { id: 'log-1' },
      {
        $setOnInsert: {
          id: 'log-1',
          user_id: 'admin@crisislens.local',
          action: 'seed',
          detail: { note: 'seeded initial data' },
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    console.log('MongoDB seed complete (db:', dbName + ')');
  } catch (err) {
    console.error('MongoDB seed failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
