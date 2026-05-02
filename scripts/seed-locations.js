// scripts/seed-locations.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Country, State } = require('country-state-city');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLocations() {
  console.log("Loading countries and states from 'country-state-city'...");
  
  // We'll collect all countries and their states
  const allCountries = Country.getAllCountries();
  const regions = [];

  // Add all countries
  for (const c of allCountries) {
    regions.push({
      name: c.name,
      code: c.isoCode, // e.g., 'US', 'IN'
      description: `Country: ${c.name}`,
      population: 0, // Package doesn't have pop, default to 0
      area_km2: 0,
      center_lat: parseFloat(c.latitude) || 0,
      center_lng: parseFloat(c.longitude) || 0,
      infrastructure_score: 0.5,
      emergency_resources: {}
    });

    // Add all states for this country
    const states = State.getStatesOfCountry(c.isoCode);
    for (const s of states) {
      regions.push({
        // To ensure uniqueness, we append Country Code to State Name/Code
        name: `${s.name}, ${c.name}`,
        code: `${c.isoCode}-${s.isoCode}`, // e.g., 'US-CA', 'IN-MH'
        description: `State/Region: ${s.name} in ${c.name}`,
        population: 0,
        area_km2: 0,
        center_lat: parseFloat(s.latitude) || parseFloat(c.latitude) || 0,
        center_lng: parseFloat(s.longitude) || parseFloat(c.longitude) || 0,
        infrastructure_score: 0.5,
        emergency_resources: {}
      });
    }
  }

  console.log(`Total regions built: ${regions.length}. Upserting to Supabase...`);

  // Insert in batches of 100 to avoid payload limits
  const batchSize = 100;
  let successCount = 0;
  
  for (let i = 0; i < regions.length; i += batchSize) {
    const batch = regions.slice(i, i + batchSize);
    
    // We try to upsert handling conflict on 'code'
    const { data, error } = await supabase
      .from('regions')
      .upsert(batch, { onConflict: 'code', ignoreDuplicates: true });
      
    if (error) {
      // If code unique constraint fails, we can log. 
      // Sometimes people change schema and 'name' is unique.
      if (error.code === '23505') { 
        const { error: nameErr } = await supabase
          .from('regions')
          .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
          if (nameErr) console.error(`Error on batch ${i}:`, nameErr.message);
          else successCount += batch.length;
      } else {
          console.error(`Error upserting batch ${i}:`, error.message);
      }
    } else {
      successCount += batch.length;
      process.stdout.write(`...Processed ${successCount}/${regions.length}\r`);
    }
  }
  
  console.log(`\nSuccessfully processed seeding for locations. Total upserted: ${successCount}`);
}

seedLocations();
