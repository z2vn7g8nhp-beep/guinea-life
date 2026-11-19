import React from 'react';
import { ShieldAlert, Sunrise, Sunset, Wind } from 'lucide-react';
import type { WeatherSnapshot } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import type { WeatherTheme } from '../../utils/weatherTheme';

interface WeatherDetailsCardProps {
  weather: WeatherSnapshot;
  unit: TempUnit;
  localTimeStr: string;
  theme: WeatherTheme;
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

function aqiBarGradient(aqi: number): string {
  if (aqi <= 50) return 'from-emerald-400 to-teal-300';
  if (aqi <= 100) return 'from-amber-300 to-yellow-200';
  if (aqi <= 150) return 'from-orange-400 to-amber-300';
  return 'from-rose-500 to-orange-400';
}

export const WeatherDetailsCard: React.FC<WeatherDetailsCardProps> = ({
  weather,
  unit,
  localTimeStr,
  theme,
}) => {
  const riseMin = parseMinutes(weather.sunrise) ?? 390;
  const setMin = parseMinutes(weather.sunset) ?? 1080;

  let nowMin = parseMinutes(localTimeStr) ?? 720;
  if (weather.isSimulated) {
    if (weather.timeOfDay === 'dawn') nowMin = riseMin + 14;
    else if (weather.timeOfDay === 'day') nowMin = Math.round((riseMin + setMin) / 2);
    else if (weather.timeOfDay === 'sunset') nowMin = setMin - 16;
    else nowMin = setMin + 120;
  }

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

  const aqi = weather.airQuality;

  return (
    <section
      className={`overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ${theme.cardBgClass}`}
    >
      <h2 className="mb-3 border-b border-white/12 pb-2.5 text-[14px] font-medium tracking-wide text-white/92">
        气象详情 · 空气与日照
      </h2>

      {/* Air Quality Block */}
      {aqi && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/6 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[13px] font-normal text-white/80">
              {aqi.needsMask ? (
                <ShieldAlert className="h-4 w-4 text-amber-300" strokeWidth={1.8} />
              ) : (
                <Wind className="h-4 w-4 text-emerald-300" strokeWidth={1.8} />
              )}
              <span>空气质量 · {aqi.level}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] tabular-nums">
              {aqi.needsMask && (
                <span className="rounded-full bg-amber-300/20 px-2 py-0.5 text-[11px] text-amber-200">
                  豚鼠已戴口罩
                </span>
              )}
              <span className="font-medium text-white">AQI {aqi.aqi}</span>
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/14">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${aqiBarGradient(aqi.aqi)}`}
              style={{ width: `${Math.min(100, Math.max(8, (aqi.aqi / 250) * 100))}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-white/70">
            <span className="truncate">{aqi.advice}</span>
            <span className="shrink-0 tabular-nums">PM2.5 {aqi.pm25}</span>
          </div>
        </div>
      )}

      {/* Minimal Sunrise / Sunset Arc */}
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

      {/* Symmetrical Hairline Telemetry Grid */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
        {metrics.map((m) => (
          <div key={m.label} className="bg-slate-950/38 px-3.5 py-3">
            <div className="text-[13px] font-normal text-white/70">{m.label}</div>
            <div className="mt-1 text-[16px] font-medium text-white tabular-nums">{m.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
