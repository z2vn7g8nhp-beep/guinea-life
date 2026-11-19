import React, { useId } from 'react';
import type { WeatherCondition } from '../../types/weather';

interface WeatherHeroEmblemProps {
  condition: WeatherCondition;
  isDay: boolean;
}

export const WeatherHeroEmblem: React.FC<WeatherHeroEmblemProps> = ({ condition, isDay }) => {
  const uid = useId().replace(/:/g, '');
  const sunGradId = `sunGlow-${uid}`;
  const sunAuraId = `sunAura-${uid}`;
  const cloudGradId = `cloudLit-${uid}`;
  const darkCloudGradId = `cloudDark-${uid}`;
  const moonGradId = `moonLit-${uid}`;
  const boltGradId = `boltLit-${uid}`;

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
      <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
        <defs>
          <radialGradient id={sunAuraId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 224, 92, 0.72)" />
            <stop offset="55%" stopColor="rgba(253, 186, 46, 0.25)" />
            <stop offset="100%" stopColor="rgba(253, 186, 46, 0)" />
          </radialGradient>

          <radialGradient id={sunGradId} cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFF7B2" />
            <stop offset="48%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>

          <radialGradient id={moonGradId} cx="35%" cy="35%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="62%" stopColor="#E2ECFF" />
            <stop offset="100%" stopColor="#A9C1EA" />
          </radialGradient>

          <linearGradient id={cloudGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="58%" stopColor="#E6EEF7" />
            <stop offset="100%" stopColor="#A7BAD0" />
          </linearGradient>

          <linearGradient id={darkCloudGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD7E6" />
            <stop offset="55%" stopColor="#8597AD" />
            <stop offset="100%" stopColor="#4A5A70" />
          </linearGradient>

          <linearGradient id={boltGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Sun Glow & Disc */}
        {showSun && (
          <g
            transform={
              condition === 'clear' ? 'translate(60, 58) scale(1.12)' : 'translate(66, 46) scale(0.95)'
            }
          >
            <circle cx="0" cy="0" r="46" fill={`url(#${sunAuraId})`} />
            <circle cx="0" cy="0" r="27" fill={`url(#${sunGradId})`} />
          </g>
        )}

        {/* Luminous Night Moon & Subtle Stars */}
        {showMoon && (
          <g transform={condition === 'clear' ? 'translate(60, 58)' : 'translate(66, 45) scale(0.92)'}>
            <circle cx="0" cy="0" r="42" fill="rgba(191, 219, 254, 0.22)" />
            <circle cx="0" cy="0" r="24" fill={`url(#${moonGradId})`} />
            <circle cx="-7" cy="-5" r="4.2" fill="rgba(148, 168, 204, 0.32)" />
            <circle cx="7" cy="6" r="3" fill="rgba(148, 168, 204, 0.28)" />
            <circle cx="-28" cy="-22" r="2" fill="#FEF9C3" opacity="0.9" />
            <circle cx="28" cy="-26" r="1.6" fill="#FFFFFF" opacity="0.85" />
            <circle cx="32" cy="14" r="1.4" fill="#E0F2FE" opacity="0.8" />
          </g>
        )}

        {/* Soft Volumetric Cloud */}
        {showCloud && (
          <g transform={showSun || showMoon ? 'translate(2, 12)' : 'translate(4, 2)'}>
            {/* Shadow back puff */}
            <path
              d="M 24 72 C 14 72, 10 56, 22 50 C 24 34, 46 28, 58 38 C 70 28, 92 38, 90 56 C 100 60, 98 72, 86 72 Z"
              fill={isStorm || condition === 'rain' ? `url(#${darkCloudGradId})` : `url(#${cloudGradId})`}
            />
          </g>
        )}

        {/* Fog Horizontal Soft Mist Bars */}
        {isFog && (
          <g stroke="rgba(241, 245, 249, 0.8)" strokeWidth="3.5" strokeLinecap="round">
            <line x1="20" y1="84" x2="96" y2="84" />
            <line x1="28" y1="93" x2="88" y2="93" opacity="0.7" />
          </g>
        )}

        {/* Wind Streaks */}
        {isWindy && (
          <g fill="none" stroke="rgba(224, 242, 254, 0.85)" strokeWidth="2.8" strokeLinecap="round">
            <path d="M 18 82 H 78 C 86 82, 88 73, 81 71" />
            <path d="M 28 92 H 90 C 98 92, 100 101, 92 103" opacity="0.75" />
          </g>
        )}

        {/* Raindrops */}
        {isRainy && !isStorm && (
          <g stroke="#93C5FD" strokeWidth="2.8" strokeLinecap="round" opacity="0.92">
            <line x1="40" y1="82" x2="35" y2="95" />
            <line x1="58" y1="84" x2="53" y2="99" />
            <line x1="76" y1="82" x2="71" y2="95" />
          </g>
        )}

        {/* Heavy Rain / Thunderstorm Lightning */}
        {isStorm && (
          <g>
            {condition === 'thunderstorm' ? (
              <polygon
                points="60,70 48,88 58,88 53,106 74,83 62,83"
                fill={`url(#${boltGradId})`}
              />
            ) : (
              <g stroke="#7DD3FC" strokeWidth="3" strokeLinecap="round">
                <line x1="36" y1="80" x2="30" y2="96" />
                <line x1="52" y1="82" x2="46" y2="100" />
                <line x1="68" y1="80" x2="62" y2="96" />
                <line x1="84" y1="82" x2="78" y2="98" />
              </g>
            )}
          </g>
        )}

        {/* Snowflakes */}
        {isSnow && (
          <g fill="#F8FAFC" opacity="0.95">
            <circle cx="38" cy="86" r="3.2" />
            <circle cx="58" cy="94" r="3.6" />
            <circle cx="78" cy="85" r="3.0" />
            <circle cx="48" cy="103" r="2.2" opacity="0.75" />
            <circle cx="70" cy="102" r="2.5" opacity="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
};
