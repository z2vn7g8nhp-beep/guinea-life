import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRESET_CITIES,
  buildFallbackWeather,
  deriveTimeOfDay,
  mapWmoCodeToCondition,
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

test('buildFallbackWeather generates complete 12-hour and 7-day schedules', () => {
  const weather = buildFallbackWeather(PRESET_CITIES[0]);
  assert.equal(weather.hourly.length, 12);
  assert.equal(weather.daily.length, 7);
  assert.equal(weather.isOfflineFallback, true);
});
