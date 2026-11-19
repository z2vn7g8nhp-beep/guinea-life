import React from 'react';
import { Check, RotateCcw, Shirt, SlidersHorizontal, X } from 'lucide-react';
import {
  TEMP_TIERS,
  WARDROBE_PRESETS,
  resolveGuineaPigOutfit,
  type WardrobeLookPreset,
} from '../../data/outfits';
import type { GuineaPigOutfit, TimeOfDay, WeatherCondition } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';

export type SheetTab = 'wardrobe' | 'simulator';

interface WardrobeSimulatorSheetProps {
  open: boolean;
  activeTab: SheetTab;
  onChangeTab: (tab: SheetTab) => void;
  onClose: () => void;
  currentOutfit: GuineaPigOutfit;
  isSimulated: boolean;
  temperature: number;
  condition: WeatherCondition;
  windSpeed: number;
  timeOfDay: TimeOfDay;
  unit: TempUnit;
  onApplyPreset: (preset: WardrobeLookPreset) => void;
  onApplyTempSample: (temp: number) => void;
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

export const WardrobeSimulatorSheet: React.FC<WardrobeSimulatorSheetProps> = ({
  open,
  activeTab,
  onChangeTab,
  onClose,
  currentOutfit,
  isSimulated,
  temperature,
  condition,
  windSpeed,
  timeOfDay,
  unit,
  onApplyPreset,
  onApplyTempSample,
  onChangeTemp,
  onChangeCondition,
  onChangeWind,
  onChangeTimeOfDay,
  onResetLive,
}) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="豚鼠衣橱与天气模拟"
      className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-end"
    >
      {/* Upper dismiss area leaving sky & perched guinea pig unobstructed */}
      <div className="pointer-events-auto flex-1" onClick={onClose} />

      <section className="animate-ui-sheet pointer-events-auto mx-auto flex max-h-[48vh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-3xl border border-b-0 border-white/18 bg-slate-950/88 text-white shadow-[0_-16px_48px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
        {/* Drag handle & header */}
        <div className="flex flex-col items-center border-b border-white/12 px-4 pt-2 pb-2.5">
          <div className="mb-2 h-1 w-10 rounded-full bg-white/30" />
          <div className="flex w-full items-center justify-between gap-2">
            <div className="inline-flex rounded-xl border border-white/14 bg-black/40 p-0.5">
              <button
                type="button"
                onClick={() => onChangeTab('wardrobe')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] transition ${
                  activeTab === 'wardrobe'
                    ? 'bg-white font-medium text-slate-950'
                    : 'font-normal text-white/80 hover:text-white'
                }`}
              >
                <Shirt className="h-4 w-4" />
                豚鼠衣橱
              </button>
              <button
                type="button"
                onClick={() => onChangeTab('simulator')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] transition ${
                  activeTab === 'simulator'
                    ? 'bg-white font-medium text-slate-950'
                    : 'font-normal text-white/80 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                天气模拟
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {isSimulated && (
                <button
                  type="button"
                  onClick={onResetLive}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-500/20 px-3 py-1 text-[12px] text-emerald-100 transition hover:bg-emerald-500/35"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  恢复实时
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="收起面板"
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3.5">
          {activeTab === 'wardrobe' ? (
            <>
              <div className="rounded-xl border border-white/12 bg-white/6 px-3.5 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-medium text-amber-200">{currentOutfit.outfitTitle}</span>
                  <span className="text-[12px] font-normal text-white/65">{currentOutfit.tierLabel}</span>
                </div>
                <p className="mt-1 text-[13px] font-normal leading-relaxed text-white/80">
                  {currentOutfit.description}
                </p>
              </div>

              <div>
                <div className="mb-2 text-[13px] font-medium text-white/75">
                  温控智能穿搭（点击实时预览上方豚鼠）
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TEMP_TIERS.map((tier) => {
                    const isActive = currentOutfit.tierId === tier.id;
                    const preview = resolveGuineaPigOutfit(tier.sampleTemp, 'clear', 12, true);
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => onApplyTempSample(tier.sampleTemp)}
                        className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                          isActive
                            ? 'border-amber-300/70 bg-white/15'
                            : 'border-white/12 bg-white/6 hover:bg-white/12'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[12px] font-medium text-amber-200 tabular-nums">
                            {tier.rangeText}
                          </span>
                          {isActive && <Check className="h-3.5 w-3.5 text-amber-300" />}
                        </div>
                        <div className="mt-1 text-[13px] font-medium text-white">{tier.label}</div>
                        <div className="mt-0.5 truncate text-[12px] font-normal text-white/65">
                          {preview.outfitTitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-2 text-[13px] font-medium text-white/75">天气限定造型</div>
                <div className="grid grid-cols-2 gap-2">
                  {WARDROBE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onApplyPreset(preset)}
                      className="flex flex-col rounded-xl border border-white/12 bg-white/6 px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/12"
                    >
                      <span className="text-[13px] font-medium text-white">{preset.name}</span>
                      <span className="mt-0.5 text-[12px] font-normal text-white/65">
                        {preset.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 pb-1">
              <div>
                <div className="mb-2 text-[13px] font-medium text-white/75">气象状态</div>
                <div className="flex flex-wrap gap-1.5">
                  {WEATHER_OPTIONS.map((opt) => {
                    const active = condition === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeCondition(opt.id)}
                        className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${
                          active
                            ? 'bg-white font-medium text-slate-950'
                            : 'border border-white/14 bg-white/8 font-normal text-white/85 hover:bg-white/16'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-normal text-white/80">模拟气温（触发 6 档穿衣）</span>
                  <span className="font-medium text-amber-200 tabular-nums">
                    {formatTemp(temperature, unit)}°{unit}
                    {unit === 'F' && (
                      <span className="ml-1 text-[12px] font-normal text-white/60">
                        ({temperature}°C)
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min={-15}
                  max={42}
                  step={1}
                  value={temperature}
                  onChange={(e) => onChangeTemp(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-rose-400 accent-white"
                />
              </label>

              <label className="block space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-normal text-white/80">模拟风速</span>
                  <span className="font-medium text-sky-200 tabular-nums">{windSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={windSpeed}
                  onChange={(e) => onChangeWind(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-sky-200"
                />
              </label>

              <div className="flex items-center justify-between">
                <span className="text-[13px] font-normal text-white/80">时段光线</span>
                <div className="inline-flex rounded-full border border-white/14 bg-black/40 p-0.5">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeTimeOfDay(t.id)}
                      className={`rounded-full px-3 py-1 text-[13px] transition ${
                        timeOfDay === t.id
                          ? 'bg-amber-200 font-medium text-slate-950'
                          : 'font-normal text-white/80 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
