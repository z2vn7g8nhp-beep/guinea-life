import React, { useId, useState } from 'react';
import { Eye } from 'lucide-react';
import { resolveGuineaPigOutfit } from '../../data/outfits';
import { CONDITION_LABELS } from '../../services/weatherApi';
import type { HourlyPoint } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface HourlyForecastCardProps {
  hourly: HourlyPoint[];
  unit: TempUnit;
  theme: WeatherTheme;
  onPreviewHour?: (point: HourlyPoint) => void;
}

const COL_W = 54;

export const HourlyForecastCard: React.FC<HourlyForecastCardProps> = ({
  hourly,
  unit,
  theme,
  onPreviewHour,
}) => {
  const uid = useId().replace(/:/g, '');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (hourly.length === 0) return null;

  const temps = hourly.map((h) => formatTemp(h.temperature, unit));
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const span = Math.max(1, maxT - minT);

  const totalWidth = hourly.length * COL_W;
  const svgHeight = 56;
  const padY = 12;

  const points = temps.map((t, i) => {
    const x = (i + 0.5) * COL_W;
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

  const selectedPoint =
    selectedIdx !== null && hourly[selectedIdx] ? hourly[selectedIdx] : null;
  const selectedOutfit = selectedPoint
    ? resolveGuineaPigOutfit(selectedPoint.temperature, selectedPoint.condition, 12, selectedPoint.isDay)
    : null;

  return (
    <section
      className={`overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ${theme.cardBgClass}`}
    >
      <div className="mb-3 flex items-center justify-between border-b border-white/12 pb-2.5">
        <h2 className="text-[14px] font-medium tracking-wide text-white/92">
          24 小时预报
        </h2>
        <span className="text-[13px] font-normal text-white/75 tabular-nums">
          {minT}° ~ {maxT}°{unit}
        </span>
      </div>

      <div className="no-scrollbar touch-pan-x overflow-x-auto overscroll-x-contain pb-1">
        <div style={{ width: totalWidth }}>
          <div className="flex text-center">
            {hourly.map((h, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={`${h.time}-${idx}`}
                  type="button"
                  onClick={() => setSelectedIdx((cur) => (cur === idx ? null : idx))}
                  style={{ width: COL_W }}
                  className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 transition ${
                    isSelected ? 'bg-white/14' : 'hover:bg-white/6'
                  }`}
                >
                  <span className="text-[12px] font-normal text-white/85 tabular-nums">
                    {h.hourLabel}
                  </span>
                  <WeatherConditionIcon condition={h.condition} isDay={h.isDay} className="h-5 w-5" />
                  <span className="h-4 text-[11px] font-normal text-sky-200/88 tabular-nums">
                    {h.precipitationProb >= 15 ? `${h.precipitationProb}%` : ''}
                  </span>
                  <span className="text-[15px] font-medium text-white tabular-nums">
                    {temps[idx]}°
                  </span>
                </button>
              );
            })}
          </div>

          <svg
            viewBox={`0 0 ${totalWidth} ${svgHeight}`}
            width={totalWidth}
            height={svgHeight}
            className="mt-1 block h-12"
          >
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
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${lineGradId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {points.map((pt, idx) => (
              <circle
                key={`${hourly[idx].time}-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={selectedIdx === idx ? 4.4 : idx === 0 ? 3.8 : 2.4}
                fill={selectedIdx === idx || idx === 0 ? '#fde047' : '#ffffff'}
              />
            ))}
          </svg>
        </div>
      </div>

      {selectedPoint && selectedOutfit && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-[12px]">
          <div className="min-w-0">
            <div className="truncate font-medium text-white">
              {selectedPoint.hourLabel} · {CONDITION_LABELS[selectedPoint.condition]} ·{' '}
              {formatTemp(selectedPoint.temperature, unit)}°{unit}
              {selectedPoint.precipitationProb >= 15
                ? ` · 降水 ${selectedPoint.precipitationProb}%`
                : ''}
            </div>
            <div className="mt-0.5 truncate text-white/75">
              建议穿搭：{selectedOutfit.outfitTitle}
            </div>
          </div>

          {onPreviewHour && (
            <button
              type="button"
              onClick={() => onPreviewHour(selectedPoint)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200/35 bg-amber-300/18 px-2.5 py-1 text-[12px] font-medium text-amber-100 transition hover:bg-amber-300/30"
            >
              <Eye className="h-3.5 w-3.5" />
              预览
            </button>
          )}
        </div>
      )}
    </section>
  );
};
