import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLifestyleIndices, getTempTier, resolveGuineaPigOutfit } from './outfits.ts';
import { buildFallbackWeather, PRESET_CITIES } from '../services/weatherApi.ts';

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

test('resolveGuineaPigOutfit outfits adapt to freezing snow vs scorching sun vs rain', () => {
  const freezingSnow = resolveGuineaPigOutfit(-8, 'snow', 15, true);
  assert.equal(freezingSnow.tierId, 'freezing');
  assert.equal(freezingSnow.outerwear, 'parka');
  assert.equal(freezingSnow.headwear, 'pom-beanie');
  assert.equal(freezingSnow.footwear, 'snow-boots');
  assert.equal(freezingSnow.hasFrostBreath, true);
  assert.equal(freezingSnow.hasSnowDust, true);
  assert.equal(freezingSnow.animationMode, 'shiver');

  const hotSun = resolveGuineaPigOutfit(35, 'clear', 8, true);
  assert.equal(hotSun.tierId, 'hot');
  assert.equal(hotSun.outerwear, 'cooling-tank');
  assert.equal(hotSun.neckwear, 'cooling-ring');
  assert.equal(hotSun.eyewear, 'sunglasses');
  assert.equal(hotSun.handheldProp, 'mini-fan');
  assert.equal(hotSun.hasSweatDrop, true);
  assert.equal(hotSun.animationMode, 'pant');

  const rainyCool = resolveGuineaPigOutfit(15, 'rain', 16, true);
  assert.equal(rainyCool.tierId, 'cool');
  assert.equal(rainyCool.rainGear, 'yellow-poncho');
  assert.equal(rainyCool.headwear, 'rain-hood');
  assert.equal(rainyCool.footwear, 'rain-boots');
  assert.equal(rainyCool.handheldProp, 'umbrella');
  assert.equal(rainyCool.hasPuddle, true);

  const thunderstorm = resolveGuineaPigOutfit(20, 'thunderstorm', 35, false);
  assert.equal(thunderstorm.rainGear, 'storm-slicker');
  assert.equal(thunderstorm.isWindy, true);
});

test('buildLifestyleIndices produces 6 actionable daily indices', () => {
  const sample = buildFallbackWeather(PRESET_CITIES[0]);
  const indices = buildLifestyleIndices(sample);
  assert.equal(indices.length, 6);
  for (const item of indices) {
    assert.ok(item.score >= 0 && item.score <= 100);
    assert.ok(item.title.length > 0 && item.summary.length > 0);
  }
});
