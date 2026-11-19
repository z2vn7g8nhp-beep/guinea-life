import type { CityLocation, WeatherSnapshot } from '../types/weather';
import { cityCoordKey } from '../services/weatherApi';

const CACHE_KEY = 'guinea_life_weather_cache_v1';
const FRESH_MS = 8 * 60_000;
const STALE_MS = 60 * 60_000;
const MAX_ENTRIES = 12;

interface CacheEntry {
  snapshot: WeatherSnapshot;
  savedAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
let hydrated = false;

function hydrateOnce(): void {
  if (hydrated || typeof localStorage === 'undefined') {
    hydrated = true;
    return;
  }
  hydrated = true;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [k, v] of Object.entries(parsed)) {
      if (v && v.snapshot && typeof v.savedAt === 'number' && now - v.savedAt < STALE_MS) {
        memoryCache.set(k, v);
      }
    }
  } catch {
    // ignore corrupt cache
  }
}

function persistCache(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => b[1].savedAt - a[1].savedAt)
      .slice(0, MAX_ENTRIES);
    const obj: Record<string, CacheEntry> = {};
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {
    // ignore storage quota errors
  }
}

export function getCachedWeather(
  city: CityLocation
): { snapshot: WeatherSnapshot; isFresh: boolean } | null {
  hydrateOnce();
  const key = cityCoordKey(city);
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.savedAt;
  if (age > STALE_MS) {
    memoryCache.delete(key);
    return null;
  }
  return {
    snapshot: { ...entry.snapshot, city },
    isFresh: age <= FRESH_MS,
  };
}

export function setCachedWeather(city: CityLocation, snapshot: WeatherSnapshot): void {
  if (snapshot.isOfflineFallback || snapshot.isSimulated) return;
  hydrateOnce();
  const key = cityCoordKey(city);
  memoryCache.set(key, {
    snapshot,
    savedAt: Date.now(),
  });
  persistCache();
}
