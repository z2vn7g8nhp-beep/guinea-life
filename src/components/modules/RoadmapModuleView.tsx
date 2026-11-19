import React from 'react';
import { BookHeart, CheckSquare, Coffee, UtensilsCrossed } from 'lucide-react';

const UPCOMING_MODULES = [
  {
    icon: <CheckSquare className="h-6 w-6 text-emerald-300" />,
    title: '每日微习惯打卡',
    tag: '规划中 · 模块 02',
    desc: '喝水、早睡、散步打卡，每次完成任务还能解锁豚鼠的新帽子与小零食道具。',
  },
  {
    icon: <BookHeart className="h-6 w-6 text-rose-300" />,
    title: '心情碎片手账',
    tag: '规划中 · 模块 03',
    desc: '自动把当天的天气截图、体感温度与豚鼠穿搭贴进你的每日心情日记本。',
  },
  {
    icon: <UtensilsCrossed className="h-6 w-6 text-amber-300" />,
    title: '时令饮食灵感',
    tag: '规划中 · 模块 04',
    desc: '降温提醒煮一碗热汤、闷热推荐清爽冷面，跟随天气节气推荐今日餐桌搭配。',
  },
  {
    icon: <Coffee className="h-6 w-6 text-sky-300" />,
    title: '桌面专注白噪音',
    tag: '规划中 · 模块 05',
    desc: '把当前下雨、炉火、微风的真实声景升级为带番茄钟的伴学陪伴模式。',
  },
];

export const RoadmapModuleView: React.FC = () => {
  return (
    <section className="rounded-3xl border border-white/20 bg-slate-950/35 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5">
        <span className="inline-flex items-center rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">
          生活馆扩展架构
        </span>
        <h2 className="mt-2.5 text-xl font-semibold text-white">更多生活板块正在筹备中</h2>
        <p className="mt-1 text-sm text-white/70">
          当前已完成「第一板块：沉浸式天气与动态棕白豚鼠」，后续生活功能可直接在现有模块化导航中无缝扩展。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {UPCOMING_MODULES.map((mod) => (
          <div
            key={mod.title}
            className="rounded-2xl border border-white/15 bg-white/8 p-5 transition hover:border-white/30 hover:bg-white/12"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                {mod.icon}
              </div>
              <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[11px] text-white/75">
                {mod.tag}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">{mod.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/75">{mod.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
