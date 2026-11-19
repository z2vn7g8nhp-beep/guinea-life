import React from 'react';
import { Coffee, Compass, Footprints, Shirt, Sun, Wind } from 'lucide-react';
import { buildLifestyleIndices } from '../../data/outfits';
import type { WeatherSnapshot } from '../../types/weather';

interface LifestyleIndicesViewProps {
  weather: WeatherSnapshot;
}

const ICONS: Record<string, React.ReactNode> = {
  dressing: <Shirt className="h-3.5 w-3.5 text-amber-200/85" strokeWidth={1.6} />,
  laundry: <Wind className="h-3.5 w-3.5 text-sky-200/85" strokeWidth={1.6} />,
  uv: <Sun className="h-3.5 w-3.5 text-amber-200/85" strokeWidth={1.6} />,
  outdoor: <Footprints className="h-3.5 w-3.5 text-emerald-200/85" strokeWidth={1.6} />,
  hydration: <Coffee className="h-3.5 w-3.5 text-amber-100/85" strokeWidth={1.6} />,
  commute: <Compass className="h-3.5 w-3.5 text-sky-200/85" strokeWidth={1.6} />,
};

export const LifestyleIndicesView: React.FC<LifestyleIndicesViewProps> = ({ weather }) => {
  const items = buildLifestyleIndices(weather);

  return (
    <section className="rounded-2xl border border-white/10 bg-black/42 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between border-b border-white/10 pb-2.5">
        <h2 className="text-xs font-medium tracking-wider text-white/80 uppercase">
          今日生活指南
        </h2>
        <span className="text-[11px] font-light text-white/55">{weather.city.name}</span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x">
        {items.map((item) => (
          <article key={item.id} className="px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-light text-white/70">
                {ICONS[item.id] ?? <Sun className="h-3.5 w-3.5" strokeWidth={1.6} />}
                <span>{item.title}</span>
              </div>
              <span className="text-[11px] font-light text-white/55 tabular-nums">
                {item.score}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-normal text-white">{item.level}</div>
            <p className="mt-1 line-clamp-2 text-[11px] font-light leading-relaxed text-white/65">
              {item.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
