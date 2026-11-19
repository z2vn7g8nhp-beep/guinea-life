import React from 'react';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import type { GuineaPigOutfit, WeatherSnapshot } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import { GuineaPigMascot } from '../mascot/GuineaPigMascot';
import { WeatherHeroEmblem } from './WeatherHeroEmblem';

interface HeroWeatherCardProps {
  weather: WeatherSnapshot;
  outfit: GuineaPigOutfit;
  unit: TempUnit;
  startled: boolean;
  whisper: string | null;
  onPet: (quote: string) => void;
  onOpenWardrobe: () => void;
}

export const HeroWeatherCard: React.FC<HeroWeatherCardProps> = ({
  weather,
  outfit,
  unit,
  startled,
  whisper,
  onPet,
  onOpenWardrobe,
}) => {
  const today = weather.daily[0];
  const mainTemp = formatTemp(weather.temperature, unit);
  const feelsLike = formatTemp(weather.apparentTemperature, unit);
  const highTemp = today ? formatTemp(today.tempMax, unit) : mainTemp;
  const lowTemp = today ? formatTemp(today.tempMin, unit) : mainTemp;

  return (
    <section aria-label="当前天气与豚鼠伙伴" className="relative w-full">
      {/* Perched Hand-Drawn Brown-and-White Guinea Pig Resting ON TOP of the Card */}
      <div className="relative z-20 mx-auto -mb-6 flex justify-center">
        {whisper && (
          <div
            role="status"
            className="animate-ui-bubble pointer-events-none absolute -top-9 left-1/2 z-30 max-w-[260px] -translate-x-1/2 rounded-full border border-white/20 bg-slate-950/85 px-3.5 py-1.5 text-center text-[13px] font-normal text-white shadow-xl backdrop-blur-md"
          >
            <span className="block truncate">{whisper}</span>
          </div>
        )}

        <GuineaPigMascot
          outfit={outfit}
          condition={weather.condition}
          temperature={weather.temperature}
          startled={startled}
          onPet={onPet}
        />
      </div>

      {/* Signature Dark Translucent Editorial Weather Card */}
      <div className="relative z-10 overflow-hidden rounded-[24px] border border-white/18 bg-slate-950/54 px-5 pt-7 pb-4 shadow-[0_20px_50px_rgba(0,0,0,0.44)] backdrop-blur-xl">
        {/* Subtle top rim highlight & soft paw contact shadow */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="pointer-events-none absolute -top-3 left-1/2 h-6 w-48 -translate-x-1/2 rounded-full bg-black/55 blur-md" />

        {/* Main Weather Row: Left Temp & Stats + Right Luminous Weather Emblem */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-start">
              <span className="text-[78px] leading-[0.88] font-extralight tracking-[-0.03em] text-white tabular-nums sm:text-[86px]">
                {mainTemp}
              </span>
              <span className="mt-1.5 ml-1 text-[26px] font-light text-white/88">°{unit}</span>
            </div>

            <div className="mt-2.5 text-[14px] font-normal text-white/85 tabular-nums">
              体感 {feelsLike}°
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

        {/* Hairline Bottom Outfit & Simulator Row */}
        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-white/12 pt-3">
          <span className="truncate text-[13px] font-normal text-white/85">
            穿搭 · {outfit.outfitTitle}
          </span>
          <button
            type="button"
            onClick={onOpenWardrobe}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[13px] font-normal text-amber-200 transition hover:bg-white/20 hover:text-white"
          >
            <span>衣橱 / 模拟</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
