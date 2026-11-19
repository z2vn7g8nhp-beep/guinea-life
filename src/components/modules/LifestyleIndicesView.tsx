import React from 'react';
import { Coffee, Compass, Footprints, Shirt, Sun, Wind } from 'lucide-react';
import { buildLifestyleIndices } from '../../data/outfits';
import type { LifestyleIndexItem, WeatherSnapshot } from '../../types/weather';

interface LifestyleIndicesViewProps {
  weather: WeatherSnapshot;
}

const ICONS: Record<string, React.ReactNode> = {
  dressing: <Shirt className="h-5 w-5" />,
  laundry: <Wind className="h-5 w-5" />,
  uv: <Sun className="h-5 w-5" />,
  outdoor: <Footprints className="h-5 w-5" />,
  hydration: <Coffee className="h-5 w-5" />,
  commute: <Compass className="h-5 w-5" />,
};

const TONE_BADGE: Record<LifestyleIndexItem['tone'], string> = {
  emerald: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30',
  sky: 'bg-sky-400/20 text-sky-200 border-sky-300/30',
  amber: 'bg-amber-400/20 text-amber-200 border-amber-300/30',
  rose: 'bg-rose-400/20 text-rose-200 border-rose-300/30',
  indigo: 'bg-indigo-400/20 text-indigo-200 border-indigo-300/30',
};

const TONE_BAR: Record<LifestyleIndexItem['tone'], string> = {
  emerald: 'from-emerald-400 to-teal-300',
  sky: 'from-sky-400 to-cyan-300',
  amber: 'from-amber-400 to-yellow-300',
  rose: 'from-rose-400 to-orange-300',
  indigo: 'from-indigo-400 to-violet-300',
};

export const LifestyleIndicesView: React.FC<LifestyleIndicesViewProps> = ({ weather }) => {
  const items = buildLifestyleIndices(weather);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/20 bg-slate-950/35 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-white">今日天气生活指南</h2>
            <p className="mt-0.5 text-xs text-white/70">
              基于 {weather.city.name} 当前 {weather.temperature}°C · {weather.conditionLabel} 实时生成的日常建议
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85">
            空气湿度 {weather.humidity}% · 体感 {weather.apparentTemperature}°C
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-white/15 bg-white/8 p-4 transition hover:bg-white/12"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-white">
                    <span className={`inline-flex rounded-xl border p-2 ${TONE_BADGE[item.tone]}`}>
                      {ICONS[item.id] ?? <Sun className="h-5 w-5" />}
                    </span>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                  </div>
                  <span className="text-xs font-semibold text-white/75 tabular-nums">{item.score} 分</span>
                </div>

                <div className="mt-3 text-base font-bold text-white">{item.level}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-white/75">{item.summary}</p>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${TONE_BAR[item.tone]}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
