import React from 'react';
import { RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { TimeOfDay, WeatherCondition } from '../../types/weather';

interface WeatherSimulatorBarProps {
  isSimulated: boolean;
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  timeOfDay: TimeOfDay;
  onChangeTemp: (temp: number) => void;
  onChangeCondition: (cond: WeatherCondition) => void;
  onChangeWind: (wind: number) => void;
  onChangeTimeOfDay: (tod: TimeOfDay) => void;
  onResetLive: () => void;
}

const WEATHER_OPTIONS: Array<{ id: WeatherCondition; label: string }> = [
  { id: 'clear', label: '晴朗' },
  { id: 'partly-cloudy', label: '多云' },
  { id: 'overcast', label: '阴天' },
  { id: 'drizzle', label: '细雨' },
  { id: 'rain', label: '中雨' },
  { id: 'heavy-rain', label: '暴雨' },
  { id: 'thunderstorm', label: '雷暴' },
  { id: 'snow', label: '小雪' },
  { id: 'blizzard', label: '暴雪' },
  { id: 'fog', label: '大雾' },
  { id: 'windy', label: '大风' },
];

const TIME_OPTIONS: Array<{ id: TimeOfDay; label: string }> = [
  { id: 'dawn', label: '黎明' },
  { id: 'day', label: '白昼' },
  { id: 'sunset', label: '黄昏' },
  { id: 'night', label: '星夜' },
];

export const WeatherSimulatorBar: React.FC<WeatherSimulatorBarProps> = ({
  isSimulated,
  temperature,
  condition,
  windSpeed,
  timeOfDay,
  onChangeTemp,
  onChangeCondition,
  onChangeWind,
  onChangeTimeOfDay,
  onResetLive,
}) => {
  return (
    <section className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">天气特效 & 豚鼠换装实验室</h2>
            <p className="text-xs text-white/65">拖动温度或切换天气，实时观察天空物理特效与棕白豚鼠换装</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSimulated ? (
            <button
              type="button"
              onClick={onResetLive}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/25 px-3.5 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              恢复实时天气
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85">
              <Sparkles className="h-3 w-3 text-amber-300" />
              当前同步实时天气
            </span>
          )}
        </div>
      </div>

      {/* Weather Condition Chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {WEATHER_OPTIONS.map((item) => {
          const active = condition === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeCondition(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-transform duration-150 active:scale-95 ${
                active
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'border border-white/15 bg-white/10 text-white/85 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Sliders & Time of Day */}
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/75">模拟气温（触发 6 档穿衣）</span>
            <span className="font-semibold text-amber-300 tabular-nums">{temperature}°C</span>
          </div>
          <input
            type="range"
            min={-15}
            max={42}
            step={1}
            value={temperature}
            onChange={(e) => onChangeTemp(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-cyan-400 via-emerald-300 to-rose-400 accent-white"
          />
          <div className="flex justify-between text-[10px] text-white/50 tabular-nums">
            <span>-15°C 极寒</span>
            <span>10°C 微凉</span>
            <span>22°C 舒适</span>
            <span>42°C 酷暑</span>
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/75">模拟风速（吹动雪雨与围巾）</span>
            <span className="font-semibold text-sky-300 tabular-nums">{windSpeed} km/h</span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={windSpeed}
            onChange={(e) => onChangeWind(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-sky-300"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-white/75">时段光线</span>
          <div className="inline-flex rounded-full border border-white/15 bg-black/25 p-1">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTimeOfDay(t.id)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-transform duration-150 active:scale-95 ${
                  timeOfDay === t.id ? 'bg-amber-300 text-slate-900' : 'bg-transparent text-white/80 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
