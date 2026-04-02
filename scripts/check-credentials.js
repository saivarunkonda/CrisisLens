// Simple credential test for CrisisLens (MongoDB + Supabase)
// Use: npm run check-credentials

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const { createClient } = require('@supabase/supabase-js');

const {
  MONGODB_URI,
  MONGODB_DB,
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  DB_BACKEND,
} = process.env;

function item(name, value) {
  console.log(`${name}: ${value ? 'set' : 'missing'}`);
}

async function checkMongo() {
  if (!MONGODB_URI) {
    console.error('MongoDB URI missing (MONGODB_URI)');
    return;
  }
  if (!MONGODB_DB) {
    console.error('MongoDB DB missing (MONGODB_DB)');
    return;
  }

  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    await db.command({ ping: 1 });
    console.log('MongoDB connected: OK');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message || err);
  } finally {
    if (client) await client.close();
  }
}

async function checkSupabase() {
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase URL or anon key missing (NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    return;
  }

  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  try {
    const { data, error } = await supabase.from('reports').select('*').limit(1);
    if (error) {
      console.error('Supabase query error:', error.message || JSON.stringify(error));
    } else {
      console.log('Supabase access OK (reports table query)');
      console.log('Supabase record sample count:', Array.isArray(data) ? data.length : 0);
    }
  } catch (err) {
    console.error('Supabase check failed:', err.message || err);
  }
}

(async () => {
  console.log('DB_BACKEND:', DB_BACKEND ?? 'mongodb');
  item('MONGODB_URI', MONGODB_URI);
  item('MONGODB_DB', MONGODB_DB);
  item('NEXT_PUBLIC_SUPABASE_URL', NEXT_PUBLIC_SUPABASE_URL);
  item('NEXT_PUBLIC_SUPABASE_ANON_KEY', NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (DB_BACKEND === 'supabase') {
    await checkSupabase();
  } else {
    await checkMongo();
  }

  console.log('Done.');
})();
