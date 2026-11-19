import React from 'react';
import { Sunrise, Sunset } from 'lucide-react';
import type { WeatherSnapshot } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';

interface WeatherDetailsCardProps {
  weather: WeatherSnapshot;
  unit: TempUnit;
  localTimeStr: string;
}

function parseMinutes(hhmm: string): number | null {
  const match = hhmm.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function windCompass(deg: number): string {
  const dirs = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return dirs[idx] ?? '微风';
}

export const WeatherDetailsCard: React.FC<WeatherDetailsCardProps> = ({
  weather,
  unit,
  localTimeStr,
}) => {
  const riseMin = parseMinutes(weather.sunrise) ?? 390;
  const setMin = parseMinutes(weather.sunset) ?? 1080;
  const nowMin = parseMinutes(localTimeStr) ?? 720;

  const span = Math.max(60, setMin - riseMin);
  const progress = Math.max(0, Math.min(1, (nowMin - riseMin) / span));
  const isSunUp = nowMin >= riseMin && nowMin <= setMin;

  const cx = 110;
  const cy = 78;
  const r = 74;
  const angle = Math.PI * (1 - progress);
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);

  const uvLabel =
    weather.uvIndex >= 8
      ? '极强'
      : weather.uvIndex >= 6
      ? '强'
      : weather.uvIndex >= 3
      ? '中等'
      : '弱';

  const metrics = [
    { label: '空气湿度', value: `${weather.humidity}%` },
    { label: '风速风向', value: `${windCompass(weather.windDirection)} ${weather.windSpeed} km/h` },
    { label: '体感温度', value: `${formatTemp(weather.apparentTemperature, unit)}°${unit}` },
    { label: '紫外线指数', value: `${weather.uvIndex} · ${uvLabel}` },
    { label: '能见度', value: `${weather.visibility} km` },
    { label: '大气压强', value: `${weather.pressure} hPa` },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/14 bg-slate-950/50 p-4 shadow-lg backdrop-blur-xl">
      <h2 className="mb-3 border-b border-white/12 pb-2.5 text-[14px] font-medium tracking-wide text-white/92">
        气象详情 · 日照轨迹
      </h2>

      {/* Minimal Sunrise / Sunset Arc (contained inside viewBox) */}
      <div className="mb-3 flex flex-col items-center">
        <svg viewBox="0 0 220 92" className="h-22 w-full max-w-[270px]">
          <line
            x1="18"
            y1={cy}
            x2="202"
            y2={cy}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
          {isSunUp && (
            <>
              <path
                d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${sunX.toFixed(1)} ${sunY.toFixed(1)}`}
                fill="none"
                stroke="rgba(253, 224, 71, 0.78)"
                strokeWidth="2"
              />
              <circle cx={sunX} cy={sunY} r="9" fill="rgba(253, 224, 71, 0.24)" />
              <circle cx={sunX} cy={sunY} r="4.5" fill="#FDE047" />
            </>
          )}
          {!isSunUp && (
            <circle
              cx={nowMin < riseMin ? cx - r : cx + r}
              cy={cy}
              r="3.5"
              fill="rgba(255,255,255,0.5)"
            />
          )}
        </svg>

        <div className="-mt-1 flex w-full max-w-[270px] items-center justify-between text-[13px] font-normal text-white/88 tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <Sunrise className="h-4 w-4 text-amber-200" strokeWidth={1.7} />
            日出 {weather.sunrise}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sunset className="h-4 w-4 text-orange-300" strokeWidth={1.7} />
            日落 {weather.sunset}
          </span>
        </div>
      </div>

      {/* 2x3 Hairline Telemetry Grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-white/10 border-t border-white/12 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.label} className="px-3 py-3.5">
            <div className="text-[13px] font-normal text-white/70">{m.label}</div>
            <div className="mt-1 text-[16px] font-medium text-white tabular-nums">{m.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
