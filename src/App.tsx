import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LocateFixed,
  MapPin,
  Menu,
  RefreshCw,
  Shirt,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CityPickerModal } from './components/weather/CityPickerModal';
import { DailyForecastCard } from './components/weather/DailyForecastCard';
import { HeroWeatherCard } from './components/weather/HeroWeatherCard';
import { HourlyForecastCard } from './components/weather/HourlyForecastCard';
import { RealisticWeatherCanvas } from './components/weather/RealisticWeatherCanvas';
import { SideMenuDrawer } from './components/weather/SideMenuDrawer';
import {
  WardrobeSimulatorSheet,
  type SheetTab,
} from './components/weather/WardrobeSimulatorSheet';
import { WeatherDetailsCard } from './components/weather/WeatherDetailsCard';
import { LifestyleIndicesView } from './components/modules/LifestyleIndicesView';
import { resolveGuineaPigOutfit, type WardrobeLookPreset } from './data/outfits';
import {
  CONDITION_LABELS,
  PRESET_CITIES,
  buildFallbackWeather,
  detectLocationByIp,
  fetchLiveWeather,
  reverseGeocodeCity,
} from './services/weatherApi';
import type {
  CityLocation,
  TimeOfDay,
  WeatherCondition,
  WeatherSnapshot,
} from './types/weather';
import type { TempUnit } from './utils/tempUnit';
import { weatherAudio } from './utils/weatherAudio';

interface SimOverrides {
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  timeOfDay: TimeOfDay;
}

const CITIES_STORAGE_KEY = 'guinea_life_pinned_cities_v1';
const LOCATED_CITY_STORAGE_KEY = 'guinea_life_located_city_v1';
const UNIT_STORAGE_KEY = 'guinea_life_temp_unit_v1';

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
        const rest = savedList.filter(
          (c) =>
            c.name !== '当前位置' &&
            !(c.name === loc.name && Math.abs(c.latitude - loc.latitude) < 0.1)
        );
        return [loc, ...rest];
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

function upsertPrimaryLocatedCity(prev: CityLocation[], loc: CityLocation): CityLocation[] {
  const rest = prev.filter(
    (c, idx) =>
      idx !== 0 &&
      c.name !== '当前位置' &&
      !(c.name === loc.name && Math.abs(c.latitude - loc.latitude) < 0.12)
  );
  // If old slot 0 was a preset city (not previously auto-located or '当前位置'), keep it right after
  const oldFirst = prev[0];
  if (
    oldFirst &&
    oldFirst.name !== '当前位置' &&
    !(oldFirst.name === loc.name && Math.abs(oldFirst.latitude - loc.latitude) < 0.12) &&
    PRESET_CITIES.some((p) => p.name === oldFirst.name)
  ) {
    return [loc, oldFirst, ...rest.filter((r) => r.name !== oldFirst.name)];
  }
  return [loc, ...rest];
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
  const [unit, setUnit] = useState<TempUnit>(loadTempUnit);

  const selectedCity = pinnedCities[activeCityIndex] ?? pinnedCities[0] ?? PRESET_CITIES[0];

  const [liveWeather, setLiveWeather] = useState<WeatherSnapshot>(() =>
    buildFallbackWeather(selectedCity)
  );
  const [sim, setSim] = useState<SimOverrides | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab>('wardrobe');

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [startled, setStartled] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const whisperTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const userPickedCityRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const showToast = useCallback((msg: string) => {
    setLocationToast(msg);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setLocationToast(null);
    }, 2800);
  }, []);

  const applyLocatedCity = useCallback((loc: CityLocation, selectSlot: boolean) => {
    try {
      localStorage.setItem(LOCATED_CITY_STORAGE_KEY, JSON.stringify(loc));
    } catch {
      // ignore
    }
    setLocatedCityKey(loc.name);
    setPinnedCities((prev) => upsertPrimaryLocatedCity(prev, loc));
    if (selectSlot) {
      setSim(null);
      setActiveCityIndex(0);
    }
  }, []);

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
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setCityModalOpen(false);
        setSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Automatic First-Launch Geolocation (instant IP lookup + silent GPS refinement)
  useEffect(() => {
    let cancelled = false;

    void detectLocationByIp().then((ipCity) => {
      if (cancelled || !ipCity) return;
      applyLocatedCity(ipCity, !userPickedCityRef.current);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          void reverseGeocodeCity(pos.coords.latitude, pos.coords.longitude).then((gpsCity) => {
            if (cancelled) return;
            applyLocatedCity(gpsCity, !userPickedCityRef.current);
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
  }, [applyLocatedCity]);

  const loadWeatherForCity = useCallback(async (city: CityLocation) => {
    setLoading(true);
    const snapshot = await fetchLiveWeather(city);
    setLiveWeather(snapshot);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadWeatherForCity(selectedCity);
  }, [selectedCity, loadWeatherForCity]);

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
      isSimulated: true,
    };
  }, [liveWeather, sim]);

  const outfit = useMemo(
    () =>
      resolveGuineaPigOutfit(
        effectiveWeather.temperature,
        effectiveWeather.condition,
        effectiveWeather.windSpeed,
        effectiveWeather.isDay
      ),
    [
      effectiveWeather.temperature,
      effectiveWeather.condition,
      effectiveWeather.windSpeed,
      effectiveWeather.isDay,
    ]
  );

  useEffect(() => {
    weatherAudio.update(effectiveWeather.condition, effectiveWeather.windSpeed);
  }, [effectiveWeather.condition, effectiveWeather.windSpeed]);

  const handlePetMascot = (quote: string) => {
    setWhisper(quote);
    if (whisperTimeoutRef.current !== null) {
      window.clearTimeout(whisperTimeoutRef.current);
    }
    whisperTimeoutRef.current = window.setTimeout(() => {
      setWhisper(null);
    }, 3500);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    weatherAudio.setEnabled(next, effectiveWeather.condition, effectiveWeather.windSpeed);
  };

  const handleLightningFlash = useCallback(() => {
    setStartled(true);
    window.setTimeout(() => setStartled(false), 520);
  }, []);

  const ensureSim = (): SimOverrides =>
    sim ?? {
      temperature: liveWeather.temperature,
      condition: liveWeather.condition,
      windSpeed: liveWeather.windSpeed,
      timeOfDay: liveWeather.timeOfDay,
    };

  const handleAddOrSelectCity = (city: CityLocation) => {
    userPickedCityRef.current = true;
    setSim(null);
    const existingIdx = pinnedCities.findIndex(
      (c) =>
        c.name === city.name &&
        Math.abs(c.latitude - city.latitude) < 0.08 &&
        Math.abs(c.longitude - city.longitude) < 0.08
    );
    if (existingIdx >= 0) {
      setActiveCityIndex(existingIdx);
    } else {
      setPinnedCities((prev) => [...prev, city]);
      setActiveCityIndex(pinnedCities.length);
    }
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

  const handleLocateMe = useCallback(() => {
    userPickedCityRef.current = true;
    setLocating(true);

    const fallbackToIp = async () => {
      const ipCity = await detectLocationByIp();
      setLocating(false);
      if (ipCity) {
        applyLocatedCity(ipCity, true);
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
          applyLocatedCity(gpsCity, true);
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
    setSim({
      temperature: preset.temperature,
      condition: preset.condition,
      windSpeed: preset.windSpeed,
      timeOfDay: preset.isDay ? 'day' : 'night',
    });
  };

  const handleApplyTempSample = (temp: number) => {
    const base = ensureSim();
    setSim({
      ...base,
      temperature: temp,
      condition: temp <= -4 && base.condition === 'rain' ? 'snow' : base.condition,
    });
  };

  const openSheet = (tab: SheetTab) => {
    setSheetTab(tab);
    setSheetOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    const t = e.changedTouches[0];
    touchStartRef.current = null;
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
    }
  };

  const localTimeStr = formatCityLocalTime(
    effectiveWeather.city,
    effectiveWeather.updatedAt,
    nowMs
  );

  const isCurrentCityLocated =
    locatedCityKey !== null && effectiveWeather.city.name === locatedCityKey;

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
      <div className="relative z-10 mx-auto w-full max-w-[460px] overflow-x-clip px-4 pb-12">
        {/* First Viewport: Top Chrome + Balanced Sky + Perched Guinea Pig & Hero Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex min-h-[calc(100svh-84px)] flex-col justify-between pt-3 pb-3"
        >
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
                  className="mt-1 rounded-full border border-amber-200/40 bg-slate-950/60 px-3 py-0.5 text-[12px] font-normal text-amber-200 backdrop-blur-md transition hover:bg-slate-950/80"
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
                      }}
                      aria-label={`切换到 ${c.name}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeCityIndex
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
                  void loadWeatherForCity(selectedCity);
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

            {/* Clean Geolocation Feedback Toast */}
            {locationToast && (
              <div
                role="status"
                className="animate-ui-bubble pointer-events-none absolute top-14 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/20 bg-slate-950/85 px-3.5 py-1.5 text-[13px] font-normal text-white shadow-xl backdrop-blur-md"
              >
                {locationToast}
              </div>
            )}
          </header>

          {/* Balanced Open Sky Space (no empty void!) */}
          <div className="min-h-[10svh] flex-1" />

          {/* Perched Guinea Pig + Dark Translucent Hero Card */}
          <HeroWeatherCard
            weather={effectiveWeather}
            outfit={outfit}
            unit={unit}
            startled={startled}
            whisper={whisper}
            onPet={handlePetMascot}
            onOpenWardrobe={() => openSheet('wardrobe')}
          />
        </div>

        {/* Below-the-Fold Scrollable Feed (Hourly header peeks ~76px at fold) */}
        <main className="space-y-3.5">
          <HourlyForecastCard hourly={effectiveWeather.hourly} unit={unit} />
          <DailyForecastCard daily={effectiveWeather.daily} unit={unit} />
          <WeatherDetailsCard
            weather={effectiveWeather}
            unit={unit}
            localTimeStr={localTimeStr}
          />
          <LifestyleIndicesView weather={effectiveWeather} />

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
              豚鼠生活馆 GuineaLife · 实时气象由 Open-Meteo 提供
            </p>
          </footer>
        </main>
      </div>

      {/* Slide-over Left Menu Drawer */}
      <SideMenuDrawer
        open={drawerOpen}
        pinnedCities={pinnedCities}
        activeCityIndex={activeCityIndex}
        unit={unit}
        soundEnabled={soundEnabled}
        locating={locating}
        onClose={() => setDrawerOpen(false)}
        onSelectCityIndex={(idx) => {
          userPickedCityRef.current = true;
          setSim(null);
          setActiveCityIndex(idx);
        }}
        onRemoveCity={handleRemoveCity}
        onOpenCityPicker={() => setCityModalOpen(true)}
        onLocateMe={handleLocateMe}
        onToggleUnit={setUnit}
        onToggleSound={handleToggleSound}
        onOpenSheet={openSheet}
      />

      {/* Compact Live-Preview Wardrobe & Simulator Bottom Sheet */}
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
        unit={unit}
        onApplyPreset={handleApplyWardrobePreset}
        onApplyTempSample={handleApplyTempSample}
        onChangeTemp={(t) => setSim({ ...ensureSim(), temperature: t })}
        onChangeCondition={(c) => setSim({ ...ensureSim(), condition: c })}
        onChangeWind={(w) => setSim({ ...ensureSim(), windSpeed: w })}
        onChangeTimeOfDay={(tod) => setSim({ ...ensureSim(), timeOfDay: tod })}
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
    </div>
  );
}

export default App;
