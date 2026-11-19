import React, { useEffect, useState } from 'react';
import { Download, Loader2, Share2, X } from 'lucide-react';
import type { GuineaPigOutfit, MascotCoatId, WeatherSnapshot } from '../../types/weather';
import { generateWeatherPostcard } from '../../utils/postcardGenerator';
import type { TempUnit } from '../../utils/tempUnit';

interface PostcardModalProps {
  open: boolean;
  weather: WeatherSnapshot;
  outfit: GuineaPigOutfit;
  coatId: MascotCoatId;
  customName: string;
  unit: TempUnit;
  localTimeStr: string;
  aqiNeedsMask: boolean;
  onClose: () => void;
}

export const PostcardModal: React.FC<PostcardModalProps> = ({
  open,
  weather,
  outfit,
  coatId,
  customName,
  unit,
  localTimeStr,
  aqiNeedsMask,
  onClose,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    let cancelled = false;
    setImageUrl(null);
    setError(false);

    void generateWeatherPostcard({
      weather,
      outfit,
      coatId,
      customName,
      unit,
      localTimeStr,
      aqiNeedsMask,
      baseUrl: import.meta.env.BASE_URL || '/',
    })
      .then((url) => {
        if (!cancelled) setImageUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
    };
  }, [open, weather, outfit, coatId, customName, unit, localTimeStr, aqiNeedsMask]);

  if (!open) return null;

  const handleSaveOrShare = async () => {
    if (!imageUrl) return;
    const filename = `guinealife-${weather.city.name}.png`;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${weather.city.name} · 豚鼠生活馆`,
        });
        return;
      }
    } catch {
      // Fallback to download anchor
    }

    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="今日豚鼠天气明信片"
      className="animate-ui-fade fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/16 bg-slate-950/92 p-4 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex w-full items-center justify-between">
          <h2 className="text-[15px] font-medium text-white">今日豚鼠天气明信片</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭明信片"
            className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex aspect-[9/16] w-full max-w-[270px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-slate-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${weather.city.name}豚鼠天气明信片`}
              className="h-full w-full object-contain"
            />
          ) : error ? (
            <span className="px-4 text-center text-[13px] text-white/65">
              生成明信片失败，请稍后重试
            </span>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[13px] text-white/75">
              <Loader2 className="h-6 w-6 animate-spin text-amber-200" />
              <span>正在排版合成明信片…</span>
            </div>
          )}
        </div>

        <p className="mt-2.5 text-[12px] text-white/65">
          手机端可直接长按图片保存，或点击下方分享
        </p>

        <button
          type="button"
          disabled={!imageUrl}
          onClick={() => void handleSaveOrShare()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 text-[14px] font-medium text-slate-950 transition hover:bg-amber-200 disabled:opacity-45"
        >
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          保存 / 分享明信片
        </button>
      </div>
    </div>
  );
};
