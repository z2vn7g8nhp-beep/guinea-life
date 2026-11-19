import React from 'react';
import { ArrowDown, ArrowUp, Camera, ChevronRight, Lock, ShieldAlert } from 'lucide-react';
import type {
  GuineaPigOutfit,
  MascotCoatId,
  MascotSnackId,
  WeatherSnapshot,
} from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { GuineaPigMascot } from '../mascot/GuineaPigMascot';
import { WeatherHeroEmblem } from './WeatherHeroEmblem';

interface HeroWeatherCardProps {
  weather: WeatherSnapshot;
  outfit: GuineaPigOutfit;
  unit: TempUnit;
  theme: WeatherTheme;
  coatId: MascotCoatId;
  customName: string;
  isOutfitLocked: boolean;
  aqiNeedsMask: boolean;
  snack: { id: MascotSnackId; label: string; emoji: string };
  startled: boolean;
  whisper: string | null;
  feedEvent: { id: number; snack: MascotSnackId } | null;
  onPet: (quote: string) => void;
  onFeed: () => void;
  onOpenPostcard: () => void;
  onOpenWardrobe: () => void;
}

export const HeroWeatherCard: React.FC<HeroWeatherCardProps> = ({
  weather,
  outfit,
  unit,
  theme,
  coatId,
  customName,
  isOutfitLocked,
  aqiNeedsMask,
  snack,
  startled,
  whisper,
  feedEvent,
  onPet,
  onFeed,
  onOpenPostcard,
  onOpenWardrobe,
}) => {
  const today = weather.daily[0];
  const mainTemp = formatTemp(weather.temperature, unit);
  const feelsLike = formatTemp(weather.apparentTemperature, unit);
  const highTemp = today ? formatTemp(today.tempMax, unit) : mainTemp;
  const lowTemp = today ? formatTemp(today.tempMin, unit) : mainTemp;

  return (
    <section aria-label="当前天气与豚鼠伙伴" className="relative w-full">
      {/* Perched Hand-Drawn Guinea Pig Resting ON TOP of the Card */}
      <div className="relative z-20 mx-auto -mb-6 flex justify-center">
        {whisper && (
          <div
            role="status"
            className="animate-ui-bubble pointer-events-none absolute -top-9 left-1/2 z-30 max-w-[270px] -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/88 px-3.5 py-1.5 text-center text-[13px] font-normal text-white shadow-xl backdrop-blur-md"
          >
            <span className="block truncate">{whisper}</span>
          </div>
        )}

        <GuineaPigMascot
          outfit={outfit}
          condition={weather.condition}
          temperature={weather.temperature}
          coatId={coatId}
          customName={customName}
          aqiNeedsMask={aqiNeedsMask}
          startled={startled}
          feedEvent={feedEvent}
          onPet={onPet}
        />
      </div>

      {/* Signature Adaptive Translucent Editorial Weather Card */}
      <div
        className={`relative z-10 overflow-hidden rounded-[24px] border px-5 pt-7 pb-4 shadow-[0_20px_50px_rgba(0,0,0,0.44)] backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ${theme.heroBgClass}`}
      >
        {/* Subtle top rim highlight & 3 localized soft paw-contact shadows along card top */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/38 to-transparent" />
        <div className="pointer-events-none absolute top-0 left-1/2 flex w-44 -translate-x-1/2 items-center justify-between">
          <div className="h-2.5 w-10 rounded-full bg-black/45 blur-[4px]" />
          <div className="h-2.5 w-11 rounded-full bg-black/50 blur-[4px]" />
          <div className="h-2.5 w-12 rounded-full bg-black/45 blur-[4px]" />
        </div>

        {/* Main Weather Row: Left Temp & Stats + Right Luminous Weather Emblem */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start">
              <span className="text-[78px] leading-[0.88] font-extralight tracking-[-0.03em] text-white tabular-nums sm:text-[86px]">
                {mainTemp}
              </span>
              <span className="mt-1.5 ml-1 text-[26px] font-light text-white/88">°{unit}</span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[14px] font-normal text-white/85 tabular-nums">
              <span>体感 {feelsLike}°</span>
              {weather.airQuality && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[12px] text-white/90">
                  {aqiNeedsMask && <ShieldAlert className="h-3 w-3 text-amber-300" />}
                  空气{weather.airQuality.level} · {weather.airQuality.aqi}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3.5 text-[15px] font-normal text-white/95 tabular-nums">
              <span className="inline-flex items-center gap-0.5">
                <ArrowUp className="h-4 w-4 text-white/80" strokeWidth={1.8} />
                {highTemp}°
              </span>
              <span className="inline-flex items-center gap-0.5">
                <ArrowDown className="h-4 w-4 text-white/80" strokeWidth={1.8} />
                {lowTemp}°
              </span>
            </div>

            <div className="mt-2 truncate text-[24px] font-normal tracking-wide text-white">
              {weather.conditionLabel}
            </div>
          </div>

          <WeatherHeroEmblem condition={weather.condition} isDay={weather.isDay} />
        </div>

        {/* Hairline Bottom Outfit & Quick Interaction Row */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/12 pt-3">
          <div className="flex min-w-0 items-center gap-1.5">
            {isOutfitLocked && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-amber-200" strokeWidth={2} />
            )}
            <span className="truncate text-[13px] font-normal text-white/86">
              穿搭 · {outfit.outfitTitle}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onFeed}
              title={`投喂${snack.label}`}
              aria-label={`投喂${snack.label}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[12px] font-normal text-white/92 transition hover:bg-white/20 active:scale-95"
            >
              <span aria-hidden="true">{snack.emoji}</span>
              <span>投喂</span>
            </button>

            <button
              type="button"
              onClick={onOpenPostcard}
              title="生成今日豚鼠明信片"
              aria-label="生成今日豚鼠明信片"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/90 transition hover:bg-white/20 active:scale-95"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={onOpenWardrobe}
              className="inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[12px] font-normal text-amber-200 transition hover:bg-white/20 hover:text-white active:scale-95"
            >
              <span>衣橱</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
