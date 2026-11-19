import type { MascotCoatId } from '../types/weather';
import { loadMascotImage } from './mascotOutfitPainter';

export type MascotSpriteKey = 'base' | 'mild' | 'cool' | 'cold';

export interface CoatMeta {
  id: MascotCoatId;
  name: string;
  swatchPrimary: string;
  swatchSecondary: string;
  targetRgb: [number, number, number];
  eyelidHex: string;
}

export const MASCOT_COATS: CoatMeta[] = [
  {
    id: 'classic',
    name: '经典棕白',
    swatchPrimary: '#C47A4C',
    swatchSecondary: '#FAF4EA',
    targetRgb: [196, 122, 76],
    eyelidHex: '#C27442',
  },
  {
    id: 'cream',
    name: '奶油团子',
    swatchPrimary: '#E0C6A2',
    swatchSecondary: '#FFFDF8',
    targetRgb: [224, 198, 162],
    eyelidHex: '#D8BD98',
  },
  {
    id: 'panda',
    name: '黑白奶牛',
    swatchPrimary: '#3E3A3E',
    swatchSecondary: '#F8FAFC',
    targetRgb: [62, 58, 62],
    eyelidHex: '#423E42',
  },
  {
    id: 'caramel',
    name: '深烘焦糖',
    swatchPrimary: '#8E3E16',
    swatchSecondary: '#FDF4E8',
    targetRgb: [148, 62, 20],
    eyelidHex: '#8E3F18',
  },
];

export function getCoatMeta(coatId: MascotCoatId): CoatMeta {
  return MASCOT_COATS.find((c) => c.id === coatId) ?? MASCOT_COATS[0];
}

const recolorCache = new Map<string, Promise<string>>();
const furMaskCache = new Map<string, Promise<Uint8Array>>();
const spritePixelsCache = new Map<string, Promise<{ width: number; height: number; data: Uint8ClampedArray }>>();

function readImagePixels(src: string): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  const existing = spritePixelsCache.get(src);
  if (existing) return existing;

  const task = (async () => {
    const img = await loadMascotImage(src);
    const w = img.naturalWidth || 560;
    const h = img.naturalHeight || 420;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unsupported');
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    return { width: w, height: h, data: imageData.data };
  })();

  spritePixelsCache.set(src, task);
  return task;
}

function median3x3Binary(src: Uint8Array, w: number, h: number): Uint8Array {
  const dst = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y;
    const y2 = y + 1 < h ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x;
      const x2 = x + 1 < w ? x + 1 : w - 1;
      const count =
        (src[y0 * w + x0] > 127 ? 1 : 0) +
        (src[y0 * w + x1] > 127 ? 1 : 0) +
        (src[y0 * w + x2] > 127 ? 1 : 0) +
        (src[y1 * w + x0] > 127 ? 1 : 0) +
        (src[y1 * w + x1] > 127 ? 1 : 0) +
        (src[y1 * w + x2] > 127 ? 1 : 0) +
        (src[y2 * w + x0] > 127 ? 1 : 0) +
        (src[y2 * w + x1] > 127 ? 1 : 0) +
        (src[y2 * w + x2] > 127 ? 1 : 0);
      dst[y * w + x] = count >= 5 ? 255 : 0;
    }
  }
  return dst;
}

function minFilter5x5(src: Uint8Array, w: number, h: number): Uint8Array {
  // Separable 1D min-filter radius 2 (equivalent to 5x5 erosion)
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    for (let x = 0; x < w; x++) {
      const xStart = x >= 2 ? x - 2 : 0;
      const xEnd = x + 2 < w ? x + 2 : w - 1;
      let m = 255;
      for (let kx = xStart; kx <= xEnd; kx++) {
        const v = src[rowOff + kx];
        if (v < m) m = v;
      }
      tmp[rowOff + x] = m;
    }
  }
  const dst = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const yStart = y >= 2 ? y - 2 : 0;
    const yEnd = y + 2 < h ? y + 2 : h - 1;
    for (let x = 0; x < w; x++) {
      let m = 255;
      for (let ky = yStart; ky <= yEnd; ky++) {
        const v = tmp[ky * w + x];
        if (v < m) m = v;
      }
      dst[y * w + x] = m;
    }
  }
  return dst;
}

function boxBlur3x3(src: Uint8Array, w: number, h: number): Uint8Array {
  const dst = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y;
    const y2 = y + 1 < h ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x;
      const x2 = x + 1 < w ? x + 1 : w - 1;
      const sum =
        src[y0 * w + x0] +
        src[y0 * w + x1] +
        src[y0 * w + x2] +
        src[y1 * w + x0] +
        src[y1 * w + x1] +
        src[y1 * w + x2] +
        src[y2 * w + x0] +
        src[y2 * w + x1] +
        src[y2 * w + x2];
      dst[y * w + x] = Math.round(sum / 9);
    }
  }
  return dst;
}

function computeBaseFurMask(baseData: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const raw = new Uint8Array(w * h);
  const scaleX = 560 / w;
  const scaleY = 420 / h;

  for (let y = 0; y < h; y++) {
    const ny = y * scaleY;
    for (let x = 0; x < w; x++) {
      const nx = x * scaleX;
      const idx = (y * w + x) * 4;
      const r = baseData[idx];
      const g = baseData[idx + 1];
      const b = baseData[idx + 2];
      const a = baseData[idx + 3];

      const warmExcess = r - b;
      const orangeRatio = (r - g) / Math.max(1, r);
      const isBrown =
        a > 60 &&
        r > 95 &&
        warmExcess > 42 &&
        orangeRatio > 0.14 &&
        orangeRatio < 0.65 &&
        b < 145;
      if (!isBrown) continue;

      const dEye1 = (nx - 140) * (nx - 140) + (ny - 224) * (ny - 224);
      const dEye2 = (nx - 232) * (nx - 232) + (ny - 229) * (ny - 229);
      const dNose = (nx - 158) * (nx - 158) + (ny - 274) * (ny - 274);
      const inEar1 = nx >= 96 && nx <= 162 && ny >= 156 && ny <= 204;
      const inEar2 = nx >= 250 && nx <= 344 && ny >= 156 && ny <= 226;

      if (dEye1 < 18 * 18 || dEye2 < 19 * 19 || dNose < 22 * 22 || inEar1 || inEar2) {
        continue;
      }
      raw[y * w + x] = 255;
    }
  }

  return boxBlur3x3(median3x3Binary(raw, w, h), w, h);
}

function getFurMask(
  spriteKey: MascotSpriteKey,
  spriteUrl: string,
  baseSpriteUrl: string
): Promise<Uint8Array> {
  const key = `${spriteKey}:${baseSpriteUrl}`;
  const existing = furMaskCache.get(key);
  if (existing) return existing;

  const task = (async () => {
    const basePx = await readImagePixels(baseSpriteUrl);
    const { width: w, height: h, data: bData } = basePx;
    const baseMaskKey = `base:${baseSpriteUrl}`;

    let baseMaskPromise = furMaskCache.get(baseMaskKey);
    if (!baseMaskPromise) {
      baseMaskPromise = Promise.resolve(computeBaseFurMask(bData, w, h));
      furMaskCache.set(baseMaskKey, baseMaskPromise);
    }
    const baseMask = await baseMaskPromise;
    if (spriteKey === 'base') {
      return baseMask;
    }

    const spPx = await readImagePixels(spriteUrl);
    const sData = spPx.data;
    const out = new Uint8Array(w * h);
    const scaleX = 560 / w;
    const scaleY = 420 / h;

    for (let y = 0; y < h; y++) {
      const ny = y * scaleY;
      for (let x = 0; x < w; x++) {
        const pIdx = y * w + x;
        const bm = baseMask[pIdx];
        if (bm === 0) continue;

        const cIdx = pIdx * 4;
        const sa = sData[cIdx + 3];
        if (sa <= 60) continue;

        const sr = sData[cIdx];
        const sg = sData[cIdx + 1];
        const sb = sData[cIdx + 2];
        const dr = sr - bData[cIdx];
        const dg = sg - bData[cIdx + 1];
        const db = sb - bData[cIdx + 2];
        if (dr * dr + dg * dg + db * db >= 32 * 32) continue;

        const nx = x * scaleX;
        if (spriteKey === 'mild') {
          if (nx >= 274 && nx <= 362 && ny >= 134 && ny <= 265 && sb > sr - 8) continue;
        } else if (spriteKey === 'cool') {
          if (ny < 164 || (nx >= 244 && ny >= 158 && sg > sr - 18)) continue;
        } else if (spriteKey === 'cold') {
          // cold.webp coat + scarf + beret cover torso & crown; keep only front face cheek fur
          if (!(nx < 216 && ny >= 170)) continue;
        }

        out[pIdx] = bm;
      }
    }

    return boxBlur3x3(minFilter5x5(out, w, h), w, h);
  })();

  furMaskCache.set(key, task);
  return task;
}

export function getRecoloredSpriteUrl(
  spriteKey: MascotSpriteKey,
  spriteUrl: string,
  baseSpriteUrl: string,
  coatId: MascotCoatId
): Promise<string> {
  if (coatId === 'classic' || typeof document === 'undefined') {
    return Promise.resolve(spriteUrl);
  }

  const cacheKey = `${spriteKey}:${coatId}`;
  const cached = recolorCache.get(cacheKey);
  if (cached) return cached;

  const coat = getCoatMeta(coatId);
  const task = (async () => {
    try {
      const [spPx, mask] = await Promise.all([
        readImagePixels(spriteUrl),
        getFurMask(spriteKey, spriteUrl, baseSpriteUrl),
      ]);

      const { width: w, height: h, data: src } = spPx;
      const outCanvas = document.createElement('canvas');
      outCanvas.width = w;
      outCanvas.height = h;
      const outCtx = outCanvas.getContext('2d');
      if (!outCtx) return spriteUrl;

      const outImg = outCtx.createImageData(w, h);
      const px = outImg.data;
      px.set(src);

      const [tr, tg, tb] = coat.targetRgb;
      const total = w * h;

      for (let p = 0; p < total; p++) {
        const maskVal = mask[p] / 255;
        const i = p * 4;
        if (maskVal <= 0.02 || px[i + 3] === 0) continue;

        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        const luma = Math.max(0.52, Math.min(1.38, (0.299 * r + 0.587 * g + 0.114 * b) / 138));

        const nr = Math.min(255, Math.max(0, tr * luma));
        const ng = Math.min(255, Math.max(0, tg * luma));
        const nb = Math.min(255, Math.max(0, tb * luma));

        px[i] = Math.round(r * (1 - maskVal) + nr * maskVal);
        px[i + 1] = Math.round(g * (1 - maskVal) + ng * maskVal);
        px[i + 2] = Math.round(b * (1 - maskVal) + nb * maskVal);
      }

      outCtx.putImageData(outImg, 0, 0);
      const webp = outCanvas.toDataURL('image/webp', 0.9);
      return webp.startsWith('data:image/webp') ? webp : outCanvas.toDataURL('image/png');
    } catch {
      return spriteUrl;
    }
  })();

  recolorCache.set(cacheKey, task);
  return task;
}
