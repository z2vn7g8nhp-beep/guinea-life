import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRESET_CITIES,
  buildFallbackWeather,
  cityCoordKey,
  classifyAirQuality,
  deriveTimeOfDay,
  formatLocalYmd,
  isValidIanaTimeZone,
  mapWmoCodeToCondition,
  normalizeChineseCityName,
} from './weatherApi.ts';

test('mapWmoCodeToCondition maps WMO codes and high-wind overrides', () => {
  assert.equal(mapWmoCodeToCondition(0, 10), 'clear');
  assert.equal(mapWmoCodeToCondition(0, 38), 'windy');
  assert.equal(mapWmoCodeToCondition(3, 12), 'overcast');
  assert.equal(mapWmoCodeToCondition(45, 5), 'fog');
  assert.equal(mapWmoCodeToCondition(53, 8), 'drizzle');
  assert.equal(mapWmoCodeToCondition(63, 18), 'rain');
  assert.equal(mapWmoCodeToCondition(65, 22), 'heavy-rain');
  assert.equal(mapWmoCodeToCondition(73, 15), 'snow');
  assert.equal(mapWmoCodeToCondition(75, 35), 'blizzard');
  assert.equal(mapWmoCodeToCondition(95, 40), 'thunderstorm');
});

test('deriveTimeOfDay distinguishes dawn, day, sunset, and night', () => {
  const sunrise = '2026-11-19T06:30';
  const sunset = '2026-11-19T17:30';
  assert.equal(deriveTimeOfDay('2026-11-19T06:45', sunrise, sunset, true), 'dawn');
  assert.equal(deriveTimeOfDay('2026-11-19T12:15', sunrise, sunset, true), 'day');
  assert.equal(deriveTimeOfDay('2026-11-19T17:10', sunrise, sunset, true), 'sunset');
  assert.equal(deriveTimeOfDay('2026-11-19T22:00', sunrise, sunset, false), 'night');
});

test('buildFallbackWeather generates complete 24-hour, 7-day, and AQI schedules', () => {
  const weather = buildFallbackWeather(PRESET_CITIES[0]);
  assert.equal(weather.hourly.length, 24);
  assert.equal(weather.daily.length, 7);
  assert.equal(weather.isOfflineFallback, true);
  assert.ok(weather.airQuality);
  assert.equal(weather.daily[0].date, formatLocalYmd(new Date()));
});

test('classifyAirQuality sets needsMask at AQI >= 101', () => {
  const good = classifyAirQuality(38, 12, 24);
  assert.equal(good.level, '优');
  assert.equal(good.needsMask, false);

  const moderate = classifyAirQuality(88, 32, 55);
  assert.equal(moderate.level, '良');
  assert.equal(moderate.needsMask, false);

  const unhealthy = classifyAirQuality(128, 48, 86);
  assert.equal(unhealthy.level, '轻度污染');
  assert.equal(unhealthy.needsMask, true);
});

test('normalizeChineseCityName and cityCoordKey behave deterministically', () => {
  assert.equal(normalizeChineseCityName('郑州市'), '郑州');
  assert.equal(normalizeChineseCityName('上海市 '), '上海');
  assert.equal(normalizeChineseCityName('津市'), '津市');
  assert.equal(normalizeChineseCityName('London'), 'London');
  assert.equal(cityCoordKey(PRESET_CITIES[0]), '31.23,121.47');
});

test('isValidIanaTimeZone validates IANA identifiers and rejects auto/invalid', () => {
  assert.equal(isValidIanaTimeZone('Asia/Shanghai'), true);
  assert.equal(isValidIanaTimeZone('Europe/London'), true);
  assert.equal(isValidIanaTimeZone('auto'), false);
  assert.equal(isValidIanaTimeZone(''), false);
  assert.equal(isValidIanaTimeZone(undefined), false);
  assert.equal(isValidIanaTimeZone('Invalid/Place_XYZ'), false);
});
