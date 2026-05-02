// Dynamic location data fetching using REST Countries API
export interface Country {
  name: string;
  code: string;
  region: string;
  capital: string;
  population: number;
}

export interface State {
  name: string;
  code?: string;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
}

// Cache for location data to reduce API calls
let locationCache: {
  countries: Country[] | null;
  states: Record<string, State[]> | null;
  cities: Record<string, City[]> | null;
} = {
  countries: null,
  states: null,
  cities: null
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
let lastFetch = 0;

async function fetchWithCache<T>(
  key: keyof typeof locationCache,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (locationCache[key] && (now - lastFetch) < CACHE_DURATION) {
    return locationCache[key] as T;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  locationCache[key] = data as any;
  lastFetch = now;
  return data;
}

export async function getCountries(): Promise<Country[]> {
  return fetchWithCache('countries', async () => {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region,capital,population');
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    const data = await response.json();
    
    return data.map((country: any) => ({
      name: country.name.common,
      code: country.cca2,
      region: country.region,
      capital: country.capital?.[0] || '',
      population: country.population || 0
    })).sort((a: Country, b: Country) => a.name.localeCompare(b.name));
  });
}

export async function getStates(countryCode: string): Promise<State[]> {
  return fetchWithCache('states', async () => {
    // For many countries, we need to use a different approach
    // Using a fallback list of common country codes for now
    // In production, you might want to use a more comprehensive API
    const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    if (!response.ok) {
      throw new Error('Failed to fetch country details');
    }
    const data = await response.json();
    
    // REST Countries doesn't provide states directly
    // This is a limitation - you might need to use GeoNames for states
    // For now, return the capital as a state
    return [
      {
        name: data.capital?.[0] || 'Capital Region',
        code: data.cca2
      }
    ];
  });
}

export async function getCities(countryCode: string, stateName: string): Promise<City[]> {
  // Using OpenStreetMap/Nominatim API for cities
  try {
    const query = encodeURIComponent(`${stateName}, ${countryCode}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=10&featureType=city`,
      {
        headers: {
          'User-Agent': 'CrisisLens/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch cities');
    }
    
    const data = await response.json();
    
    return data.map((place: any) => ({
      name: place.display_name.split(',')[0],
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon)
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
}

// Fallback function for when APIs fail
export function getFallbackLocationData() {
  return {
    countries: ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'],
    states: {
      'India': ['Andhra Pradesh', 'Delhi', 'Karnataka', 'Maharashtra', 'Tamil Nadu'],
      'United States': ['California', 'New York', 'Texas', 'Florida', 'Illinois'],
      'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
      'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
      'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia']
    },
    cities: {
      'India': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'],
      'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
      'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'],
      'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
      'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide']
    }
  };
}
