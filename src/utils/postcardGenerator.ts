import type { GuineaPigOutfit, MascotCoatId, TimeOfDay, WeatherCondition, WeatherSnapshot } from '../types/weather';
import { resolveMascotVisual } from '../components/mascot/GuineaPigMascot';
import { getRecoloredSpriteUrl } from './mascotCoat';
import { formatTemp, type TempUnit } from './tempUnit';

function resolveSkyKey(condition: WeatherCondition, timeOfDay: TimeOfDay): string {
  if (condition === 'thunderstorm') return 'thunderstorm';
  if (condition === 'rain' || condition === 'heavy-rain' || condition === 'drizzle') return 'rain-day';
  if (condition === 'snow' || condition === 'blizzard') return 'snow-day';
  if (condition === 'fog') return 'fog-day';
  if (timeOfDay === 'sunset' || timeOfDay === 'dawn') return 'sunset';
  if (timeOfDay === 'night') return 'clear-night';
  if (condition === 'overcast') return 'overcast-day';
  if (condition === 'partly-cloudy' || condition === 'windy') return 'partly-cloudy-day';
  return 'clear-day';
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src.slice(0, 64)}`));
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateWeatherPostcard(params: {
  weather: WeatherSnapshot;
  outfit: GuineaPigOutfit;
  coatId: MascotCoatId;
  customName: string;
  unit: TempUnit;
  localTimeStr: string;
  aqiNeedsMask: boolean;
  baseUrl: string;
}): Promise<string> {
  const { weather, outfit, coatId, customName, unit, localTimeStr, aqiNeedsMask, baseUrl } = params;
  const W = 1080;
  const H = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');

  const skyKey = resolveSkyKey(weather.condition, weather.timeOfDay);
  const skyImg = await loadImg(`${baseUrl}assets/weather/${skyKey}.webp`);

  // Cover draw sky
  const scale = Math.max(W / skyImg.naturalWidth, H / skyImg.naturalHeight);
  const dw = skyImg.naturalWidth * scale;
  const dh = skyImg.naturalHeight * scale;
  ctx.drawImage(skyImg, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // Editorial contrast scrim
  const scrim = ctx.createLinearGradient(0, 0, 0, H);
  scrim.addColorStop(0, 'rgba(8, 16, 32, 0.48)');
  scrim.addColorStop(0.32, 'rgba(8, 16, 32, 0.08)');
  scrim.addColorStop(0.68, 'rgba(8, 16, 32, 0.2)');
  scrim.addColorStop(1, 'rgba(8, 16, 32, 0.62)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  // Header brand + city + local time
  const fontStack = "'PingFang SC', 'HarmonyOS Sans SC', 'Noto Sans SC', -apple-system, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.font = `500 28px ${fontStack}`;
  ctx.fillText('豚鼠生活馆 · GUINEALIFE', W / 2, 148);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 66px ${fontStack}`;
  ctx.fillText(weather.city.name, W / 2, 232);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = `400 34px ${fontStack}`;
  const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  ctx.fillText(`${todayStr}  ${localTimeStr}`, W / 2, 288);

  // Hero card geometry
  const cardX = 84;
  const cardY = 1090;
  const cardW = W - 168;
  const cardH = 620;

  // Draw perched guinea pig resting right on top of the card
  const { spriteKey, garmentVariant } = resolveMascotVisual(outfit, weather.condition);
  const rawSpriteUrl = `${baseUrl}assets/mascot/${spriteKey}.webp`;
  const baseSpriteUrl = `${baseUrl}assets/mascot/base.webp`;
  const spriteUrl = await getRecoloredSpriteUrl(
    spriteKey,
    rawSpriteUrl,
    baseSpriteUrl,
    coatId,
    garmentVariant
  );
  const spriteImg = await loadImg(spriteUrl);

  const mascotW = 660;
  const mascotH = 495;
  const mascotX = (W - mascotW) / 2;
  const mascotY = cardY - mascotH + 62;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(spriteImg, mascotX, mascotY, mascotW, mascotH);
  ctx.restore();

  // Draw refined storybook AQI mask details if active
  if (aqiNeedsMask) {
    const sx = mascotX;
    const sy = mascotY;
    const k = mascotW / 560;
    ctx.save();
    ctx.strokeStyle = 'rgba(248, 240, 228, 0.84)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + 134 * k, sy + 265 * k);
    ctx.quadraticCurveTo(sx + 111 * k, sy + 241 * k, sx + 121 * k, sy + 202 * k);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 186 * k, sy + 270 * k);
    ctx.quadraticCurveTo(sx + 226 * k, sy + 276 * k, sx + 254 * k, sy + 226 * k);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx + 133 * k, sy + 268 * k);
    ctx.quadraticCurveTo(sx + 133 * k, sy + 259 * k, sx + 142 * k, sy + 257 * k);
    ctx.quadraticCurveTo(sx + 161 * k, sy + 254 * k, sx + 179 * k, sy + 261 * k);
    ctx.quadraticCurveTo(sx + 188 * k, sy + 264 * k, sx + 186 * k, sy + 273 * k);
    ctx.lineTo(sx + 181 * k, sy + 296 * k);
    ctx.quadraticCurveTo(sx + 160 * k, sy + 302 * k, sx + 137 * k, sy + 294 * k);
    ctx.closePath();
    const maskGrad = ctx.createLinearGradient(sx + 133 * k, sy + 255 * k, sx + 186 * k, sy + 300 * k);
    maskGrad.addColorStop(0, '#E6F5FC');
    maskGrad.addColorStop(1, '#C7E6F4');
    ctx.fillStyle = maskGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#7C6456';
    ctx.stroke();
    ctx.restore();
  }

  // Translucent dark weather card
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 52);
  ctx.fillStyle = 'rgba(10, 16, 32, 0.68)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.stroke();
  ctx.restore();

  // Weather stats inside card
  const mainTemp = formatTemp(weather.temperature, unit);
  const today = weather.daily[0];
  const highTemp = today ? formatTemp(today.tempMax, unit) : mainTemp;
  const lowTemp = today ? formatTemp(today.tempMin, unit) : mainTemp;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `200 206px ${fontStack}`;
  ctx.fillText(`${mainTemp}`, cardX + 64, cardY + 236);
  const numW = ctx.measureText(`${mainTemp}`).width;
  ctx.font = `300 66px ${fontStack}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.fillText(`°${unit}`, cardX + 74 + numW, cardY + 126);

  ctx.font = `400 48px ${fontStack}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(weather.conditionLabel, cardX + 68, cardY + 324);

  ctx.font = `400 32px ${fontStack}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.84)';
  ctx.fillText(
    `体感 ${formatTemp(weather.apparentTemperature, unit)}°   ↑ ${highTemp}°  ↓ ${lowTemp}°${
      weather.airQuality ? `   AQI ${weather.airQuality.aqi}` : ''
    }`,
    cardX + 68,
    cardY + 388
  );

  // Divider & quote
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 64, cardY + 432);
  ctx.lineTo(cardX + cardW - 64, cardY + 432);
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.font = `500 32px ${fontStack}`;
  ctx.fillText(`穿搭 · ${outfit.outfitTitle}`, cardX + 68, cardY + 492);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.font = `400 28px ${fontStack}`;
  const quote = `${customName}：${outfit.reactionQuotes[0] ?? '祝你今天也有好天气～'}`;
  ctx.fillText(quote.slice(0, 29), cardX + 68, cardY + 550);

  // Subtle footer watermark
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.56)';
  ctx.font = `400 24px ${fontStack}`;
  ctx.fillText('z2vn7g8nhp-beep.github.io/guinea-life', W / 2, H - 88);

  return canvas.toDataURL('image/png');
}
