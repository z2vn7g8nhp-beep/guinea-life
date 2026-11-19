import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CloudSun,
  Compass,
  Droplets,
  Eye,
  Gauge,
  LayoutGrid,
  MapPin,
  RefreshCw,
  Shirt,
  Sparkles,
  Sunrise,
  Sunset,
  Thermometer,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { GuineaPigMascot } from './components/mascot/GuineaPigMascot';
import { LifestyleIndicesView } from './components/modules/LifestyleIndicesView';
import { RoadmapModuleView } from './components/modules/RoadmapModuleView';
import { WardrobeStudioView } from './components/modules/WardrobeStudioView';
import { CityPickerModal } from './components/weather/CityPickerModal';
import { DailyForecastCard } from './components/weather/DailyForecastCard';
import { HourlyForecastCard } from './components/weather/HourlyForecastCard';
import { RealisticWeatherCanvas } from './components/weather/RealisticWeatherCanvas';
import { WeatherConditionIcon } from './components/weather/WeatherConditionIcon';
import { WeatherSimulatorBar } from './components/weather/WeatherSimulatorBar';
import { resolveGuineaPigOutfit, type WardrobeLookPreset } from './data/outfits';
import {
  CONDITION_LABELS,
  PRESET_CITIES,
  buildFallbackWeather,
  fetchLiveWeather,
} from './services/weatherApi';
import type {
  AppModuleId,
  CityLocation,
  TimeOfDay,
  WeatherCondition,
  WeatherSnapshot,
} from './types/weather';
import { weatherAudio } from './utils/weatherAudio';

interface SimOverrides {
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  timeOfDay: TimeOfDay;
}

const MODULES: Array<{ id: AppModuleId; label: string; icon: React.ReactNode }> = [
  { id: 'weather', label: '今日天气', icon: <CloudSun className="h-4 w-4" /> },
  { id: 'wardrobe', label: '豚鼠衣橱', icon: <Shirt className="h-4 w-4" /> },
  { id: 'lifestyle', label: '生活指南', icon: <Compass className="h-4 w-4" /> },
  { id: 'upcoming', label: '更多板块', icon: <LayoutGrid className="h-4 w-4" /> },
];

export function App() {
  const [activeModule, setActiveModule] = useState<AppModuleId>('weather');
  const [selectedCity, setSelectedCity] = useState<CityLocation>(PRESET_CITIES[0]);
  const [liveWeather, setLiveWeather] = useState<WeatherSnapshot>(() =>
    buildFallbackWeather(PRESET_CITIES[0])
  );
  const [sim, setSim] = useState<SimOverrides | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [startled, setStartled] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

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

  // Sync Web Audio ambient profile
  useEffect(() => {
    weatherAudio.update(effectiveWeather.condition, effectiveWeather.windSpeed);
  }, [effectiveWeather.condition, effectiveWeather.windSpeed]);

  // Show contextual welcome quote whenever outfit tier or condition changes
  useEffect(() => {
    setSpeechBubble(outfit.reactionQuotes[0] ?? null);
  }, [outfit.outfitTitle]);

  const showBubble = (text: string) => {
    setSpeechBubble(text);
    if (speechTimeoutRef.current !== null) {
      window.clearTimeout(speechTimeoutRef.current);
    }
    speechTimeoutRef.current = window.setTimeout(() => {
      setSpeechBubble(outfit.reactionQuotes[0] ?? null);
    }, 4200);
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
        setSelectedCity(myCity);
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

  const todayMinMax = effectiveWeather.daily[0];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      {/* Fullscreen Realistic Canvas Weather Engine */}
      <RealisticWeatherCanvas
        condition={effectiveWeather.condition}
        temperature={effectiveWeather.temperature}
        windSpeed={effectiveWeather.windSpeed}
        cloudCover={effectiveWeather.cloudCover}
        timeOfDay={effectiveWeather.timeOfDay}
        onLightningFlash={handleLightningFlash}
      />

      {/* Subtle readability gradient scrim at very top & bottom */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-slate-950/25 via-transparent to-slate-950/35" />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-4 pb-10 sm:px-6 lg:px-8">
        {/* Top Navigation Bar */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/20 bg-slate-950/30 px-4 py-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-md">
              <span className="text-xl leading-none" role="img" aria-label="豚鼠">
                🐹
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                  豚鼠生活馆
                </h1>
                <span className="hidden rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 sm:inline-block">
                  GuineaLife
                </span>
              </div>
              <p className="text-[11px] text-white/65">每日气象 · 随温换装 · 生活灵感</p>
            </div>
          </div>

          {/* Lifestyle Module Switcher */}
          <nav
            aria-label="生活板块导航"
            className="order-3 flex w-full items-center justify-between gap-1 rounded-2xl border border-white/15 bg-black/25 p-1 sm:order-2 sm:w-auto"
          >
            {MODULES.map((mod) => {
              const active = activeModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(mod.id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-transform duration-150 active:scale-95 sm:flex-initial ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-transparent text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {mod.icon}
                  <span>{mod.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Location & Sound Controls */}
          <div className="order-2 flex items-center gap-2 sm:order-3">
            <button
              type="button"
              onClick={() => setCityModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/22"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-300" />
              <span>{effectiveWeather.city.name}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSim(null);
                void loadWeatherForCity(selectedCity);
              }}
              aria-label="刷新实时天气"
              title="刷新实时天气"
              className="rounded-full border border-white/20 bg-white/10 p-2 text-white/85 transition hover:bg-white/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={soundEnabled ? '关闭环境声景' : '开启环境声景'}
              title={soundEnabled ? '关闭环境声景' : '开启环境天气白噪音'}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                soundEnabled
                  ? 'border-amber-300/60 bg-amber-400/25 text-amber-100'
                  : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{soundEnabled ? '声景开' : '声景'}</span>
            </button>
          </div>
        </header>

        {/* Active Module Content */}
        <main className="flex-1 space-y-6">
          {activeModule === 'weather' && (
            <>
              {/* Hero Stage: Weather Telemetry + Dynamic Brown-and-White Guinea Pig */}
              <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                {/* Left: Weather Hero Card */}
                <section className="flex flex-col justify-between rounded-3xl border border-white/20 bg-slate-950/28 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-medium text-white">
                          <WeatherConditionIcon
                            condition={effectiveWeather.condition}
                            isDay={effectiveWeather.isDay}
                            className="h-3.5 w-3.5"
                          />
                          {effectiveWeather.isSimulated ? '实验室模拟天气' : '实时气象站'}
                        </span>
                        {effectiveWeather.isOfflineFallback && !effectiveWeather.isSimulated && (
                          <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] text-amber-200">
                            示例模式
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/65 tabular-nums">
                        更新于 {effectiveWeather.updatedAt}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <div className="flex items-start gap-1">
                          <span className="text-7xl font-light tracking-tight text-white tabular-nums sm:text-8xl">
                            {effectiveWeather.temperature}
                          </span>
                          <span className="mt-2 text-3xl font-light text-white/85">°C</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-base font-medium text-white/95">
                          <span>{effectiveWeather.conditionLabel}</span>
                          {todayMinMax && (
                            <span className="text-sm text-white/70 tabular-nums">
                              最高 {todayMinMax.tempMax}° · 最低 {todayMinMax.tempMin}°
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs text-white/85 sm:items-end">
                        <span className="inline-flex items-center gap-1.5">
                          <Thermometer className="h-3.5 w-3.5 text-amber-300" />
                          体感温度{' '}
                          <strong className="font-semibold text-white tabular-nums">
                            {effectiveWeather.apparentTemperature}°C
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-2 text-white/70 tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Sunrise className="h-3.5 w-3.5 text-amber-200" />
                            {effectiveWeather.sunrise}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Sunset className="h-3.5 w-3.5 text-orange-300" />
                            {effectiveWeather.sunset}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Key Telemetry Tiles */}
                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-white/15 bg-white/8 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/65">
                        <Droplets className="h-3.5 w-3.5 text-sky-300" />
                        空气湿度
                      </div>
                      <div className="mt-1.5 text-lg font-semibold text-white tabular-nums">
                        {effectiveWeather.humidity}%
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/8 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/65">
                        <Wind className="h-3.5 w-3.5 text-teal-300" />
                        风速风向
                      </div>
                      <div className="mt-1.5 text-lg font-semibold text-white tabular-nums">
                        {effectiveWeather.windSpeed} <span className="text-xs font-normal">km/h</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/8 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/65">
                        <Eye className="h-3.5 w-3.5 text-indigo-200" />
                        能见度
                      </div>
                      <div className="mt-1.5 text-lg font-semibold text-white tabular-nums">
                        {effectiveWeather.visibility} <span className="text-xs font-normal">km</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/8 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/65">
                        <Gauge className="h-3.5 w-3.5 text-amber-200" />
                        气压 / UV
                      </div>
                      <div className="mt-1.5 text-lg font-semibold text-white tabular-nums">
                        {effectiveWeather.pressure}
                        <span className="ml-1 text-[11px] font-normal text-white/65">
                          · UV {effectiveWeather.uvIndex}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Right: Dynamic Brown-and-White Guinea Pig Centerpiece */}
                <section className="relative flex flex-col items-center justify-between rounded-3xl border border-white/20 bg-slate-950/25 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
                  {/* Speech bubble */}
                  {speechBubble && (
                    <div className="relative mb-1 max-w-sm rounded-2xl border border-white/25 bg-white/90 px-4 py-2.5 text-center text-xs font-medium text-slate-800 shadow-lg backdrop-blur-md">
                      <span>{speechBubble}</span>
                      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-r border-b border-white/25 bg-white/90" />
                    </div>
                  )}

                  <GuineaPigMascot
                    outfit={outfit}
                    condition={effectiveWeather.condition}
                    temperature={effectiveWeather.temperature}
                    startled={startled}
                    onPet={(quote) => showBubble(quote)}
                  />

                  {/* Outfit Summary Pill */}
                  <div className="mt-2 w-full rounded-2xl border border-white/15 bg-black/25 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        {outfit.tierLabel} · 棕白豚鼠实时穿搭
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveModule('wardrobe')}
                        className="text-xs font-medium text-sky-200 underline-offset-2 hover:underline"
                      >
                        进衣橱试穿 →
                      </button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/80">{outfit.description}</p>
                  </div>
                </section>
              </div>

              {/* Interactive Weather & Outfit Simulator */}
              <WeatherSimulatorBar
                isSimulated={Boolean(sim)}
                temperature={effectiveWeather.temperature}
                condition={effectiveWeather.condition}
                windSpeed={effectiveWeather.windSpeed}
                timeOfDay={effectiveWeather.timeOfDay}
                onChangeTemp={(t) => setSim({ ...ensureSim(), temperature: t })}
                onChangeCondition={(c) => setSim({ ...ensureSim(), condition: c })}
                onChangeWind={(w) => setSim({ ...ensureSim(), windSpeed: w })}
                onChangeTimeOfDay={(tod) => setSim({ ...ensureSim(), timeOfDay: tod })}
                onResetLive={() => setSim(null)}
              />

              {/* Forecasts Bento */}
              <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
                <HourlyForecastCard hourly={effectiveWeather.hourly} />
                <DailyForecastCard daily={effectiveWeather.daily} />
              </div>
            </>
          )}

          {activeModule === 'wardrobe' && (
            <WardrobeStudioView
              currentOutfit={outfit}
              currentTemp={effectiveWeather.temperature}
              currentCondition={effectiveWeather.condition}
              isSimulated={Boolean(sim)}
              onApplyPreset={handleApplyWardrobePreset}
              onApplyTempSample={handleApplyTempSample}
              onResetLive={() => setSim(null)}
            />
          )}

          {activeModule === 'lifestyle' && <LifestyleIndicesView weather={effectiveWeather} />}

          {activeModule === 'upcoming' && <RoadmapModuleView />}
        </main>

        {/* Subtle Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
          <span>豚鼠生活馆 GuineaLife · 第一板块：真实天气引擎 & 动态换装棕白豚鼠</span>
          <span>实时气象数据由 Open-Meteo 提供 · 支持全球城市检索</span>
        </footer>
      </div>

      {/* City Picker Modal */}
      <CityPickerModal
        open={cityModalOpen}
        currentCity={effectiveWeather.city}
        onClose={() => setCityModalOpen(false)}
        onSelectCity={(city) => {
          setSim(null);
          setSelectedCity(city);
        }}
        onLocateMe={handleLocateMe}
        locating={locating}
      />
    </div>
  );
}

export default App;
