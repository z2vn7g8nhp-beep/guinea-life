import React from 'react';
import {
  LocateFixed,
  MapPin,
  Plus,
  Shirt,
  SlidersHorizontal,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { CityLocation } from '../../types/weather';
import type { TempUnit } from '../../utils/tempUnit';

interface SideMenuDrawerProps {
  open: boolean;
  pinnedCities: CityLocation[];
  activeCityIndex: number;
  unit: TempUnit;
  soundEnabled: boolean;
  locating: boolean;
  onClose: () => void;
  onSelectCityIndex: (index: number) => void;
  onRemoveCity: (index: number) => void;
  onOpenCityPicker: () => void;
  onLocateMe: () => void;
  onToggleUnit: (unit: TempUnit) => void;
  onToggleSound: () => void;
  onOpenSheet: (tab: 'wardrobe' | 'simulator') => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  open,
  pinnedCities,
  activeCityIndex,
  unit,
  soundEnabled,
  locating,
  onClose,
  onSelectCityIndex,
  onRemoveCity,
  onOpenCityPicker,
  onLocateMe,
  onToggleUnit,
  onToggleSound,
  onOpenSheet,
}) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="导航菜单"
      className="fixed inset-0 z-50 flex"
    >
      {/* Backdrop */}
      <div
        className="animate-ui-fade fixed inset-0 bg-black/55 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-over drawer */}
      <aside className="animate-ui-drawer relative z-10 flex h-full w-[290px] max-w-[85vw] flex-col border-r border-white/12 bg-slate-950/90 text-white shadow-2xl backdrop-blur-2xl sm:w-[320px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-base font-medium tracking-wide text-white">豚鼠生活馆</div>
            <div className="text-[11px] font-light text-white/55">GuineaLife · 真实气象</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭菜单"
            className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Pinned Cities */}
          <div>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="text-[11px] font-medium tracking-wider text-white/55 uppercase">
                关注城市
              </span>
              <span className="text-[11px] text-white/45 tabular-nums">{pinnedCities.length} 个</span>
            </div>

            <div className="space-y-1">
              {pinnedCities.map((city, idx) => {
                const isActive = idx === activeCityIndex;
                return (
                  <div
                    key={`${city.name}-${city.latitude}-${city.longitude}`}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition ${
                      isActive
                        ? 'bg-white/14 text-white'
                        : 'text-white/75 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCityIndex(idx);
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    >
                      <MapPin
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-amber-300' : 'text-white/45'
                        }`}
                        strokeWidth={1.7}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-normal">{city.name}</div>
                        {(city.region || city.country) && (
                          <div className="truncate text-[11px] font-light text-white/50">
                            {[city.region, city.country].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </button>

                    {pinnedCities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveCity(idx)}
                        aria-label={`移除 ${city.name}`}
                        className="ml-2 rounded-lg p-1 text-white/40 opacity-75 transition hover:bg-white/10 hover:text-rose-300 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCityPicker();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-normal text-white transition hover:bg-white/15"
              >
                <Plus className="h-3.5 w-3.5" />
                添加城市
              </button>
              <button
                type="button"
                disabled={locating}
                onClick={() => {
                  onLocateMe();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs font-normal text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : ''}`} />
                当前定位
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="px-1 text-[11px] font-medium tracking-wider text-white/55 uppercase">
              显示与声音
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/6 px-3.5 py-2.5">
              <span className="text-sm font-light text-white/85">温度单位</span>
              <div className="inline-flex rounded-lg border border-white/12 bg-black/35 p-0.5">
                {(['C', 'F'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onToggleUnit(u)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      unit === u ? 'bg-white text-slate-950' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    °{u}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleSound}
              className="flex w-full items-center justify-between rounded-xl bg-white/6 px-3.5 py-2.5 text-left transition hover:bg-white/10"
            >
              <span className="inline-flex items-center gap-2 text-sm font-light text-white/85">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-amber-300" />
                ) : (
                  <VolumeX className="h-4 w-4 text-white/55" />
                )}
                环境天气声景
              </span>
              <span
                className={`text-xs ${soundEnabled ? 'text-amber-200' : 'text-white/50'}`}
              >
                {soundEnabled ? '开启' : '关闭'}
              </span>
            </button>
          </div>

          {/* Quick Guinea Pig Wardrobe & Weather Lab */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="px-1 text-[11px] font-medium tracking-wider text-white/55 uppercase">
              豚鼠与气象实验
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSheet('wardrobe');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm font-light text-white transition hover:bg-white/12"
            >
              <Shirt className="h-4 w-4 text-amber-200" />
              豚鼠衣橱试穿
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSheet('simulator');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm font-light text-white transition hover:bg-white/12"
            >
              <SlidersHorizontal className="h-4 w-4 text-sky-200" />
              天气特效模拟
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
