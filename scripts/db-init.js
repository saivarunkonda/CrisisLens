// scripts/db-init.js
// Orchestrate DB initialization: check credentials, create schema (Supabase), seed DB.
// Usage: node scripts/db-init.js

require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_BACKEND = process.env.DB_BACKEND || 'mongodb';
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL; // optional: full psql connection string

function run(cmd, env = {}) {
  try {
    console.log(`\n> ${cmd}`);
    const out = execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
    return { ok: true, out };
  } catch (err) {
    return { ok: false, err };
  }
}

async function main() {
  console.log('DB init: backend =', DB_BACKEND);

  // 1) Run credential check
  console.log('\n1) Checking credentials...');
  const checkCmd = `node scripts/check-credentials.js`;
  const checkRes = run(checkCmd, { DB_BACKEND });
  if (!checkRes.ok) {
    console.error('Credential check failed to execute. Please run `npm run check-credentials` manually.');
  }

  if (DB_BACKEND === 'mongodb') {
    console.log('\n2) Seeding MongoDB...');
    const res = run('node scripts/seed-mongo.js');
    if (!res.ok) {
      console.error('MongoDB seed failed. Check MONGODB_URI and network access.');
      process.exit(1);
    }
    console.log('\nMongoDB initialization complete.');
    console.log('\nTo start the app: npm run dev');
    return;
  }

  // Supabase flow
  console.log('\n2) Seeding Supabase (will try to upsert seed rows).');
  let seedRes = run('node scripts/seed-supabase.js');

  // If seed failed due to missing tables, attempt to run SQL if SUPABASE_DB_URL provided
  const seedFailed = !seedRes.ok;
  if (seedFailed) {
    console.log('\nSeed reported errors. Attempting schema creation using SQL file.');
    const sqlFile = path.join(__dirname, 'seed-supabase.sql');
    if (!fs.existsSync(sqlFile)) {
      console.error('Schema SQL file not found at', sqlFile);
      process.exit(1);
    }

    if (!SUPABASE_DB_URL) {
      console.error('\nSUPABASE_DB_URL is not set in .env.local.');
      console.error('Please set SUPABASE_DB_URL (Postgres connection string) or run scripts/seed-supabase.sql in the Supabase SQL editor.');
      process.exit(1);
    }

    // Run psql to execute SQL file
    const psqlCmd = `psql "${SUPABASE_DB_URL}" -f "${sqlFile}"`;
    const sqlRes = run(psqlCmd);
    if (!sqlRes.ok) {
      console.error('Failed to run SQL file via psql. Ensure psql is installed and SUPABASE_DB_URL is correct.');
      process.exit(1);
    }

    console.log('\nSQL executed. Re-running Supabase seeder...');
    seedRes = run('node scripts/seed-supabase.js');
    if (!seedRes.ok) {
      console.error('Supabase seeder still failed after running SQL. Check errors above.');
      process.exit(1);
    }
  }

  console.log('\nSupabase initialization complete.');
  console.log('\nTo start the app: npm run dev');
}

main();
