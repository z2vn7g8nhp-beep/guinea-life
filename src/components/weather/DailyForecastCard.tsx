import React from 'react';
import type { DailyPoint } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface DailyForecastCardProps {
  daily: DailyPoint[];
  unit: TempUnit;
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({ daily, unit }) => {
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
    <section className="rounded-2xl border border-white/10 bg-black/42 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-1 border-b border-white/10 pb-2.5">
        <h2 className="text-xs font-medium tracking-wider text-white/80 uppercase">
          7日天气预报
        </h2>
      </div>

      <div className="divide-y divide-white/10">
        {converted.map((day) => {
          const leftPct = ((day.minV - globalMin) / totalSpan) * 100;
          const widthPct = Math.max(10, ((day.maxV - day.minV) / totalSpan) * 100);

          return (
            <div
              key={day.date}
              className="grid grid-cols-[48px_28px_34px_1fr_34px] items-center gap-2 py-2.5 text-sm font-light"
            >
              <span className="text-white/90">{day.dayLabel}</span>

              <div className="flex items-center justify-center">
                <WeatherConditionIcon condition={day.condition} isDay className="h-4 w-4" />
              </div>

              <span className="text-right text-[11px] text-sky-200/80 tabular-nums">
                {day.precipitationProb >= 15 ? `${day.precipitationProb}%` : ''}
              </span>

              <div className="flex items-center gap-2">
                <span className="w-7 text-right text-xs text-white/60 tabular-nums">
                  {day.minV}°
                </span>
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-300/90 via-amber-200/90 to-orange-300/90"
                    style={{
                      left: `${Math.min(88, leftPct)}%`,
                      width: `${Math.min(100 - leftPct, widthPct)}%`,
                    }}
                  />
                </div>
              </div>

              <span className="text-right font-normal text-white tabular-nums">{day.maxV}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
