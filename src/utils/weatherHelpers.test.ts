import assert from 'node:assert/strict';
import test from 'node:test';
import { PRESET_CITIES, buildFallbackWeather, classifyAirQuality } from '../services/weatherApi.ts';
import type { CityLocation } from '../types/weather.ts';
import { moveCity, upsertPrimaryLocatedCity } from './cityList.ts';
import { formatTemp } from './tempUnit.ts';
import { buildWeatherAlert } from './weatherAlerts.ts';
import { getWeatherTheme } from './weatherTheme.ts';

test('formatTemp converts Celsius and Fahrenheit accurately', () => {
  assert.equal(formatTemp(0, 'C'), 0);
  assert.equal(formatTemp(0, 'F'), 32);
  assert.equal(formatTemp(25, 'F'), 77);
});

test('upsertPrimaryLocatedCity preserves custom non-preset city in slot 0', () => {
  const customCity: CityLocation = {
    name: '大理',
    region: '云南',
    country: '中国',
    latitude: 25.6065,
    longitude: 100.2679,
  };
  const locatedCity: CityLocation = {
    name: '杭州',
    region: '浙江',
    country: '中国',
    latitude: 30.2741,
    longitude: 120.1551,
  };

  // Custom slot 0 is preserved right after newly located slot 0
  const updated = upsertPrimaryLocatedCity([customCity, PRESET_CITIES[0]], locatedCity, null);
  assert.equal(updated[0].name, '杭州');
  assert.equal(updated[1].name, '大理');
  assert.equal(updated[2].name, '上海');

  // Previously auto-located slot 0 is cleanly replaced when location changes
  const nextLoc: CityLocation = {
    name: '宁波',
    region: '浙江',
    country: '中国',
    latitude: 29.8683,
    longitude: 121.544,
  };
  const replaced = upsertPrimaryLocatedCity(updated, nextLoc, '杭州');
  assert.equal(replaced[0].name, '宁波');
  assert.equal(replaced[1].name, '大理');
  assert.equal(replaced.some((c) => c.name === '杭州'), false);
});

test('moveCity reorders safely within bounds', () => {
  const list = [PRESET_CITIES[0], PRESET_CITIES[1], PRESET_CITIES[2]];
  const moved = moveCity(list, 2, 0);
  assert.deepEqual(
    moved.map((c) => c.name),
    ['深圳', '上海', '北京']
  );
  assert.equal(moveCity(list, -1, 1), list);
});

test('buildWeatherAlert detects upcoming rain, AQI mask, temp drop, and returns null when calm', () => {
  const calm = buildFallbackWeather({
    name: '昆明',
    latitude: 25.0,
    longitude: 102.7,
  });
  calm.condition = 'clear';
  calm.windSpeed = 8;
  calm.uvIndex = 3;
  calm.airQuality = classifyAirQuality(35, 10, 18);
  calm.hourly = calm.hourly.map((h) => ({
    ...h,
    condition: 'clear',
    precipitationProb: 5,
    temperature: 20,
  }));
  calm.temperature = 20;
  assert.equal(buildWeatherAlert(calm), null);

  // Upcoming rain in +2h
  const rainSoon = {
    ...calm,
    hourly: calm.hourly.map((h, i) => (i === 2 ? { ...h, condition: 'rain' as const, precipitationProb: 75 } : h)),
  };
  assert.equal(buildWeatherAlert(rainSoon)?.id, 'precip-soon');

  // AQI mask alert
  const hazy = {
    ...calm,
    airQuality: classifyAirQuality(135, 52, 90),
  };
  assert.equal(buildWeatherAlert(hazy)?.id, 'aqi-mask');

  // Steep temp drop
  const dropping = {
    ...calm,
    temperature: 22,
    hourly: calm.hourly.map((h, i) => (i === 4 ? { ...h, temperature: 14 } : h)),
  };
  assert.equal(buildWeatherAlert(dropping)?.id, 'temp-drop');
});

test('getWeatherTheme picks adaptive themeColor per condition and timeOfDay', () => {
  assert.equal(getWeatherTheme('clear', 'night').themeColor, '#091124');
  assert.equal(getWeatherTheme('clear', 'day').themeColor, '#17548e');
  assert.equal(getWeatherTheme('snow', 'day').themeColor, '#354b63');
  assert.equal(getWeatherTheme('thunderstorm', 'day').themeColor, '#1f334a');
});
