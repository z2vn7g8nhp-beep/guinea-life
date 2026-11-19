import React from 'react';
import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react';
import type { GuineaPigOutfit, WeatherSnapshot } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import { GuineaPigMascot } from '../mascot/GuineaPigMascot';

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
    <section
      aria-label="当前天气与豚鼠伙伴"
      className="relative rounded-2xl border border-white/12 bg-black/44 px-5 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.34)] backdrop-blur-md"
    >
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        {/* Left: Editorial Ultra-Light Temperature & Condition (Image 1 Layout) */}
        <div className="min-w-0 pb-1">
          <div className="flex items-start">
            <span className="text-[74px] leading-[0.88] font-extralight tracking-[-0.03em] text-white tabular-nums sm:text-[84px]">
              {mainTemp}
            </span>
            <span className="mt-1.5 ml-0.5 text-2xl font-extralight text-white/85">°{unit}</span>
          </div>

          <div className="mt-2.5 text-xs font-light text-white/75 tabular-nums">
            (体感 {feelsLike}°)
          </div>

          <div className="mt-1 flex items-center gap-3 text-sm font-light text-white/90 tabular-nums">
            <span className="inline-flex items-center gap-0.5">
              <ArrowUp className="h-3.5 w-3.5 text-white/75" strokeWidth={1.6} />
              {highTemp}°
            </span>
            <span className="inline-flex items-center gap-0.5">
              <ArrowDown className="h-3.5 w-3.5 text-white/75" strokeWidth={1.6} />
              {lowTemp}°
            </span>
          </div>

          <div className="mt-2.5 truncate text-2xl font-light tracking-wide text-white">
            {weather.conditionLabel}
          </div>
        </div>

        {/* Right: Storybook Hand-Drawn Brown-and-White Guinea Pig */}
        <div className="relative flex flex-col items-center">
          {/* Brief disappearing whisper bubble on pet interaction */}
          {whisper && (
            <div
              role="status"
              className="animate-ui-bubble pointer-events-none absolute -top-8 right-0 z-20 max-w-[210px] rounded-full border border-white/18 bg-black/72 px-3 py-1 text-center text-[11px] font-light text-white/95 shadow-lg backdrop-blur-md"
            >
              <span className="block truncate">{whisper}</span>
            </div>
          )}

          <GuineaPigMascot
            outfit={outfit}
            condition={weather.condition}
            temperature={weather.temperature}
            startled={startled}
            compact
            onPet={onPet}
          />

          <button
            type="button"
            onClick={onOpenWardrobe}
            className="-mt-1 inline-flex max-w-[180px] items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-light text-white/78 transition hover:bg-white/10 hover:text-white"
          >
            <span className="truncate">{outfit.outfitTitle}</span>
            <ChevronRight className="h-3 w-3 shrink-0 opacity-75" />
          </button>
        </div>
      </div>
    </section>
  );
};
