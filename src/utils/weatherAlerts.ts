import type { WeatherCondition, WeatherSnapshot } from '../types/weather';

export interface WeatherAlert {
  id: string;
  tone: 'amber' | 'sky' | 'rose';
  message: string;
}

function isRainy(cond: WeatherCondition): boolean {
  return (
    cond === 'drizzle' ||
    cond === 'rain' ||
    cond === 'heavy-rain' ||
    cond === 'thunderstorm'
  );
}

function isSnowy(cond: WeatherCondition): boolean {
  return cond === 'snow' || cond === 'blizzard';
}

export function buildWeatherAlert(weather: WeatherSnapshot): WeatherAlert | null {
  const nextHours = weather.hourly.slice(1, 7);

  if (weather.condition === 'thunderstorm' || weather.condition === 'heavy-rain') {
    return {
      id: 'storm-now',
      tone: 'rose',
      message:
        weather.condition === 'thunderstorm'
          ? '当前雷阵雨较强，尽量减少外出并注意避雷防风'
          : '当前雨势较大，出门记得穿防水鞋并留足通勤时间',
    };
  }

  const stormHourIdx = nextHours.findIndex(
    (h) => h.condition === 'thunderstorm' || h.condition === 'heavy-rain'
  );
  if (stormHourIdx >= 0) {
    return {
      id: 'storm-soon',
      tone: 'amber',
      message: `约 ${stormHourIdx + 1} 小时后可能有强降水，记得提前避雨`,
    };
  }

  if (!isRainy(weather.condition) && !isSnowy(weather.condition)) {
    const precipIdx = nextHours.findIndex(
      (h) => h.precipitationProb >= 55 || isRainy(h.condition) || isSnowy(h.condition)
    );
    if (precipIdx >= 0) {
      const target = nextHours[precipIdx];
      const willSnow = isSnowy(target.condition);
      return {
        id: 'precip-soon',
        tone: 'sky',
        message: willSnow
          ? `约 ${precipIdx + 1} 小时后可能转雪，记得添衣防滑`
          : `约 ${precipIdx + 1} 小时后可能转雨，豚鼠提醒出门带伞`,
      };
    }
  }

  if (weather.airQuality?.needsMask) {
    return {
      id: 'aqi-mask',
      tone: 'amber',
      message: `空气${weather.airQuality.level}（AQI ${weather.airQuality.aqi}），豚鼠已戴上小口罩`,
    };
  }

  if (nextHours.length > 0) {
    const minUpcoming = Math.min(...nextHours.map((h) => h.temperature));
    const drop = Math.round(weather.temperature - minUpcoming);
    if (drop >= 6) {
      return {
        id: 'temp-drop',
        tone: 'sky',
        message: `未来几小时降温约 ${drop}°，晚归记得多备一件外套`,
      };
    }
  }

  if (weather.windSpeed >= 32) {
    return {
      id: 'high-wind',
      tone: 'sky',
      message: `阵风 ${weather.windSpeed} km/h，外出注意防风与高空坠物`,
    };
  }

  if (weather.isDay && weather.uvIndex >= 7) {
    return {
      id: 'high-uv',
      tone: 'amber',
      message: `紫外线强度 ${weather.uvIndex}，外出记得涂防晒并戴遮阳帽`,
    };
  }

  return null;
}
