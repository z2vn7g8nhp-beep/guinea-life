import React, { useId } from 'react';
import type { WeatherCondition } from '../../types/weather';

interface WeatherConditionIconProps {
  condition: WeatherCondition;
  isDay?: boolean;
  className?: string;
}

export const WeatherConditionIcon: React.FC<WeatherConditionIconProps> = ({
  condition,
  isDay = true,
  className = 'h-5 w-5',
}) => {
  const uid = useId().replace(/:/g, '');
  const sunId = `ciSun-${uid}`;
  const cloudId = `ciCloud-${uid}`;
  const stormId = `ciStorm-${uid}`;

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
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={sunId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="55%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <linearGradient id={cloudId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#B8CCE4" />
        </linearGradient>
        <linearGradient id={stormId} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>

      {showSun && (
        <g
          transform={
            condition === 'clear' ? 'translate(14, 14) scale(1.12)' : 'translate(18, 10) scale(0.84)'
          }
        >
          <circle cx="0" cy="0" r="8.5" fill="rgba(253, 224, 71, 0.28)" />
          <circle cx="0" cy="0" r="5.6" fill={`url(#${sunId})`} />
        </g>
      )}

      {showMoon && (
        <g
          transform={
            condition === 'clear' ? 'translate(14, 14) scale(1.06)' : 'translate(18, 10) scale(0.82)'
          }
        >
          <path
            d="M 1.5 -5.8 A 6 6 0 1 0 6.2 2.4 A 4.8 4.8 0 1 1 1.5 -5.8 Z"
            fill="#E0EEFF"
          />
          <circle cx="4.8" cy="-4.2" r="0.9" fill="#FEF9C3" />
        </g>
      )}

      {showCloud && (
        <path
          d="M 7.2 19.2 C 4.6 19.2, 3.8 15.8, 6.2 14.3 C 6.4 10.9, 9.8 9.2, 12.8 10.6 C 15 8.4, 19.8 9.8, 20.1 13.7 C 22.8 14.2, 23 19.2, 19.8 19.2 Z"
          transform={showSun || showMoon ? 'translate(0, 2)' : 'translate(1, -1)'}
          fill={isStorm || condition === 'rain' ? `url(#${stormId})` : `url(#${cloudId})`}
        />
      )}

      {isRainy && condition !== 'thunderstorm' && (
        <g fill="#7DD3FC">
          <path d="M 9.6 20.4 C 8.7 21.8, 8.7 23.1, 9.6 23.1 C 10.5 23.1, 10.5 21.8, 9.6 20.4 Z" />
          <path d="M 14.2 21.4 C 13.3 22.8, 13.3 24.1, 14.2 24.1 C 15.1 24.1, 15.1 22.8, 14.2 21.4 Z" />
          <path d="M 18.8 20.4 C 17.9 21.8, 17.9 23.1, 18.8 23.1 C 19.7 23.1, 19.7 21.8, 18.8 20.4 Z" />
        </g>
      )}

      {condition === 'thunderstorm' && (
        <polygon points="15,17 11.8,21.5 14.2,21.5 12.8,25.5 17.6,20.2 15.1,20.2" fill="#FDE047" />
      )}

      {isSnow && (
        <g stroke="#F0F9FF" strokeWidth="1.25" strokeLinecap="round">
          {[10, 15, 20].map((sx, idx) => (
            <g key={sx} transform={`translate(${sx}, ${idx === 1 ? 22.6 : 21.2})`}>
              <line x1="0" y1="-1.8" x2="0" y2="1.8" />
              <line x1="-1.5" y1="-0.9" x2="1.5" y2="0.9" />
              <line x1="-1.5" y1="0.9" x2="1.5" y2="-0.9" />
            </g>
          ))}
        </g>
      )}

      {isFog && (
        <g stroke="rgba(226, 232, 240, 0.85)" strokeWidth="1.6" strokeLinecap="round">
          <line x1="6" y1="21.2" x2="21.5" y2="21.2" />
          <line x1="8.5" y1="24" x2="19.5" y2="24" />
        </g>
      )}

      {isWindy && (
        <g fill="none" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round">
          <path d="M 5 21 H 18.5 C 20.4 21, 21 19, 19.2 18.4" />
          <path d="M 8 24 H 21.5 C 23.2 24, 23.5 25.6, 21.8 25.8" opacity="0.8" />
        </g>
      )}
    </svg>
  );
};
