import React, { useId } from 'react';
import type { HourlyPoint } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface HourlyForecastCardProps {
  hourly: HourlyPoint[];
  unit: TempUnit;
}

export const HourlyForecastCard: React.FC<HourlyForecastCardProps> = ({ hourly, unit }) => {
  const uid = useId().replace(/:/g, '');
  if (hourly.length === 0) return null;

  const temps = hourly.map((h) => formatTemp(h.temperature, unit));
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const span = Math.max(1, maxT - minT);

  const svgWidth = Math.max(540, hourly.length * 52);
  const svgHeight = 52;
  const padX = 24;
  const padY = 10;

  const points = temps.map((t, i) => {
    const x = padX + (i / Math.max(1, temps.length - 1)) * (svgWidth - padX * 2);
    const y = padY + ((maxT - t) / span) * (svgHeight - padY * 2);
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;
  const lineGradId = `hourlyLine-${uid}`;
  const areaGradId = `hourlyArea-${uid}`;

  return (
    <section className="rounded-2xl border border-white/10 bg-black/42 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
        <h2 className="text-xs font-medium tracking-wider text-white/80 uppercase">
          逐小时预报
        </h2>
        <span className="text-xs font-light text-white/60 tabular-nums">
          {minT}° ~ {maxT}°{unit}
        </span>
      </div>

      <div className="no-scrollbar overflow-x-auto pb-1">
        <div className="min-w-[540px]">
          <div className="grid grid-cols-12 gap-1 text-center">
            {hourly.map((h, idx) => (
              <div key={h.time} className="flex flex-col items-center gap-1.5 py-0.5">
                <span className="text-[11px] font-light text-white/75 tabular-nums">
                  {h.hourLabel}
                </span>
                <WeatherConditionIcon condition={h.condition} isDay={h.isDay} className="h-4 w-4" />
                <span className="h-3.5 text-[10px] font-light text-sky-200/80 tabular-nums">
                  {h.precipitationProb >= 15 ? `${h.precipitationProb}%` : ''}
                </span>
                <span className="text-sm font-normal text-white tabular-nums">{temps[idx]}°</span>
              </div>
            ))}
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mt-1 h-11 w-full overflow-visible">
            <defs>
              <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(253, 224, 71, 0.9)" />
                <stop offset="50%" stopColor="rgba(125, 211, 252, 0.9)" />
                <stop offset="100%" stopColor="rgba(196, 181, 253, 0.85)" />
              </linearGradient>
              <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(125, 211, 252, 0.22)" />
                <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${areaGradId})`} />
            <path d={pathD} fill="none" stroke={`url(#${lineGradId})`} strokeWidth="2" strokeLinecap="round" />
            {points.map((pt, idx) => (
              <circle
                key={hourly[idx].time}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 ? 3.5 : 2.3}
                fill={idx === 0 ? '#fde047' : '#ffffff'}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
};
