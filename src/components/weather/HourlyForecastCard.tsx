import React from 'react';
import { Droplets } from 'lucide-react';
import type { HourlyPoint } from '../../types/weather';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface HourlyForecastCardProps {
  hourly: HourlyPoint[];
}

export const HourlyForecastCard: React.FC<HourlyForecastCardProps> = ({ hourly }) => {
  if (hourly.length === 0) return null;

  const temps = hourly.map((h) => h.temperature);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const span = Math.max(1, maxT - minT);

  const svgWidth = Math.max(600, hourly.length * 64);
  const svgHeight = 68;
  const padX = 28;
  const padY = 14;

  const points = hourly.map((h, i) => {
    const x = padX + (i / Math.max(1, hourly.length - 1)) * (svgWidth - padX * 2);
    const y = padY + ((maxT - h.temperature) / span) * (svgHeight - padY * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <section className="rounded-3xl border border-white/20 bg-slate-950/30 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-white/75 uppercase">
          逐小时预报 · 未来 12 小时趋势
        </h2>
        <span className="text-xs text-white/60 tabular-nums">
          {minT}° ~ {maxT}°
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-12 gap-1 text-center">
            {hourly.map((h) => (
              <div key={h.time} className="flex flex-col items-center gap-1.5 py-1">
                <span className="text-xs font-medium text-white/80 tabular-nums">{h.hourLabel}</span>
                <WeatherConditionIcon condition={h.condition} isDay={h.isDay} className="h-5 w-5" />
                <span className="inline-flex items-center gap-0.5 text-[11px] text-sky-200/90 tabular-nums">
                  <Droplets className="h-3 w-3 opacity-75" />
                  {h.precipitationProb}%
                </span>
                <span className="text-sm font-semibold text-white tabular-nums">{h.temperature}°</span>
              </div>
            ))}
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mt-1 h-14 w-full overflow-visible">
            <defs>
              <linearGradient id="hourlyLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="50%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
              <linearGradient id="hourlyAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(125, 211, 252, 0.32)" />
                <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#hourlyAreaGrad)" />
            <path d={pathD} fill="none" stroke="url(#hourlyLineGrad)" strokeWidth="2.5" strokeLinecap="round" />
            {points.map((pt, idx) => (
              <circle
                key={hourly[idx].time}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 ? 4.5 : 3}
                fill={idx === 0 ? '#fde047' : '#ffffff'}
                stroke="rgba(15, 23, 42, 0.65)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
};
