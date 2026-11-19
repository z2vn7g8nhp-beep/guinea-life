import React from 'react';
import { CalendarDays } from 'lucide-react';
import type { DailyPoint } from '../../types/weather';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface DailyForecastCardProps {
  daily: DailyPoint[];
}

export const DailyForecastCard: React.FC<DailyForecastCardProps> = ({ daily }) => {
  if (daily.length === 0) return null;

  const globalMin = Math.min(...daily.map((d) => d.tempMin));
  const globalMax = Math.max(...daily.map((d) => d.tempMax));
  const totalSpan = Math.max(1, globalMax - globalMin);

  return (
    <section className="rounded-3xl border border-white/20 bg-slate-950/30 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-white/75 uppercase">
        <CalendarDays className="h-4 w-4 text-sky-300" />
        <span>7日天气展望</span>
      </div>

      <div className="divide-y divide-white/10">
        {daily.map((day) => {
          const leftPct = ((day.tempMin - globalMin) / totalSpan) * 100;
          const widthPct = Math.max(12, ((day.tempMax - day.tempMin) / totalSpan) * 100);

          return (
            <div key={day.date} className="grid grid-cols-[54px_34px_42px_1fr_36px] items-center gap-2 py-2.5 text-sm">
              <span className="font-medium text-white/90">{day.dayLabel}</span>

              <div className="flex items-center justify-center">
                <WeatherConditionIcon condition={day.condition} isDay className="h-5 w-5" />
              </div>

              <span className="text-right text-xs text-sky-200/85 tabular-nums">
                {day.precipitationProb >= 15 ? `${day.precipitationProb}%` : ''}
              </span>

              <div className="flex items-center gap-2.5">
                <span className="w-8 text-right text-xs text-white/65 tabular-nums">{day.tempMin}°</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-300 via-amber-300 to-orange-400"
                    style={{
                      left: `${Math.min(88, leftPct)}%`,
                      width: `${Math.min(100 - leftPct, widthPct)}%`,
                    }}
                  />
                </div>
              </div>

              <span className="text-right font-semibold text-white tabular-nums">{day.tempMax}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
