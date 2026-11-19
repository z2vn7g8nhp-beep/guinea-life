import React from 'react';
import { CheckCircle2, RotateCcw, Shirt, Sparkles } from 'lucide-react';
import { TEMP_TIERS, WARDROBE_PRESETS, resolveGuineaPigOutfit, type WardrobeLookPreset } from '../../data/outfits';
import type { GuineaPigOutfit } from '../../types/weather';
import { GuineaPigMascot } from '../mascot/GuineaPigMascot';

interface WardrobeStudioViewProps {
  currentOutfit: GuineaPigOutfit;
  currentTemp: number;
  currentCondition: WardrobeLookPreset['condition'];
  isSimulated: boolean;
  onApplyPreset: (preset: WardrobeLookPreset) => void;
  onApplyTempSample: (temp: number) => void;
  onResetLive: () => void;
}

export const WardrobeStudioView: React.FC<WardrobeStudioViewProps> = ({
  currentOutfit,
  currentTemp,
  currentCondition,
  isSimulated,
  onApplyPreset,
  onApplyTempSample,
  onResetLive,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Live Preview Stage */}
        <section className="flex flex-col items-center justify-between rounded-3xl border border-white/20 bg-slate-950/35 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex w-full items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-amber-300 uppercase">
              <Shirt className="h-4 w-4" />
              豚鼠试衣间
            </span>
            {isSimulated && (
              <button
                type="button"
                onClick={onResetLive}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-100 hover:bg-emerald-500/35"
              >
                <RotateCcw className="h-3 w-3" />
                同步实时
              </button>
            )}
          </div>

          <GuineaPigMascot
            outfit={currentOutfit}
            condition={currentCondition}
            temperature={currentTemp}
          />

          <div className="w-full rounded-2xl border border-white/15 bg-white/10 p-4 text-left">
            <div className="flex flex-wrap items-center gap-1.5">
              {currentOutfit.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="mt-2 text-base font-semibold text-white">{currentOutfit.outfitTitle}</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/75">{currentOutfit.description}</p>
          </div>
        </section>

        {/* Right Side: 6 Temp Tiers + 8 Scene Presets */}
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-xl backdrop-blur-xl">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-300" />
              6 档温控智能穿搭规则（点击直接试穿）
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {TEMP_TIERS.map((tier) => {
                const isActive = currentOutfit.tierId === tier.id;
                const previewOutfit = resolveGuineaPigOutfit(tier.sampleTemp, 'clear', 12, true);
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onApplyTempSample(tier.sampleTemp)}
                    className={`group flex flex-col justify-between rounded-2xl border p-3.5 text-left transition ${
                      isActive
                        ? 'border-amber-300/70 bg-white/20 shadow-lg'
                        : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/12'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-block rounded-full bg-gradient-to-r ${tier.accent} px-2.5 py-0.5 text-[11px] font-semibold text-white`}
                      >
                        {tier.rangeText}
                      </span>
                      {isActive && <CheckCircle2 className="h-4 w-4 text-amber-300" />}
                    </div>
                    <div className="mt-2.5">
                      <div className="text-sm font-semibold text-white">{tier.label}</div>
                      <div className="mt-0.5 text-xs text-white/70">{previewOutfit.outfitTitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-white/20 bg-slate-950/35 p-5 shadow-xl backdrop-blur-xl">
            <h2 className="mb-3 text-sm font-semibold text-white">天气主题限定造型（含雨具、雪镜、星夜提灯）</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {WARDROBE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-left transition hover:border-white/35 hover:bg-white/16"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{preset.name}</div>
                    <div className="mt-0.5 text-xs text-white/65">{preset.subtitle}</div>
                  </div>
                  <span className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-medium text-amber-200">
                    一键试穿
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
