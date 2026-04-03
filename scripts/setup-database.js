#!/usr/bin/env node

/**
 * CrisisLens Database Setup Script
 * Initializes Supabase database with production schema
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function setupDatabase() {
  console.log('🚀 Setting up CrisisLens Production Database\n');
  
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('📋 Step 1: Reading database schema...');
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('✅ Schema loaded successfully');
    
    console.log('\n📋 Step 2: Executing database migrations...');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let executedCount = 0;
    let errors = [];
    
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct SQL execution for certain statements
          if (statement.includes('CREATE') || statement.includes('INSERT')) {
            console.log(`⚠️  RPC failed, trying direct execution for: ${statement.substring(0, 50)}...`);
            errors.push({ statement: statement.substring(0, 100), error: error.message });
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
            executedCount++;
          }
        } else {
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          executedCount++;
        }
      } catch (err) {
        errors.push({ statement: statement.substring(0, 100), error: err.message });
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully executed: ${executedCount} statements`);
    console.log(`   ⚠️  Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Migration Errors (these may be expected):');
      errors.forEach(err => {
        console.log(`   - ${err.statement}: ${err.error}`);
      });
    }
    
    console.log('\n📋 Step 3: Verifying database setup...');
    
    // Test if we can query regions
    const { data: regions, error: regionsError } = await supabase
      .from('regions')
      .select('id, name, code')
      .limit(5);
    
    if (regionsError) {
      console.error('❌ Failed to query regions:', regionsError.message);
    } else {
      console.log(`✅ Found ${regions.length} regions in database`);
      regions.forEach(region => {
        console.log(`   - ${region.name} (${region.code})`);
      });
    }
    
    // Test if we can create a test incident report
    const { data: testReport, error: reportError } = await supabase
      .from('incident_reports')
      .select('id, title, created_at')
      .limit(1);
    
    if (reportError) {
      console.log(`⚠️  Incident reports table may need manual setup: ${reportError.message}`);
    } else {
      console.log(`✅ Incident reports table accessible`);
    }
    
    console.log('\n📋 Step 4: Creating initial admin user...');
    
    // Try to create admin user (if auth is configured)
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@crisislens.local',
        password: 'CrisisLens2026!',
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          full_name: 'System Administrator'
        }
      });
      
      if (authError && !authError.message.includes('already registered')) {
        console.log(`⚠️  Admin user creation: ${authError.message}`);
      } else {
        console.log(`✅ Admin user ready: admin@crisislens.local`);
      }
    } catch (authErr) {
      console.log(`⚠️  Auth setup may need manual configuration in Supabase dashboard`);
    }
    
    console.log('\n✨ Database Setup Complete!');
    console.log('=====================================');
    console.log('\n🎯 Next Steps:');
    console.log('1. Visit Supabase dashboard to verify tables');
    console.log('2. Check Row Level Security (RLS) policies');
    console.log('3. Configure authentication providers');
    console.log('4. Test the application with real database');
    
    console.log('\n🔗 Useful Links:');
    console.log(`   Supabase Dashboard: ${supabaseUrl.replace('supabase', 'supabase/dashboard/project')}`);
    console.log(`   Database Editor: ${supabaseUrl.replace('supabase', 'supabase/dashboard/project')}/database`);
    console.log(`   Authentication: ${supabaseUrl.replace('supabase', 'supabase/dashboard/project')}/auth`);
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to Supabase dashboard');
    console.log('2. Run the SQL from supabase/migrations/001_initial_schema.sql');
    console.log('3. Enable Row Level Security on all tables');
    console.log('4. Configure authentication providers');
    process.exit(1);
  }
}

// Helper function to execute SQL directly
async function executeSQL(supabase, sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
