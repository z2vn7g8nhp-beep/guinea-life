import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { resolveGuineaPigOutfit } from '../../data/outfits';
import { CONDITION_LABELS } from '../../services/weatherApi';
import type { DailyPoint } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface DailyForecastCardProps {
  daily: DailyPoint[];
  unit: TempUnit;
  theme: WeatherTheme;
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({ daily, unit, theme }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (daily.length === 0) return null;

  const converted = daily.map((d) => ({
    ...d,
    minV: formatTemp(d.tempMin, unit),
    maxV: formatTemp(d.tempMax, unit),
  }));

  const globalMin = Math.min(...converted.map((d) => d.minV));
  const globalMax = Math.max(...converted.map((d) => d.maxV));
  const totalSpan = Math.max(1, globalMax - globalMin);

  return (
    <section
      className={`overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ${theme.cardBgClass}`}
    >
      <div className="mb-1 flex items-center justify-between border-b border-white/12 pb-2.5">
        <h2 className="text-[14px] font-medium tracking-wide text-white/92">
          7日天气预报
        </h2>
        <span className="text-[12px] text-white/55">点击单日看穿衣建议</span>
      </div>

      <div className="divide-y divide-white/10">
        {converted.map((day) => {
          const leftPct = ((day.minV - globalMin) / totalSpan) * 100;
          const widthPct = Math.max(10, ((day.maxV - day.minV) / totalSpan) * 100);
          const isOpen = expandedDate === day.date;
          const avgC = Math.round((day.tempMax + day.tempMin) / 2);
          const outfit = isOpen
            ? resolveGuineaPigOutfit(avgC, day.condition, day.windSpeedMax ?? 12, true)
            : null;

          return (
            <div key={day.date}>
              <button
                type="button"
                onClick={() => setExpandedDate((cur) => (cur === day.date ? null : day.date))}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[50px_28px_36px_1fr_34px_16px] items-center gap-1.5 py-3 text-left text-[15px] font-normal transition hover:bg-white/5"
              >
                <span className="text-white/95">{day.dayLabel}</span>

                <div className="flex items-center justify-center">
                  <WeatherConditionIcon condition={day.condition} isDay className="h-5 w-5" />
                </div>

                <span className="text-right text-[12px] text-sky-200/88 tabular-nums">
                  {day.precipitationProb >= 15 ? `${day.precipitationProb}%` : ''}
                </span>

                <div className="flex items-center gap-2">
                  <span className="w-8 text-right text-[14px] text-white/70 tabular-nums">
                    {day.minV}°
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/18">
                    <div
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-300 via-amber-200 to-orange-300"
                      style={{
                        left: `${Math.min(88, leftPct)}%`,
                        width: `${Math.min(100 - leftPct, widthPct)}%`,
                      }}
                    />
                  </div>
                </div>

                <span className="text-right text-[15px] font-medium text-white tabular-nums">
                  {day.maxV}°
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-white/50 transition-transform ${
                    isOpen ? 'rotate-180 text-white/85' : ''
                  }`}
                />
              </button>

              {isOpen && outfit && (
                <div className="mb-2.5 rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-[12px] text-white/85">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-white/95">
                    <span>
                      {day.date.slice(5)} · {CONDITION_LABELS[day.condition]} · 均温{' '}
                      {formatTemp(avgC, unit)}°{unit}
                    </span>
                    <span className="text-white/70 tabular-nums">
                      UV 峰值 {day.uvIndexMax}
                      {typeof day.windSpeedMax === 'number' ? ` · 最大风 ${day.windSpeedMax} km/h` : ''}
                      {typeof day.precipitationSum === 'number' && day.precipitationSum > 0
                        ? ` · 降水 ${day.precipitationSum} mm`
                        : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-amber-200/95">
                    豚鼠穿搭：{outfit.outfitTitle} — <span className="text-white/78">{outfit.description}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
