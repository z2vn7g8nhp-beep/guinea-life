import type { TimeOfDay, WeatherCondition } from '../types/weather';

export interface WeatherTheme {
  themeColor: string;
  heroBgClass: string;
  cardBgClass: string;
}

export function getWeatherTheme(condition: WeatherCondition, timeOfDay: TimeOfDay): WeatherTheme {
  if (timeOfDay === 'night') {
    return {
      themeColor: '#091124',
      heroBgClass: 'bg-slate-950/60 border-indigo-200/16',
      cardBgClass: 'bg-slate-950/54 border-indigo-200/14',
    };
  }

  if (timeOfDay === 'sunset' || timeOfDay === 'dawn') {
    return {
      themeColor: timeOfDay === 'sunset' ? '#3f3254' : '#35486b',
      heroBgClass: 'bg-slate-950/56 border-amber-100/18',
      cardBgClass: 'bg-slate-950/50 border-amber-100/14',
    };
  }

  if (condition === 'thunderstorm' || condition === 'heavy-rain' || condition === 'rain') {
    return {
      themeColor: '#1f334a',
      heroBgClass: 'bg-slate-950/60 border-sky-100/16',
      cardBgClass: 'bg-slate-950/54 border-sky-100/14',
    };
  }

  if (condition === 'snow' || condition === 'blizzard' || condition === 'fog' || condition === 'overcast') {
    return {
      themeColor: '#354b63',
      heroBgClass: 'bg-slate-950/62 border-white/20',
      cardBgClass: 'bg-slate-950/56 border-white/16',
    };
  }

  return {
    themeColor: '#17548e',
    heroBgClass: 'bg-slate-950/54 border-white/18',
    cardBgClass: 'bg-slate-950/48 border-white/14',
  };
}
