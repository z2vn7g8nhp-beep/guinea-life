import type {
  CityLocation,
  DailyPoint,
  HourlyPoint,
  TimeOfDay,
  WeatherCondition,
  WeatherSnapshot,
} from '../types/weather';

export const PRESET_CITIES: CityLocation[] = [
  { name: '上海', region: '华东', country: '中国', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' },
  { name: '北京', region: '华北', country: '中国', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai' },
  { name: '深圳', region: '华南', country: '中国', latitude: 22.5431, longitude: 114.0579, timezone: 'Asia/Shanghai' },
  { name: '哈尔滨', region: '东北', country: '中国', latitude: 45.8038, longitude: 126.535, timezone: 'Asia/Shanghai' },
  { name: '成都', region: '西南', country: '中国', latitude: 30.5728, longitude: 104.0668, timezone: 'Asia/Shanghai' },
  { name: '拉萨', region: '高原', country: '中国', latitude: 29.6525, longitude: 91.1721, timezone: 'Asia/Shanghai' },
  { name: '东京', region: '关东', country: '日本', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: '伦敦', region: '英格兰', country: '英国', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { name: '雷克雅未克', region: '北欧', country: '冰岛', latitude: 64.1466, longitude: -21.9426, timezone: 'Atlantic/Reykjavik' },
];

export const CONDITION_LABELS: Record<WeatherCondition, string> = {
  clear: '晴朗',
  'partly-cloudy': '多云转晴',
  overcast: '阴天',
  fog: '轻雾弥漫',
  drizzle: '细雨绵绵',
  rain: '小到中雨',
  'heavy-rain': '倾盆大雨',
  thunderstorm: '雷阵雨',
  snow: '纷飞小雪',
  blizzard: '暴风雪',
  windy: '清风扬拂',
};

export function mapWmoCodeToCondition(code: number, windSpeedKmh = 0): WeatherCondition {
  if (code === 0) {
    return windSpeedKmh >= 34 ? 'windy' : 'clear';
  }
  if (code === 1 || code === 2) {
    return windSpeedKmh >= 36 ? 'windy' : 'partly-cloudy';
  }
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code === 61 || code === 63 || code === 80 || code === 81) return 'rain';
  if (code === 65 || code === 66 || code === 67 || code === 82) return 'heavy-rain';
  if (code === 71 || code === 73 || code === 77 || code === 85) return 'snow';
  if (code === 75 || code === 86) return 'blizzard';
  if (code >= 95) return 'thunderstorm';
  return 'partly-cloudy';
}

export function deriveTimeOfDay(
  currentIso: string,
  sunriseIso: string,
  sunsetIso: string,
  isDayFlag: boolean
): TimeOfDay {
  const parseHourMinute = (iso: string): number | null => {
    const match = iso.match(/T(\d{2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  };

  const nowMin = parseHourMinute(currentIso);
  const riseMin = parseHourMinute(sunriseIso);
  const setMin = parseHourMinute(sunsetIso);

  if (nowMin !== null && riseMin !== null && setMin !== null) {
    if (Math.abs(nowMin - riseMin) <= 55) return 'dawn';
    if (Math.abs(nowMin - setMin) <= 60) return 'sunset';
    if (nowMin > riseMin && nowMin < setMin) return 'day';
    return 'night';
  }
  return isDayFlag ? 'day' : 'night';
}

function formatDayLabel(dateStr: string, index: number): string {
  if (index === 0) return '今天';
  if (index === 1) return '明天';
  const date = new Date(`${dateStr}T12:00:00`);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()] ?? dateStr.slice(5);
}

function formatHourLabel(iso: string, index: number): string {
  if (index === 0) return '现在';
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : iso;
}

export function normalizeChineseCityName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('市') && trimmed.length > 2) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

export async function reverseGeocodeCity(
  latitude: number,
  longitude: number
): Promise<CityLocation> {
  const fallback: CityLocation = {
    name: '当前位置',
    region: 'GPS 定位',
    latitude,
    longitude,
    timezone: 'auto',
  };

  try {
    const url = new URL('https://api-bdc.io/data/reverse-geocode-client');
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('localityLanguage', 'zh');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };

    const rawCity = data.city || data.locality || data.principalSubdivision || '';
    const cityName = normalizeChineseCityName(rawCity);
    if (!cityName) return fallback;

    const rawSub = data.principalSubdivision?.trim();
    const country =
      data.countryName === '中华人民共和国' ? '中国' : data.countryName?.trim();

    return {
      name: cityName,
      region: rawSub && normalizeChineseCityName(rawSub) !== cityName ? rawSub : data.locality?.trim(),
      country,
      latitude,
      longitude,
      timezone: 'auto',
    };
  } catch {
    return fallback;
  }
}

export async function detectLocationByIp(): Promise<CityLocation | null> {
  const tryIpWhoIs = async (): Promise<{
    lat: number;
    lon: number;
    city?: string;
    timezone?: string;
  } | null> => {
    try {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      const d = (await res.json()) as {
        success?: boolean;
        latitude?: number;
        longitude?: number;
        city?: string;
        timezone?: { id?: string };
      };
      if (d.success === false || typeof d.latitude !== 'number' || typeof d.longitude !== 'number') {
        return null;
      }
      return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city,
        timezone: d.timezone?.id,
      };
    } catch {
      return null;
    }
  };

  const tryGeoJs = async (): Promise<{
    lat: number;
    lon: number;
    city?: string;
    timezone?: string;
  } | null> => {
    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return null;
      const d = (await res.json()) as {
        latitude?: string | number;
        longitude?: string | number;
        city?: string;
        timezone?: string;
      };
      const lat = Number(d.latitude);
      const lon = Number(d.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
      return { lat, lon, city: d.city, timezone: d.timezone };
    } catch {
      return null;
    }
  };

  const ipPos = (await tryIpWhoIs()) ?? (await tryGeoJs());
  if (!ipPos) return null;

  const resolved = await reverseGeocodeCity(ipPos.lat, ipPos.lon);
  if (resolved.name !== '当前位置') {
    return {
      ...resolved,
      timezone: ipPos.timezone || resolved.timezone,
    };
  }

  if (ipPos.city) {
    const matches = await searchCities(ipPos.city);
    if (matches[0]) {
      return {
        ...matches[0],
        latitude: ipPos.lat,
        longitude: ipPos.lon,
        timezone: ipPos.timezone || matches[0].timezone,
      };
    }
    return {
      name: normalizeChineseCityName(ipPos.city) || ipPos.city,
      latitude: ipPos.lat,
      longitude: ipPos.lon,
      timezone: ipPos.timezone || 'auto',
    };
  }

  return null;
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return PRESET_CITIES;

  const localMatches = PRESET_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
      (c.country && c.country.toLowerCase().includes(trimmed.toLowerCase()))
  );

  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '8');
    url.searchParams.set('language', 'zh');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Geocoding error: ${res.status}`);
    const data = (await res.json()) as {
      results?: Array<{
        name: string;
        admin1?: string;
        country?: string;
        latitude: number;
        longitude: number;
        timezone?: string;
      }>;
    };

    const remote: CityLocation[] = (data.results ?? []).map((item) => ({
      name: item.name,
      region: item.admin1,
      country: item.country,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
    }));

    if (remote.length > 0) return remote;
    return localMatches;
  } catch {
    return localMatches;
  }
}

export function buildFallbackWeather(city: CityLocation): WeatherSnapshot {
  const now = new Date();
  const baseTempMap: Record<string, { temp: number; cond: WeatherCondition; hum: number; wind: number }> = {
    哈尔滨: { temp: -7, cond: 'snow', hum: 76, wind: 19 },
    北京: { temp: 8, cond: 'clear', hum: 38, wind: 16 },
    上海: { temp: 16, cond: 'partly-cloudy', hum: 62, wind: 14 },
    深圳: { temp: 26, cond: 'clear', hum: 68, wind: 12 },
    成都: { temp: 14, cond: 'fog', hum: 84, wind: 7 },
    拉萨: { temp: 5, cond: 'clear', hum: 28, wind: 21 },
    东京: { temp: 15, cond: 'rain', hum: 82, wind: 18 },
    伦敦: { temp: 10, cond: 'drizzle', hum: 88, wind: 24 },
    雷克雅未克: { temp: -2, cond: 'blizzard', hum: 85, wind: 36 },
  };

  const preset = baseTempMap[city.name] ?? { temp: 20, cond: 'partly-cloudy' as WeatherCondition, hum: 58, wind: 13 };
  const hour = now.getHours();
  const isDay = hour >= 6 && hour < 18;
  const timeOfDay: TimeOfDay = hour >= 5 && hour < 7 ? 'dawn' : hour >= 17 && hour < 19 ? 'sunset' : isDay ? 'day' : 'night';

  const hourly: HourlyPoint[] = Array.from({ length: 12 }, (_, idx) => {
    const h = (hour + idx) % 24;
    const wave = Math.round(Math.sin(((h - 8) / 24) * Math.PI * 2) * 3.5);
    return {
      time: `${String(h).padStart(2, '0')}:00`,
      hourLabel: idx === 0 ? '现在' : `${String(h).padStart(2, '0')}:00`,
      temperature: preset.temp + wave,
      condition: idx % 5 === 4 && preset.cond === 'clear' ? 'partly-cloudy' : preset.cond,
      precipitationProb: preset.cond.includes('rain') || preset.cond === 'snow' ? 65 : 15,
      isDay: h >= 6 && h < 18,
    };
  });

  const daily: DailyPoint[] = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now.getTime() + idx * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const delta = ((idx * 3) % 5) - 2;
    return {
      date: dateStr,
      dayLabel: formatDayLabel(dateStr, idx),
      condition: idx === 2 ? 'rain' : idx === 4 ? 'partly-cloudy' : preset.cond,
      tempMax: preset.temp + 4 + delta,
      tempMin: preset.temp - 4 + delta,
      precipitationProb: idx === 2 ? 75 : 20,
      uvIndexMax: preset.cond === 'clear' ? 6 : 3,
    };
  });

  return {
    city,
    temperature: preset.temp,
    apparentTemperature: preset.temp - (preset.wind > 20 ? 2 : 0),
    humidity: preset.hum,
    windSpeed: preset.wind,
    windDirection: 135,
    pressure: 1015,
    uvIndex: isDay ? (preset.cond === 'clear' ? 5 : 2) : 0,
    visibility: preset.cond === 'fog' ? 1.8 : preset.cond === 'blizzard' ? 2.5 : 16,
    cloudCover: preset.cond === 'clear' ? 10 : preset.cond === 'partly-cloudy' ? 45 : 85,
    condition: preset.cond,
    conditionLabel: CONDITION_LABELS[preset.cond],
    isDay,
    timeOfDay,
    sunrise: '06:32',
    sunset: '17:48',
    updatedAt: `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} (离线示例)`,
    hourly,
    daily,
    isOfflineFallback: true,
  };
}

export async function fetchLiveWeather(city: CityLocation): Promise<WeatherSnapshot> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(city.latitude));
    url.searchParams.set('longitude', String(city.longitude));
    url.searchParams.set(
      'current',
      [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'weather_code',
        'cloud_cover',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
      ].join(',')
    );
    url.searchParams.set(
      'hourly',
      ['temperature_2m', 'weather_code', 'precipitation_probability', 'is_day', 'visibility', 'uv_index'].join(',')
    );
    url.searchParams.set(
      'daily',
      ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'sunrise', 'sunset', 'uv_index_max', 'precipitation_probability_max'].join(',')
    );
    url.searchParams.set('timezone', city.timezone || 'auto');
    url.searchParams.set('forecast_days', '7');

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const data = (await res.json()) as {
      current: {
        time: string;
        temperature_2m: number;
        relative_humidity_2m: number;
        apparent_temperature: number;
        is_day: number;
        weather_code: number;
        cloud_cover: number;
        surface_pressure: number;
        wind_speed_10m: number;
        wind_direction_10m: number;
      };
      hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        precipitation_probability: number[];
        is_day: number[];
        visibility: number[];
        uv_index: number[];
      };
      daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        sunrise: string[];
        sunset: string[];
        uv_index_max: number[];
        precipitation_probability_max: number[];
      };
    };

    const current = data.current;
    const isDay = current.is_day === 1;
    const sunrise = data.daily.sunrise?.[0] ?? '';
    const sunset = data.daily.sunset?.[0] ?? '';
    const condition = mapWmoCodeToCondition(current.weather_code, current.wind_speed_10m);
    const timeOfDay = deriveTimeOfDay(current.time, sunrise, sunset, isDay);

    const currentHourPrefix = current.time.slice(0, 13);
    const startIdx = Math.max(
      0,
      data.hourly.time.findIndex((t) => t.startsWith(currentHourPrefix))
    );

    const hourly: HourlyPoint[] = data.hourly.time.slice(startIdx, startIdx + 12).map((t, idx) => {
      const realIdx = startIdx + idx;
      return {
        time: t,
        hourLabel: formatHourLabel(t, idx),
        temperature: Math.round(data.hourly.temperature_2m[realIdx] ?? current.temperature_2m),
        condition: mapWmoCodeToCondition(data.hourly.weather_code[realIdx] ?? current.weather_code),
        precipitationProb: Math.round(data.hourly.precipitation_probability[realIdx] ?? 0),
        isDay: (data.hourly.is_day[realIdx] ?? current.is_day) === 1,
      };
    });

    const daily: DailyPoint[] = data.daily.time.map((dateStr, idx) => ({
      date: dateStr,
      dayLabel: formatDayLabel(dateStr, idx),
      condition: mapWmoCodeToCondition(data.daily.weather_code[idx] ?? 0),
      tempMax: Math.round(data.daily.temperature_2m_max[idx] ?? current.temperature_2m),
      tempMin: Math.round(data.daily.temperature_2m_min[idx] ?? current.temperature_2m),
      precipitationProb: Math.round(data.daily.precipitation_probability_max[idx] ?? 0),
      uvIndexMax: Math.round((data.daily.uv_index_max[idx] ?? 0) * 10) / 10,
    }));

    const visibilityMeters = data.hourly.visibility?.[startIdx] ?? 16000;
    const currentUv = data.hourly.uv_index?.[startIdx] ?? 0;

    return {
      city,
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: Math.round(current.wind_direction_10m),
      pressure: Math.round(current.surface_pressure),
      uvIndex: Math.round(currentUv * 10) / 10,
      visibility: Math.round((visibilityMeters / 1000) * 10) / 10,
      cloudCover: Math.round(current.cloud_cover),
      condition,
      conditionLabel: CONDITION_LABELS[condition],
      isDay,
      timeOfDay,
      sunrise: sunrise.slice(11, 16) || '06:30',
      sunset: sunset.slice(11, 16) || '18:00',
      updatedAt: current.time.slice(11, 16) || '刚刚',
      hourly,
      daily,
    };
  } catch {
    return buildFallbackWeather(city);
  }
}
