export interface CityResult {
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  source: 'curated' | 'atlas' | 'online';
}

const CURATED_CITIES: CityResult[] = [
  { name: 'New Delhi', country: 'IN', admin1: 'Delhi', latitude: 28.6139, longitude: 77.2090, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Mumbai', country: 'IN', admin1: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Bengaluru', country: 'IN', admin1: 'Karnataka', latitude: 12.9716, longitude: 77.5946, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Chennai', country: 'IN', admin1: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Kolkata', country: 'IN', admin1: 'West Bengal', latitude: 22.5726, longitude: 88.3639, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Hyderabad', country: 'IN', admin1: 'Telangana', latitude: 17.3850, longitude: 78.4867, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Pune', country: 'IN', admin1: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Ahmedabad', country: 'IN', admin1: 'Gujarat', latitude: 23.0225, longitude: 72.5714, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Jaipur', country: 'IN', admin1: 'Rajasthan', latitude: 26.9124, longitude: 75.7873, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Lucknow', country: 'IN', admin1: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Varanasi', country: 'IN', admin1: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Thiruvananthapuram', country: 'IN', admin1: 'Kerala', latitude: 8.5241, longitude: 76.9366, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Kochi', country: 'IN', admin1: 'Kerala', latitude: 9.9312, longitude: 76.2673, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Kozhikode', country: 'IN', admin1: 'Kerala', latitude: 11.2588, longitude: 75.7804, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Thrissur', country: 'IN', admin1: 'Kerala', latitude: 10.5276, longitude: 76.2144, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Zahirabad', country: 'IN', admin1: 'Telangana', latitude: 17.6815, longitude: 77.6074, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Bhopal', country: 'IN', admin1: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Patna', country: 'IN', admin1: 'Bihar', latitude: 25.5941, longitude: 85.1376, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Chandigarh', country: 'IN', admin1: 'Chandigarh', latitude: 30.7333, longitude: 76.7794, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Guwahati', country: 'IN', admin1: 'Assam', latitude: 26.1445, longitude: 91.7362, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Bhubaneswar', country: 'IN', admin1: 'Odisha', latitude: 20.2961, longitude: 85.8245, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Indore', country: 'IN', admin1: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Surat', country: 'IN', admin1: 'Gujarat', latitude: 21.1702, longitude: 72.8311, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Nagpur', country: 'IN', admin1: 'Maharashtra', latitude: 21.1458, longitude: 79.0882, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Haridwar', country: 'IN', admin1: 'Uttarakhand', latitude: 29.9457, longitude: 78.1642, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Ujjain', country: 'IN', admin1: 'Madhya Pradesh', latitude: 23.1765, longitude: 75.7885, timeZone: 'Asia/Kolkata', source: 'curated' },
  { name: 'Kathmandu', country: 'NP', latitude: 27.7172, longitude: 85.3240, timeZone: 'Asia/Kathmandu', source: 'curated' },
  { name: 'Colombo', country: 'LK', latitude: 6.9271, longitude: 79.8612, timeZone: 'Asia/Colombo', source: 'curated' },
  { name: 'Dhaka', country: 'BD', latitude: 23.8103, longitude: 90.4125, timeZone: 'Asia/Dhaka', source: 'curated' },
  { name: 'Karachi', country: 'PK', latitude: 24.8607, longitude: 67.0011, timeZone: 'Asia/Karachi', source: 'curated' },
  { name: 'Lahore', country: 'PK', latitude: 31.5204, longitude: 74.3587, timeZone: 'Asia/Karachi', source: 'curated' },
  { name: 'Dubai', country: 'AE', latitude: 25.2048, longitude: 55.2708, timeZone: 'Asia/Dubai', source: 'curated' },
  { name: 'Riyadh', country: 'SA', latitude: 24.7136, longitude: 46.6753, timeZone: 'Asia/Riyadh', source: 'curated' },
  { name: 'Singapore', country: 'SG', latitude: 1.3521, longitude: 103.8198, timeZone: 'Asia/Singapore', source: 'curated' },
  { name: 'Kuala Lumpur', country: 'MY', latitude: 3.1390, longitude: 101.6869, timeZone: 'Asia/Kuala_Lumpur', source: 'curated' },
  { name: 'Tokyo', country: 'JP', latitude: 35.6762, longitude: 139.6503, timeZone: 'Asia/Tokyo', source: 'curated' },
  { name: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278, timeZone: 'Europe/London', source: 'curated' },
  { name: 'Paris', country: 'FR', latitude: 48.8566, longitude: 2.3522, timeZone: 'Europe/Paris', source: 'curated' },
  { name: 'Berlin', country: 'DE', latitude: 52.5200, longitude: 13.4050, timeZone: 'Europe/Berlin', source: 'curated' },
  { name: 'New York', country: 'US', admin1: 'NY', latitude: 40.7128, longitude: -74.0060, timeZone: 'America/New_York', source: 'curated' },
  { name: 'Los Angeles', country: 'US', admin1: 'CA', latitude: 34.0522, longitude: -118.2437, timeZone: 'America/Los_Angeles', source: 'curated' },
  { name: 'Chicago', country: 'US', admin1: 'IL', latitude: 41.8781, longitude: -87.6298, timeZone: 'America/Chicago', source: 'curated' },
  { name: 'San Francisco', country: 'US', admin1: 'CA', latitude: 37.7749, longitude: -122.4194, timeZone: 'America/Los_Angeles', source: 'curated' },
  { name: 'Toronto', country: 'CA', admin1: 'ON', latitude: 43.6532, longitude: -79.3832, timeZone: 'America/Toronto', source: 'curated' },
  { name: 'Sydney', country: 'AU', admin1: 'NSW', latitude: -33.8688, longitude: 151.2093, timeZone: 'Australia/Sydney', source: 'curated' },
  { name: 'Melbourne', country: 'AU', admin1: 'VIC', latitude: -37.8136, longitude: 144.9631, timeZone: 'Australia/Melbourne', source: 'curated' },
];

export function searchCuratedCities(query: string, limit = 15): CityResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURATED_CITIES.slice(0, limit);
  return CURATED_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      (c.admin1 && c.admin1.toLowerCase().includes(q))
  ).slice(0, limit);
}

let cachedAtlas: { cities: { name: string; lat: number; lng: number; country: string; admin1?: string }[]; tz: (lat: number, lon: number) => string } | null = null;

async function ensureAtlasLoaded() {
  if (cachedAtlas) return cachedAtlas;
  const [{ default: rawCities }, { default: tzlookup }] = await Promise.all([
    import('cities.json'),
    import('tz-lookup'),
  ]);
  const parsed = rawCities.map((c) => ({
    name: c.name,
    lat: parseFloat(c.lat),
    lng: parseFloat(c.lng),
    country: c.country,
    admin1: c.admin1,
  }));
  cachedAtlas = { cities: parsed, tz: tzlookup };
  return cachedAtlas;
}

export async function lookupTimezoneForCoords(latitude: number, longitude: number): Promise<string> {
  try {
    const { default: tzlookup } = await import('tz-lookup');
    return tzlookup(latitude, longitude);
  } catch {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }
}

export async function searchCitiesGlobal(query: string, limit = 20): Promise<CityResult[]> {
  const q = query.trim().toLowerCase();
  const curated = searchCuratedCities(q, limit);
  if (!q || q.length < 2) return curated;

  try {
    const atlas = await ensureAtlasLoaded();
    const matches: CityResult[] = [];
    for (const c of atlas.cities) {
      if (c.name.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q)) {
        let timeZone = 'UTC';
        try {
          timeZone = atlas.tz(c.lat, c.lng);
        } catch {
          timeZone = 'UTC';
        }
        matches.push({
          name: c.name,
          country: c.country,
          admin1: c.admin1,
          latitude: c.lat,
          longitude: c.lng,
          timeZone,
          source: 'atlas',
        });
        if (matches.length >= limit) break;
      }
    }
    // Deduplicate against curated
    const seen = new Set(curated.map((c) => `${c.name.toLowerCase()}|${c.country}`));
    const merged = [...curated];
    for (const m of matches) {
      const key = `${m.name.toLowerCase()}|${m.country}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(m);
      }
      if (merged.length >= limit) break;
    }
    return merged;
  } catch {
    return curated;
  }
}

export async function searchCityOnlineNominatim(query: string, signal?: AbortSignal): Promise<CityResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  const { default: tzlookup } = await import('tz-lookup');
  return data.map((row) => {
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    let tz = 'UTC';
    try {
      tz = tzlookup(lat, lon);
    } catch {
      tz = 'UTC';
    }
    const parts = row.display_name.split(',').map((s) => s.trim());
    return {
      name: parts[0] || row.display_name,
      admin1: parts[1],
      country: parts[parts.length - 1] || '',
      latitude: lat,
      longitude: lon,
      timeZone: tz,
      source: 'online',
    };
  });
}
