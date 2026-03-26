// scripts/seed-supabase.js
// Usage: node scripts/seed-supabase.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE;

if (!url || !anonKey) {
  console.error('Supabase URL or anon key missing in .env.local');
  process.exit(1);
}

const supabase = createClient(url, anonKey, { global: { headers: { "x-client-info": "crisislens-seed" } } });
const supabaseAdmin = serviceRole ? createClient(url, serviceRole, { global: { headers: { "x-client-info": "crisislens-seed-admin" } } }) : null;

async function upsert(table, row, pk = 'id') {
  try {
    const res = await supabase.from(table).upsert([row], { onConflict: pk });
    if (res.error) throw res.error;
    return true;
  } catch (err) {
    const message = String(err.message || err || '');
    if (message.includes('Could not find the table')) {
      console.error(`Table "${table}" not found. Run scripts/seed-supabase.sql in Supabase SQL editor first.`);
      return false;
    }
    if (message.includes('violates row-level security') || message.includes('row-level security')) {
      console.error(`Upsert ${table} blocked by Row Level Security policy.`);
      if (supabaseAdmin) {
        console.log(`Retrying ${table} using SUPABASE_SERVICE_ROLE_KEY (service role) to bypass RLS...`);
        try {
          const r2 = await supabaseAdmin.from(table).upsert([row], { onConflict: pk });
          if (r2.error) throw r2.error;
          return true;
        } catch (e2) {
          console.error(`Service-role upsert ${table} failed:`, e2.message || e2);
          return false;
        }
      }
      console.error('No SUPABASE_SERVICE_ROLE_KEY found. Either set `SUPABASE_SERVICE_ROLE_KEY` in .env.local (server-only secret) or run the SQL in the Supabase SQL editor to create permissive policies for seeding. See scripts/seed-supabase.sql.');
      return false;
    }

    console.error(`Upsert ${table} failed:`, message);
    return false;
  }
}

async function main() {
  // Reports
  const ok1 = await upsert('reports', {
    id: 'test-1',
    region: 'North District',
    category: 'flood',
    severity: 3,
    note: 'sample report',
    created_at: new Date().toISOString(),
  });

  // Users
  const ok2 = await upsert('users', {
    id: 'admin@crisislens.local',
    email: 'admin@crisislens.local',
    name: 'admin',
    role: 'admin',
    created_at: new Date().toISOString(),
  });

  // Risk snapshots
  const ok3 = await upsert('risk_snapshots', {
    id: 'snapshot-1',
    region: 'North District',
    flood_risk: 36,
    heat_risk: 52,
    health_risk: 41,
    supply_risk: 28,
    overall_risk: 39,
    generated_at: new Date().toISOString(),
  });

  // ML models
  const ok4 = await upsert('ml_models', {
    id: 'model-1',
    tag: 'baseline',
    created_at: new Date().toISOString(),
    metrics: { mse: 12.3 },
  });

  // Audit logs
  const ok5 = await upsert('audit_logs', {
    id: 'log-1',
    user_id: 'admin@crisislens.local',
    action: 'seed',
    detail: { note: 'seeded initial data' },
    created_at: new Date().toISOString(),
  });

  if (ok1 && ok2 && ok3 && ok4 && ok5) {
    console.log('Supabase seed complete');
  } else {
    console.log('Supabase seed had errors (see above)');
  }
}

main();
