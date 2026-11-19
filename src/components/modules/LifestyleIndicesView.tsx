import React from 'react';
import { Coffee, Compass, Footprints, Shirt, Sun, Wind } from 'lucide-react';
import { buildLifestyleIndices } from '../../data/outfits';
import type { WeatherSnapshot } from '../../types/weather';
import type { WeatherTheme } from '../../utils/weatherTheme';

interface LifestyleIndicesViewProps {
  weather: WeatherSnapshot;
  theme: WeatherTheme;
}

const ICONS: Record<string, React.ReactNode> = {
  dressing: <Shirt className="h-4 w-4 text-amber-200" strokeWidth={1.7} />,
  laundry: <Wind className="h-4 w-4 text-sky-200" strokeWidth={1.7} />,
  uv: <Sun className="h-4 w-4 text-amber-200" strokeWidth={1.7} />,
  outdoor: <Footprints className="h-4 w-4 text-emerald-200" strokeWidth={1.7} />,
  hydration: <Coffee className="h-4 w-4 text-amber-100" strokeWidth={1.7} />,
  commute: <Compass className="h-4 w-4 text-sky-200" strokeWidth={1.7} />,
};

export const LifestyleIndicesView: React.FC<LifestyleIndicesViewProps> = ({ weather, theme }) => {
  const items = buildLifestyleIndices(weather);

  return (
    <section
      className={`overflow-hidden rounded-2xl border p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150 transition-colors duration-500 ${theme.cardBgClass}`}
    >
      <div className="mb-3 flex items-center justify-between border-b border-white/12 pb-2.5">
        <h2 className="text-[14px] font-medium tracking-wide text-white/92">
          今日生活指南
        </h2>
        <span className="text-[13px] font-normal text-white/65">{weather.city.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="bg-slate-950/38 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[13px] font-normal text-white/80">
                {ICONS[item.id] ?? <Sun className="h-4 w-4" strokeWidth={1.7} />}
                <span>{item.title}</span>
              </div>
              <span className="text-[13px] font-normal text-white/60 tabular-nums">
                {item.score}
              </span>
            </div>
            <div className="mt-1.5 text-[15px] font-medium text-white">{item.level}</div>
            <p className="mt-1 text-[13px] font-normal leading-relaxed text-white/78">
              {item.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
