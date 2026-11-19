import React, { useEffect, useState } from 'react';
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

export const GuineaPigMascot: React.FC<GuineaPigMascotProps> = ({
  outfit,
  condition,
  temperature,
  startled = false,
  onPet,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Natural blinking loop
  useEffect(() => {
    let timer = 0;
    let closeTimer = 0;
    const scheduleBlink = () => {
      const wait = 2400 + Math.random() * 3400;
      timer = window.setTimeout(() => {
        setIsBlinking(true);
        closeTimer = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 145);
      }, wait);
    };
    scheduleBlink();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  const handlePetClick = () => {
    weatherAudio.playPetChime();
    setIsPetted(true);
    window.setTimeout(() => setIsPetted(false), 680);

    const quotes = outfit.reactionQuotes;
    const nextQuote = quotes[quoteIdx % quotes.length] ?? 'Wheek~ 豚鼠向你问好！';
    setQuoteIdx((prev) => prev + 1);
    onPet?.(nextQuote);

    const batchId = Date.now();
    const spawned: FloatingHeart[] = [
      { id: batchId + 1, x: 112 + Math.random() * 25, y: 76, kind: 'heart' },
      { id: batchId + 2, x: 162 + Math.random() * 30, y: 58, kind: 'sparkle' },
      { id: batchId + 3, x: 196 + Math.random() * 22, y: 82, kind: 'heart' },
    ];
    setHearts((prev) => [...prev.slice(-6), ...spawned]);
    window.setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id < batchId));
    }, 1400);
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
  const showSquintCold = !isPetted && !startled && outfit.tierId === 'freezing' && outfit.eyewear === 'none';

  return (
    <div className="relative flex flex-col items-center select-none">
      <button
        type="button"
        onClick={handlePetClick}
        title="点一点摸摸棕白豚鼠"
        aria-label={`摸摸棕白豚鼠，当前穿搭：${outfit.outfitTitle}`}
        className="group relative cursor-pointer rounded-3xl p-1 transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {/* Subtle ambient spotlight behind mascot */}
        <div
          className="pointer-events-none absolute inset-6 rounded-full opacity-45 blur-2xl transition-colors duration-700"
          style={{
            background:
              temperature <= 2
                ? 'radial-gradient(circle, rgba(186,230,253,0.55) 0%, rgba(56,189,248,0) 70%)'
                : temperature >= 28
                ? 'radial-gradient(circle, rgba(253,224,71,0.5) 0%, rgba(251,146,60,0) 70%)'
                : 'radial-gradient(circle, rgba(255,247,237,0.45) 0%, rgba(255,255,255,0) 70%)',
          }}
        />

        <svg
          viewBox="0 0 320 310"
          className="relative z-10 h-64 w-64 drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)] sm:h-76 sm:w-76"
        >
          <defs>
            {/* Rich chestnut brown fur */}
            <linearGradient id="cavyBrownFur" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B96A36" />
              <stop offset="55%" stopColor="#944B21" />
              <stop offset="100%" stopColor="#6D3214" />
            </linearGradient>

            {/* Lighter caramel brown highlight */}
            <linearGradient id="cavyCaramelFur" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CE7B42" />
              <stop offset="100%" stopColor="#9C5023" />
            </linearGradient>

            {/* Creamy milk-white fur */}
            <radialGradient id="cavyWhiteFur" cx="48%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="68%" stopColor="#FAF4EA" />
              <stop offset="100%" stopColor="#E9DDD0" />
            </radialGradient>

            {/* Inner ear pink */}
            <linearGradient id="cavyEarPink" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5B2BA" />
              <stop offset="100%" stopColor="#D67C89" />
            </linearGradient>

            {/* Transparent bubble umbrella dome */}
            <radialGradient id="bubbleDome" cx="35%" cy="28%" r="72%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.68)" />
              <stop offset="55%" stopColor="rgba(196,232,255,0.26)" />
              <stop offset="100%" stopColor="rgba(147,197,253,0.45)" />
            </radialGradient>

            {/* Lantern glow */}
            <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(254, 240, 138, 0.9)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0.35)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
            </radialGradient>

            <clipPath id="cavyBodyClip">
              <path d="M96 164 C92 128, 108 82, 160 80 C212 82, 228 128, 224 164 C232 204, 222 254, 160 256 C98 254, 88 204, 96 164 Z" />
            </clipPath>
          </defs>

          {/* 1. Ground Stage */}
          <g>
            {/* Soft contact shadow */}
            <ellipse cx="160" cy="264" rx="74" ry="13" fill="rgba(15, 23, 42, 0.28)" />

            {outfit.hasPuddle && (
              <g>
                <ellipse
                  cx="160"
                  cy="265"
                  rx="88"
                  ry="16"
                  fill="rgba(125, 211, 252, 0.28)"
                  stroke="rgba(224, 242, 254, 0.55)"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="126"
                  cy="264"
                  rx="16"
                  ry="4.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="1.2"
                  className="animate-cavy-puddle-ripple"
                />
                <ellipse
                  cx="196"
                  cy="267"
                  rx="14"
                  ry="4"
                  fill="none"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.2"
                  style={{ animationDelay: '0.7s' }}
                  className="animate-cavy-puddle-ripple"
                />
              </g>
            )}

            {outfit.hasSnowDust && (
              <g>
                <path
                  d="M72 264 Q112 246 160 256 Q208 248 248 264 Q210 278 160 276 Q110 278 72 264 Z"
                  fill="rgba(241, 245, 249, 0.88)"
                />
                <path
                  d="M84 265 Q122 254 160 261 Q202 254 236 265"
                  fill="none"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
            )}

            {!outfit.hasPuddle && !outfit.hasSnowDust && (
              <g>
                <ellipse cx="160" cy="265" rx="82" ry="12" fill="rgba(134, 239, 172, 0.22)" />
                {/* Tiny clover/grass tufts */}
                <path
                  d="M92 264 Q89 254 84 252 M94 264 Q96 253 101 251 M226 264 Q224 254 219 253 M228 264 Q232 254 237 252"
                  stroke="rgba(167, 243, 208, 0.65)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}
          </g>

          {/* 2. Animated Mascot Core Group */}
          <g className={bodyAnimClass}>
            {/* Ears (behind head) */}
            <g className="animate-cavy-ear-left">
              <path
                d="M106 94 C86 78, 76 96, 86 114 C94 122, 108 118, 114 106 Z"
                fill="url(#cavyBrownFur)"
              />
              <path
                d="M103 97 C91 88, 86 98, 92 109 C97 113, 104 111, 108 104 Z"
                fill="url(#cavyEarPink)"
                opacity="0.72"
              />
            </g>
            <g className="animate-cavy-ear-right">
              <path
                d="M214 94 C234 78, 244 96, 234 114 C226 122, 212 118, 206 106 Z"
                fill="#F7EFE3"
              />
              <path
                d="M217 97 C229 88, 234 98, 228 109 C223 113, 216 111, 212 104 Z"
                fill="url(#cavyEarPink)"
                opacity="0.82"
              />
            </g>

            {/* Footwear (under body hem) */}
            <g>
              {outfit.footwear === 'bare-paws' && (
                <>
                  <ellipse cx="132" cy="254" rx="16" ry="8" fill="#F8D8CE" stroke="#DFB4A8" strokeWidth="1.2" />
                  <ellipse cx="188" cy="254" rx="16" ry="8" fill="#F8D8CE" stroke="#DFB4A8" strokeWidth="1.2" />
                </>
              )}
              {outfit.footwear === 'snow-boots' && (
                <>
                  <g>
                    <rect x="115" y="236" width="32" height="22" rx="10" fill="#B45309" />
                    <rect x="113" y="233" width="36" height="9" rx="4.5" fill="#FEF3C7" />
                    <rect x="116" y="254" width="30" height="5" rx="2.5" fill="#451A03" />
                  </g>
                  <g>
                    <rect x="173" y="236" width="32" height="22" rx="10" fill="#B45309" />
                    <rect x="171" y="233" width="36" height="9" rx="4.5" fill="#FEF3C7" />
                    <rect x="174" y="254" width="30" height="5" rx="2.5" fill="#451A03" />
                  </g>
                </>
              )}
              {outfit.footwear === 'ankle-boots' && (
                <>
                  <rect x="116" y="239" width="31" height="19" rx="9" fill="#57321A" />
                  <rect x="173" y="239" width="31" height="19" rx="9" fill="#57321A" />
                  <rect x="117" y="253" width="29" height="4.5" rx="2" fill="#291509" />
                  <rect x="174" y="253" width="29" height="4.5" rx="2" fill="#291509" />
                </>
              )}
              {outfit.footwear === 'sneakers' && (
                <>
                  <rect x="116" y="242" width="32" height="16" rx="8" fill="#0F766E" />
                  <rect x="116" y="252" width="32" height="6" rx="3" fill="#FFFFFF" />
                  <rect x="172" y="242" width="32" height="16" rx="8" fill="#0F766E" />
                  <rect x="172" y="252" width="32" height="6" rx="3" fill="#FFFFFF" />
                </>
              )}
              {outfit.footwear === 'rain-boots' && (
                <>
                  <rect x="115" y="233" width="32" height="25" rx="9" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
                  <rect x="114" y="233" width="34" height="6" rx="3" fill="#FEF08A" />
                  <rect x="115" y="253" width="32" height="5" rx="2.5" fill="#A16207" />
                  <rect x="173" y="233" width="32" height="25" rx="9" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.2" />
                  <rect x="172" y="233" width="34" height="6" rx="3" fill="#FEF08A" />
                  <rect x="173" y="253" width="32" height="5" rx="2.5" fill="#A16207" />
                </>
              )}
              {outfit.footwear === 'sandals' && (
                <>
                  <ellipse cx="132" cy="254" rx="16" ry="7" fill="#D97706" />
                  <path d="M120 251 Q132 245 144 251" stroke="#FEF3C7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <ellipse cx="188" cy="254" rx="16" ry="7" fill="#D97706" />
                  <path d="M176 251 Q188 245 200 251" stroke="#FEF3C7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </>
              )}
            </g>

            {/* Plump Guinea Pig Body & Brown-and-White Fur Coat */}
            <g clipPath="url(#cavyBodyClip)">
              {/* Creamy white base coat */}
              <rect x="85" y="75" width="150" height="190" fill="url(#cavyWhiteFur)" />

              {/* Signature brown patch on left cheek & eye */}
              <path
                d="M84 74 L152 74 C146 94, 152 114, 144 134 C132 148, 114 152, 86 146 Z"
                fill="url(#cavyBrownFur)"
              />

              {/* Signature caramel-brown saddle patch on right flank & hip */}
              <path
                d="M236 142 C202 142, 184 162, 180 188 C176 218, 192 246, 236 254 Z"
                fill="url(#cavyCaramelFur)"
              />

              {/* Small brown patch on lower left hip for authentic tri-spot look */}
              <path
                d="M84 182 C108 184, 120 202, 114 236 L84 248 Z"
                fill="url(#cavyBrownFur)"
                opacity="0.92"
              />

              {/* Subtle belly shading */}
              <ellipse cx="160" cy="236" rx="64" ry="28" fill="rgba(214, 198, 180, 0.34)" />

              {/* Soft fur tuft texture accents along patch boundaries */}
              <path
                d="M148 92 L154 96 L147 101 M145 112 L152 116 L144 122 M186 168 L178 172 L185 178"
                stroke="#944B21"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="0.55"
              />
            </g>

            {/* Outer body silhouette contour for crisp contrast against bright skies */}
            <path
              d="M96 164 C92 128, 108 82, 160 80 C212 82, 228 128, 224 164 C232 204, 222 254, 160 256 C98 254, 88 204, 96 164 Z"
              fill="none"
              stroke="rgba(120, 72, 42, 0.22)"
              strokeWidth="1.5"
            />

            {/* Fluffy cheek fur tufts */}
            <path
              d="M97 132 Q90 135 95 140 M223 132 Q230 135 225 140"
              stroke="rgba(148, 75, 33, 0.45)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />

            {/* 3. Outerwear Clothing Layer */}
            <g>
              {outfit.outerwear === 'parka' && (
                <g>
                  <path
                    d="M97 166 C92 198, 96 238, 122 246 L198 246 C224 238, 228 198, 223 166 C204 156, 116 156, 97 166 Z"
                    fill="#3F6212"
                  />
                  {/* Quilted horizontal stitching */}
                  <path
                    d="M100 188 Q160 194 220 188 M98 212 Q160 218 222 212"
                    stroke="#365314"
                    strokeWidth="1.8"
                    fill="none"
                  />
                  {/* Center zipper placket */}
                  <rect x="155" y="160" width="10" height="86" rx="4" fill="#65A30D" />
                  <circle cx="160" cy="178" r="2.2" fill="#FEF08A" />
                  <circle cx="160" cy="202" r="2.2" fill="#FEF08A" />
                  <circle cx="160" cy="226" r="2.2" fill="#FEF08A" />
                  {/* Fluffy cream faux-fur collar */}
                  <path
                    d="M104 162 Q132 174 160 168 Q188 174 216 162 Q204 148 160 154 Q116 148 104 162 Z"
                    fill="#FEF3C7"
                    stroke="#E7D7AE"
                    strokeWidth="1.2"
                  />
                </g>
              )}

              {outfit.outerwear === 'duffle-coat' && (
                <g>
                  <path
                    d="M98 166 C94 200, 98 240, 122 246 L198 246 C222 240, 226 200, 222 166 C204 156, 116 156, 98 166 Z"
                    fill="#D97706"
                  />
                  <line x1="160" y1="162" x2="160" y2="246" stroke="#92400E" strokeWidth="2" />
                  {/* Wooden toggle clasps */}
                  {[182, 206, 228].map((ty) => (
                    <g key={ty}>
                      <line x1="150" y1={ty} x2="170" y2={ty} stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
                      <rect x="155" y={ty - 3} width="10" height="6" rx="3" fill="#451A03" />
                    </g>
                  ))}
                  {/* Side pockets */}
                  <rect x="112" y="206" width="24" height="20" rx="5" fill="#B45309" />
                  <rect x="184" y="206" width="24" height="20" rx="5" fill="#B45309" />
                </g>
              )}

              {outfit.outerwear === 'knit-cardigan' && (
                <g>
                  {/* Cream inner tee */}
                  <path d="M126 162 L194 162 L188 244 L132 244 Z" fill="#FFFBEB" />
                  {/* Matcha knit cardigan left & right */}
                  <path
                    d="M99 166 C94 198, 98 238, 122 244 L150 244 L150 162 C132 158, 112 160, 99 166 Z"
                    fill="#65A30D"
                  />
                  <path
                    d="M221 166 C226 198, 222 238, 198 244 L170 244 L170 162 C188 158, 208 160, 221 166 Z"
                    fill="#65A30D"
                  />
                  {/* Knit ribbing texture */}
                  <path
                    d="M118 176 V232 M134 176 V232 M186 176 V232 M202 176 V232"
                    stroke="#4D7C0F"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.55"
                  />
                  <circle cx="154" cy="186" r="2.6" fill="#78350F" />
                  <circle cx="154" cy="208" r="2.6" fill="#78350F" />
                  <circle cx="154" cy="230" r="2.6" fill="#78350F" />
                </g>
              )}

              {outfit.outerwear === 'denim-overalls' && (
                <g>
                  {/* Striped tee underneath */}
                  <path
                    d="M100 166 C97 188, 99 212, 108 228 L212 228 C221 212, 223 188, 220 166 C198 158, 122 158, 100 166 Z"
                    fill="#FFF7ED"
                  />
                  <path
                    d="M102 178 H218 M100 192 H220"
                    stroke="#FB923C"
                    strokeWidth="4.5"
                    opacity="0.82"
                  />
                  {/* Denim overall bib & pants */}
                  <path
                    d="M126 176 L194 176 L212 244 C194 249, 126 249, 108 244 Z"
                    fill="#2563EB"
                  />
                  {/* Straps */}
                  <rect x="126" y="160" width="11" height="22" rx="3" fill="#1D4ED8" />
                  <rect x="183" y="160" width="11" height="22" rx="3" fill="#1D4ED8" />
                  <circle cx="131.5" cy="179" r="3" fill="#FACC15" />
                  <circle cx="188.5" cy="179" r="3" fill="#FACC15" />
                  {/* Front pocket */}
                  <rect x="143" y="192" width="34" height="24" rx="6" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="1" strokeDasharray="3 2" />
                </g>
              )}

              {outfit.outerwear === 'floral-shirt' && (
                <g>
                  <path
                    d="M99 166 C95 196, 99 232, 120 242 L200 242 C221 232, 225 196, 221 166 C202 158, 118 158, 99 166 Z"
                    fill="#0EA5E9"
                  />
                  {/* Botanical palm/hibiscus prints */}
                  <circle cx="126" cy="192" r="7" fill="#FDA4AF" opacity="0.9" />
                  <circle cx="126" cy="192" r="2.5" fill="#FACC15" />
                  <circle cx="188" cy="216" r="8" fill="#FDE047" opacity="0.88" />
                  <circle cx="188" cy="216" r="2.8" fill="#F97316" />
                  <path d="M174 178 Q190 172 196 186 Q182 188 174 178 Z" fill="#4ADE80" opacity="0.85" />
                  <path d="M122 224 Q138 214 144 230 Q128 232 122 224 Z" fill="#4ADE80" opacity="0.85" />
                  {/* Open collar V-neck */}
                  <polygon points="145,160 160,184 175,160" fill="#FFFBF4" />
                </g>
              )}

              {outfit.outerwear === 'cooling-tank' && (
                <g>
                  <path
                    d="M116 164 L204 164 L210 238 C188 244, 132 244, 110 238 Z"
                    fill="#38BDF8"
                  />
                  <path
                    d="M142 164 Q160 178 178 164"
                    fill="#FFFBF4"
                  />
                  <circle cx="160" cy="204" r="14" fill="rgba(255,255,255,0.22)" />
                  <path d="M160 194 V214 M150 204 H170 M153 197 L167 211 M167 197 L153 211" stroke="#E0F2FE" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}
            </g>

            {/* 4. Waterproof Raincoat Overlay */}
            {outfit.rainGear !== 'none' && (
              <g>
                <path
                  d="M92 162 C86 200, 92 240, 118 248 L202 248 C228 240, 234 200, 228 162 C206 150, 114 150, 92 162 Z"
                  fill={outfit.rainGear === 'storm-slicker' ? 'rgba(249, 115, 22, 0.88)' : 'rgba(250, 204, 21, 0.86)'}
                  stroke={outfit.rainGear === 'storm-slicker' ? '#EA580C' : '#EAB308'}
                  strokeWidth="1.5"
                />
                {/* Glossy waterproof highlight */}
                <path
                  d="M108 174 C104 198, 108 222, 116 236"
                  stroke="rgba(255,255,255,0.48)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Snap buttons */}
                <line x1="160" y1="160" x2="160" y2="246" stroke="rgba(161,98,7,0.5)" strokeWidth="2" />
                {[178, 200, 222].map((y) => (
                  <circle key={y} cx="160" cy={y} r="3" fill="#FFFBEB" stroke="#B45309" strokeWidth="1" />
                ))}
              </g>
            )}

            {/* 5. Neckwear */}
            <g>
              {(outfit.neckwear === 'wool-scarf' || outfit.neckwear === 'plaid-scarf') && (
                <g>
                  {/* Fluttering scarf tail */}
                  <g className={outfit.isWindy ? 'animate-cavy-scarf-wind' : ''}>
                    <path
                      d="M174 164 C196 176, 204 202, 198 222 L176 222 C178 202, 170 182, 158 170 Z"
                      fill={outfit.neckwear === 'wool-scarf' ? '#DC2626' : '#B91C1C'}
                    />
                    <path
                      d="M177 194 H199 M177 208 H199"
                      stroke={outfit.neckwear === 'wool-scarf' ? '#FEF3C7' : '#FBBF24'}
                      strokeWidth="3"
                    />
                  </g>
                  {/* Collar wrap */}
                  <path
                    d="M104 156 Q160 176 216 156 Q218 172 160 182 Q102 172 104 156 Z"
                    fill={outfit.neckwear === 'wool-scarf' ? '#EF4444' : '#991B1B'}
                  />
                  <path
                    d="M126 164 L122 176 M148 168 L146 180 M172 168 L174 180 M194 164 L198 176"
                    stroke={outfit.neckwear === 'wool-scarf' ? '#FEF3C7' : '#FDE68A'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {outfit.neckwear === 'cooling-ring' && (
                <g>
                  <path
                    d="M112 152 Q160 174 208 152 Q212 164 160 180 Q108 164 112 152 Z"
                    fill="#67E8F9"
                    stroke="#06B6D4"
                    strokeWidth="1.5"
                  />
                  <path d="M124 160 Q160 173 196 160" stroke="#ECFEFF" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                </g>
              )}

              {outfit.neckwear === 'bowtie' && outfit.rainGear === 'none' && (
                <g transform="translate(160, 162)">
                  <polygon points="0,0 -15,-8 -15,8" fill="#F43F5E" />
                  <polygon points="0,0 15,-8 15,8" fill="#F43F5E" />
                  <circle cx="0" cy="0" r="4" fill="#FB7185" />
                </g>
              )}
            </g>

            {/* 6. Expressive Guinea Pig Face */}
            <g>
              {/* Eyes */}
              {showEyesClosedHappy ? (
                <>
                  <path d="M122 116 Q132 106 142 116" stroke="#1C1917" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                  <path d="M178 116 Q188 106 198 116" stroke="#1C1917" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                </>
              ) : isBlinking || showSquintCold ? (
                <>
                  <path d="M123 114 Q132 119 141 114" stroke="#1C1917" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  <path d="M179 114 Q188 119 197 114" stroke="#1C1917" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                </>
              ) : startled ? (
                <>
                  <circle cx="132" cy="113" r="8.5" fill="#FFFFFF" stroke="#1C1917" strokeWidth="1.5" />
                  <circle cx="132" cy="113" r="4.5" fill="#1C1917" />
                  <circle cx="134" cy="111" r="1.5" fill="#FFFFFF" />
                  <circle cx="188" cy="113" r="8.5" fill="#FFFFFF" stroke="#1C1917" strokeWidth="1.5" />
                  <circle cx="188" cy="113" r="4.5" fill="#1C1917" />
                  <circle cx="190" cy="111" r="1.5" fill="#FFFFFF" />
                </>
              ) : (
                <>
                  {/* Left eye */}
                  <circle cx="132" cy="114" r="6.8" fill="#1C1917" />
                  <circle cx="134.5" cy="111.5" r="2.2" fill="#FFFFFF" />
                  <circle cx="129.5" cy="116" r="1" fill="#FFFFFF" opacity="0.7" />
                  {/* Right eye */}
                  <circle cx="188" cy="114" r="6.8" fill="#1C1917" />
                  <circle cx="190.5" cy="111.5" r="2.2" fill="#FFFFFF" />
                  <circle cx="185.5" cy="116" r="1" fill="#FFFFFF" opacity="0.7" />
                </>
              )}

              {/* Rosy blush */}
              <ellipse cx="114" cy="127" rx="8.5" ry="5" fill="#FDA4AF" opacity={temperature <= 0 || isPetted ? 0.72 : 0.45} />
              <ellipse cx="206" cy="127" rx="8.5" ry="5" fill="#FDA4AF" opacity={temperature <= 0 || isPetted ? 0.72 : 0.45} />

              {/* Twitching pink guinea pig nose & signature Y-mouth */}
              <g className="animate-cavy-nose">
                <ellipse cx="160" cy="126" rx="7.5" ry="5.5" fill="#F9A8B8" />
                <ellipse cx="158" cy="124.5" rx="2.4" ry="1.3" fill="rgba(255,255,255,0.55)" />
                <path
                  d="M160 131.5 V135.5 M160 135.5 Q154 140 150 136 M160 135.5 Q166 140 170 136"
                  stroke="#78350F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Cute whiskers */}
                <path
                  d="M142 128 L120 124 M142 132 L119 133 M178 128 L200 124 M178 132 L201 133"
                  stroke="rgba(120, 72, 42, 0.45)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>

              {/* Frost breath puff when cold */}
              {outfit.hasFrostBreath && (
                <g className="animate-cavy-breath-puff" style={{ transformOrigin: '172px 136px' }}>
                  <circle cx="174" cy="136" r="4" fill="rgba(255,255,255,0.68)" />
                  <circle cx="182" cy="133" r="5.5" fill="rgba(255,255,255,0.55)" />
                  <circle cx="191" cy="135" r="3.5" fill="rgba(255,255,255,0.45)" />
                </g>
              )}

              {/* Hot summer sweat drop */}
              {outfit.hasSweatDrop && (
                <path
                  d="M206 96 C206 96, 212 104, 212 108 A6 6 0 1 1 200 108 C200 104, 206 96, 206 96 Z"
                  fill="#7DD3FC"
                  stroke="#E0F2FE"
                  strokeWidth="1"
                />
              )}
            </g>

            {/* 7. Eyewear */}
            <g>
              {outfit.eyewear === 'sunglasses' && (
                <g>
                  <rect x="115" y="103" width="36" height="22" rx="7" fill="#1C1917" stroke="#F59E0B" strokeWidth="2" />
                  <rect x="169" y="103" width="36" height="22" rx="7" fill="#1C1917" stroke="#F59E0B" strokeWidth="2" />
                  <line x1="151" y1="112" x2="169" y2="112" stroke="#F59E0B" strokeWidth="2.5" />
                  <line x1="122" y1="107" x2="132" y2="121" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="176" y1="107" x2="186" y2="121" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              )}

              {outfit.eyewear === 'round-glasses' && (
                <g>
                  <circle cx="132" cy="114" r="14" fill="rgba(224,242,254,0.22)" stroke="#D97706" strokeWidth="2.2" />
                  <circle cx="188" cy="114" r="14" fill="rgba(224,242,254,0.22)" stroke="#D97706" strokeWidth="2.2" />
                  <path d="M146 113 Q160 109 174 113" stroke="#D97706" strokeWidth="2.2" fill="none" />
                </g>
              )}

              {outfit.eyewear === 'snow-goggles' && (
                <g>
                  <rect x="108" y="99" width="104" height="28" rx="13" fill="#0F172A" />
                  <rect x="113" y="103" width="94" height="20" rx="10" fill="url(#cavyCaramelFur)" />
                  <path d="M124 106 L142 120 M162 106 L178 120" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
            </g>

            {/* 8. Headwear */}
            <g>
              {outfit.headwear === 'pom-beanie' && (
                <g>
                  <circle cx="160" cy="46" r="13" fill="#FFFFFF" />
                  <path d="M114 90 C118 52, 202 52, 206 90 Z" fill="#E11D48" />
                  <path d="M120 74 Q160 66 200 74" stroke="#FEF3C7" strokeWidth="6" fill="none" />
                  <rect x="110" y="84" width="100" height="15" rx="7.5" fill="#F43F5E" stroke="#FFE4E6" strokeWidth="1.2" />
                </g>
              )}

              {outfit.headwear === 'earmuffs' && (
                <g>
                  <path d="M96 92 C106 54, 214 54, 224 92" stroke="#F43F5E" strokeWidth="6" fill="none" strokeLinecap="round" />
                  <circle cx="94" cy="100" r="16" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2" />
                  <circle cx="226" cy="100" r="16" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="2" />
                </g>
              )}

              {outfit.headwear === 'beret' && (
                <g transform="translate(154, 78) rotate(-8)">
                  <ellipse cx="0" cy="0" rx="48" ry="18" fill="#881337" />
                  <path d="M-4 -18 Q0 -26 6 -21" stroke="#4C0519" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <ellipse cx="-14" cy="-5" rx="18" ry="5" fill="rgba(255,255,255,0.12)" />
                </g>
              )}

              {outfit.headwear === 'newsboy' && (
                <g>
                  <path d="M114 88 C120 56, 200 56, 206 88 Z" fill="#78350F" />
                  <path d="M116 86 Q160 77 216 90 Q190 96 150 91 Z" fill="#451A03" />
                  <circle cx="160" cy="64" r="4" fill="#451A03" />
                </g>
              )}

              {outfit.headwear === 'straw-hat' && (
                <g>
                  <ellipse cx="160" cy="84" rx="68" ry="14" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
                  <path d="M122 82 L128 56 Q160 50 192 56 L198 82 Z" fill="#FEF08A" stroke="#D97706" strokeWidth="1.2" />
                  <path d="M124 75 Q160 80 196 75 L197 82 Q160 87 123 82 Z" fill="#F43F5E" />
                </g>
              )}

              {outfit.headwear === 'sun-visor' && (
                <g>
                  <path d="M112 86 Q160 76 208 86 L204 75 Q160 66 116 75 Z" fill="#FFFFFF" />
                  <path d="M110 85 Q160 78 214 94 Q162 103 110 85 Z" fill="rgba(34, 211, 238, 0.72)" stroke="#0891B2" strokeWidth="1.2" />
                </g>
              )}

              {outfit.headwear === 'rain-hood' && (
                <g>
                  <path
                    d="M100 132 C88 86, 114 58, 160 58 C206 58, 232 86, 220 132 C214 96, 194 82, 160 82 C126 82, 106 96, 100 132 Z"
                    fill={outfit.rainGear === 'storm-slicker' ? 'rgba(249, 115, 22, 0.9)' : 'rgba(250, 204, 21, 0.9)'}
                    stroke={outfit.rainGear === 'storm-slicker' ? '#EA580C' : '#CA8A04'}
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {outfit.headwear === 'nightcap' && (
                <g>
                  <path d="M116 86 C126 52, 184 42, 224 68 C202 74, 198 84, 202 88 Z" fill="#1E3A8A" />
                  <circle cx="148" cy="68" r="2.2" fill="#FDE047" />
                  <circle cx="174" cy="62" r="1.8" fill="#FDE047" />
                  <circle cx="226" cy="70" r="8" fill="#FEF08A" />
                  <rect x="112" y="82" width="94" height="11" rx="5.5" fill="#E0F2FE" />
                </g>
              )}
            </g>

            {/* 9. Little Front Paws */}
            <g>
              <ellipse cx="122" cy="196" rx="11" ry="8" transform="rotate(-15 122 196)" fill="#FFF8EE" stroke="#E2D3C1" strokeWidth="1.2" />
              <ellipse cx="198" cy="196" rx="11" ry="8" transform="rotate(15 198 196)" fill="#FFF8EE" stroke="#E2D3C1" strokeWidth="1.2" />
            </g>

            {/* 10. Handheld Props */}
            <g>
              {outfit.handheldProp === 'hot-cocoa' && (
                <g transform="translate(196, 184)">
                  <rect x="0" y="6" width="22" height="22" rx="5" fill="#DC2626" />
                  <path d="M22 11 C28 11, 28 23, 22 23" fill="none" stroke="#DC2626" strokeWidth="3.2" />
                  <ellipse cx="11" cy="7" rx="9" ry="3.2" fill="#78350F" />
                  <circle cx="8" cy="6" r="3" fill="#FFFFFF" />
                  <circle cx="14" cy="6" r="2.5" fill="#FFFFFF" />
                  <path d="M7 -2 Q4 -10 8 -16" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-cavy-steam" />
                  <path d="M14 -3 Q18 -11 14 -18" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round" fill="none" style={{ animationDelay: '0.8s' }} className="animate-cavy-steam" />
                </g>
              )}

              {outfit.handheldProp === 'sweet-potato' && (
                <g transform="translate(192, 188)">
                  <ellipse cx="14" cy="12" rx="14" ry="9" transform="rotate(-18 14 12)" fill="#7C2D12" />
                  <ellipse cx="16" cy="12" rx="9" ry="6" transform="rotate(-18 16 12)" fill="#FBBF24" />
                  <path d="M12 -2 Q9 -10 14 -16" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" className="animate-cavy-steam" />
                </g>
              )}

              {outfit.handheldProp === 'milk-tea' && (
                <g transform="translate(198, 178)">
                  <polygon points="3,8 21,8 18,32 6,32" fill="#FDE68A" stroke="#D97706" strokeWidth="1.2" />
                  <rect x="2" y="6" width="20" height="4" rx="2" fill="#FFFFFF" />
                  <line x1="14" y1="-4" x2="12" y2="10" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="9" cy="27" r="2" fill="#451A03" />
                  <circle cx="14" cy="26" r="2" fill="#451A03" />
                  <circle cx="12" cy="29" r="2" fill="#451A03" />
                </g>
              )}

              {outfit.handheldProp === 'hay-clover' && (
                <g transform="translate(188, 178)">
                  <path d="M4 24 L26 2 M8 26 L30 12 M10 26 L20 0" stroke="#84CC16" strokeWidth="2.6" strokeLinecap="round" />
                  <circle cx="26" cy="2" r="4" fill="#FACC15" />
                  <circle cx="30" cy="12" r="3" fill="#4ADE80" />
                </g>
              )}

              {outfit.handheldProp === 'lemonade' && (
                <g transform="translate(198, 178)">
                  <polygon points="3,8 21,8 18,32 6,32" fill="rgba(254, 240, 138, 0.9)" stroke="#FFFFFF" strokeWidth="1.4" />
                  <circle cx="19" cy="9" r="6" fill="#FACC15" stroke="#FEF9C3" strokeWidth="1.2" />
                  <line x1="11" y1="-4" x2="13" y2="24" stroke="#38BDF8" strokeWidth="2.8" strokeLinecap="round" />
                  <rect x="8" y="14" width="5" height="5" rx="1" fill="rgba(255,255,255,0.65)" />
                </g>
              )}

              {outfit.handheldProp === 'mini-fan' && (
                <g transform="translate(198, 170)">
                  <rect x="10" y="20" width="6" height="18" rx="3" fill="#0F766E" />
                  <circle cx="13" cy="12" r="14" fill="rgba(204,251,241,0.35)" stroke="#2DD4BF" strokeWidth="2" />
                  <g className="animate-cavy-fan-spin" style={{ transformOrigin: '13px 12px' }}>
                    <ellipse cx="13" cy="5" rx="3" ry="6" fill="#5EEAD4" />
                    <ellipse cx="13" cy="19" rx="3" ry="6" fill="#5EEAD4" />
                    <ellipse cx="6" cy="12" rx="6" ry="3" fill="#99F6E4" />
                    <ellipse cx="20" cy="12" rx="6" ry="3" fill="#99F6E4" />
                  </g>
                  <circle cx="13" cy="12" r="3" fill="#0F766E" />
                </g>
              )}

              {outfit.handheldProp === 'lantern' && (
                <g transform="translate(200, 176)">
                  <circle cx="12" cy="24" r="24" fill="url(#lanternGlow)" />
                  <line x1="12" y1="0" x2="12" y2="10" stroke="#FDE047" strokeWidth="2" />
                  <rect x="4" y="10" width="16" height="22" rx="6" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.5" />
                  <rect x="8" y="14" width="8" height="14" rx="3" fill="#FEF9C3" />
                </g>
              )}

              {outfit.handheldProp === 'umbrella' && (
                <g className="animate-cavy-umbrella">
                  {/* Handle & shaft */}
                  <line x1="204" y1="14" x2="204" y2="198" stroke="#E2E8F0" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M204 198 C204 208, 192 208, 192 199" stroke="#78350F" strokeWidth="4" strokeLinecap="round" fill="none" />
                  {/* Transparent bubble umbrella dome */}
                  <path
                    d="M104 72 C104 12, 304 12, 304 72 Q254 64 204 72 Q154 64 104 72 Z"
                    fill="url(#bubbleDome)"
                    stroke={isStorm ? '#60A5FA' : 'rgba(255,255,255,0.88)'}
                    strokeWidth="2"
                  />
                  {/* Dome ribs */}
                  <path
                    d="M204 20 Q164 38 148 68 M204 20 Q244 38 260 68 M204 20 V72"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.4"
                    fill="none"
                  />
                  {/* Tiny raindrops sliding off umbrella */}
                  <circle cx="146" cy="46" r="2.2" fill="rgba(255,255,255,0.85)" />
                  <circle cx="256" cy="52" r="2.4" fill="rgba(255,255,255,0.85)" />
                  <circle cx="222" cy="34" r="1.8" fill="rgba(255,255,255,0.9)" />
                </g>
              )}
            </g>

            {/* Snow dusting on hat/shoulders during snow */}
            {outfit.hasSnowDust && (
              <g fill="#FFFFFF" opacity="0.9">
                <circle cx="136" cy="72" r="2.5" />
                <circle cx="178" cy="68" r="2" />
                <circle cx="114" cy="158" r="2.5" />
                <circle cx="204" cy="160" r="2.2" />
              </g>
            )}
          </g>

          {/* 11. Floating Pet Hearts / Sparkles */}
          {hearts.map((h) => (
            <g key={h.id} className="animate-cavy-heart" style={{ transformOrigin: `${h.x}px ${h.y}px` }}>
              {h.kind === 'heart' ? (
                <path
                  d={`M ${h.x} ${h.y} c -3 -5, -10 -4, -10 2 c 0 5, 10 11, 10 11 c 0 0, 10 -6, 10 -11 c 0 -6, -7 -7, -10 -2 z`}
                  fill="#FB7185"
                />
              ) : (
                <path
                  d={`M ${h.x} ${h.y - 7} L ${h.x + 2} ${h.y - 2} L ${h.x + 7} ${h.y} L ${h.x + 2} ${h.y + 2} L ${h.x} ${h.y + 7} L ${h.x - 2} ${h.y + 2} L ${h.x - 7} ${h.y} L ${h.x - 2} ${h.y - 2} Z`}
                  fill="#FDE047"
                />
              )}
            </g>
          ))}
        </svg>

        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md transition group-hover:bg-black/40">
          <span>点我互动</span>
          <span className="text-amber-300">✦</span>
          <span>{outfit.outfitTitle}</span>
        </span>
      </button>
    </div>
  );
};
