import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, RefreshCw, Shirt, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
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
  fetchLiveWeather,
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
const UNIT_STORAGE_KEY = 'guinea_life_temp_unit_v1';

const DEFAULT_PINNED_CITIES: CityLocation[] = [
  PRESET_CITIES[0], // 上海
  PRESET_CITIES[1], // 北京
  PRESET_CITIES[6], // 东京
  PRESET_CITIES[7], // 伦敦
  PRESET_CITIES[3], // 哈尔滨
];

function loadPinnedCities(): CityLocation[] {
  try {
    const raw = localStorage.getItem(CITIES_STORAGE_KEY);
    if (!raw) return DEFAULT_PINNED_CITIES;
    const parsed = JSON.parse(raw) as CityLocation[];
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.name) {
      return parsed;
    }
  } catch {
    // ignore invalid localStorage
  }
  return DEFAULT_PINNED_CITIES;
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

export function App() {
  const [pinnedCities, setPinnedCities] = useState<CityLocation[]>(loadPinnedCities);
  const [activeCityIndex, setActiveCityIndex] = useState(0);
  const [unit, setUnit] = useState<TempUnit>(loadTempUnit);

  const selectedCity = pinnedCities[activeCityIndex] ?? pinnedCities[0] ?? PRESET_CITIES[0];

  const [liveWeather, setLiveWeather] = useState<WeatherSnapshot>(() =>
    buildFallbackWeather(selectedCity)
  );
  const [sim, setSim] = useState<SimOverrides | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab>('wardrobe');

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [startled, setStartled] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const whisperTimeoutRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(pinnedCities));
    } catch {
      // ignore storage quota errors
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

  // Sync Web Audio ambient weather profile
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

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setCityModalOpen(false);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myCity: CityLocation = {
          name: '当前位置',
          region: 'GPS 定位',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone: 'auto',
        };
        setSim(null);
        setPinnedCities((prev) => {
          const filtered = prev.filter((c) => c.name !== '当前位置');
          return [myCity, ...filtered];
        });
        setActiveCityIndex(0);
        setLocating(false);
        setCityModalOpen(false);
      },
      () => {
        setLocating(false);
      },
      { timeout: 6000 }
    );
  };

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
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.35) {
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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      {/* Full-bleed Dual-Layer Atmospheric Weather Engine */}
      <RealisticWeatherCanvas
        condition={effectiveWeather.condition}
        temperature={effectiveWeather.temperature}
        windSpeed={effectiveWeather.windSpeed}
        cloudCover={effectiveWeather.cloudCover}
        timeOfDay={effectiveWeather.timeOfDay}
        onLightningFlash={handleLightningFlash}
      />

      {/* Editorial Mobile-First Vertical Column (Image 1 Composition) */}
      <div className="relative z-10 mx-auto w-full max-w-[460px] px-4 pb-12">
        {/* First Viewport: Top Chrome + Unobstructed Sky + Bottom Hero Card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex min-h-[calc(100svh-64px)] flex-col justify-between pt-3 pb-3"
        >
          {/* Floating Minimal Top Bar */}
          <header className="flex items-start justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="打开菜单"
              className="rounded-full p-2 text-white/90 drop-shadow transition hover:bg-white/10 hover:text-white"
            >
              <Menu className="h-5 w-5" strokeWidth={1.7} />
            </button>

            <div className="flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => setCityModalOpen(true)}
                className="text-lg font-normal tracking-wide text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.45)] transition hover:opacity-85"
              >
                {effectiveWeather.city.name}
              </button>

              {sim ? (
                <button
                  type="button"
                  onClick={() => setSim(null)}
                  className="mt-0.5 rounded-full border border-amber-200/35 bg-black/45 px-2.5 py-0.5 text-[11px] font-light text-amber-200 backdrop-blur-md transition hover:bg-black/65"
                >
                  模拟中 · 点击恢复实时
                </button>
              ) : (
                <div className="mt-0.5 text-xs font-light text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] tabular-nums">
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
                        setSim(null);
                        setActiveCityIndex(idx);
                      }}
                      aria-label={`切换到 ${c.name}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeCityIndex
                          ? 'w-3 bg-white shadow-xs'
                          : 'w-1.5 bg-white/45 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleToggleSound}
                aria-label={soundEnabled ? '关闭环境声景' : '开启环境声景'}
                title={soundEnabled ? '关闭环境声景' : '开启环境声景'}
                className={`rounded-full p-2 drop-shadow transition hover:bg-white/10 ${
                  soundEnabled ? 'text-amber-200' : 'text-white/85 hover:text-white'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4.5 w-4.5" strokeWidth={1.7} />
                ) : (
                  <VolumeX className="h-4.5 w-4.5" strokeWidth={1.7} />
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
                className="rounded-full p-2 text-white/90 drop-shadow transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw
                  className={`h-4.5 w-4.5 ${loading ? 'animate-spin' : ''}`}
                  strokeWidth={1.7}
                />
              </button>
            </div>
          </header>

          {/* Open Realistic Sky Spacer */}
          <div className="min-h-[30svh] flex-1" />

          {/* Image-1 Signature Bottom Hero Card (Temp + Hand-drawn Guinea Pig) */}
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

        {/* Below-the-Fold Scrollable Feed (Top header of Hourly peeks at fold!) */}
        <main className="space-y-3">
          <HourlyForecastCard hourly={effectiveWeather.hourly} unit={unit} />
          <DailyForecastCard daily={effectiveWeather.daily} unit={unit} />
          <WeatherDetailsCard
            weather={effectiveWeather}
            unit={unit}
            localTimeStr={localTimeStr}
          />
          <LifestyleIndicesView weather={effectiveWeather} />

          {/* Minimal Lab Triggers & Attribution */}
          <footer className="flex flex-col items-center gap-3 pt-3 text-center">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openSheet('wardrobe')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 text-xs font-light text-white/85 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
              >
                <Shirt className="h-3.5 w-3.5 text-amber-200" strokeWidth={1.6} />
                豚鼠衣橱
              </button>
              <button
                type="button"
                onClick={() => openSheet('simulator')}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 text-xs font-light text-white/85 backdrop-blur-md transition hover:bg-black/60 hover:text-white"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-sky-200" strokeWidth={1.6} />
                天气模拟
              </button>
            </div>
            <p className="text-[11px] font-light text-white/50">
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
