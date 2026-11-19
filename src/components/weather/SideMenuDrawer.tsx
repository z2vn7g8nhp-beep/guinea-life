import React, { useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
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
import { cityCoordKey } from '../../services/weatherApi';
import type { CityBriefWeather, CityLocation } from '../../types/weather';
import { formatTemp, type TempUnit } from '../../utils/tempUnit';
import { WeatherConditionIcon } from './WeatherConditionIcon';

interface SideMenuDrawerProps {
  open: boolean;
  pinnedCities: CityLocation[];
  activeCityIndex: number;
  briefWeatherMap: Record<string, CityBriefWeather>;
  locatedCityKey: string | null;
  locationSource: 'gps' | 'ip' | null;
  autoLocate: boolean;
  unit: TempUnit;
  soundEnabled: boolean;
  locating: boolean;
  onClose: () => void;
  onSelectCityIndex: (index: number) => void;
  onMoveCity: (fromIdx: number, toIdx: number) => void;
  onRemoveCity: (index: number) => void;
  onOpenCityPicker: () => void;
  onLocateMe: () => void;
  onToggleAutoLocate: () => void;
  onToggleUnit: (unit: TempUnit) => void;
  onToggleSound: () => void;
  onOpenSheet: (tab: 'wardrobe' | 'simulator') => void;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({
  open,
  pinnedCities,
  activeCityIndex,
  briefWeatherMap,
  locatedCityKey,
  locationSource,
  autoLocate,
  unit,
  soundEnabled,
  locating,
  onClose,
  onSelectCityIndex,
  onMoveCity,
  onRemoveCity,
  onOpenCityPicker,
  onLocateMe,
  onToggleAutoLocate,
  onToggleUnit,
  onToggleSound,
  onOpenSheet,
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
        className="animate-ui-fade fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-over drawer */}
      <aside className="animate-ui-drawer relative z-10 flex h-full w-[310px] max-w-[86vw] flex-col border-r border-white/14 bg-slate-950/92 text-white shadow-2xl backdrop-blur-2xl sm:w-[340px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/12 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL || '/'}icon-192.png`}
              alt="豚鼠生活馆"
              draggable={false}
              className="h-10 w-10 rounded-xl object-cover shadow-md ring-1 ring-white/15"
            />
            <div>
              <div className="text-[17px] font-medium tracking-wide text-white">豚鼠生活馆</div>
              <div className="text-[12px] font-normal text-white/60">GuineaLife · 真实气象</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭菜单"
            className="rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {/* Pinned Cities with Live Brief Temps & Reordering */}
          <div>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <span className="text-[13px] font-medium text-white/65">
                关注城市
              </span>
              <span className="text-[13px] text-white/55 tabular-nums">{pinnedCities.length} 个</span>
            </div>

            <div className="space-y-1">
              {pinnedCities.map((city, idx) => {
                const isActive = idx === activeCityIndex;
                const brief = briefWeatherMap[cityCoordKey(city)];
                const isLocated = locatedCityKey !== null && city.name === locatedCityKey;

                return (
                  <div
                    key={`${city.name}-${city.latitude}-${city.longitude}`}
                    className={`group flex items-center justify-between rounded-xl px-2.5 py-2 transition ${
                      isActive
                        ? 'bg-white/14 text-white'
                        : 'text-white/85 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCityIndex(idx);
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <MapPin
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? 'text-amber-300' : 'text-white/48'
                        }`}
                        strokeWidth={1.8}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[15px] font-normal">{city.name}</span>
                          {isLocated && locationSource && (
                            <span className="shrink-0 rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[10px] text-amber-200">
                              {locationSource === 'gps' ? 'GPS' : '网络'}
                            </span>
                          )}
                        </div>
                        {(city.region || city.country) && (
                          <div className="truncate text-[11px] font-normal text-white/55">
                            {[city.region, city.country].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>

                      {brief && (
                        <div className="flex shrink-0 items-center gap-1 pr-1">
                          <WeatherConditionIcon
                            condition={brief.condition}
                            isDay={brief.isDay}
                            className="h-4 w-4"
                          />
                          <span className="text-[14px] font-medium text-white tabular-nums">
                            {formatTemp(brief.temperature, unit)}°
                          </span>
                        </div>
                      )}
                    </button>

                    <div className="ml-1 flex shrink-0 items-center">
                      {pinnedCities.length > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMoveCity(idx, idx - 1)}
                            aria-label={`上移 ${city.name}`}
                            className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === pinnedCities.length - 1}
                            onClick={() => onMoveCity(idx, idx + 1)}
                            aria-label={`下移 ${city.name}`}
                            className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveCity(idx)}
                            aria-label={`移除 ${city.name}`}
                            className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-[13px] font-normal text-white transition hover:bg-white/15"
              >
                <Plus className="h-4 w-4" />
                添加城市
              </button>
              <button
                type="button"
                disabled={locating}
                onClick={() => {
                  onLocateMe();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-[13px] font-normal text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                <LocateFixed className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
                当前定位
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-2.5 border-t border-white/12 pt-4">
            <div className="px-1 text-[13px] font-medium text-white/65">
              显示与定位
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/8 px-3.5 py-2.5">
              <span className="text-[14px] font-normal text-white/90">温度单位</span>
              <div className="inline-flex rounded-lg border border-white/14 bg-black/40 p-0.5">
                {(['C', 'F'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onToggleUnit(u)}
                    className={`rounded-md px-3 py-1 text-[13px] font-medium transition ${
                      unit === u ? 'bg-white text-slate-950' : 'text-white/75 hover:text-white'
                    }`}
                  >
                    °{u}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleAutoLocate}
              className="flex w-full items-center justify-between rounded-xl bg-white/8 px-3.5 py-3 text-left transition hover:bg-white/12"
            >
              <span className="inline-flex items-center gap-2 text-[14px] font-normal text-white/90">
                <LocateFixed className="h-4 w-4 text-sky-200" />
                启动时自动定位
              </span>
              <span
                className={`text-[13px] ${autoLocate ? 'text-amber-200' : 'text-white/55'}`}
              >
                {autoLocate ? '开启' : '关闭'}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              className="flex w-full items-center justify-between rounded-xl bg-white/8 px-3.5 py-3 text-left transition hover:bg-white/12"
            >
              <span className="inline-flex items-center gap-2 text-[14px] font-normal text-white/90">
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-amber-300" />
                ) : (
                  <VolumeX className="h-4 w-4 text-white/60" />
                )}
                环境天气声景
              </span>
              <span
                className={`text-[13px] ${soundEnabled ? 'text-amber-200' : 'text-white/55'}`}
              >
                {soundEnabled ? '开启' : '关闭'}
              </span>
            </button>
          </div>

          {/* Quick Guinea Pig Wardrobe & Weather Lab */}
          <div className="space-y-2 border-t border-white/12 pt-4">
            <div className="px-1 text-[13px] font-medium text-white/65">
              豚鼠与气象实验
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSheet('wardrobe');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/12 bg-white/8 px-3.5 py-3 text-[14px] font-normal text-white transition hover:bg-white/14"
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
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/12 bg-white/8 px-3.5 py-3 text-[14px] font-normal text-white transition hover:bg-white/14"
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
