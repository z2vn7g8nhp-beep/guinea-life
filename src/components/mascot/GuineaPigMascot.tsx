import React, { useEffect, useId, useState } from 'react';
import type { GuineaPigOutfit, WeatherCondition } from '../../types/weather';
import { weatherAudio } from '../../utils/weatherAudio';

interface GuineaPigMascotProps {
  outfit: GuineaPigOutfit;
  condition: WeatherCondition;
  temperature: number;
  startled?: boolean;
  compact?: boolean;
  onPet?: (quote: string) => void;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
  kind: 'heart' | 'sparkle';
}

export const GuineaPigMascot: React.FC<GuineaPigMascotProps> = ({
  outfit,
  condition,
  temperature,
  startled = false,
  compact = false,
  onPet,
}) => {
  const uid = useId().replace(/:/g, '');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Natural blinking loop
  useEffect(() => {
    let timer = 0;
    let closeTimer = 0;
    const scheduleBlink = () => {
      const wait = 2600 + Math.random() * 3400;
      timer = window.setTimeout(() => {
        setIsBlinking(true);
        closeTimer = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140);
      }, wait);
    };
    scheduleBlink();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(closeTimer);
    };
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
      { id: batchId + 1, x: 78 + Math.random() * 18, y: 54, kind: 'heart' },
      { id: batchId + 2, x: 126 + Math.random() * 24, y: 40, kind: 'sparkle' },
      { id: batchId + 3, x: 168 + Math.random() * 20, y: 58, kind: 'heart' },
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

  const isStorm = condition === 'thunderstorm' || condition === 'heavy-rain';
  const showEyesClosedHappy = isPetted;
  const showSquintCold =
    !isPetted && !startled && outfit.tierId === 'freezing' && outfit.eyewear === 'none';

  const handDrawnFilterId = `handDrawn-${uid}`;
  const bodyClipId = `loafClip-${uid}`;
  const whiteCoatId = `whiteCoat-${uid}`;
  const brownPatchId = `brownPatch-${uid}`;
  const caramelPatchId = `caramelPatch-${uid}`;
  const bubbleDomeId = `bubbleDome-${uid}`;
  const lanternGlowId = `lanternGlow-${uid}`;

  // 3/4 front-left loaf silhouette path
  const loafBodyPath =
    'M 54 134 C 50 103, 68 72, 110 70 C 142 69, 158 80, 174 82 C 210 82, 240 100, 242 134 C 244 162, 224 176, 186 177 C 140 178, 90 177, 68 168 C 56 162, 55 148, 54 134 Z';

  return (
    <div className="relative flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handlePetClick}
        title="摸摸棕白豚鼠"
        aria-label={`摸摸棕白豚鼠，当前穿搭：${outfit.outfitTitle}`}
        className="group relative cursor-pointer rounded-2xl p-0.5 transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {/* Subtle warm ambient halo behind mascot */}
        <div
          className="pointer-events-none absolute inset-4 rounded-full opacity-40 blur-xl transition-colors duration-700"
          style={{
            background:
              temperature <= 2
                ? 'radial-gradient(circle, rgba(186,230,253,0.45) 0%, rgba(56,189,248,0) 72%)'
                : outfit.handheldProp === 'lantern'
                ? 'radial-gradient(circle, rgba(253,224,71,0.45) 0%, rgba(251,146,60,0) 72%)'
                : 'radial-gradient(circle, rgba(255,244,229,0.35) 0%, rgba(255,255,255,0) 72%)',
          }}
        />

        <svg
          viewBox="0 0 280 210"
          className={`relative z-10 drop-shadow-[0_10px_22px_rgba(0,0,0,0.32)] ${
            compact ? 'h-36 w-48 sm:h-40 sm:w-52' : 'h-44 w-56 sm:h-48 sm:w-64'
          }`}
        >
          <defs>
            {/* Subtle organic storybook gouache edge filter */}
            <filter id={handDrawnFilterId} x="-6%" y="-6%" width="112%" height="112%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.024"
                numOctaves="2"
                seed="7"
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.35"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>

            <clipPath id={bodyClipId}>
              <path d={loafBodyPath} />
            </clipPath>

            {/* Creamy milk-white storybook coat */}
            <radialGradient id={whiteCoatId} cx="42%" cy="38%" r="68%">
              <stop offset="0%" stopColor="#FFFDF9" />
              <stop offset="72%" stopColor="#FBF5EB" />
              <stop offset="100%" stopColor="#EDE1D0" />
            </radialGradient>

            {/* Warm terracotta / cinnamon brown fur */}
            <linearGradient id={brownPatchId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CE8556" />
              <stop offset="65%" stopColor="#BF7447" />
              <stop offset="100%" stopColor="#A65E35" />
            </linearGradient>

            {/* Rich warm rump saddle brown */}
            <linearGradient id={caramelPatchId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#CA7F50" />
              <stop offset="100%" stopColor="#AA6138" />
            </linearGradient>

            {/* Transparent bubble umbrella */}
            <radialGradient id={bubbleDomeId} cx="36%" cy="28%" r="72%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
              <stop offset="55%" stopColor="rgba(196,232,255,0.22)" />
              <stop offset="100%" stopColor="rgba(147,197,253,0.42)" />
            </radialGradient>

            {/* Night lantern glow */}
            <radialGradient id={lanternGlowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(254, 240, 138, 0.92)" />
              <stop offset="45%" stopColor="rgba(251, 191, 36, 0.36)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
            </radialGradient>
          </defs>

          {/* 1. Ground Stage */}
          <g>
            <ellipse cx="148" cy="182" rx="88" ry="11" fill="rgba(10, 15, 28, 0.32)" />

            {outfit.hasPuddle && (
              <g>
                <ellipse
                  cx="148"
                  cy="183"
                  rx="98"
                  ry="13"
                  fill="rgba(125, 211, 252, 0.22)"
                  stroke="rgba(224, 242, 254, 0.42)"
                  strokeWidth="1.1"
                />
                <ellipse
                  cx="92"
                  cy="184"
                  rx="13"
                  ry="3.6"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1"
                  className="animate-cavy-puddle-ripple"
                />
                <ellipse
                  cx="206"
                  cy="184"
                  rx="11"
                  ry="3.2"
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="1"
                  style={{ animationDelay: '0.75s' }}
                  className="animate-cavy-puddle-ripple"
                />
              </g>
            )}

            {outfit.hasSnowDust && (
              <g filter={`url(#${handDrawnFilterId})`}>
                <path
                  d="M 46 182 Q 96 168 150 175 Q 204 168 250 182 Q 204 193 148 191 Q 92 193 46 182 Z"
                  fill="rgba(241, 245, 249, 0.85)"
                />
              </g>
            )}

            {!outfit.hasPuddle && !outfit.hasSnowDust && (
              <g>
                <path
                  d="M 56 181 Q 53 174 49 173 M 58 181 Q 60 174 64 173 M 234 181 Q 232 174 228 173 M 236 181 Q 239 174 243 173"
                  stroke="rgba(167, 243, 208, 0.52)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}
          </g>

          {/* 2. Animated Chubby Loaf Guinea Pig Core */}
          <g className={bodyAnimClass}>
            {/* Dainty little paws / booties peeking under the tummy */}
            <g filter={`url(#${handDrawnFilterId})`}>
              {outfit.footwear === 'bare-paws' && (
                <>
                  <ellipse cx="86" cy="175" rx="10" ry="5.2" fill="#E9BDB1" />
                  <ellipse cx="126" cy="177" rx="10" ry="5.2" fill="#E9BDB1" />
                  <ellipse cx="204" cy="175" rx="9" ry="4.8" fill="#E3B3A7" />
                </>
              )}
              {outfit.footwear === 'snow-boots' && (
                <>
                  <g>
                    <ellipse cx="86" cy="176" rx="11.5" ry="6.2" fill="#9A5026" />
                    <path d="M 76 172 Q 86 169 96 172" stroke="#F7EAD2" strokeWidth="3.8" strokeLinecap="round" fill="none" />
                  </g>
                  <g>
                    <ellipse cx="126" cy="178" rx="11.5" ry="6.2" fill="#9A5026" />
                    <path d="M 116 174 Q 126 171 136 174" stroke="#F7EAD2" strokeWidth="3.8" strokeLinecap="round" fill="none" />
                  </g>
                  <g>
                    <ellipse cx="204" cy="176" rx="10.5" ry="5.8" fill="#8C4721" />
                    <path d="M 195 172 Q 204 169 213 172" stroke="#F7EAD2" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                  </g>
                </>
              )}
              {outfit.footwear === 'ankle-boots' && (
                <>
                  <ellipse cx="86" cy="176" rx="11" ry="5.8" fill="#6D442B" />
                  <ellipse cx="126" cy="178" rx="11" ry="5.8" fill="#6D442B" />
                  <ellipse cx="204" cy="176" rx="10" ry="5.2" fill="#5D3822" />
                </>
              )}
              {outfit.footwear === 'sneakers' && (
                <>
                  <ellipse cx="86" cy="175" rx="11" ry="5.8" fill="#538D83" />
                  <path d="M 76 177 Q 86 180 96 177" stroke="#FAF6EE" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <ellipse cx="126" cy="177" rx="11" ry="5.8" fill="#538D83" />
                  <path d="M 116 179 Q 126 182 136 179" stroke="#FAF6EE" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  <ellipse cx="204" cy="175" rx="9.8" ry="5.2" fill="#497D74" />
                </>
              )}
              {outfit.footwear === 'rain-boots' && (
                <>
                  <ellipse cx="86" cy="175" rx="11.5" ry="6.2" fill="#EFC542" />
                  <ellipse cx="126" cy="177" rx="11.5" ry="6.2" fill="#EFC542" />
                  <ellipse cx="204" cy="175" rx="10.5" ry="5.6" fill="#E2B634" />
                </>
              )}
              {outfit.footwear === 'sandals' && (
                <>
                  <ellipse cx="86" cy="176" rx="10.5" ry="5" fill="#C97B3A" />
                  <path d="M 78 174 Q 86 170 94 174" stroke="#FCEEC7" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <ellipse cx="126" cy="178" rx="10.5" ry="5" fill="#C97B3A" />
                  <path d="M 118 176 Q 126 172 134 176" stroke="#FCEEC7" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                  <ellipse cx="204" cy="175" rx="9.5" ry="4.8" fill="#BA6F31" />
                </>
              )}
            </g>

            {/* Plump Loaf Body + Brown-and-White Storybook Markings */}
            <g filter={`url(#${handDrawnFilterId})`}>
              <g clipPath={`url(#${bodyClipId})`}>
                {/* Creamy milk-white base coat */}
                <rect x="40" y="60" width="215" height="130" fill={`url(#${whiteCoatId})`} />

                {/* Left cheek cinnamon-brown patch (wraps around far-left cheek) */}
                <path
                  d="M 42 74 C 66 74, 86 84, 88 104 C 90 120, 80 134, 72 142 C 62 148, 44 146, 42 132 Z"
                  fill={`url(#${brownPatchId})`}
                />

                {/* Right crown & eye cinnamon-brown patch (leaves cute white forehead blaze!) */}
                <path
                  d="M 108 62 C 134 62, 156 76, 158 100 C 159 116, 146 130, 128 130 C 114 130, 108 116, 108 100 C 108 86, 106 72, 108 62 Z"
                  fill={`url(#${brownPatchId})`}
                />

                {/* Signature plump cinnamon-brown rump saddle */}
                <path
                  d="M 176 76 C 194 94, 198 122, 186 146 C 176 164, 178 178, 196 184 L 252 184 L 252 76 Z"
                  fill={`url(#${caramelPatchId})`}
                />

                {/* Warm subtle tummy shadow for plumpness */}
                <ellipse cx="148" cy="170" rx="86" ry="15" fill="rgba(182, 149, 122, 0.22)" />

                {/* Gentle hand-drawn fur fluff strokes */}
                <path
                  d="M 86 98 L 91 102 L 85 106 M 183 116 L 177 120 L 182 125"
                  stroke="#B3693D"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="0.48"
                />

                {/* Outerwear Layer clipped/shaped snugly inside the loaf torso */}
                {outfit.outerwear === 'parka' && (
                  <g>
                    {/* Olive quilted winter coat draped across back & torso */}
                    <path
                      d="M 134 78 C 166 76, 206 84, 224 108 C 232 126, 226 158, 212 174 L 132 176 C 122 152, 122 104, 134 78 Z"
                      fill="#5A7247"
                    />
                    <path
                      d="M 138 112 Q 182 118 224 110 M 135 138 Q 182 144 222 136 M 136 160 Q 180 165 216 158"
                      stroke="#445834"
                      strokeWidth="1.6"
                      fill="none"
                      opacity="0.7"
                    />
                    {/* Fluffy oatmeal sherpa collar */}
                    <path
                      d="M 126 78 Q 140 108 134 152 Q 146 156 150 144 Q 154 104 142 78 Z"
                      fill="#F6ECD8"
                    />
                  </g>
                )}

                {outfit.outerwear === 'duffle-coat' && (
                  <g>
                    {/* Warm camel-ochre wool capelet */}
                    <path
                      d="M 136 78 C 170 76, 208 86, 226 112 C 232 134, 224 162, 208 174 L 134 176 C 126 146, 126 106, 136 78 Z"
                      fill="#D28E44"
                    />
                    {/* Stitched pocket */}
                    <rect x="164" y="132" width="24" height="20" rx="6" fill="#BA7730" opacity="0.8" />
                    {/* Wooden toggle clasps */}
                    {[100, 122, 144].map((ty, idx) => (
                      <g key={ty}>
                        <line
                          x1={144 + idx * 2}
                          y1={ty}
                          x2={156 + idx * 2}
                          y2={ty - 1}
                          stroke="#6B3D1C"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                        <rect x={148 + idx * 2} y={ty - 3} width="7" height="4.5" rx="2.2" fill="#4A2710" />
                      </g>
                    ))}
                  </g>
                )}

                {outfit.outerwear === 'knit-cardigan' && (
                  <g>
                    {/* Cozy sage-matcha knitted sweater wrap */}
                    <path
                      d="M 136 80 C 168 78, 196 84, 208 106 C 214 130, 208 158, 194 174 L 136 174 C 128 148, 128 108, 136 80 Z"
                      fill="#7A9A5B"
                    />
                    {/* Soft ribbed knit stripes */}
                    <path
                      d="M 150 86 V168 M 166 86 V168 M 182 90 V168 M 196 98 V166"
                      stroke="#607E43"
                      strokeWidth="1.8"
                      strokeDasharray="4 4"
                      opacity="0.55"
                    />
                    {/* Cream placket & wooden buttons */}
                    <circle cx="143" cy="112" r="2.4" fill="#6D4325" />
                    <circle cx="143" cy="132" r="2.4" fill="#6D4325" />
                    <circle cx="143" cy="152" r="2.4" fill="#6D4325" />
                  </g>
                )}

                {outfit.outerwear === 'denim-overalls' && (
                  <g>
                    {/* Subtle dusty-indigo cute overall harness over the white middle band */}
                    <path
                      d="M 148 112 L 204 110 C 212 134, 208 162, 196 176 L 142 176 C 136 154, 138 130, 148 112 Z"
                      fill="#4B6E9E"
                    />
                    {/* Overall straps over shoulders */}
                    <path
                      d="M 148 80 Q 152 98 154 114"
                      stroke="#3C5B85"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M 178 82 Q 186 98 190 112"
                      stroke="#3C5B85"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="154" cy="116" r="2.4" fill="#F2C85B" />
                    <circle cx="190" cy="114" r="2.4" fill="#F2C85B" />
                    {/* Pocket */}
                    <rect
                      x="160"
                      y="132"
                      width="24"
                      height="18"
                      rx="5"
                      fill="#3C5B85"
                      stroke="#93B4DF"
                      strokeWidth="1"
                      strokeDasharray="3 2"
                    />
                  </g>
                )}

                {outfit.outerwear === 'floral-shirt' && (
                  <g>
                    {/* Breezy chambray summer shirt */}
                    <path
                      d="M 136 80 C 168 78, 200 86, 212 110 C 218 134, 212 160, 198 174 L 136 174 C 128 148, 128 108, 136 80 Z"
                      fill="#62A3C7"
                    />
                    {/* Soft cream & coral blossom motifs */}
                    <circle cx="162" cy="114" r="4.5" fill="#FAD2CE" />
                    <circle cx="162" cy="114" r="1.7" fill="#F59E0B" />
                    <circle cx="188" cy="142" r="5" fill="#FEF3C7" />
                    <circle cx="188" cy="142" r="1.9" fill="#F97316" />
                    <circle cx="154" cy="150" r="3.8" fill="#FEF3C7" />
                    <path d="M 178 102 Q 190 98 193 108 Q 182 110 178 102 Z" fill="#86EFAC" opacity="0.85" />
                  </g>
                )}

                {outfit.outerwear === 'cooling-tank' && (
                  <g>
                    {/* Light pastel aqua breathable vest */}
                    <path
                      d="M 138 82 C 166 80, 194 86, 204 108 C 210 132, 204 158, 192 172 L 138 172 C 132 146, 132 108, 138 82 Z"
                      fill="#7CC8DF"
                    />
                    <circle cx="170" cy="130" r="11" fill="rgba(255,255,255,0.22)" />
                    <path
                      d="M 170 122 V138 M 162 130 H178 M 164 124 L 176 136 M 176 124 L 164 136"
                      stroke="#F0FAFF"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Raincoat Poncho Overlay */}
                {outfit.rainGear !== 'none' && (
                  <g>
                    <path
                      d="M 126 76 C 166 72, 212 84, 232 116 C 238 140, 230 166, 212 176 L 126 176 C 118 146, 118 104, 126 76 Z"
                      fill={
                        outfit.rainGear === 'storm-slicker'
                          ? 'rgba(235, 136, 62, 0.92)'
                          : 'rgba(244, 206, 82, 0.92)'
                      }
                    />
                    <path
                      d="M 142 94 C 168 92, 196 100, 210 122"
                      stroke="rgba(255,255,255,0.48)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="144" cy="118" r="2.3" fill="#FFFDF5" />
                    <circle cx="144" cy="142" r="2.3" fill="#FFFDF5" />
                  </g>
                )}
              </g>
            </g>

            {/* Rain hood framing crown & behind cheeks (when raining) */}
            {outfit.headwear === 'rain-hood' && (
              <g filter={`url(#${handDrawnFilterId})`}>
                <path
                  d="M 102 66 C 132 62, 156 78, 160 112 C 162 132, 150 156, 134 166 L 122 156 C 134 140, 138 118, 134 96 C 128 80, 110 74, 88 76 C 72 78, 62 90, 58 102 C 58 82, 76 68, 102 66 Z"
                  fill={
                    outfit.rainGear === 'storm-slicker'
                      ? 'rgba(235, 136, 62, 0.95)'
                      : 'rgba(244, 206, 82, 0.95)'
                  }
                />
              </g>
            )}

            {/* Soft Floppy Ears (low & snug, matching Image 2) */}
            {outfit.headwear !== 'rain-hood' && (
              <g filter={`url(#${handDrawnFilterId})`}>
                <g className="animate-cavy-ear-left">
                  <path
                    d="M 80 76 C 64 72, 58 84, 65 96 C 71 102, 82 96, 84 86 Z"
                    fill="#98695F"
                  />
                  <path
                    d="M 78 80 C 68 78, 65 85, 69 92 C 73 95, 79 91, 80 85 Z"
                    fill="#B7887D"
                  />
                </g>
                <g className="animate-cavy-ear-right">
                  <path
                    d="M 140 72 C 156 68, 164 80, 156 93 C 150 99, 139 94, 137 83 Z"
                    fill="#98695F"
                  />
                  <path
                    d="M 142 76 C 152 74, 156 81, 151 89 C 147 92, 141 88, 140 81 Z"
                    fill="#B7887D"
                  />
                </g>
              </g>
            )}

            {/* Neckwear (curved around 3/4 neck contour) */}
            <g filter={`url(#${handDrawnFilterId})`}>
              {(outfit.neckwear === 'wool-scarf' || outfit.neckwear === 'plaid-scarf') && (
                <g>
                  {/* Fluttering scarf tail resting along shoulder */}
                  <g className={outfit.isWindy ? 'animate-cavy-scarf-wind' : ''}>
                    <path
                      d="M 140 128 C 156 134, 166 150, 164 166 L 146 167 C 146 152, 140 140, 130 134 Z"
                      fill={outfit.neckwear === 'wool-scarf' ? '#CF5348' : '#B54038'}
                    />
                    <path
                      d="M 146 150 H163 M 146 159 H163"
                      stroke="#F9EAC8"
                      strokeWidth="2.4"
                    />
                  </g>
                  {/* Scarf collar wrap */}
                  <path
                    d="M 122 76 C 142 96, 144 138, 128 164 C 118 166, 114 160, 118 152 C 130 130, 128 96, 112 78 Z"
                    fill={outfit.neckwear === 'wool-scarf' ? '#DC5D52' : '#9E342D'}
                  />
                </g>
              )}

              {outfit.neckwear === 'cooling-ring' && (
                <path
                  d="M 122 82 C 138 102, 138 136, 126 160 C 118 162, 115 156, 119 148 C 128 128, 128 102, 114 84 Z"
                  fill="#8FE3F4"
                  stroke="#53BDD4"
                  strokeWidth="1.2"
                />
              )}

              {outfit.neckwear === 'bowtie' && outfit.rainGear === 'none' && (
                <g transform="translate(114, 159) rotate(-8)">
                  <polygon points="0,0 -10,-5.5 -10,5.5" fill="#DE6B68" />
                  <polygon points="0,0 10,-5.5 10,5.5" fill="#DE6B68" />
                  <circle cx="0" cy="0" r="2.8" fill="#F49D9B" />
                </g>
              )}
            </g>

            {/* 3. Expressive 3/4 Guinea Pig Face */}
            <g>
              {/* Soft rosy cheek blush */}
              <ellipse
                cx="68"
                cy="127"
                rx="6.5"
                ry="3.6"
                fill="#F2B2AA"
                opacity={temperature <= 0 || isPetted ? 0.65 : 0.36}
              />
              <ellipse
                cx="124"
                cy="129"
                rx="7"
                ry="3.8"
                fill="#F2B2AA"
                opacity={temperature <= 0 || isPetted ? 0.65 : 0.36}
              />

              {/* Cute little bean eyes */}
              {showEyesClosedHappy ? (
                <>
                  <path
                    d="M 69 113 Q 74 106 80 112"
                    stroke="#2A1F1B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 111 114 Q 118 107 125 114"
                    stroke="#2A1F1B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : isBlinking || showSquintCold ? (
                <>
                  <path
                    d="M 69 112 Q 74 116 79 112"
                    stroke="#2A1F1B"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 112 113 Q 118 117 124 113"
                    stroke="#2A1F1B"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : startled ? (
                <>
                  <circle cx="74" cy="111" r="6" fill="#FFFFFF" stroke="#2A1F1B" strokeWidth="1.4" />
                  <circle cx="74" cy="111" r="3.2" fill="#2A1F1B" />
                  <circle cx="75.2" cy="109.6" r="1.2" fill="#FFFFFF" />
                  <circle cx="118" cy="112" r="6.4" fill="#FFFFFF" stroke="#2A1F1B" strokeWidth="1.4" />
                  <circle cx="118" cy="112" r="3.4" fill="#2A1F1B" />
                  <circle cx="119.3" cy="110.5" r="1.2" fill="#FFFFFF" />
                </>
              ) : (
                <>
                  <ellipse cx="74" cy="112" rx="4.2" ry="5.1" fill="#2A1F1B" />
                  <circle cx="75.4" cy="109.8" r="1.5" fill="#FFFFFF" />
                  <ellipse cx="118" cy="113" rx="4.6" ry="5.4" fill="#2A1F1B" />
                  <circle cx="119.5" cy="110.8" r="1.6" fill="#FFFFFF" />
                </>
              )}

              {/* Delicate tiny dusty-pink nose & minimal Y-mouth (NO whiskers) */}
              <g className="animate-cavy-nose">
                <path
                  d="M 90 122 C 92 119.5, 97 119.5, 99 122 C 97.5 124.8, 95.5 126, 94.5 126 C 93.5 126, 91.5 124.8, 90 122 Z"
                  fill="#DDA19B"
                />
                <path
                  d="M 94.5 126 V 129 M 94.5 129 Q 90.5 132 88.5 129.5 M 94.5 129 Q 98.5 132 100.5 129.5"
                  stroke="#7E554B"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* Frost breath puff when freezing / snowy */}
              {outfit.hasFrostBreath && (
                <g className="animate-cavy-breath-puff" style={{ transformOrigin: '80px 132px' }}>
                  <circle cx="78" cy="132" r="3.2" fill="rgba(255,255,255,0.68)" />
                  <circle cx="71" cy="130" r="4.4" fill="rgba(255,255,255,0.52)" />
                  <circle cx="64" cy="132" r="2.8" fill="rgba(255,255,255,0.42)" />
                </g>
              )}

              {/* Subtle summer sweat drop when >= 33°C */}
              {outfit.hasSweatDrop && (
                <path
                  d="M 134 92 C 134 92, 139 98, 139 101 A5 5 0 1 1 129 101 C 129 98, 134 92, 134 92 Z"
                  fill="#8CE0FA"
                />
              )}
            </g>

            {/* 4. Eyewear (aligned to 3/4 eyes) */}
            <g>
              {outfit.eyewear === 'sunglasses' && (
                <g>
                  <circle cx="74" cy="112" r="10.5" fill="rgba(42,31,27,0.88)" stroke="#DFB164" strokeWidth="1.6" />
                  <circle cx="118" cy="113" r="11" fill="rgba(42,31,27,0.88)" stroke="#DFB164" strokeWidth="1.6" />
                  <path d="M 84.5 111 Q 96 108 107 111.5" stroke="#DFB164" strokeWidth="1.8" fill="none" />
                  <line x1="69" y1="107" x2="76" y2="116" stroke="rgba(255,255,255,0.32)" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="113" y1="108" x2="120" y2="117" stroke="rgba(255,255,255,0.32)" strokeWidth="1.8" strokeLinecap="round" />
                </g>
              )}

              {outfit.eyewear === 'round-glasses' && (
                <g>
                  <circle cx="74" cy="112" r="10.5" fill="rgba(230,244,255,0.18)" stroke="#8B5E3C" strokeWidth="1.7" />
                  <circle cx="118" cy="113" r="11" fill="rgba(230,244,255,0.18)" stroke="#8B5E3C" strokeWidth="1.7" />
                  <path d="M 84.5 111 Q 96 108 107 111.5" stroke="#8B5E3C" strokeWidth="1.7" fill="none" />
                </g>
              )}

              {outfit.eyewear === 'snow-goggles' && (
                <g>
                  <rect x="61" y="100" width="70" height="22" rx="10" fill="#293548" />
                  <rect x="65" y="103" width="62" height="16" rx="8" fill="#E3974F" />
                  <path d="M 76 106 L 88 116 M 102 106 L 114 116" stroke="rgba(255,255,255,0.45)" strokeWidth="2.4" strokeLinecap="round" />
                </g>
              )}
            </g>

            {/* 5. Headwear (tilted gracefully on the 3/4 crown) */}
            <g filter={`url(#${handDrawnFilterId})`}>
              {outfit.headwear === 'pom-beanie' && (
                <g transform="translate(110, 72) rotate(5)">
                  <circle cx="2" cy="-31" r="9.5" fill="#FBF7F0" />
                  <path d="M -30 4 C -26 -24, 28 -24, 32 4 Z" fill="#C94B4B" />
                  <path d="M -25 -9 Q 2 -15 27 -9" stroke="#F9EAC8" strokeWidth="4.5" fill="none" />
                  <rect x="-33" y="-1" width="68" height="10" rx="5" fill="#DE6363" />
                </g>
              )}

              {outfit.headwear === 'earmuffs' && (
                <g>
                  <path
                    d="M 76 82 C 88 52, 134 50, 146 78"
                    stroke="#D95D66"
                    strokeWidth="4.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx="75" cy="88" r="11.5" fill="#FAF2E4" />
                  <circle cx="147" cy="84" r="12" fill="#FAF2E4" />
                </g>
              )}

              {outfit.headwear === 'beret' && (
                <g transform="translate(116, 66) rotate(8)">
                  <ellipse cx="0" cy="0" rx="33" ry="12" fill="#8C2F47" />
                  <path d="M 2 -12 Q 6 -18 10 -14" stroke="#5E1D2E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <ellipse cx="-10" cy="-3" rx="12" ry="3.5" fill="rgba(255,255,255,0.12)" />
                </g>
              )}

              {outfit.headwear === 'newsboy' && (
                <g transform="translate(110, 70) rotate(-4)">
                  <path d="M -32 4 C -24 -18, 26 -18, 34 4 Z" fill="#8D6143" />
                  <path d="M -40 4 Q -10 -4 28 5 Q 0 10 -40 4 Z" fill="#5D3D27" />
                  <circle cx="2" cy="-12" r="3" fill="#5D3D27" />
                </g>
              )}

              {outfit.headwear === 'straw-hat' && (
                <g transform="translate(110, 70) rotate(3)">
                  <ellipse cx="0" cy="4" rx="48" ry="10.5" fill="#F2D27C" />
                  <path d="M -25 2 L -20 -17 Q 0 -22 20 -17 L 25 2 Z" fill="#F7DE94" />
                  <path d="M -23 -3 Q 0 2 23 -3 L 24 2 Q 0 7 -24 2 Z" fill="#E16B66" />
                </g>
              )}

              {outfit.headwear === 'sun-visor' && (
                <g transform="translate(106, 72) rotate(-5)">
                  <path d="M -30 4 Q 0 -3 30 4 L 27 -5 Q 0 -11 -27 -5 Z" fill="#FAF6EE" />
                  <path d="M -36 6 Q -6 -1 26 9 Q -8 15 -36 6 Z" fill="rgba(94, 200, 224, 0.78)" />
                </g>
              )}

              {outfit.headwear === 'nightcap' && (
                <g transform="translate(112, 71) rotate(4)">
                  <path d="M -30 3 C -18 -24, 24 -28, 52 -6 C 34 -2, 30 4, 33 6 Z" fill="#3B518B" />
                  <circle cx="-4" cy="-10" r="1.8" fill="#FDE047" />
                  <circle cx="14" cy="-13" r="1.5" fill="#FDE047" />
                  <circle cx="53" cy="-5" r="6" fill="#FAF0CA" />
                  <rect x="-32" y="0" width="66" height="8" rx="4" fill="#EEF4FF" />
                </g>
              )}
            </g>

            {/* 6. Charming Foreground Companion Props */}
            <g>
              {outfit.handheldProp === 'hot-cocoa' && (
                <g transform="translate(24, 146)">
                  <rect x="0" y="6" width="20" height="20" rx="5" fill="#C94B4B" />
                  <path d="M 0 11 C -6 11, -6 21, 0 21" fill="none" stroke="#C94B4B" strokeWidth="2.8" />
                  <ellipse cx="10" cy="7" rx="8" ry="2.8" fill="#6D381C" />
                  <circle cx="8" cy="6" r="2.5" fill="#FFFDF8" />
                  <circle cx="13" cy="6" r="2.1" fill="#FFFDF8" />
                  <path
                    d="M 7 -1 Q 4 -8 8 -14"
                    stroke="rgba(255,255,255,0.72)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                    className="animate-cavy-steam"
                  />
                  <path
                    d="M 14 -2 Q 17 -9 13 -15"
                    stroke="rgba(255,255,255,0.62)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                    style={{ animationDelay: '0.8s' }}
                    className="animate-cavy-steam"
                  />
                </g>
              )}

              {outfit.handheldProp === 'sweet-potato' && (
                <g transform="translate(20, 152)">
                  <ellipse cx="14" cy="11" rx="13" ry="8" transform="rotate(-14 14 11)" fill="#8B3B24" />
                  <ellipse cx="16" cy="11" rx="8.5" ry="5.5" transform="rotate(-14 16 11)" fill="#F7BE49" />
                  <path
                    d="M 12 -1 Q 9 -8 14 -14"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                    className="animate-cavy-steam"
                  />
                </g>
              )}

              {outfit.handheldProp === 'milk-tea' && (
                <g transform="translate(26, 142)">
                  <polygon points="3,8 19,8 16,30 6,30" fill="#F6D88C" />
                  <rect x="2" y="6" width="18" height="3.5" rx="1.8" fill="#FAF6EE" />
                  <line x1="13" y1="-3" x2="11" y2="10" stroke="#DE6B68" strokeWidth="2.6" strokeLinecap="round" />
                  <circle cx="8.5" cy="25" r="1.8" fill="#4A2C1D" />
                  <circle cx="13" cy="24" r="1.8" fill="#4A2C1D" />
                  <circle cx="11" cy="27" r="1.8" fill="#4A2C1D" />
                </g>
              )}

              {outfit.handheldProp === 'hay-clover' && (
                <g transform="translate(22, 142)" filter={`url(#${handDrawnFilterId})`}>
                  <path
                    d="M 24 28 L 4 8 M 20 30 L 0 18 M 18 28 L 10 4"
                    stroke="#7FB855"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="4" cy="8" r="3.5" fill="#FDE047" />
                  <circle cx="10" cy="4" r="2.8" fill="#FFFDF8" />
                </g>
              )}

              {outfit.handheldProp === 'lemonade' && (
                <g transform="translate(26, 142)">
                  <polygon
                    points="3,8 19,8 16,30 6,30"
                    fill="rgba(254, 240, 138, 0.88)"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth="1.2"
                  />
                  <circle cx="17" cy="9" r="5" fill="#F5C73B" />
                  <line x1="9" y1="-3" x2="11" y2="23" stroke="#53B8DF" strokeWidth="2.4" strokeLinecap="round" />
                </g>
              )}

              {outfit.handheldProp === 'mini-fan' && (
                <g transform="translate(22, 134)">
                  <rect x="9" y="19" width="5" height="16" rx="2.5" fill="#497D74" />
                  <circle cx="11.5" cy="11.5" r="12.5" fill="rgba(204,251,241,0.3)" stroke="#7DD3C6" strokeWidth="1.6" />
                  <g className="animate-cavy-fan-spin" style={{ transformOrigin: '11.5px 11.5px' }}>
                    <ellipse cx="11.5" cy="5.5" rx="2.6" ry="5.2" fill="#82E3D4" />
                    <ellipse cx="11.5" cy="17.5" rx="2.6" ry="5.2" fill="#82E3D4" />
                    <ellipse cx="5.5" cy="11.5" rx="5.2" ry="2.6" fill="#A9F3E7" />
                    <ellipse cx="17.5" cy="11.5" rx="5.2" ry="2.6" fill="#A9F3E7" />
                  </g>
                  <circle cx="11.5" cy="11.5" r="2.6" fill="#497D74" />
                </g>
              )}

              {outfit.handheldProp === 'lantern' && (
                <g transform="translate(22, 130)" className="animate-cavy-lantern">
                  <circle cx="11" cy="24" r="26" fill={`url(#${lanternGlowId})`} />
                  <line x1="11" y1="2" x2="11" y2="11" stroke="#FDE047" strokeWidth="1.8" />
                  <rect x="4" y="11" width="14" height="20" rx="5" fill="#E3973B" stroke="#FEF08A" strokeWidth="1.2" />
                  <rect x="7.5" y="14.5" width="7" height="13" rx="3" fill="#FEF9C3" />
                </g>
              )}

              {outfit.handheldProp === 'umbrella' && (
                <g className="animate-cavy-umbrella">
                  <line
                    x1="152"
                    y1="14"
                    x2="152"
                    y2="136"
                    stroke="rgba(236, 244, 255, 0.85)"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 152 136 C 152 144, 142 144, 142 137"
                    stroke="#8B5A3C"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 52 68 C 52 10, 252 10, 252 68 Q 202 60 152 68 Q 102 60 52 68 Z"
                    fill={`url(#${bubbleDomeId})`}
                    stroke={isStorm ? '#7FB3F5' : 'rgba(255,255,255,0.85)'}
                    strokeWidth="1.8"
                  />
                  <path
                    d="M 152 18 Q 112 36 96 64 M 152 18 Q 192 36 208 64 M 152 18 V 68"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle cx="96" cy="44" r="2" fill="rgba(255,255,255,0.85)" />
                  <circle cx="204" cy="48" r="2.2" fill="rgba(255,255,255,0.85)" />
                  <circle cx="174" cy="30" r="1.6" fill="rgba(255,255,255,0.9)" />
                </g>
              )}
            </g>

            {/* Delicate snow dusting when snowing */}
            {outfit.hasSnowDust && (
              <g fill="#FFFFFF" opacity="0.88">
                <circle cx="98" cy="69" r="2.2" />
                <circle cx="186" cy="84" r="2.4" />
                <circle cx="212" cy="92" r="2" />
              </g>
            )}
          </g>

          {/* 7. Floating Pet Hearts / Sparkles */}
          {hearts.map((h) => (
            <g key={h.id} className="animate-cavy-heart" style={{ transformOrigin: `${h.x}px ${h.y}px` }}>
              {h.kind === 'heart' ? (
                <path
                  d={`M ${h.x} ${h.y} c -2.6 -4.5, -8.5 -3.5, -8.5 1.8 c 0 4.5, 8.5 9.5, 8.5 9.5 c 0 0, 8.5 -5, 8.5 -9.5 c 0 -5.3, -6 -6.3, -8.5 -1.8 z`}
                  fill="#FB7185"
                />
              ) : (
                <path
                  d={`M ${h.x} ${h.y - 6} L ${h.x + 1.8} ${h.y - 1.8} L ${h.x + 6} ${h.y} L ${h.x + 1.8} ${h.y + 1.8} L ${h.x} ${h.y + 6} L ${h.x - 1.8} ${h.y + 1.8} L ${h.x - 6} ${h.y} L ${h.x - 1.8} ${h.y - 1.8} Z`}
                  fill="#FDE047"
                />
              )}
            </g>
          ))}
        </svg>
      </button>
    </div>
  );
};
