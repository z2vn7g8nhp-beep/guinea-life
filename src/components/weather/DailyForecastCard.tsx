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
    <section className="overflow-hidden rounded-2xl border border-white/14 bg-slate-950/50 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-1 border-b border-white/12 pb-2.5">
        <h2 className="text-[14px] font-medium tracking-wide text-white/92">
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
              className="grid grid-cols-[52px_28px_38px_1fr_36px] items-center gap-2 py-3 text-[15px] font-normal"
            >
              <span className="text-white/95">{day.dayLabel}</span>

              <div className="flex items-center justify-center">
                <WeatherConditionIcon condition={day.condition} isDay className="h-5 w-5" />
              </div>

              <span className="text-right text-[12px] text-sky-200/88 tabular-nums">
                {day.precipitationProb >= 15 ? `${day.precipitationProb}%` : ''}
              </span>

              <div className="flex items-center gap-2.5">
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
            </div>
          );
        })}
      </div>
    </section>
  );
};
