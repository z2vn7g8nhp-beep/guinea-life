import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { GuineaPigOutfit, MascotCoatId, MascotSnackId, WeatherCondition } from '../../types/weather';
import {
  getCoatMeta,
  getRecoloredSpriteUrl,
  type GarmentVariantId,
  type MascotSpriteKey,
} from '../../utils/mascotCoat';
import { weatherAudio } from '../../utils/weatherAudio';

export type MascotPropMode = 'none' | 'umbrella' | 'blizzard' | 'snow-dust' | 'fan' | 'lantern';

interface GuineaPigMascotProps {
  outfit: GuineaPigOutfit;
  condition: WeatherCondition;
  temperature: number;
  coatId: MascotCoatId;
  customName: string;
  aqiNeedsMask?: boolean;
  startled?: boolean;
  feedEvent: { id: number; snack: MascotSnackId } | null;
  onPet?: (quote: string) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  kind: 'heart' | 'sparkle' | 'crumb';
}

export type { GarmentVariantId, MascotSpriteKey };

function temperatureFallbackSprite(tierId: GuineaPigOutfit['tierId']): MascotSpriteKey {
  if (tierId === 'freezing' || tierId === 'cold') return 'cold';
  if (tierId === 'cool') return 'cool';
  if (tierId === 'mild' || tierId === 'warm') return 'mild';
  return 'base';
}

export function resolveMascotVisual(
  outfit: GuineaPigOutfit,
  condition: WeatherCondition
): {
  spriteKey: MascotSpriteKey;
  garmentVariant: GarmentVariantId;
  propMode: MascotPropMode;
} {
  if (outfit.rainGear !== 'none') {
    return {
      spriteKey: 'cold',
      garmentVariant: outfit.rainGear === 'storm-slicker' ? 'storm-rain' : 'honey-rain',
      propMode: 'umbrella',
    };
  }
  if (condition === 'blizzard' || outfit.eyewear === 'snow-goggles') {
    return {
      spriteKey: 'cold',
      garmentVariant: 'navy-winter',
      propMode: 'blizzard',
    };
  }
  if (outfit.tierId === 'freezing') {
    return {
      spriteKey: 'cold',
      garmentVariant: 'pine-winter',
      propMode: 'snow-dust',
    };
  }
  if (condition === 'fog') {
    return {
      spriteKey: 'cool',
      garmentVariant: 'default',
      propMode: outfit.handheldProp === 'lantern' ? 'lantern' : 'none',
    };
  }
  if (outfit.headwear === 'nightcap') {
    return {
      spriteKey: temperatureFallbackSprite(outfit.tierId),
      garmentVariant: outfit.tierId === 'warm' ? 'sky-denim' : 'default',
      propMode: 'lantern',
    };
  }
  if (outfit.tierId === 'cold') {
    return {
      spriteKey: 'cold',
      garmentVariant: 'default',
      propMode: outfit.handheldProp === 'lantern' ? 'lantern' : outfit.hasSnowDust ? 'snow-dust' : 'none',
    };
  }
  if (outfit.tierId === 'cool') {
    return {
      spriteKey: 'cool',
      garmentVariant: 'default',
      propMode: outfit.handheldProp === 'lantern' ? 'lantern' : outfit.hasSnowDust ? 'snow-dust' : 'none',
    };
  }
  if (outfit.tierId === 'mild') {
    return {
      spriteKey: 'mild',
      garmentVariant: 'default',
      propMode: outfit.handheldProp === 'lantern' ? 'lantern' : outfit.hasSnowDust ? 'snow-dust' : 'none',
    };
  }
  if (outfit.tierId === 'warm') {
    return {
      spriteKey: 'mild',
      garmentVariant: 'sky-denim',
      propMode: outfit.handheldProp === 'lantern' ? 'lantern' : 'none',
    };
  }
  return {
    spriteKey: 'base',
    garmentVariant: 'default',
    propMode: 'fan',
  };
}

export const GuineaPigMascot: React.FC<GuineaPigMascotProps> = ({
  outfit,
  condition,
  temperature,
  coatId,
  customName,
  aqiNeedsMask = false,
  startled = false,
  feedEvent,
  onPet,
}) => {
  const uid = useId().replace(/:/g, '');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [activeSnack, setActiveSnack] = useState<MascotSnackId>('hay');
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const petTimerRef = useRef<number | null>(null);
  const eatTimerRef = useRef<number | null>(null);
  const heartTimersRef = useRef<number[]>([]);
  const lastFeedIdRef = useRef<number>(0);

  const baseUrl = import.meta.env.BASE_URL || '/';
  const baseSpriteUrl = `${baseUrl}assets/mascot/base.webp`;
  const { spriteKey, garmentVariant, propMode } = useMemo(
    () => resolveMascotVisual(outfit, condition),
    [outfit, condition]
  );

  const rawSpriteUrl = `${baseUrl}assets/mascot/${spriteKey}.webp`;
  const [displaySpriteUrl, setDisplaySpriteUrl] = useState<string>(rawSpriteUrl);

  // Preload 4 core hand-painted sprites once
  useEffect(() => {
    (['base', 'mild', 'cool', 'cold'] as MascotSpriteKey[]).forEach((k) => {
      const img = new Image();
      img.src = `${baseUrl}assets/mascot/${k}.webp`;
    });
  }, [baseUrl]);

  // Apply seamless coat fur + garment gouache recoloring
  useEffect(() => {
    let cancelled = false;
    if (coatId === 'classic' && garmentVariant === 'default') {
      setDisplaySpriteUrl(rawSpriteUrl);
      return;
    }
    void getRecoloredSpriteUrl(spriteKey, rawSpriteUrl, baseSpriteUrl, coatId, garmentVariant).then(
      (url) => {
        if (!cancelled) {
          setDisplaySpriteUrl(url);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [spriteKey, rawSpriteUrl, baseSpriteUrl, coatId, garmentVariant]);

  // Natural blinking loop (2.8s - 5.6s)
  useEffect(() => {
    let waitTimer = 0;
    let closeTimer = 0;
    const scheduleBlink = () => {
      const wait = 2800 + Math.random() * 2800;
      waitTimer = window.setTimeout(() => {
        setIsBlinking(true);
        closeTimer = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140);
      }, wait);
    };
    scheduleBlink();
    return () => {
      window.clearTimeout(waitTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (petTimerRef.current !== null) window.clearTimeout(petTimerRef.current);
      if (eatTimerRef.current !== null) window.clearTimeout(eatTimerRef.current);
      for (const tid of heartTimersRef.current) {
        window.clearTimeout(tid);
      }
    };
  }, []);

  // Respond to feeding events
  useEffect(() => {
    if (!feedEvent || feedEvent.id === lastFeedIdRef.current) return;
    lastFeedIdRef.current = feedEvent.id;

    setActiveSnack(feedEvent.snack);
    setIsEating(true);
    if (eatTimerRef.current !== null) {
      window.clearTimeout(eatTimerRef.current);
    }
    eatTimerRef.current = window.setTimeout(() => {
      setIsEating(false);
      eatTimerRef.current = null;
    }, 1350);

    const batchId = feedEvent.id;
    const spawned: FloatingHeart[] = [
      { id: batchId + 1, x: 118, y: 242, kind: 'crumb' },
      { id: batchId + 2, x: 185, y: 120, kind: 'sparkle' },
      { id: batchId + 3, x: 256, y: 102, kind: 'heart' },
    ];
    setHearts((prev) => [...prev.slice(-6), ...spawned]);
    const hTimer = window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id < batchId));
    }, 1350);
    heartTimersRef.current.push(hTimer);
  }, [feedEvent]);

  const handlePetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    weatherAudio.playPetChime();
    setIsPetted(true);
    if (petTimerRef.current !== null) {
      window.clearTimeout(petTimerRef.current);
    }
    petTimerRef.current = window.setTimeout(() => {
      setIsPetted(false);
      petTimerRef.current = null;
    }, 640);

    const quotes = outfit.reactionQuotes;
    const nextQuote = quotes[quoteIdx % quotes.length] ?? 'Wheek~ 豚鼠向你问好！';
    setQuoteIdx((prev) => prev + 1);
    onPet?.(nextQuote);

    const batchId = Date.now();
    const spawned: FloatingHeart[] = [
      { id: batchId + 1, x: 140 + Math.random() * 28, y: 112, kind: 'heart' },
      { id: batchId + 2, x: 235 + Math.random() * 34, y: 86, kind: 'sparkle' },
      { id: batchId + 3, x: 325 + Math.random() * 28, y: 118, kind: 'heart' },
    ];
    setHearts((prev) => [...prev.slice(-6), ...spawned]);
    const hTimer = window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id < batchId));
    }, 1350);
    heartTimersRef.current.push(hTimer);
  };

  const bodyAnimClass = isPetted
    ? 'animate-cavy-pet-jump'
    : isEating
    ? 'animate-cavy-chew'
    : outfit.animationMode === 'shiver'
    ? 'animate-cavy-shiver'
    : outfit.animationMode === 'pant'
    ? 'animate-cavy-pant'
    : outfit.animationMode === 'bounce'
    ? 'animate-cavy-bounce'
    : 'animate-cavy-breathe';

  const isStorm = condition === 'thunderstorm' || condition === 'heavy-rain';
  const isRainy = propMode === 'umbrella';
  const isNightLantern = propMode === 'lantern';
  const isBlizzardGoggles = propMode === 'blizzard';
  const isFogGlasses = outfit.eyewear === 'round-glasses' && !isBlizzardGoggles;
  const isSunglasses = outfit.eyewear === 'sunglasses' && !isBlizzardGoggles;
  const eyesCovered = isBlizzardGoggles || isSunglasses;
  const coatMeta = getCoatMeta(coatId);

  const umbrellaGradId = `umbrellaDome-${uid}`;
  const lanternGlowId = `lanternAura-${uid}`;
  const lensGradId = `sunLens-${uid}`;
  const skiLensGradId = `skiLens-${uid}`;
  const maskGradId = `aqiMask-${uid}`;

  // Calibrated 560x420 eyeball centers:
  // Left Eye: (136, 226), Right Eye: (230, 235), Nose/Snout: (158, 274)
  return (
    <div className="relative flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handlePetClick}
        title={`摸摸${customName}`}
        aria-label={`摸摸${customName}，当前穿搭：${outfit.outfitTitle}`}
        className="group relative cursor-pointer rounded-3xl transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {/* Atmospheric backlight behind the perched guinea pig */}
        <div
          className="pointer-events-none absolute inset-x-6 top-8 bottom-2 rounded-full opacity-45 blur-2xl transition-colors duration-700"
          style={{
            background:
              temperature <= 2
                ? 'radial-gradient(circle, rgba(186,230,253,0.45) 0%, rgba(56,189,248,0) 70%)'
                : isNightLantern
                ? 'radial-gradient(circle, rgba(253,224,71,0.45) 0%, rgba(251,146,60,0) 70%)'
                : 'radial-gradient(circle, rgba(255,244,225,0.34) 0%, rgba(255,255,255,0) 72%)',
          }}
        />

        {/* Fixed 4:3 Stage preventing layout shift */}
        <div
          className={`relative z-10 aspect-[4/3] w-[228px] sm:w-[252px] ${bodyAnimClass}`}
          style={{ transformOrigin: 'center 94%' }}
        >
          {/* Hand-Painted Gouache Sprite (with coat fur & garment color variants) */}
          <img
            src={displaySpriteUrl}
            alt={customName}
            draggable={false}
            className="pointer-events-none h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.34)] transition-opacity duration-200"
          />

          {/* Interactive & Animated Storybook SVG Details */}
          <svg
            viewBox="0 0 560 420"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <radialGradient id={umbrellaGradId} cx="36%" cy="28%" r="74%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                <stop offset="55%" stopColor="rgba(186,230,253,0.38)" />
                <stop offset="100%" stopColor="rgba(125,211,252,0.58)" />
              </radialGradient>

              <radialGradient id={lanternGlowId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(254, 240, 138, 0.92)" />
                <stop offset="48%" stopColor="rgba(251, 191, 36, 0.36)" />
                <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
              </radialGradient>

              <linearGradient id={lensGradId} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="rgba(56, 36, 26, 0.9)" />
                <stop offset="100%" stopColor="rgba(30, 22, 18, 0.82)" />
              </linearGradient>

              <linearGradient id={skiLensGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(248, 184, 96, 0.94)" />
                <stop offset="55%" stopColor="rgba(226, 136, 118, 0.92)" />
                <stop offset="100%" stopColor="rgba(190, 108, 162, 0.92)" />
              </linearGradient>

              <linearGradient id={maskGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E6F5FC" />
                <stop offset="100%" stopColor="#C7E6F4" />
              </linearGradient>
            </defs>

            {/* 1. Animated Bubble Umbrella for Rain & Storm */}
            {isRainy && (
              <g className="animate-cavy-umbrella" style={{ transformOrigin: '300px 240px' }}>
                <line
                  x1="286"
                  y1="14"
                  x2="286"
                  y2="255"
                  stroke="rgba(241, 245, 249, 0.9)"
                  strokeWidth="5.2"
                  strokeLinecap="round"
                />
                <path
                  d="M 286 255 C 286 272, 268 272, 268 258"
                  stroke="#8B5A3C"
                  strokeWidth="6.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 88 122 C 88 12, 484 12, 484 122 Q 385 106 286 122 Q 187 106 88 122 Z"
                  fill={`url(#${umbrellaGradId})`}
                  stroke={isStorm ? '#93C5FD' : 'rgba(255,255,255,0.9)'}
                  strokeWidth="3"
                />
                <path
                  d="M 286 24 Q 204 58 174 114 M 286 24 Q 368 58 398 114 M 286 24 V 122"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2.2"
                  fill="none"
                />
              </g>
            )}

            {/* 2. Spinning Pastel Mint Mini Fan (Hot) */}
            {propMode === 'fan' && (
              <g transform="translate(60, 316)">
                <rect x="18" y="40" width="10" height="34" rx="5" fill="#497D74" />
                <circle
                  cx="23"
                  cy="24"
                  r="25"
                  fill="rgba(204,251,241,0.34)"
                  stroke="#7DD3C6"
                  strokeWidth="3"
                />
                <g className="animate-cavy-fan-spin" style={{ transformOrigin: '23px 24px' }}>
                  <ellipse cx="23" cy="11" rx="5.2" ry="10.5" fill="#82E3D4" />
                  <ellipse cx="23" cy="37" rx="5.2" ry="10.5" fill="#82E3D4" />
                  <ellipse cx="10" cy="24" rx="10.5" ry="5.2" fill="#A9F3E7" />
                  <ellipse cx="36" cy="24" rx="10.5" ry="5.2" fill="#A9F3E7" />
                </g>
                <circle cx="23" cy="24" r="5" fill="#497D74" />
              </g>
            )}

            {/* 3. Swinging Warm Brass Lantern (Night) */}
            {isNightLantern && (
              <g transform="translate(60, 306)" className="animate-cavy-lantern">
                <circle cx="24" cy="52" r="54" fill={`url(#${lanternGlowId})`} />
                <line x1="24" y1="6" x2="24" y2="24" stroke="#FDE047" strokeWidth="3.4" />
                <rect
                  x="9"
                  y="24"
                  width="30"
                  height="42"
                  rx="9"
                  fill="#E3973B"
                  stroke="#FEF08A"
                  strokeWidth="2.2"
                />
                <rect x="16" y="31" width="16" height="28" rx="5.5" fill="#FEF9C3" />
              </g>
            )}

            {/* 4. Sweat Drop on very hot days */}
            {outfit.hasSweatDrop && (
              <path
                d="M 268 182 C 268 182, 277 193, 277 200 A 9 9 0 1 1 259 200 C 259 193, 268 182, 268 182 Z"
                fill="#8CE0FA"
                stroke="rgba(255,255,255,0.65)"
                strokeWidth="1.2"
              />
            )}

            {/* 5. Natural Blink / Happy Smile Eyes at calibrated (136,226) & (230,235) */}
            {!eyesCovered && !startled && (isPetted || isEating || isBlinking) && (
              <g>
                <ellipse cx="136" cy="226" rx="14.5" ry="17" fill={coatMeta.eyelidHex} />
                <ellipse cx="230" cy="235" rx="13" ry="15" fill={coatMeta.eyelidHex} />
                {isPetted || isEating ? (
                  <>
                    <path
                      d="M 124 228 Q 136 216 148 228"
                      fill="none"
                      stroke="#2A1F1B"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 218 237 Q 230 225 242 237"
                      fill="none"
                      stroke="#2A1F1B"
                      strokeWidth="3.6"
                      strokeLinecap="round"
                    />
                  </>
                ) : (
                  <>
                    <path
                      d="M 125 227 Q 136 233 147 227"
                      fill="none"
                      stroke="#2A1F1B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 219 236 Q 230 242 241 236"
                      fill="none"
                      stroke="#2A1F1B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </g>
            )}

            {/* 6. Lightning-Flash Startled Eyes */}
            {startled && !eyesCovered && (
              <g>
                <circle cx="136" cy="226" r="13.5" fill="#FFFFFF" stroke="#2A1F1B" strokeWidth="2.5" />
                <circle cx="136" cy="226" r="6.5" fill="#2A1F1B" />
                <circle cx="139" cy="223" r="2.4" fill="#FFFFFF" />
                <circle cx="230" cy="235" r="13.5" fill="#FFFFFF" stroke="#2A1F1B" strokeWidth="2.5" />
                <circle cx="230" cy="235" r="6.5" fill="#2A1F1B" />
                <circle cx="233" cy="232" r="2.4" fill="#FFFFFF" />
              </g>
            )}

            {/* 7. Fog Glasses, Sunny Sunglasses, or Blizzard Ski Goggles */}
            {isFogGlasses && (
              <g>
                <circle
                  cx="136"
                  cy="226"
                  r="20"
                  fill="rgba(235,246,255,0.16)"
                  stroke="#7A4F30"
                  strokeWidth="3.4"
                />
                <circle
                  cx="230"
                  cy="235"
                  r="20.5"
                  fill="rgba(235,246,255,0.16)"
                  stroke="#7A4F30"
                  strokeWidth="3.4"
                />
                <path d="M 156 225 Q 183 217 209 229" stroke="#7A4F30" strokeWidth="3.2" fill="none" />
              </g>
            )}

            {isSunglasses && (
              <g>
                <circle
                  cx="136"
                  cy="226"
                  r="20.5"
                  fill={`url(#${lensGradId})`}
                  stroke="#E3B35F"
                  strokeWidth="3.2"
                />
                <circle
                  cx="230"
                  cy="235"
                  r="21"
                  fill={`url(#${lensGradId})`}
                  stroke="#E3B35F"
                  strokeWidth="3.2"
                />
                <path d="M 157 224 Q 183 216 209 227" stroke="#E3B35F" strokeWidth="3.2" fill="none" />
                <line
                  x1="126"
                  y1="216"
                  x2="140"
                  y2="234"
                  stroke="rgba(255,255,255,0.34)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                <line
                  x1="220"
                  y1="225"
                  x2="234"
                  y2="243"
                  stroke="rgba(255,255,255,0.34)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {isBlizzardGoggles && (
              <g>
                <path
                  d="M 110 220 Q 116 222 122 224 M 248 232 Q 272 232 292 224"
                  stroke="rgba(52, 48, 56, 0.92)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
                <rect
                  x="114"
                  y="204"
                  width="138"
                  height="46"
                  rx="21"
                  fill="#3B3538"
                  stroke="#262022"
                  strokeWidth="2.5"
                />
                <path
                  d="M 134 210 L 231 210 A 15 15 0 0 1 246 225 L 246 229 A 15 15 0 0 1 231 244 L 194 244 L 184 235 L 174 244 L 134 244 A 15 15 0 0 1 119 229 L 119 225 A 15 15 0 0 1 134 210 Z"
                  fill={`url(#${skiLensGradId})`}
                />
                <line
                  x1="138"
                  y1="214"
                  x2="156"
                  y2="238"
                  stroke="rgba(255, 250, 235, 0.56)"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                />
                <line
                  x1="205"
                  y1="215"
                  x2="222"
                  y2="239"
                  stroke="rgba(255, 250, 235, 0.48)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* 8. Plush Pastel-Sky Storybook AQI Protective Mask */}
            {aqiNeedsMask && (
              <g>
                {/* Soft cream elastic ear loops curving below cheek away from right eye */}
                <path
                  d="M 134 265 Q 111 241 121 202"
                  fill="none"
                  stroke="rgba(248, 240, 228, 0.84)"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                <path
                  d="M 186 270 Q 226 276 254 226"
                  fill="none"
                  stroke="rgba(248, 240, 228, 0.8)"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                {/* Soft warm ambient shadow under mask */}
                <path
                  d="M 132 269 Q 132 260 141 258 Q 160 255 179 262 Q 188 265 186 274 L 181 298 Q 160 304 137 296 Z"
                  fill="rgba(92, 62, 46, 0.2)"
                />
                {/* Rounded pleated pastel-sky cloth mask with sepia ink outline */}
                <path
                  d="M 133 268 Q 133 259 142 257 Q 161 254 179 261 Q 188 264 186 273 L 181 296 Q 160 302 137 294 Q 134 283 133 268 Z"
                  fill={`url(#${maskGradId})`}
                  stroke="#7C6456"
                  strokeWidth="2.1"
                  strokeLinejoin="round"
                />
                <path
                  d="M 139 274 Q 160 270 182 277 M 138 285 Q 159 281 180 287"
                  fill="none"
                  stroke="rgba(130, 178, 206, 0.78)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                {/* Tiny coral heart badge */}
                <path
                  d="M 171 280 c -1.5 -2.6, -5.2 -2, -5.2 1.1 c 0 2.7, 5.2 5.6, 5.2 5.6 c 0 0, 5.2 -2.9, 5.2 -5.6 c 0 -3.1, -3.7 -3.7, -5.2 -1.1 z"
                  fill="#F4808A"
                />
              </g>
            )}

            {/* 9. Animated Feeding Snack Icon Near Nose */}
            {isEating && (
              <g className="animate-cavy-snack" transform="translate(106, 266)">
                {activeSnack === 'strawberry' && (
                  <g>
                    <path d="M 16 4 C 24 4, 28 14, 24 24 C 21 31, 12 31, 9 24 C 5 14, 9 4, 16 4 Z" fill="#FB7185" />
                    <path d="M 10 5 Q 16 1 22 5 L 16 9 Z" fill="#4ADE80" />
                    <circle cx="14" cy="14" r="1.2" fill="#FEF08A" />
                    <circle cx="19" cy="18" r="1.2" fill="#FEF08A" />
                    <circle cx="14" cy="22" r="1.2" fill="#FEF08A" />
                  </g>
                )}
                {activeSnack === 'sweet-potato' && (
                  <g>
                    <ellipse cx="18" cy="18" rx="14" ry="10" fill="#B45309" />
                    <ellipse cx="18" cy="16" rx="10" ry="6.5" fill="#FBBF24" />
                  </g>
                )}
                {activeSnack === 'lettuce' && (
                  <g>
                    <circle cx="16" cy="18" r="11" fill="#4ADE80" />
                    <circle cx="22" cy="14" r="8" fill="#86EFAC" />
                    <path d="M 10 24 Q 17 17 24 12" stroke="#16A34A" strokeWidth="2" fill="none" />
                  </g>
                )}
                {activeSnack === 'hay' && (
                  <g stroke="#84CC16" strokeWidth="3" strokeLinecap="round">
                    <line x1="6" y1="24" x2="28" y2="8" />
                    <line x1="8" y1="16" x2="30" y2="20" stroke="#A3E635" />
                    <circle cx="28" cy="8" r="3" fill="#FEF08A" stroke="none" />
                  </g>
                )}
              </g>
            )}

            {/* 10. Cold Breath Puffs & Delicate Snow Dust on Beret / Coat Back */}
            {outfit.hasFrostBreath && (
              <g className="animate-cavy-breath-puff" style={{ transformOrigin: '132px 292px' }}>
                <circle cx="128" cy="292" r="6" fill="rgba(255,255,255,0.72)" />
                <circle cx="114" cy="288" r="8.5" fill="rgba(255,255,255,0.56)" />
                <circle cx="100" cy="292" r="5" fill="rgba(255,255,255,0.44)" />
              </g>
            )}

            {(propMode === 'snow-dust' || propMode === 'blizzard') && (
              <g fill="rgba(255, 255, 255, 0.9)">
                <ellipse cx="204" cy="122" rx="11" ry="4.5" />
                <ellipse cx="224" cy="117" rx="13" ry="5" />
                <ellipse cx="244" cy="123" rx="9" ry="4" />
                <ellipse cx="380" cy="158" rx="12" ry="4.5" />
                <ellipse cx="400" cy="162" rx="14" ry="5" />
                <ellipse cx="418" cy="168" rx="10" ry="4" />
              </g>
            )}

            {/* 11. Floating Pet & Snack Hearts / Sparkles */}
            {hearts.map((h) => (
              <g
                key={h.id}
                className="animate-cavy-heart"
                style={{ transformOrigin: `${h.x}px ${h.y}px` }}
              >
                {h.kind === 'heart' ? (
                  <path
                    d={`M ${h.x} ${h.y} c -5 -9, -17 -7, -17 3.6 c 0 9, 17 19, 17 19 c 0 0, 17 -10, 17 -19 c 0 -10.6, -12 -12.6, -17 -3.6 z`}
                    fill="#FB7185"
                  />
                ) : h.kind === 'sparkle' ? (
                  <path
                    d={`M ${h.x} ${h.y - 12} L ${h.x + 3.6} ${h.y - 3.6} L ${h.x + 12} ${h.y} L ${h.x + 3.6} ${h.y + 3.6} L ${h.x} ${h.y + 12} L ${h.x - 3.6} ${h.y + 3.6} L ${h.x - 12} ${h.y} L ${h.x - 3.6} ${h.y - 3.6} Z`}
                    fill="#FDE047"
                  />
                ) : (
                  <circle cx={h.x} cy={h.y} r="4.5" fill="#FBBF24" />
                )}
              </g>
            ))}
          </svg>
        </div>
      </button>
    </div>
  );
};
