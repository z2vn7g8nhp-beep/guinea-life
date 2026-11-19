import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LocateFixed,
  MapPin,
  Menu,
  RefreshCw,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { LifestyleIndicesView } from './components/modules/LifestyleIndicesView';
import { CityPickerModal } from './components/weather/CityPickerModal';
import { DailyForecastCard } from './components/weather/DailyForecastCard';
import { HeroWeatherCard } from './components/weather/HeroWeatherCard';
import { HourlyForecastCard } from './components/weather/HourlyForecastCard';
import { PostcardModal } from './components/weather/PostcardModal';
import { RealisticWeatherCanvas } from './components/weather/RealisticWeatherCanvas';
import { SideMenuDrawer } from './components/weather/SideMenuDrawer';
import {
  WardrobeSimulatorSheet,
  type SheetTab,
} from './components/weather/WardrobeSimulatorSheet';
import { WeatherDetailsCard } from './components/weather/WeatherDetailsCard';
import {
  OUTFIT_LOCK_OPTIONS,
  getSeasonalSnack,
  resolveGuineaPigOutfit,
  type OutfitLockSpec,
  type WardrobeLookPreset,
} from './data/outfits';
import {
  CONDITION_LABELS,
  PRESET_CITIES,
  buildFallbackWeather,
  classifyAirQuality,
  detectLocationByIp,
  fetchCitiesBriefWeather,
  fetchLiveWeather,
  formatLocalYmd,
  reverseGeocodeCity,
} from './services/weatherApi';
import type {
  CityBriefWeather,
  CityLocation,
  CompanionStats,
  HourlyPoint,
  MascotCoatId,
  MascotSnackId,
  TimeOfDay,
  WeatherCondition,
  WeatherSnapshot,
} from './types/weather';
import { moveCity, upsertPrimaryLocatedCity } from './utils/cityList';
import type { TempUnit } from './utils/tempUnit';
import { buildWeatherAlert } from './utils/weatherAlerts';
import { weatherAudio } from './utils/weatherAudio';
import { getCachedWeather, setCachedWeather } from './utils/weatherCache';
import { getWeatherTheme } from './utils/weatherTheme';

interface SimOverrides {
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  timeOfDay: TimeOfDay;
  aqi?: number;
}

const CITIES_STORAGE_KEY = 'guinea_life_pinned_cities_v1';
const LOCATED_CITY_STORAGE_KEY = 'guinea_life_located_city_v1';
const UNIT_STORAGE_KEY = 'guinea_life_temp_unit_v1';
const COAT_STORAGE_KEY = 'guinea_life_coat_v1';
const PET_NAME_STORAGE_KEY = 'guinea_life_pet_name_v1';
const LOCKED_OUTFIT_STORAGE_KEY = 'guinea_life_locked_outfit_v1';
const AUTO_LOCATE_STORAGE_KEY = 'guinea_life_auto_locate_v1';
const COMPANION_STORAGE_KEY = 'guinea_life_companion_v1';

const DEFAULT_PINNED_CITIES: CityLocation[] = [
  PRESET_CITIES[0], // 上海
  PRESET_CITIES[1], // 北京
  PRESET_CITIES[6], // 东京
  PRESET_CITIES[7], // 伦敦
  PRESET_CITIES[3], // 哈尔滨
];

function loadInitialCities(): CityLocation[] {
  let savedList = DEFAULT_PINNED_CITIES;
  try {
    const raw = localStorage.getItem(CITIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CityLocation[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
        savedList = parsed;
      }
    }
  } catch {
    // ignore invalid localStorage
  }

  try {
    const rawLoc = localStorage.getItem(LOCATED_CITY_STORAGE_KEY);
    if (rawLoc) {
      const loc = JSON.parse(rawLoc) as CityLocation;
      if (loc?.name && typeof loc.latitude === 'number') {
        return upsertPrimaryLocatedCity(savedList, loc, loc.name);
      }
    }
  } catch {
    // ignore
  }

  return savedList;
}

function loadTempUnit(): TempUnit {
  try {
    const raw = localStorage.getItem(UNIT_STORAGE_KEY);
    if (raw === 'F' || raw === 'C') return raw;
  } catch {
    // ignore
  }
  return 'C';
}

function loadCoatId(): MascotCoatId {
  try {
    const raw = localStorage.getItem(COAT_STORAGE_KEY);
    if (raw === 'classic' || raw === 'cream' || raw === 'panda' || raw === 'caramel') {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'classic';
}

function loadPetName(): string {
  try {
    const raw = localStorage.getItem(PET_NAME_STORAGE_KEY);
    if (raw && raw.trim()) return raw.trim().slice(0, 10);
  } catch {
    // ignore
  }
  return '小棕团';
}

function loadAutoLocate(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_LOCATE_STORAGE_KEY);
    if (raw === 'false') return false;
  } catch {
    // ignore
  }
  return true;
}

function loadCompanionStats(): CompanionStats {
  const today = formatLocalYmd(new Date());
  try {
    const raw = localStorage.getItem(COMPANION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CompanionStats>;
      return {
        firstVisitDate: parsed.firstVisitDate || today,
        feedCount: typeof parsed.feedCount === 'number' ? parsed.feedCount : 0,
        petCount: typeof parsed.petCount === 'number' ? parsed.petCount : 0,
      };
    }
  } catch {
    // ignore
  }
  return { firstVisitDate: today, feedCount: 0, petCount: 0 };
}

function formatCityLocalTime(city: CityLocation, fallbackTime: string, nowMs: number): string {
  if (city.timezone && city.timezone !== 'auto') {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(nowMs));
    } catch {
      // fall through
    }
  }
  const clean = fallbackTime.replace(/\s*\(.*\)$/, '').trim();
  return clean || '--:--';
}

export function App() {
  const [pinnedCities, setPinnedCities] = useState<CityLocation[]>(loadInitialCities);
  const [activeCityIndex, setActiveCityIndex] = useState(0);
  const [locatedCityKey, setLocatedCityKey] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem(LOCATED_CITY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CityLocation;
        return parsed?.name ?? null;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | null>(null);
  const [autoLocate, setAutoLocate] = useState<boolean>(loadAutoLocate);
  const [unit, setUnit] = useState<TempUnit>(loadTempUnit);
  const [coatId, setCoatId] = useState<MascotCoatId>(loadCoatId);
  const [customName, setCustomName] = useState<string>(loadPetName);
  const [lockedOutfitId, setLockedOutfitId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCKED_OUTFIT_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [companionStats, setCompanionStats] = useState<CompanionStats>(loadCompanionStats);

  const safeIndex = Math.min(activeCityIndex, Math.max(0, pinnedCities.length - 1));
  const selectedCity = pinnedCities[safeIndex] ?? PRESET_CITIES[0];

  const [liveWeather, setLiveWeather] = useState<WeatherSnapshot>(() => {
    const cached = getCachedWeather(selectedCity);
    return cached ? cached.snapshot : buildFallbackWeather(selectedCity);
  });
  const [briefWeatherMap, setBriefWeatherMap] = useState<Record<string, CityBriefWeather>>({});
  const [sim, setSim] = useState<SimOverrides | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [cityAnimKey, setCityAnimKey] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab>('wardrobe');

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [startled, setStartled] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [feedEvent, setFeedEvent] = useState<{ id: number; snack: MascotSnackId } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const whisperTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const startledTimeoutRef = useRef<number | null>(null);
  const thunderTimeoutRef = useRef<number | null>(null);
  const userPickedCityRef = useRef(false);
  const weatherReqIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pullStartYRef = useRef<number | null>(null);
  const locatedCityKeyRef = useRef<string | null>(locatedCityKey);
  locatedCityKeyRef.current = locatedCityKey;

  const showToast = useCallback((msg: string) => {
    setLocationToast(msg);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setLocationToast(null);
    }, 2800);
  }, []);

  const showWhisper = useCallback((msg: string) => {
    setWhisper(msg);
    if (whisperTimeoutRef.current !== null) {
      window.clearTimeout(whisperTimeoutRef.current);
    }
    whisperTimeoutRef.current = window.setTimeout(() => {
      setWhisper(null);
    }, 3500);
  }, []);

  const applyLocatedCity = useCallback(
    (loc: CityLocation, source: 'gps' | 'ip', selectSlot: boolean) => {
      try {
        localStorage.setItem(LOCATED_CITY_STORAGE_KEY, JSON.stringify(loc));
      } catch {
        // ignore
      }
      const prevKey = locatedCityKeyRef.current;
      setLocatedCityKey(loc.name);
      setLocationSource(source);
      setPinnedCities((prev) => upsertPrimaryLocatedCity(prev, loc, prevKey));
      if (selectSlot) {
        setSim(null);
        setActiveCityIndex(0);
        setCityAnimKey((k) => k + 1);
      }
    },
    []
  );

  // Persist user preferences cleanly
  useEffect(() => {
    try {
      localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(pinnedCities));
    } catch {
      // ignore
    }
  }, [pinnedCities]);

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch {
      // ignore
    }
  }, [unit]);

  useEffect(() => {
    try {
      localStorage.setItem(COAT_STORAGE_KEY, coatId);
    } catch {
      // ignore
    }
  }, [coatId]);

  useEffect(() => {
    try {
      localStorage.setItem(PET_NAME_STORAGE_KEY, customName);
    } catch {
      // ignore
    }
  }, [customName]);

  useEffect(() => {
    try {
      if (lockedOutfitId) {
        localStorage.setItem(LOCKED_OUTFIT_STORAGE_KEY, lockedOutfitId);
      } else {
        localStorage.removeItem(LOCKED_OUTFIT_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [lockedOutfitId]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_LOCATE_STORAGE_KEY, String(autoLocate));
    } catch {
      // ignore
    }
  }, [autoLocate]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPANION_STORAGE_KEY, JSON.stringify(companionStats));
    } catch {
      // ignore
    }
  }, [companionStats]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (whisperTimeoutRef.current !== null) window.clearTimeout(whisperTimeoutRef.current);
      if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
      if (startledTimeoutRef.current !== null) window.clearTimeout(startledTimeoutRef.current);
      if (thunderTimeoutRef.current !== null) window.clearTimeout(thunderTimeoutRef.current);
      abortControllerRef.current?.abort();
    };
  }, []);

  // Automatic First-Launch Geolocation (GPS wins over slow IP!)
  useEffect(() => {
    if (!autoLocate) return;
    let cancelled = false;
    let gpsResolved = false;

    void detectLocationByIp().then((ipCity) => {
      if (cancelled || gpsResolved || !ipCity) return;
      applyLocatedCity(ipCity, 'ip', !userPickedCityRef.current);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          void reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude).then((gpsCity) => {
            if (cancelled) return;
            gpsResolved = true;
            applyLocatedCity(gpsCity, 'gps', !userPickedCityRef.current);
          });
        },
        () => {
          // Silent failure — IP geolocation already resolves city cleanly
        },
        { timeout: 5500, maximumAge: 300_000 }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [autoLocate, applyLocatedCity]);

  const loadWeatherForCity = useCallback(async (city: CityLocation, force = false) => {
    const reqId = ++weatherReqIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const cached = force ? null : getCachedWeather(city);
    if (cached) {
      setLiveWeather(cached.snapshot);
      if (cached.isFresh) {
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const snapshot = await fetchLiveWeather(city, controller.signal);
      if (reqId !== weatherReqIdRef.current) return;

      setLiveWeather(snapshot);
      setCachedWeather(snapshot.city, snapshot);

      // Persist resolved IANA timezone onto stored city if it previously used 'auto'
      if (
        snapshot.city.timezone &&
        snapshot.city.timezone !== 'auto' &&
        (!city.timezone || city.timezone === 'auto')
      ) {
        setPinnedCities((prev) =>
          prev.map((c) =>
            c.name === city.name &&
            Math.abs(c.latitude - city.latitude) < 0.05 &&
            Math.abs(c.longitude - city.longitude) < 0.05
              ? { ...c, timezone: snapshot.city.timezone }
              : c
          )
        );
      }
    } catch {
      // Aborted by newer selection; ignore silently
    } finally {
      if (reqId === weatherReqIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadWeatherForCity(selectedCity);
  }, [selectedCity, loadWeatherForCity]);

  // Refresh drawer brief weather temperatures when drawer opens
  useEffect(() => {
    if (!drawerOpen) return;
    let cancelled = false;
    void fetchCitiesBriefWeather(pinnedCities).then((map) => {
      if (!cancelled) setBriefWeatherMap(map);
    });
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, pinnedCities]);

  const effectiveWeather: WeatherSnapshot = useMemo(() => {
    if (!sim) return liveWeather;
    const isDay = sim.timeOfDay !== 'night';
    const cloudCover =
      sim.condition === 'clear'
        ? 8
        : sim.condition === 'partly-cloudy'
        ? 45
        : sim.condition === 'windy'
        ? 25
        : 92;

    const tempDelta = sim.temperature - liveWeather.temperature;
    const simHourly = liveWeather.hourly.map((h, idx) =>
      idx === 0
        ? {
            ...h,
            temperature: sim.temperature,
            condition: sim.condition,
            isDay,
          }
        : {
            ...h,
            temperature: h.temperature + tempDelta,
          }
    );

    const simDaily = liveWeather.daily.map((d, idx) =>
      idx === 0
        ? {
            ...d,
            condition: sim.condition,
            tempMax: Math.max(sim.temperature, d.tempMax + tempDelta),
            tempMin: Math.min(sim.temperature, d.tempMin + tempDelta),
          }
        : d
    );

    const simAqiVal = sim.aqi ?? liveWeather.airQuality?.aqi ?? 42;
    const simAirQuality = classifyAirQuality(
      simAqiVal,
      Math.round(simAqiVal * 0.45),
      Math.round(simAqiVal * 0.74)
    );

    return {
      ...liveWeather,
      temperature: sim.temperature,
      apparentTemperature: Math.round(
        sim.temperature - (sim.windSpeed > 22 ? 3 : sim.temperature >= 30 ? -2 : 0)
      ),
      condition: sim.condition,
      conditionLabel: CONDITION_LABELS[sim.condition],
      windSpeed: sim.windSpeed,
      timeOfDay: sim.timeOfDay,
      isDay,
      cloudCover,
      visibility: sim.condition === 'fog' ? 1.2 : sim.condition === 'blizzard' ? 2.2 : 16,
      uvIndex: !isDay ? 0 : sim.condition === 'clear' ? 7 : 2,
      hourly: simHourly,
      daily: simDaily,
      airQuality: simAirQuality,
      isSimulated: true,
    };
  }, [liveWeather, sim]);

  const weatherTheme = useMemo(
    () => getWeatherTheme(effectiveWeather.condition, effectiveWeather.timeOfDay),
    [effectiveWeather.condition, effectiveWeather.timeOfDay]
  );

  // Sync mobile browser chrome theme-color with active sky
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', weatherTheme.themeColor);
    }
  }, [weatherTheme.themeColor]);

  const lockedSpec = useMemo(
    () => OUTFIT_LOCK_OPTIONS.find((o) => o.id === lockedOutfitId) ?? null,
    [lockedOutfitId]
  );

  const outfit = useMemo(() => {
    if (lockedSpec) {
      return resolveGuineaPigOutfit(
        lockedSpec.temperature,
        lockedSpec.condition,
        lockedSpec.windSpeed,
        lockedSpec.isDay
      );
    }
    return resolveGuineaPigOutfit(
      effectiveWeather.temperature,
      effectiveWeather.condition,
      effectiveWeather.windSpeed,
      effectiveWeather.isDay
    );
  }, [
    lockedSpec,
    effectiveWeather.temperature,
    effectiveWeather.condition,
    effectiveWeather.windSpeed,
    effectiveWeather.isDay,
  ]);

  const aqiNeedsMask = Boolean(effectiveWeather.airQuality?.needsMask);
  const snack = useMemo(
    () => getSeasonalSnack(effectiveWeather.temperature, effectiveWeather.condition),
    [effectiveWeather.temperature, effectiveWeather.condition]
  );
  const weatherAlert = useMemo(() => buildWeatherAlert(effectiveWeather), [effectiveWeather]);

  useEffect(() => {
    weatherAudio.update(effectiveWeather.condition, effectiveWeather.windSpeed);
  }, [effectiveWeather.condition, effectiveWeather.windSpeed]);

  // Keyboard shortcuts: Escape closes modals, ArrowLeft/ArrowRight switches cities
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setCityModalOpen(false);
        setPostcardOpen(false);
        setSheetOpen(false);
        return;
      }
      const anyModalOpen = drawerOpen || cityModalOpen || postcardOpen || sheetOpen;
      if (anyModalOpen || pinnedCities.length <= 1) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        userPickedCityRef.current = true;
        setSim(null);
        setActiveCityIndex((prev) => (prev + 1) % pinnedCities.length);
        setCityAnimKey((k) => k + 1);
      } else if (e.key === 'ArrowLeft') {
        userPickedCityRef.current = true;
        setSim(null);
        setActiveCityIndex((prev) => (prev - 1 + pinnedCities.length) % pinnedCities.length);
        setCityAnimKey((k) => k + 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, cityModalOpen, postcardOpen, sheetOpen, pinnedCities.length]);

  const handlePetMascot = (quote: string) => {
    setCompanionStats((prev) => ({ ...prev, petCount: prev.petCount + 1 }));
    showWhisper(quote);
  };

  const handleFeedMascot = () => {
    weatherAudio.playEatChime();
    setCompanionStats((prev) => ({ ...prev, feedCount: prev.feedCount + 1 }));
    setFeedEvent({ id: Date.now(), snack: snack.id });
    const quote =
      snack.eatQuotes[Math.floor(Math.random() * snack.eatQuotes.length)] ??
      `好好吃的${snack.label}！`;
    showWhisper(quote);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    weatherAudio.setEnabled(next, effectiveWeather.condition, effectiveWeather.windSpeed);
  };

  const handleLightningFlash = useCallback(() => {
    setStartled(true);
    if (startledTimeoutRef.current !== null) {
      window.clearTimeout(startledTimeoutRef.current);
    }
    startledTimeoutRef.current = window.setTimeout(() => {
      setStartled(false);
      startledTimeoutRef.current = null;
    }, 520);

    if (thunderTimeoutRef.current !== null) {
      window.clearTimeout(thunderTimeoutRef.current);
    }
    thunderTimeoutRef.current = window.setTimeout(() => {
      weatherAudio.triggerThunder();
      thunderTimeoutRef.current = null;
    }, 240);
  }, []);

  const ensureSim = (): SimOverrides =>
    sim ?? {
      temperature: liveWeather.temperature,
      condition: liveWeather.condition,
      windSpeed: liveWeather.windSpeed,
      timeOfDay: liveWeather.timeOfDay,
      aqi: liveWeather.airQuality?.aqi ?? 42,
    };

  const handleAddOrSelectCity = (city: CityLocation) => {
    userPickedCityRef.current = true;
    setSim(null);
    setPinnedCities((prev) => {
      const existingIdx = prev.findIndex(
        (c) =>
          c.name === city.name &&
          Math.abs(c.latitude - city.latitude) < 0.08 &&
          Math.abs(c.longitude - city.longitude) < 0.08
      );
      if (existingIdx >= 0) {
        setActiveCityIndex(existingIdx);
        return prev;
      }
      setActiveCityIndex(prev.length);
      return [...prev, city];
    });
    setCityAnimKey((k) => k + 1);
  };

  const handleRemoveCity = (idx: number) => {
    if (pinnedCities.length <= 1) return;
    setPinnedCities((prev) => prev.filter((_, i) => i !== idx));
    setActiveCityIndex((prevIdx) => {
      if (prevIdx > idx) return prevIdx - 1;
      if (prevIdx === idx) return Math.max(0, idx - 1);
      return prevIdx;
    });
  };

  const handleMoveCity = (fromIdx: number, toIdx: number) => {
    setPinnedCities((prev) => moveCity(prev, fromIdx, toIdx));
    setActiveCityIndex((cur) => {
      if (cur === fromIdx) return toIdx;
      if (fromIdx < cur && toIdx >= cur) return cur - 1;
      if (fromIdx > cur && toIdx <= cur) return cur + 1;
      return cur;
    });
  };

  const handleLocateMe = useCallback(() => {
    userPickedCityRef.current = true;
    setLocating(true);

    const fallbackToIp = async () => {
      const ipCity = await detectLocationByIp();
      setLocating(false);
      if (ipCity) {
        applyLocatedCity(ipCity, 'ip', true);
        showToast(`已通过网络定位：${ipCity.name}`);
      } else {
        showToast('无法获取位置，请在菜单手动选择城市');
      }
    };

    if (!navigator.geolocation) {
      void fallbackToIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude).then((gpsCity) => {
          setLocating(false);
          applyLocatedCity(gpsCity, 'gps', true);
          showToast(`已定位到：${gpsCity.name}`);
        });
      },
      () => {
        void fallbackToIp();
      },
      { timeout: 6000, maximumAge: 120_000 }
    );
  }, [applyLocatedCity, showToast]);

  const handleApplyWardrobePreset = (preset: WardrobeLookPreset) => {
    setLockedOutfitId(null);
    setSim({
      ...ensureSim(),
      temperature: preset.temperature,
      condition: preset.condition,
      windSpeed: preset.windSpeed,
      timeOfDay: preset.isDay ? 'day' : 'night',
    });
  };

  const handleApplyTempSample = (temp: number) => {
    setLockedOutfitId(null);
    const base = ensureSim();
    setSim({
      ...base,
      temperature: temp,
      condition: temp <= -4 && base.condition === 'rain' ? 'snow' : base.condition,
    });
  };

  const handlePreviewHour = (point: HourlyPoint) => {
    setLockedOutfitId(null);
    setSim({
      ...ensureSim(),
      temperature: point.temperature,
      condition: point.condition,
      timeOfDay: point.isDay ? 'day' : 'night',
    });
    showToast(`已预览 ${point.hourLabel} 天气与穿搭`);
  };

  const handleSelectLockOutfit = (spec: OutfitLockSpec | null) => {
    setLockedOutfitId(spec ? spec.id : null);
    if (spec) {
      showToast(`已锁定穿搭：${spec.label}`);
    } else {
      showToast('已恢复随实时天气自动换装');
    }
  };

  const openSheet = (tab: SheetTab) => {
    setSheetTab(tab);
    setSheetOpen(true);
  };

  const handleHeroTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
    if (window.scrollY <= 2) {
      pullStartYRef.current = t.clientY;
    } else {
      pullStartYRef.current = null;
    }
  };

  const handleHeroTouchMove = (e: React.TouchEvent) => {
    const startY = pullStartYRef.current;
    const t = e.touches[0];
    if (startY === null || !t || window.scrollY > 2) {
      if (pullOffset !== 0) setPullOffset(0);
      return;
    }
    const dy = t.clientY - startY;
    if (dy > 16) {
      setPullOffset(Math.min(54, (dy - 16) * 0.45));
    }
  };

  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    touchStartRef.current = null;
    pullStartYRef.current = null;

    if (pullOffset >= 42) {
      setPullOffset(0);
      setSim(null);
      void loadWeatherForCity(selectedCity, true);
      showToast('已刷新实时天气');
      return;
    }
    setPullOffset(0);

    if (!start || !t || pinnedCities.length <= 1) return;

    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 68 && Math.abs(dx) > Math.abs(dy) * 1.6) {
      userPickedCityRef.current = true;
      setSim(null);
      if (dx < 0) {
        setActiveCityIndex((prev) => (prev + 1) % pinnedCities.length);
      } else {
        setActiveCityIndex((prev) => (prev - 1 + pinnedCities.length) % pinnedCities.length);
      }
      setCityAnimKey((k) => k + 1);
    }
  };

  const localTimeStr = formatCityLocalTime(
    effectiveWeather.city,
    effectiveWeather.updatedAt,
    nowMs
  );

  const isCurrentCityLocated =
    locatedCityKey !== null && effectiveWeather.city.name === locatedCityKey;

  const cleanPetName = customName.trim() || '小棕团';

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-clip text-white">
      {/* Full-bleed Photorealistic Weather Sky + Live Particle Engine */}
      <RealisticWeatherCanvas
        condition={effectiveWeather.condition}
        temperature={effectiveWeather.temperature}
        windSpeed={effectiveWeather.windSpeed}
        cloudCover={effectiveWeather.cloudCover}
        timeOfDay={effectiveWeather.timeOfDay}
        onLightningFlash={handleLightningFlash}
      />

      {/* Editorial Mobile-First Vertical Column (Zero Horizontal Wobble) */}
      <div className="relative z-10 mx-auto w-full max-w-[460px] overflow-x-clip px-4 pb-[max(3rem,env(safe-area-inset-bottom))]">
        {/* First Viewport: Top Chrome + Balanced Sky + Perched Guinea Pig & Hero Card */}
        <div
          onTouchStart={handleHeroTouchStart}
          onTouchMove={handleHeroTouchMove}
          onTouchEnd={handleHeroTouchEnd}
          style={{
            transform: pullOffset > 0 ? `translateY(${pullOffset * 0.4}px)` : undefined,
          }}
          className="flex min-h-[calc(100svh-84px)] flex-col justify-between pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 transition-transform duration-150"
        >
          {pullOffset > 14 && (
            <div className="pointer-events-none mx-auto mb-1 rounded-full bg-slate-950/65 px-3 py-0.5 text-[11px] text-white/85 backdrop-blur-md">
              {pullOffset >= 42 ? '松开刷新实时天气' : '下拉刷新…'}
            </div>
          )}

          {/* Floating Top Bar */}
          <header className="relative flex items-start justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="打开菜单"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/95 drop-shadow transition hover:bg-white/12 hover:text-white"
            >
              <Menu className="h-5.5 w-5.5" strokeWidth={1.8} />
            </button>

            <div className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="inline-flex items-center gap-1 text-[22px] font-medium tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition hover:opacity-85"
              >
                {isCurrentCityLocated && (
                  <MapPin className="h-4 w-4 text-amber-200" strokeWidth={2} />
                )}
                <span>{effectiveWeather.city.name}</span>
              </button>

              {locating ? (
                <div className="mt-0.5 text-[13px] font-normal text-amber-200 drop-shadow">
                  定位中…
                </div>
              ) : sim ? (
                <button
                  type="button"
                  onClick={() => setSim(null)}
                  className="mt-1 rounded-full border border-amber-200/40 bg-slate-950/65 px-3 py-0.5 text-[12px] font-normal text-amber-200 backdrop-blur-md transition hover:bg-slate-950/85"
                >
                  模拟中 · 点击恢复实时
                </button>
              ) : (
                <div className="mt-0.5 text-[14px] font-normal text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] tabular-nums">
                  {localTimeStr}
                </div>
              )}

              {/* City Pagination Dots */}
              {pinnedCities.length > 1 && (
                <div className="mt-1.5 flex items-center gap-1.5" aria-label="切换城市">
                  {pinnedCities.map((c, idx) => (
                    <button
                      key={`${c.name}-${idx}`}
                      type="button"
                      onClick={() => {
                        userPickedCityRef.current = true;
                        setSim(null);
                        setActiveCityIndex(idx);
                        setCityAnimKey((k) => k + 1);
                      }}
                      aria-label={`切换到 ${c.name}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === safeIndex
                          ? 'w-3.5 bg-white shadow-xs'
                          : 'w-1.5 bg-white/45 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locating}
                aria-label="定位到当前城市"
                title="定位到当前城市"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/92 drop-shadow transition hover:bg-white/12 hover:text-white disabled:opacity-50"
              >
                <LocateFixed
                  className={`h-5 w-5 ${locating ? 'animate-spin text-amber-200' : ''}`}
                  strokeWidth={1.8}
                />
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                aria-label={soundEnabled ? '关闭环境声景' : '开启环境声景'}
                title={soundEnabled ? '关闭环境声景' : '开启环境声景'}
                className={`flex h-10 w-10 items-center justify-center rounded-full drop-shadow transition hover:bg-white/12 ${
                  soundEnabled ? 'text-amber-200' : 'text-white/90 hover:text-white'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <VolumeX className="h-5 w-5" strokeWidth={1.8} />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSim(null);
                  void loadWeatherForCity(selectedCity, true);
                }}
                aria-label="刷新实时天气"
                title="刷新实时天气"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/92 drop-shadow transition hover:bg-white/12 hover:text-white"
              >
                <RefreshCw
                  className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                  strokeWidth={1.8}
                />
              </button>
            </div>

            {/* Clean Geolocation / Action Feedback Toast */}
            {locationToast && (
              <div
                role="status"
                className="animate-ui-bubble pointer-events-none absolute top-14 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/88 px-3.5 py-1.5 text-[13px] font-normal text-white shadow-xl backdrop-blur-md"
              >
                {locationToast}
              </div>
            )}
          </header>

          {/* Balanced Open Sky Space */}
          <div className="min-h-[10svh] flex-1" />

          {/* Perched Guinea Pig + Adaptive Dark Translucent Hero Card */}
          <div key={cityAnimKey} className="animate-ui-fade">
            <HeroWeatherCard
              weather={effectiveWeather}
              outfit={outfit}
              unit={unit}
              theme={weatherTheme}
              coatId={coatId}
              customName={cleanPetName}
              isOutfitLocked={Boolean(lockedOutfitId)}
              aqiNeedsMask={aqiNeedsMask}
              snack={snack}
              startled={startled}
              whisper={whisper}
              feedEvent={feedEvent}
              onPet={handlePetMascot}
              onFeed={handleFeedMascot}
              onOpenPostcard={() => setPostcardOpen(true)}
              onOpenWardrobe={() => openSheet('wardrobe')}
            />
          </div>
        </div>

        {/* Below-the-Fold Scrollable Feed */}
        <main className="space-y-3.5">
          {/* Smart Proactive Weather / AQI / Rain Alert Pill */}
          {weatherAlert && (
            <div
              className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[13px] backdrop-blur-xl ${
                weatherAlert.tone === 'rose'
                  ? 'border-rose-300/30 bg-rose-950/45 text-rose-100'
                  : weatherAlert.tone === 'amber'
                  ? 'border-amber-300/30 bg-amber-950/42 text-amber-100'
                  : 'border-sky-300/30 bg-slate-950/50 text-sky-100'
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-amber-200" />
              <span>{weatherAlert.message}</span>
            </div>
          )}

          <HourlyForecastCard
            hourly={effectiveWeather.hourly}
            unit={unit}
            theme={weatherTheme}
            onPreviewHour={handlePreviewHour}
          />
          <DailyForecastCard
            daily={effectiveWeather.daily}
            unit={unit}
            theme={weatherTheme}
          />
          <WeatherDetailsCard
            weather={effectiveWeather}
            unit={unit}
            localTimeStr={localTimeStr}
            theme={weatherTheme}
          />
          <LifestyleIndicesView weather={effectiveWeather} theme={weatherTheme} />

          {/* Clean Lab Triggers & Attribution */}
          <footer className="flex flex-col items-center gap-3 pt-3 text-center">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => openSheet('wardrobe')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-slate-950/50 px-4 py-2 text-[13px] font-normal text-white/90 backdrop-blur-md transition hover:bg-slate-950/75 hover:text-white"
              >
                <Shirt className="h-4 w-4 text-amber-200" strokeWidth={1.7} />
                豚鼠衣橱
              </button>
              <button
                type="button"
                onClick={() => openSheet('simulator')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/16 bg-slate-950/50 px-4 py-2 text-[13px] font-normal text-white/90 backdrop-blur-md transition hover:bg-slate-950/75 hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4 text-sky-200" strokeWidth={1.7} />
                天气模拟
              </button>
            </div>
            <p className="text-[12px] font-normal text-white/60">
              豚鼠生活馆 GuineaLife · 实时气象与空气质量由 Open-Meteo 提供
            </p>
          </footer>
        </main>
      </div>

      {/* Slide-over Left Menu Drawer */}
      <SideMenuDrawer
        open={drawerOpen}
        pinnedCities={pinnedCities}
        activeCityIndex={safeIndex}
        briefWeatherMap={briefWeatherMap}
        locatedCityKey={locatedCityKey}
        locationSource={locationSource}
        autoLocate={autoLocate}
        unit={unit}
        soundEnabled={soundEnabled}
        locating={locating}
        onClose={() => setDrawerOpen(false)}
        onSelectCityIndex={(idx) => {
          userPickedCityRef.current = true;
          setSim(null);
          setActiveCityIndex(idx);
          setCityAnimKey((k) => k + 1);
        }}
        onMoveCity={handleMoveCity}
        onRemoveCity={handleRemoveCity}
        onOpenCityPicker={() => setCityModalOpen(true)}
        onLocateMe={handleLocateMe}
        onToggleAutoLocate={() => setAutoLocate((v) => !v)}
        onToggleUnit={setUnit}
        onToggleSound={handleToggleSound}
        onOpenSheet={openSheet}
      />

      {/* Non-blocking Live-Preview Wardrobe & Simulator Bottom Sheet */}
      <WardrobeSimulatorSheet
        open={sheetOpen}
        activeTab={sheetTab}
        onChangeTab={setSheetTab}
        onClose={() => setSheetOpen(false)}
        currentOutfit={outfit}
        isSimulated={Boolean(sim)}
        temperature={effectiveWeather.temperature}
        condition={effectiveWeather.condition}
        windSpeed={effectiveWeather.windSpeed}
        timeOfDay={effectiveWeather.timeOfDay}
        simAqi={effectiveWeather.airQuality?.aqi ?? 42}
        unit={unit}
        coatId={coatId}
        customName={customName}
        lockedOutfitId={lockedOutfitId}
        companionStats={companionStats}
        snack={snack}
        onChangeCoat={setCoatId}
        onChangeCustomName={setCustomName}
        onFeed={handleFeedMascot}
        onSelectLockOutfit={handleSelectLockOutfit}
        onApplyPreset={handleApplyWardrobePreset}
        onApplyTempSample={handleApplyTempSample}
        onChangeTemp={(t) => {
          setLockedOutfitId(null);
          setSim({ ...ensureSim(), temperature: t });
        }}
        onChangeCondition={(c) => {
          setLockedOutfitId(null);
          setSim({ ...ensureSim(), condition: c });
        }}
        onChangeWind={(w) => setSim({ ...ensureSim(), windSpeed: w })}
        onChangeTimeOfDay={(tod) => {
          setLockedOutfitId(null);
          setSim({ ...ensureSim(), timeOfDay: tod });
        }}
        onChangeSimAqi={(aqi) => setSim({ ...ensureSim(), aqi })}
        onResetLive={() => setSim(null)}
      />

      {/* Global City Picker Modal */}
      <CityPickerModal
        open={cityModalOpen}
        currentCity={effectiveWeather.city}
        onClose={() => setCityModalOpen(false)}
        onSelectCity={handleAddOrSelectCity}
        onLocateMe={handleLocateMe}
        locating={locating}
      />

      {/* Daily Weather Postcard Modal */}
      <PostcardModal
        open={postcardOpen}
        weather={effectiveWeather}
        outfit={outfit}
        coatId={coatId}
        customName={cleanPetName}
        unit={unit}
        localTimeStr={localTimeStr}
        aqiNeedsMask={aqiNeedsMask}
        onClose={() => setPostcardOpen(false)}
      />
    </div>
  );
}

export default App;
