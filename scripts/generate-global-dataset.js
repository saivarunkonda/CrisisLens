const fs = require('fs');
const { Country, State } = require('country-state-city');

const factors = [
  "flood", "extreme_heat", "rain_storm", "earthquake",
  "health", "pollution", "food_scarcity", "water_scarcity",
  "political_unrest", "war_conflict", "economic_crash", "security",
  "supply_chain", "traffic", "power_outage", "network_outage"
];

console.log("Loading global regions for dataset...");
const allCountries = Country.getAllCountries();
let locations = [];

for (const c of allCountries) {
  locations.push({ region: c.name, type: "country" });
  const states = State.getStatesOfCountry(c.isoCode);
  for (const s of states) {
    locations.push({ region: s.name, type: "state" });
  }
}

// Generate 10,000 synthetic records
const DATASET_SIZE = 10000;
let csvContent = `region,description,${factors.join(',')},overall_risk\n`;

console.log(`Generating ${DATASET_SIZE} global incident vectors...`);

const scenarios = [
  "Significant infrastructure anomalies detected following regional instability.",
  "Rising localized temperatures alongside grid capacity constraints.",
  "Heavy supply chain backlog intertwined with recent weather pressure.",
  "Severe political protests causing widespread traffic and logistical failures.",
  "Unprecedented water scarcity escalating food pressure dynamics.",
  "Quiet operational period with low threshold volatility.",
  "Earthquake shockwaves compromising network outages and grid stability."
];

for (let i = 0; i < DATASET_SIZE; i++) {
  const loc = locations[Math.floor(Math.random() * locations.length)];
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  // Base description
  const description = `[${loc.type.toUpperCase()}: ${loc.region}] ${scenario}`;
  
  let totalScore = 0;
  const factorScores = factors.map(() => {
    // some factors spike randomly
    const score = Math.random() > 0.8 ? Math.floor(Math.random()*(100-70)+70) : Math.floor(Math.random()*40);
    totalScore += score;
    return score;
  });
  
  const overall_risk = Math.min(100, Math.floor(totalScore / factors.length) + (Math.random()*10));
  
  csvContent += `"${loc.region}","${description}",${factorScores.join(',')},${Math.floor(overall_risk)}\n`;
}

fs.writeFileSync('ml-service/global_dataset.csv', csvContent);
console.log("Successfully wrote global_dataset.csv in ml-service/");
