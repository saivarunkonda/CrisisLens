// scripts/generate-locations-sql.js
const fs = require('fs');
const { Country, State } = require('country-state-city');

console.log("Loading countries and states from 'country-state-city'...");
const allCountries = Country.getAllCountries();
const regions = [];

// Add all countries
for (const c of allCountries) {
  regions.push({
    name: c.name.replace(/'/g, "''"), // Escape for SQL
    code: c.isoCode, 
    description: `Country: ${c.name.replace(/'/g, "''")}`,
    population: 0, 
    area_km2: 0,
    center_lat: parseFloat(c.latitude) || 0,
    center_lng: parseFloat(c.longitude) || 0,
    infrastructure_score: 0.5,
    emergency_resources: '{}'
  });

  // Add all states for this country
  const states = State.getStatesOfCountry(c.isoCode);
  for (const s of states) {
    regions.push({
      name: `${s.name.replace(/'/g, "''")}, ${c.name.replace(/'/g, "''")}`,
      code: `${c.isoCode}-${s.isoCode}`,
      description: `State/Region: ${s.name.replace(/'/g, "''")} in ${c.name.replace(/'/g, "''")}`,
      population: 0,
      area_km2: 0,
      center_lat: parseFloat(s.latitude) || parseFloat(c.latitude) || 0,
      center_lng: parseFloat(s.longitude) || parseFloat(c.longitude) || 0,
      infrastructure_score: 0.5,
      emergency_resources: '{}'
    });
  }
}

console.log(`Total regions built: ${regions.length}. Generating SQL file...`);

let sql = `-- CrisisLens Location Seed File (Countries and States)\n`;
sql += `-- Generated from country-state-city package\n\n`;

// Generate batched insert statements (1000 per insert to avoid huge statements)
const batchSize = 1000;
for (let i = 0; i < regions.length; i += batchSize) {
  const batch = regions.slice(i, i + batchSize);
  
  sql += `INSERT INTO regions (name, code, description, population, area_km2, center_lat, center_lng, infrastructure_score, emergency_resources)\nVALUES\n`;
  
  const values = batch.map(r => 
    `('${r.name}', '${r.code}', '${r.description}', ${r.population}, ${r.area_km2}, ${r.center_lat}, ${r.center_lng}, ${r.infrastructure_score}, '${r.emergency_resources}'::jsonb)`
  );
  
  sql += values.join(',\n');
  sql += `\nON CONFLICT (code) DO NOTHING;\n\n`;
}

fs.writeFileSync('scripts/seed-locations.sql', sql);
console.log(`Successfully generated scripts/seed-locations.sql`);
