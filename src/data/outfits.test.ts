import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLifestyleIndices,
  getSeasonalSnack,
  getTempTier,
  resolveGuineaPigOutfit,
} from './outfits.ts';
import { PRESET_CITIES, buildFallbackWeather, classifyAirQuality } from '../services/weatherApi.ts';

test('getTempTier classifies all 6 temperature tiers accurately', () => {
  assert.equal(getTempTier(-10), 'freezing');
  assert.equal(getTempTier(0), 'freezing');
  assert.equal(getTempTier(1), 'cold');
  assert.equal(getTempTier(9), 'cold');
  assert.equal(getTempTier(10), 'cool');
  assert.equal(getTempTier(17), 'cool');
  assert.equal(getTempTier(18), 'mild');
  assert.equal(getTempTier(24), 'mild');
  assert.equal(getTempTier(25), 'warm');
  assert.equal(getTempTier(30), 'warm');
  assert.equal(getTempTier(31), 'hot');
  assert.equal(getTempTier(40), 'hot');
});

test('resolveGuineaPigOutfit adapts across freezing snow, hot sun, rain, and night', () => {
  const freezingSnow = resolveGuineaPigOutfit(-8, 'snow', 15, true);
  assert.equal(freezingSnow.tierId, 'freezing');
  assert.equal(freezingSnow.outerwear, 'parka');
  assert.equal(freezingSnow.headwear, 'pom-beanie');
  assert.equal(freezingSnow.hasFrostBreath, true);
  assert.equal(freezingSnow.hasSnowDust, true);
  assert.equal(freezingSnow.animationMode, 'shiver');

  const hotSun = resolveGuineaPigOutfit(35, 'clear', 8, true);
  assert.equal(hotSun.tierId, 'hot');
  assert.equal(hotSun.neckwear, 'cooling-ring');
  assert.equal(hotSun.eyewear, 'sunglasses');
  assert.equal(hotSun.handheldProp, 'mini-fan');
  assert.equal(hotSun.hasSweatDrop, true);
  assert.equal(hotSun.animationMode, 'pant');

  const rainyCool = resolveGuineaPigOutfit(15, 'rain', 16, true);
  assert.equal(rainyCool.tierId, 'cool');
  assert.equal(rainyCool.rainGear, 'yellow-poncho');
  assert.equal(rainyCool.headwear, 'rain-hood');
  assert.equal(rainyCool.handheldProp, 'umbrella');
  assert.equal(rainyCool.hasPuddle, true);

  const thunderstorm = resolveGuineaPigOutfit(20, 'thunderstorm', 35, false);
  assert.equal(thunderstorm.rainGear, 'storm-slicker');
  assert.equal(thunderstorm.isWindy, true);

  const clearNight = resolveGuineaPigOutfit(19, 'clear', 6, false);
  assert.equal(clearNight.headwear, 'nightcap');
  assert.equal(clearNight.handheldProp, 'lantern');
});

test('getSeasonalSnack adapts snack to weather & temperature', () => {
  assert.equal(getSeasonalSnack(-2, 'snow').id, 'sweet-potato');
  assert.equal(getSeasonalSnack(32, 'clear').id, 'strawberry');
  assert.equal(getSeasonalSnack(15, 'rain').id, 'lettuce');
  assert.equal(getSeasonalSnack(22, 'partly-cloudy').id, 'hay');
});

test('buildLifestyleIndices reflects AQI mask advice when polluted', () => {
  const sample = buildFallbackWeather(PRESET_CITIES[0]);
  const cleanIndices = buildLifestyleIndices(sample);
  assert.equal(cleanIndices.length, 6);

  const polluted = {
    ...sample,
    airQuality: classifyAirQuality(142, 58, 95),
  };
  const pollutedIndices = buildLifestyleIndices(polluted);
  const outdoor = pollutedIndices.find((i) => i.id === 'outdoor');
  const commute = pollutedIndices.find((i) => i.id === 'commute');
  assert.equal(outdoor?.level, '戴口罩短行');
  assert.equal(commute?.level, '佩戴口罩出行');
});
