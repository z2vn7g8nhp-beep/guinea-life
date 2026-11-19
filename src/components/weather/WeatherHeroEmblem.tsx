import React, { useId } from 'react';
import type { WeatherCondition } from '../../types/weather';

interface WeatherHeroEmblemProps {
  condition: WeatherCondition;
  isDay: boolean;
}

export const WeatherHeroEmblem: React.FC<WeatherHeroEmblemProps> = ({ condition, isDay }) => {
  const uid = useId().replace(/:/g, '');
  const sunBlurId = `sunBlur-${uid}`;
  const cloudBlurId = `cloudBlur-${uid}`;
  const sunCoreId = `sunCore-${uid}`;
  const sunCoronaId = `sunCorona-${uid}`;
  const moonCrescentId = `moonCrescent-${uid}`;
  const moonMaskId = `moonMask-${uid}`;
  const cloudLightId = `cloudLight-${uid}`;
  const cloudStormId = `cloudStorm-${uid}`;
  const cloudRimId = `cloudRim-${uid}`;
  const dropGradId = `dropGrad-${uid}`;
  const boltGradId = `boltGrad-${uid}`;

  const showSun =
    isDay &&
    (condition === 'clear' ||
      condition === 'partly-cloudy' ||
      condition === 'windy' ||
      condition === 'drizzle');

  const showMoon =
    !isDay &&
    (condition === 'clear' || condition === 'partly-cloudy' || condition === 'windy');

  const showCloud = condition !== 'clear';
  const isStorm = condition === 'thunderstorm' || condition === 'heavy-rain';
  const isRainy =
    condition === 'drizzle' ||
    condition === 'rain' ||
    condition === 'heavy-rain' ||
    condition === 'thunderstorm';
  const isSnow = condition === 'snow' || condition === 'blizzard';
  const isFog = condition === 'fog';
  const isWindy = condition === 'windy';

  return (
    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28">
      <svg viewBox="0 0 128 128" className="h-full w-full drop-shadow-[0_8px_22px_rgba(0,0,0,0.34)]">
        <defs>
          <filter id={sunBlurId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>

          <filter id={cloudBlurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>

          {/* Optical Soft-Light Sun */}
          <radialGradient id={sunCoronaId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 232, 133, 0.88)" />
            <stop offset="42%" stopColor="rgba(253, 198, 72, 0.42)" />
            <stop offset="100%" stopColor="rgba(251, 176, 59, 0)" />
          </radialGradient>

          <radialGradient id={sunCoreId} cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFDF0" />
            <stop offset="38%" stopColor="#FFE173" />
            <stop offset="78%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#EA8C1E" />
          </radialGradient>

          {/* Frosted Pale-Silver Crescent Moon */}
          <radialGradient id={moonCrescentId} cx="30%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#E6F0FF" />
            <stop offset="100%" stopColor="#AEC7EA" />
          </radialGradient>

          <mask id={moonMaskId}>
            <rect x="-40" y="-40" width="80" height="80" fill="#FFFFFF" />
            <circle cx="10" cy="-8" r="19" fill="#000000" />
          </mask>

          {/* VisionOS Frosted-Glass Cloud Gradients */}
          <linearGradient id={cloudLightId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.98)" />
            <stop offset="55%" stopColor="rgba(232, 241, 251, 0.88)" />
            <stop offset="100%" stopColor="rgba(167, 187, 212, 0.72)" />
          </linearGradient>

          <linearGradient id={cloudStormId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="rgba(218, 228, 242, 0.92)" />
            <stop offset="52%" stopColor="rgba(130, 148, 174, 0.86)" />
            <stop offset="100%" stopColor="rgba(68, 82, 106, 0.88)" />
          </linearGradient>

          <linearGradient id={cloudRimId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.88)" />
            <stop offset="100%" stopColor="rgba(255, 244, 214, 0.55)" />
          </linearGradient>

          <linearGradient id={dropGradId} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>

          <linearGradient id={boltGradId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="55%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Sun Layer */}
        {showSun && (
          <g
            transform={
              condition === 'clear'
                ? 'translate(64, 64) scale(1.14)'
                : 'translate(76, 48) scale(0.92)'
            }
          >
            <circle cx="0" cy="0" r="46" fill={`url(#${sunCoronaId})`} filter={`url(#${sunBlurId})`} />
            <circle cx="0" cy="0" r="25" fill={`url(#${sunCoreId})`} />
            <ellipse cx="-7" cy="-8" rx="9" ry="5" transform="rotate(-24 -7 -8)" fill="rgba(255,255,255,0.42)" />
          </g>
        )}

        {/* Crescent Moon & Diamond Stars */}
        {showMoon && (
          <g
            transform={
              condition === 'clear'
                ? 'translate(64, 64) scale(1.08)'
                : 'translate(74, 46) scale(0.88)'
            }
          >
            <circle
              cx="-2"
              cy="0"
              r="38"
              fill="rgba(186, 218, 255, 0.26)"
              filter={`url(#${sunBlurId})`}
            />
            <circle
              cx="-2"
              cy="0"
              r="22"
              fill={`url(#${moonCrescentId})`}
              mask={`url(#${moonMaskId})`}
            />
            {/* Crisp 4-point diamond stars */}
            <path d="M -29 -22 L -27.2 -17.8 L -23 -16 L -27.2 -14.2 L -29 -10 L -30.8 -14.2 L -35 -16 L -30.8 -17.8 Z" fill="#FEF9C3" opacity="0.92" />
            <path d="M 27 -24 L 28.3 -21 L 31.3 -19.7 L 28.3 -18.4 L 27 -15.4 L 25.7 -18.4 L 22.7 -19.7 L 25.7 -21 Z" fill="#E0F2FE" opacity="0.88" />
          </g>
        )}

        {/* Frosted-Glass Volumetric Cloud */}
        {showCloud && (
          <g
            transform={
              showSun || showMoon
                ? 'translate(0, 12)'
                : isRainy || isSnow || isFog || isWindy
                ? 'translate(4, -2)'
                : 'translate(4, 6)'
            }
          >
            {/* Soft back puff for layered depth */}
            <ellipse
              cx="74"
              cy="54"
              rx="22"
              ry="16"
              fill="rgba(255,255,255,0.34)"
              filter={`url(#${cloudBlurId})`}
            />
            {/* Main sculpted frosted cloud silhouette */}
            <path
              d="M 29 79 C 17 79, 13 64, 24 57 C 24 41, 41 32, 55 39 C 66 28, 89 35, 90 54 C 102 56, 104 79, 89 79 Z"
              fill={isStorm || condition === 'rain' ? `url(#${cloudStormId})` : `url(#${cloudLightId})`}
              stroke={`url(#${cloudRimId})`}
              strokeWidth="1.2"
            />
            {/* Subtle backlit top edge highlight when sun peeks behind */}
            {showSun && (
              <path
                d="M 55 39 C 66 29, 88 35, 90 53"
                fill="none"
                stroke="rgba(255, 238, 178, 0.78)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </g>
        )}

        {/* Ethereal Mist Ribbons (Fog) */}
        {isFog && (
          <g filter={`url(#${cloudBlurId})`}>
            <rect x="20" y="84" width="84" height="5" rx="2.5" fill="rgba(241, 245, 249, 0.78)" />
            <rect x="30" y="94" width="66" height="4.5" rx="2.25" fill="rgba(226, 232, 240, 0.62)" />
          </g>
        )}

        {/* Fluid Aerodynamic Breeze Lines (Windy) */}
        {isWindy && (
          <g fill="none" stroke="rgba(224, 242, 254, 0.88)" strokeWidth="2.4" strokeLinecap="round">
            <path d="M 20 84 H 78 C 86 84, 89 74, 81 72" />
            <path d="M 32 95 H 92 C 100 95, 102 104, 94 105" opacity="0.72" />
          </g>
        )}

        {/* Glistening Teardrop Raindrops */}
        {isRainy && condition !== 'thunderstorm' && (
          <g>
            {[
              { x: 42, y: 86 },
              { x: 60, y: 92 },
              { x: 78, y: 86 },
              ...(condition === 'heavy-rain' ? [{ x: 51, y: 102 }, { x: 69, y: 102 }] : []),
            ].map((d, i) => (
              <path
                key={i}
                d={`M ${d.x} ${d.y} C ${d.x - 4} ${d.y + 6}, ${d.x - 4.2} ${d.y + 11}, ${d.x} ${d.y + 11} C ${d.x + 4.2} ${d.y + 11}, ${d.x + 4} ${d.y + 6}, ${d.x} ${d.y} Z`}
                fill={`url(#${dropGradId})`}
              />
            ))}
          </g>
        )}

        {/* Electric Storm Bolt & Internal Glow */}
        {condition === 'thunderstorm' && (
          <g>
            <ellipse
              cx="63"
              cy="76"
              rx="18"
              ry="8"
              fill="rgba(253, 224, 71, 0.34)"
              filter={`url(#${sunBlurId})`}
            />
            <polygon
              points="64,73 52,91 61,91 56,110 76,87 66,87"
              fill={`url(#${boltGradId})`}
            />
          </g>
        )}

        {/* Symmetrical 6-Point Crystalline Snowflakes */}
        {isSnow && (
          <g stroke="#F8FAFC" strokeLinecap="round">
            {[
              { x: 42, y: 92, r: 5.2 },
              { x: 62, y: 98, r: 6.0 },
              { x: 82, y: 91, r: 4.8 },
            ].map((sf, idx) => (
              <g key={idx} transform={`translate(${sf.x}, ${sf.y})`} strokeWidth="1.6" opacity="0.94">
                <line x1="0" y1={-sf.r} x2="0" y2={sf.r} />
                <line x1={-sf.r * 0.86} y1={-sf.r * 0.5} x2={sf.r * 0.86} y2={sf.r * 0.5} />
                <line x1={-sf.r * 0.86} y1={sf.r * 0.5} x2={sf.r * 0.86} y2={-sf.r * 0.5} />
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
