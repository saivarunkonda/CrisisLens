// scripts/apply-supabase-sql.js
// Usage: node scripts/apply-supabase-sql.js
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { Client } = require('pg');

const sqlPath = 'scripts/seed-supabase.sql';
const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('SUPABASE_DB_URL is not set in .env.local');
  process.exit(1);
}

(async () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log('Connected to Supabase Postgres via SUPABASE_DB_URL');
    // Execute the full SQL file. Some servers may require splitting, but Postgres accepts multiple statements.
    await client.query(sql);
    console.log('SQL applied successfully');
  } catch (err) {
    console.error('Failed to apply SQL:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
