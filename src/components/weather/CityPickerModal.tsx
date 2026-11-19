import React, { useEffect, useState } from 'react';
import { Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { PRESET_CITIES, searchCities } from '../../services/weatherApi';
import type { CityLocation } from '../../types/weather';

interface CityPickerModalProps {
  open: boolean;
  currentCity: CityLocation;
  onClose: () => void;
  onSelectCity: (city: CityLocation) => void;
  onLocateMe: () => void;
  locating: boolean;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  open,
  currentCity,
  onClose,
  onSelectCity,
  onLocateMe,
  locating,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityLocation[]>(PRESET_CITIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(PRESET_CITIES);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void searchCities(trimmed).then((list) => {
        if (!active) return;
        setResults(list);
        setLoading(false);
      });
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="切换城市"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/25 bg-slate-900/90 p-5 text-white shadow-2xl backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-300" />
            <h2 className="text-base font-semibold">切换城市天气</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭城市选择"
            className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入城市名（如：杭州、成都、Tokyo、Paris）..."
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-2.5 pr-4 pl-10 text-sm text-white placeholder-white/45 focus:border-amber-300/60 focus:outline-none"
            />
          </div>
          <button
            type="button"
            disabled={locating}
            onClick={onLocateMe}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl border border-sky-300/35 bg-sky-500/20 px-3.5 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/35 disabled:opacity-50"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            当前定位
          </button>
        </div>

        <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-white/65">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在搜索城市...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/60">未找到匹配城市，请尝试中文全称或英文名</div>
          ) : (
            results.map((city) => {
              const isSelected =
                city.name === currentCity.name &&
                Math.abs(city.latitude - currentCity.latitude) < 0.05;
              return (
                <button
                  key={`${city.name}-${city.latitude}-${city.longitude}`}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left transition ${
                    isSelected
                      ? 'border border-amber-300/50 bg-amber-400/20'
                      : 'border border-transparent bg-white/5 hover:bg-white/12'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{city.name}</div>
                    <div className="text-xs text-white/60">
                      {[city.region, city.country].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span className="text-[11px] text-white/45 tabular-nums">
                    {city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
