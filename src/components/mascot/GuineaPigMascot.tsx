import React, { useEffect, useId, useState } from 'react';
import type { GuineaPigOutfit, WeatherCondition } from '../../types/weather';
import { weatherAudio } from '../../utils/weatherAudio';

interface GuineaPigMascotProps {
  outfit: GuineaPigOutfit;
  condition: WeatherCondition;
  temperature: number;
  startled?: boolean;
  onPet?: (quote: string) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  kind: 'heart' | 'sparkle';
}

export type MascotSpriteKey = 'base' | 'mild' | 'cool' | 'cold';

function resolveBaseSpriteKey(outfit: GuineaPigOutfit, condition: WeatherCondition): MascotSpriteKey {
  if (outfit.rainGear !== 'none') return 'base';
  if (outfit.headwear === 'nightcap') return 'base';
  if (condition === 'fog') return 'cool';
  if (outfit.tierId === 'freezing' || outfit.tierId === 'cold' || condition === 'snow' || condition === 'blizzard') {
    return 'cold';
  }
  if (outfit.tierId === 'cool') return 'cool';
  if (outfit.tierId === 'mild') return 'mild';
  return 'base';
}

export const GuineaPigMascot: React.FC<GuineaPigMascotProps> = ({
  outfit,
  condition,
  temperature,
  startled = false,
  onPet,
}) => {
  const uid = useId().replace(/:/g, '');
  const [isPetted, setIsPetted] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Preload all 4 core sprites once so wardrobe swaps are instantaneous
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    (['base', 'mild', 'cool', 'cold'] as MascotSpriteKey[]).forEach((k) => {
      const img = new Image();
      img.src = `${base}assets/mascot/${k}.webp`;
    });
  }, []);

  const handlePetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    weatherAudio.playPetChime();
    setIsPetted(true);
    window.setTimeout(() => setIsPetted(false), 660);

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
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id < batchId));
    }, 1350);
  };

  const bodyAnimClass = isPetted
    ? 'animate-cavy-pet-jump'
    : outfit.animationMode === 'shiver'
    ? 'animate-cavy-shiver'
    : outfit.animationMode === 'pant'
    ? 'animate-cavy-pant'
    : outfit.animationMode === 'bounce'
    ? 'animate-cavy-bounce'
    : 'animate-cavy-breathe';

  const spriteKey = resolveBaseSpriteKey(outfit, condition);
  const baseUrl = import.meta.env.BASE_URL || '/';
  const spriteUrl = `${baseUrl}assets/mascot/${spriteKey}.webp`;

  const isStorm = condition === 'thunderstorm' || condition === 'heavy-rain';
  const isRainy = outfit.rainGear !== 'none';
  const isSnowBlizzard = condition === 'blizzard';
  const isFog = condition === 'fog';
  const isNightLantern = outfit.headwear === 'nightcap';
  const isWarm = !isRainy && !isFog && !isNightLantern && outfit.tierId === 'warm';
  const isHot = !isRainy && !isFog && !isNightLantern && outfit.tierId === 'hot';
  const isFreezingCocoa =
    !isRainy && !isFog && !isNightLantern && !isSnowBlizzard && outfit.tierId === 'freezing';

  const gouacheFilterId = `gouache-${uid}`;
  const umbrellaGradId = `umbrellaDome-${uid}`;
  const lanternGlowId = `lanternAura-${uid}`;

  // Exact calibrated coordinates on 560x420 sprite canvas (from scratch/mascot_grid.png):
  // Left Eye: (148, 218), Right Eye: (230, 224), Nose: (158, 272)
  // Crown: x=128..300 y=134..156, Front-left Paw: x=156 y=394, Companion Prop Spot: x=42..112 y=322..404
  return (
    <div className="relative flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handlePetClick}
        title="摸摸棕白豚鼠"
        aria-label={`摸摸棕白豚鼠，当前穿搭：${outfit.outfitTitle}`}
        className="group relative cursor-pointer rounded-3xl transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {/* Subtle warm sky-blend ambient backlight behind the perched guinea pig */}
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

        {/* Fixed 4:3 Stage preventing layout shift across sprite changes */}
        <div
          className={`relative z-10 aspect-[4/3] w-[228px] sm:w-[252px] ${bodyAnimClass}`}
          style={{ transformOrigin: 'center 94%' }}
        >
          {/* High-craft Storybook Gouache Guinea Pig Raster Sprite */}
          <img
            src={spriteUrl}
            alt="手绘棕白豚鼠"
            draggable={false}
            className="pointer-events-none h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.34)] transition-opacity duration-300"
          />

          {/* Calibrated 560x420 Gouache-Style Outfit & Reaction Overlay */}
          <svg
            viewBox="0 0 560 420"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <filter id={gouacheFilterId} x="-6%" y="-6%" width="112%" height="112%">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.022"
                  numOctaves="2"
                  seed="5"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="1.8"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>

              <radialGradient id={umbrellaGradId} cx="36%" cy="28%" r="74%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
                <stop offset="55%" stopColor="rgba(186,230,253,0.42)" />
                <stop offset="100%" stopColor="rgba(125,211,252,0.62)" />
              </radialGradient>

              <radialGradient id={lanternGlowId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(254, 240, 138, 0.92)" />
                <stop offset="48%" stopColor="rgba(251, 191, 36, 0.36)" />
                <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
              </radialGradient>
            </defs>

            {/* 1. Rain Poncho & Hood + Bubble Umbrella (over base.webp) */}
            {isRainy && (
              <g>
                <g filter={`url(#${gouacheFilterId})`}>
                  {/* Rain cape draped warmly over back & shoulders */}
                  <path
                    d="M 278 152 C 345 144, 446 156, 488 228 C 510 272, 498 358, 466 382 L 266 382 C 254 322, 260 202, 278 152 Z"
                    fill={isStorm ? 'rgba(232, 132, 58, 0.94)' : 'rgba(244, 206, 78, 0.94)'}
                  />
                  {/* Soft rain sheen highlight */}
                  <path
                    d="M 308 182 C 362 178, 424 196, 456 246"
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Hood framing top crown & behind cheek */}
                  <path
                    d="M 218 134 C 276 128, 326 164, 332 232 C 334 274, 310 326, 278 346 L 254 326 C 282 290, 290 240, 282 198 C 270 162, 228 150, 178 156 C 148 160, 130 176, 118 194 C 118 158, 160 138, 218 134 Z"
                    fill={isStorm ? 'rgba(232, 132, 58, 0.96)' : 'rgba(244, 206, 78, 0.96)'}
                  />
                  {/* Cute raincoat snap buttons */}
                  <circle cx="298" cy="242" r="5.5" fill="#FFFDF5" />
                  <circle cx="298" cy="288" r="5.5" fill="#FFFDF5" />
                </g>

                {/* Frosted Sky-Blue Bubble Umbrella Arched Overhead */}
                <g className="animate-cavy-umbrella" style={{ transformOrigin: '300px 240px' }}>
                  <line
                    x1="286"
                    y1="14"
                    x2="286"
                    y2="255"
                    stroke="rgba(241, 245, 249, 0.9)"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 286 255 C 286 272, 268 272, 268 258"
                    stroke="#8B5A3C"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 88 122 C 88 12, 484 12, 484 122 Q 385 106 286 122 Q 187 106 88 122 Z"
                    fill={`url(#${umbrellaGradId})`}
                    stroke={isStorm ? '#93C5FD' : 'rgba(255,255,255,0.9)'}
                    strokeWidth="3.2"
                  />
                  <path
                    d="M 286 24 Q 204 58 174 114 M 286 24 Q 368 58 398 114 M 286 24 V 122"
                    stroke="rgba(255,255,255,0.62)"
                    strokeWidth="2.4"
                    fill="none"
                  />
                </g>
              </g>
            )}

            {/* 2. Warm Summer Straw Sunhat + Sunglasses + Lemonade (over base.webp) */}
            {isWarm && (
              <g>
                <g filter={`url(#${gouacheFilterId})`}>
                  {/* Breezy sky-blue kerchief */}
                  <path
                    d="M 248 164 C 282 204, 288 274, 260 326 C 242 332, 232 322, 242 302 C 264 258, 258 202, 226 168 Z"
                    fill="#69AACF"
                  />
                  {/* Woven golden straw sunhat with coral ribbon */}
                  <g transform="translate(216, 134) rotate(4)">
                    <ellipse cx="0" cy="10" rx="108" ry="22" fill="#E9C46A" />
                    <path d="M -54 8 L -42 -36 Q 0 -46 42 -36 L 54 8 Z" fill="#F4D58D" />
                    <path d="M -50 -2 Q 0 8 50 -2 L 53 8 Q 0 18 -53 8 Z" fill="#E07A68" />
                  </g>
                </g>

                {/* Rounded Amber Sunglasses over Exact Eye Coordinates */}
                <g>
                  <circle cx="148" cy="218" r="22" fill="rgba(45,30,22,0.88)" stroke="#E3B35F" strokeWidth="3.5" />
                  <circle cx="230" cy="224" r="23" fill="rgba(45,30,22,0.88)" stroke="#E3B35F" strokeWidth="3.5" />
                  <path d="M 170 218 Q 189 211 207 221" stroke="#E3B35F" strokeWidth="3.5" fill="none" />
                  <line x1="138" y1="208" x2="152" y2="226" stroke="rgba(255,255,255,0.34)" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="220" y1="214" x2="234" y2="232" stroke="rgba(255,255,255,0.34)" strokeWidth="3.5" strokeLinecap="round" />
                </g>

                {/* Iced Lemonade Cup Beside Front-Left Paw */}
                <g transform="translate(64, 326)" filter={`url(#${gouacheFilterId})`}>
                  <polygon
                    points="6,16 38,16 32,64 12,64"
                    fill="rgba(254, 240, 138, 0.92)"
                    stroke="#FFFDF7"
                    strokeWidth="2.4"
                  />
                  <circle cx="34" cy="18" r="10" fill="#F5C73B" />
                  <line x1="18" y1="-4" x2="22" y2="48" stroke="#53B8DF" strokeWidth="4.5" strokeLinecap="round" />
                </g>
              </g>
            )}

            {/* 3. Hot Summer Ice Cooling Ring + Sun Visor + Mini Fan (over base.webp) */}
            {isHot && (
              <g>
                <g filter={`url(#${gouacheFilterId})`}>
                  {/* Pastel ice-blue gel cooling neck ring */}
                  <path
                    d="M 244 166 C 276 206, 278 272, 252 322 C 236 326, 228 316, 238 298 C 258 258, 254 206, 224 170 Z"
                    fill="#87E1F4"
                    stroke="#56BDD4"
                    strokeWidth="2.5"
                  />
                  {/* Mint sun visor cap */}
                  <g transform="translate(206, 144) rotate(-5)">
                    <path d="M -66 8 Q 0 -6 66 8 L 58 -12 Q 0 -24 -58 -12 Z" fill="#FAF7F0" />
                    <path d="M -82 14 Q -14 -2 58 20 Q -18 32 -82 14 Z" fill="rgba(104, 214, 228, 0.84)" />
                  </g>
                </g>

                {/* Cute sweat drop */}
                <path
                  d="M 268 176 C 268 176, 278 188, 278 195 A 10 10 0 1 1 258 195 C 258 188, 268 176, 268 176 Z"
                  fill="#8CE0FA"
                />

                {/* Spinning Pastel Mint Mini Fan Beside Front-Left Paw */}
                <g transform="translate(64, 314)">
                  <rect x="18" y="40" width="11" height="36" rx="5.5" fill="#497D74" />
                  <circle cx="23.5" cy="24" r="26" fill="rgba(204,251,241,0.34)" stroke="#7DD3C6" strokeWidth="3.2" />
                  <g className="animate-cavy-fan-spin" style={{ transformOrigin: '23.5px 24px' }}>
                    <ellipse cx="23.5" cy="11" rx="5.5" ry="11" fill="#82E3D4" />
                    <ellipse cx="23.5" cy="37" rx="5.5" ry="11" fill="#82E3D4" />
                    <ellipse cx="10.5" cy="24" rx="11" ry="5.5" fill="#A9F3E7" />
                    <ellipse cx="36.5" cy="24" rx="11" ry="5.5" fill="#A9F3E7" />
                  </g>
                  <circle cx="23.5" cy="24" r="5.5" fill="#497D74" />
                </g>
              </g>
            )}

            {/* 4. Starry Nightcap & Glowing Brass Lantern (over base.webp) */}
            {isNightLantern && (
              <g>
                <g filter={`url(#${gouacheFilterId})`} transform="translate(222, 134) rotate(5)">
                  <path d="M -66 6 C -40 -52, 54 -60, 114 -12 C 74 -4, 66 8, 72 14 Z" fill="#3B518B" />
                  <circle cx="-8" cy="-22" r="4" fill="#FDE047" />
                  <circle cx="32" cy="-28" r="3.2" fill="#FDE047" />
                  <circle cx="116" cy="-10" r="13" fill="#FAF0CA" />
                  <rect x="-70" y="0" width="144" height="17" rx="8.5" fill="#EEF4FF" />
                </g>

                <g transform="translate(62, 304)" className="animate-cavy-lantern">
                  <circle cx="24" cy="52" r="54" fill={`url(#${lanternGlowId})`} />
                  <line x1="24" y1="4" x2="24" y2="24" stroke="#FDE047" strokeWidth="3.6" />
                  <rect x="8" y="24" width="32" height="44" rx="10" fill="#E3973B" stroke="#FEF08A" strokeWidth="2.4" />
                  <rect x="16" y="31" width="16" height="29" rx="6" fill="#FEF9C3" />
                </g>
              </g>
            )}

            {/* 5. Fog Detective Round Glasses (over cool.webp) */}
            {isFog && (
              <g>
                <circle cx="148" cy="218" r="22" fill="rgba(235,246,255,0.18)" stroke="#7A4F30" strokeWidth="3.8" />
                <circle cx="230" cy="224" r="23" fill="rgba(235,246,255,0.18)" stroke="#7A4F30" strokeWidth="3.8" />
                <path d="M 170 218 Q 189 211 207 221" stroke="#7A4F30" strokeWidth="3.8" fill="none" />
              </g>
            )}

            {/* 6. Blizzard Ski Goggles (over cold.webp) */}
            {isSnowBlizzard && (
              <g filter={`url(#${gouacheFilterId})`}>
                <path d="M 118 202 L 262 212" stroke="#1E293B" strokeWidth="10" strokeLinecap="round" />
                <rect x="116" y="192" width="144" height="48" rx="22" transform="rotate(3 188 216)" fill="#243044" />
                <rect x="124" y="199" width="128" height="34" rx="15" transform="rotate(3 188 216)" fill="#E3974F" />
                <path d="M 146 204 L 168 228 M 198 206 L 220 230" stroke="rgba(255,255,255,0.52)" strokeWidth="4.8" strokeLinecap="round" />
              </g>
            )}

            {/* 7. Freezing Cocoa Mug Detail (on cold.webp when freezing & not snow/rain) */}
            {isFreezingCocoa && (
              <g transform="translate(360, 326)" filter={`url(#${gouacheFilterId})`}>
                <rect x="0" y="14" width="38" height="38" rx="9" fill="#C94B4B" />
                <path d="M 38 22 C 49 22, 49 42, 38 42" fill="none" stroke="#C94B4B" strokeWidth="5" />
                <ellipse cx="19" cy="16" rx="15" ry="5" fill="#6D381C" />
                <circle cx="15" cy="14" r="4.5" fill="#FFFDF8" />
                <circle cx="24" cy="14" r="4" fill="#FFFDF8" />
              </g>
            )}

            {/* 8. Storm Startled Highlight */}
            {(isStorm || startled) && !isSnowBlizzard && !isWarm && (
              <g>
                <circle cx="148" cy="218" r="13" fill="#FFFFFF" stroke="#2A1F1B" strokeWidth="2.5" />
                <circle cx="148" cy="218" r="6.8" fill="#2A1F1B" />
                <circle cx="151" cy="215" r="2.4" fill="#FFFFFF" />
                <circle cx="230" cy="224" r="14" fill="#FFFFFF" stroke="#2A1F1B" strokeWidth="2.5" />
                <circle cx="230" cy="224" r="7.2" fill="#2A1F1B" />
                <circle cx="233" cy="221" r="2.6" fill="#FFFFFF" />
              </g>
            )}

            {/* 9. Cold Breath Puffs & Snow Dusting */}
            {outfit.hasFrostBreath && (
              <g className="animate-cavy-breath-puff" style={{ transformOrigin: '132px 292px' }}>
                <circle cx="128" cy="292" r="6.5" fill="rgba(255,255,255,0.72)" />
                <circle cx="114" cy="288" r="9" fill="rgba(255,255,255,0.56)" />
                <circle cx="100" cy="292" r="5.5" fill="rgba(255,255,255,0.44)" />
              </g>
            )}

            {outfit.hasSnowDust && (
              <g fill="#FFFFFF" opacity="0.9">
                <circle cx="196" cy="88" r="4.5" />
                <circle cx="250" cy="96" r="3.6" />
                <circle cx="384" cy="156" r="5" />
                <circle cx="428" cy="168" r="4" />
              </g>
            )}

            {/* 10. Floating Pet Hearts & Sparkles */}
            {hearts.map((h) => (
              <g key={h.id} className="animate-cavy-heart" style={{ transformOrigin: `${h.x}px ${h.y}px` }}>
                {h.kind === 'heart' ? (
                  <path
                    d={`M ${h.x} ${h.y} c -5 -9, -17 -7, -17 3.6 c 0 9, 17 19, 17 19 c 0 0, 17 -10, 17 -19 c 0 -10.6, -12 -12.6, -17 -3.6 z`}
                    fill="#FB7185"
                  />
                ) : (
                  <path
                    d={`M ${h.x} ${h.y - 12} L ${h.x + 3.6} ${h.y - 3.6} L ${h.x + 12} ${h.y} L ${h.x + 3.6} ${h.y + 3.6} L ${h.x} ${h.y + 12} L ${h.x - 3.6} ${h.y + 3.6} L ${h.x - 12} ${h.y} L ${h.x - 3.6} ${h.y - 3.6} Z`}
                    fill="#FDE047"
                  />
                )}
              </g>
            ))}
          </svg>
        </div>
      </button>
    </div>
  );
};
