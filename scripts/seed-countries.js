// scripts/seed-countries.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCountries() {
  console.log("Fetching countries from restcountries.com...");
  try {
    const response = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,population,area,latlng,region");
    const data = await response.json();
    
    // Sometimes API returns an object or error
    if (!Array.isArray(data)) {
        console.error("API did not return an array. Response was:", typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : data);
        return;
    }
    
    const countries = data;
    console.log(`Fetched ${countries.length} countries. Filtering and mapping...`);
    
    // Sort alphabetically and map to Region schema
    const regions = countries
      .map(c => {
        // Handle lat/lng sometimes being missing
        const lat = c.latlng && c.latlng.length === 2 ? c.latlng[0] : 0;
        const lng = c.latlng && c.latlng.length === 2 ? c.latlng[1] : 0;
        
        return {
          name: c.name.common,
          code: c.cca2,
          description: `Country: ${c.name.official || c.name.common}. Region: ${c.region || 'Unknown'}`,
          population: c.population || 0,
          area_km2: c.area || 0,
          center_lat: lat,
          center_lng: lng,
          infrastructure_score: 0.5, // Default/Placeholder
          emergency_resources: {}
        };
      })
      .filter(c => c.name && c.code)
      .sort((a, b) => a.name.localeCompare(b.name));
      
    console.log("Upserting to Supabase (regions table)...");
    
    // Insert in batches of 50 to avoid payload limits
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < regions.length; i += batchSize) {
      const batch = regions.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('regions')
        .upsert(batch, { onConflict: 'code', ignoreDuplicates: true });
        
      if (error) {
        // If 'name' is the unique constraint, change onConflict to 'name'
        if (error.code === '23505') { 
          const { error: nameErr } = await supabase
            .from('regions')
            .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
            if (nameErr) console.error("Error upserting batch by name:", nameErr.message);
            else successCount += batch.length;
        } else {
            console.error("Error upserting batch:", error.message);
        }
      } else {
        successCount += batch.length;
        process.stdout.write(`...Processed ${successCount}/${regions.length}\r`);
      }
    }
    
    console.log(`\nSuccessfully processed seeding for countries. Total attempted: ${successCount}`);
    
  } catch (error) {
    console.error("Error seeding countries:", error);
  }
}

seedCountries();
