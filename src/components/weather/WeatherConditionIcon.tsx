import React from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  Wind,
} from 'lucide-react';
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
  switch (condition) {
    case 'clear':
      return isDay ? (
        <Sun className={`${className} text-amber-300`} />
      ) : (
        <Moon className={`${className} text-indigo-200`} />
      );
    case 'partly-cloudy':
      return isDay ? (
        <CloudSun className={`${className} text-amber-200`} />
      ) : (
        <Cloud className={`${className} text-slate-200`} />
      );
    case 'overcast':
      return <Cloud className={`${className} text-slate-300`} />;
    case 'fog':
      return <CloudFog className={`${className} text-slate-200`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-300`} />;
    case 'rain':
    case 'heavy-rain':
      return <CloudRain className={`${className} text-sky-300`} />;
    case 'thunderstorm':
      return <CloudLightning className={`${className} text-violet-300`} />;
    case 'snow':
      return <CloudSnow className={`${className} text-cyan-100`} />;
    case 'blizzard':
      return <Snowflake className={`${className} text-cyan-200`} />;
    case 'windy':
      return <Wind className={`${className} text-teal-200`} />;
    default:
      return <Sun className={`${className} text-amber-300`} />;
  }
};
