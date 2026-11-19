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

  const svgWidth = Math.max(580, hourly.length * 56);
  const svgHeight = 58;
  const padX = 26;
  const padY = 12;

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
    <section className="overflow-hidden rounded-2xl border border-white/14 bg-slate-950/50 p-4 shadow-lg backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between border-b border-white/12 pb-2.5">
        <h2 className="text-[14px] font-medium tracking-wide text-white/92">
          逐小时预报
        </h2>
        <span className="text-[13px] font-normal text-white/75 tabular-nums">
          {minT}° ~ {maxT}°{unit}
        </span>
      </div>

      <div className="no-scrollbar touch-pan-x overflow-x-auto overscroll-x-contain pb-1">
        <div className="min-w-[580px]">
          <div className="grid grid-cols-12 gap-1 text-center">
            {hourly.map((h, idx) => (
              <div key={h.time} className="flex flex-col items-center gap-1.5 py-0.5">
                <span className="text-[13px] font-normal text-white/85 tabular-nums">
                  {h.hourLabel}
                </span>
                <WeatherConditionIcon condition={h.condition} isDay={h.isDay} className="h-5 w-5" />
                <span className="h-4 text-[12px] font-normal text-sky-200/88 tabular-nums">
                  {h.precipitationProb >= 15 ? `${h.precipitationProb}%` : ''}
                </span>
                <span className="text-[16px] font-medium text-white tabular-nums">{temps[idx]}°</span>
              </div>
            ))}
          </div>

          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mt-1 h-12 w-full">
            <defs>
              <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(253, 224, 71, 0.92)" />
                <stop offset="50%" stopColor="rgba(125, 211, 252, 0.92)" />
                <stop offset="100%" stopColor="rgba(196, 181, 253, 0.88)" />
              </linearGradient>
              <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(125, 211, 252, 0.24)" />
                <stop offset="100%" stopColor="rgba(125, 211, 252, 0)" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${areaGradId})`} />
            <path d={pathD} fill="none" stroke={`url(#${lineGradId})`} strokeWidth="2.2" strokeLinecap="round" />
            {points.map((pt, idx) => (
              <circle
                key={hourly[idx].time}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 ? 4 : 2.6}
                fill={idx === 0 ? '#fde047' : '#ffffff'}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
};
