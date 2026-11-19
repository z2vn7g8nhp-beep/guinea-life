import type { MascotCoatId } from '../types/weather';

export type MascotSpriteKey = 'base' | 'mild' | 'cool' | 'cold';

export type GarmentVariantId =
  | 'default'
  | 'pine-winter'
  | 'navy-winter'
  | 'honey-rain'
  | 'storm-rain'
  | 'sky-denim';

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
    targetRgb: [226, 200, 164],
    eyelidHex: '#D8BD98',
  },
  {
    id: 'panda',
    name: '黑白奶牛',
    swatchPrimary: '#3E3A3E',
    swatchSecondary: '#F8FAFC',
    targetRgb: [56, 54, 60],
    eyelidHex: '#3E3A3F',
  },
  {
    id: 'caramel',
    name: '深烘焦糖',
    swatchPrimary: '#8E3E16',
    swatchSecondary: '#FDF4E8',
    targetRgb: [150, 64, 22],
    eyelidHex: '#8E3F18',
  },
];

export function getCoatMeta(coatId: MascotCoatId): CoatMeta {
  return MASCOT_COATS.find((c) => c.id === coatId) ?? MASCOT_COATS[0];
}

const GARMENT_TARGET_RGB: Record<Exclude<GarmentVariantId, 'default'>, [number, number, number]> = {
  'pine-winter': [92, 122, 88],
  'navy-winter': [68, 92, 128],
  'honey-rain': [224, 178, 72],
  'storm-rain': [56, 88, 114],
  'sky-denim': [116, 168, 206],
};

interface SpriteMaskPair {
  furMask: Uint8Array;
  garmentMask: Uint8Array;
}

const recolorCache = new Map<string, Promise<string>>();
const maskCache = new Map<string, Promise<SpriteMaskPair>>();
const spritePixelsCache = new Map<
  string,
  Promise<{ width: number; height: number; data: Uint8ClampedArray }>
>();

function shouldUseCors(src: string): boolean {
  if (typeof window === 'undefined') return false;
  return src.startsWith('http') && !src.startsWith(window.location.origin);
}

export function loadMascotImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (shouldUseCors(src)) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 64)}`));
    img.src = src;
  });
}

function readImagePixels(
  src: string
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
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

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function ellipseGuard(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  const d = Math.sqrt(dx * dx + dy * dy);
  return smoothstep(0.75, 1.15, d);
}

function boxBlur3x3U8(src: Float32Array, w: number, h: number): Uint8Array {
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
      dst[y * w + x] = Math.min(255, Math.max(0, Math.round((sum / 9) * 255)));
    }
  }
  return dst;
}

function computeBaseWeightMap(baseData: Uint8ClampedArray, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const scaleX = 560 / w;
  const scaleY = 420 / h;

  for (let y = 0; y < h; y++) {
    const ny = y * scaleY;
    for (let x = 0; x < w; x++) {
      const nx = x * scaleX;
      const i = (y * w + x) * 4;
      const a = baseData[i + 3];
      if (a <= 35) continue;

      const r = baseData[i];
      const g = baseData[i + 1];
      const b = baseData[i + 2];

      const warm = r - b;
      const oRatio = (r - g) / Math.max(1, warm);

      const wWarm = smoothstep(26, 76, warm);
      if (wWarm <= 0) continue;

      const wHue = smoothstep(0.45, 0.55, oRatio) * (1 - smoothstep(0.73, 0.82, oRatio));
      const wBright = smoothstep(80, 122, r) * (1 - smoothstep(145, 192, b));
      const wAlpha = smoothstep(35, 160, a);

      let wgt = wWarm * wHue * wBright * wAlpha;
      if (wgt <= 0.004) continue;

      // Tight inside-iris eye guards (zero halo!) + blush cheeks + snout + 3 paw clusters
      wgt *= ellipseGuard(nx, ny, 136.5, 226.0, 7.5, 10.5);
      wgt *= ellipseGuard(nx, ny, 229.5, 235.5, 7.0, 10.5);
      wgt *= ellipseGuard(nx, ny, 116.0, 266.0, 20.0, 15.0);
      wgt *= ellipseGuard(nx, ny, 208.0, 268.0, 16.0, 13.0);
      wgt *= ellipseGuard(nx, ny, 158.0, 274.0, 15.0, 15.0);
      wgt *= ellipseGuard(nx, ny, 158.0, 385.0, 26.0, 13.0);
      wgt *= ellipseGuard(nx, ny, 252.0, 390.0, 26.0, 13.0);
      wgt *= ellipseGuard(nx, ny, 418.0, 384.0, 34.0, 14.0);

      out[y * w + x] = wgt;
    }
  }

  return out;
}

const baseWeightCache = new Map<string, Promise<Float32Array>>();

function getBaseWeights(baseSpriteUrl: string): Promise<Float32Array> {
  const existing = baseWeightCache.get(baseSpriteUrl);
  if (existing) return existing;
  const task = readImagePixels(baseSpriteUrl).then((px) =>
    computeBaseWeightMap(px.data, px.width, px.height)
  );
  baseWeightCache.set(baseSpriteUrl, task);
  return task;
}

function getSpriteMasks(
  spriteKey: MascotSpriteKey,
  spriteUrl: string,
  baseSpriteUrl: string
): Promise<SpriteMaskPair> {
  const key = `${spriteKey}:${baseSpriteUrl}`;
  const existing = maskCache.get(key);
  if (existing) return existing;

  const task = (async () => {
    const [basePx, baseWeights] = await Promise.all([
      readImagePixels(baseSpriteUrl),
      getBaseWeights(baseSpriteUrl),
    ]);
    const { width: w, height: h, data: bData } = basePx;
    const scaleX = 560 / w;
    const scaleY = 420 / h;

    if (spriteKey === 'base') {
      return {
        furMask: boxBlur3x3U8(baseWeights, w, h),
        garmentMask: new Uint8Array(w * h),
      };
    }

    const spPx = await readImagePixels(spriteUrl);
    const sData = spPx.data;
    const rawFur = new Float32Array(w * h);
    const rawGarm = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      const ny = y * scaleY;
      for (let x = 0; x < w; x++) {
        const pIdx = y * w + x;
        const cIdx = pIdx * 4;
        const sa = sData[cIdx + 3];
        if (sa <= 35) continue;

        const nx = x * scaleX;
        const sr = sData[cIdx];
        const sg = sData[cIdx + 1];
        const sb = sData[cIdx + 2];

        const dr = sr - bData[cIdx];
        const dg = sg - bData[cIdx + 1];
        const db = sb - bData[cIdx + 2];
        const diff = Math.sqrt(dr * dr + dg * dg + db * db);
        const sWarm = sr - sb;
        const sOr = (sr - sg) / Math.max(1, sWarm);
        const wAlpha = smoothstep(35, 160, sa);

        // 1. Fur weight
        const bw = baseWeights[pIdx];
        if (bw > 0.004) {
          let fw = bw * wAlpha;
          if (spriteKey === 'cold') {
            const wSame = 1 - smoothstep(13, 23, diff);
            const wFurHue = smoothstep(0.565, 0.605, sOr);
            const gPotato = ellipseGuard(nx, ny, 135, 362, 68, 44);
            fw *= wSame * wFurHue * gPotato;
          } else {
            const wSame = 1 - smoothstep(16, 42, diff);
            fw *= wSame;
            if (spriteKey === 'mild') {
              if (nx >= 274 && nx <= 362 && ny >= 134 && ny <= 265 && sb > sr - 8) fw = 0;
            } else if (spriteKey === 'cool') {
              if (ny < 164 || (nx >= 244 && ny >= 158 && sg > sr - 18)) fw = 0;
            }
          }
          rawFur[pIdx] = fw;
        }

        // 2. Garment weight (camel wool coat on cold, denim overalls on mild)
        if (spriteKey === 'cold') {
          const gDiff = smoothstep(8, 16, diff);
          const topLim = nx < 342 ? 164 : 145;
          const gPos =
            smoothstep(204, 222, nx) *
            (1 - smoothstep(448, 466, nx)) *
            smoothstep(topLim, topLim + 12, ny);
          const gWarm = smoothstep(66, 96, sWarm);
          const gHue = smoothstep(0.36, 0.43, sOr) * (1 - smoothstep(0.56, 0.605, sOr));
          const gBright = smoothstep(108, 142, sr);
          rawGarm[pIdx] = gDiff * gPos * gWarm * gHue * gBright * smoothstep(40, 180, sa);
        } else if (spriteKey === 'mild') {
          const gDiff = smoothstep(22, 52, diff);
          const gDenim =
            smoothstep(-14, 4, sb - sr) *
            smoothstep(75, 108, sb) *
            (1 - smoothstep(185, 225, sr));
          const notDaisy = nx < 208 && ny > 348 ? 0 : 1;
          rawGarm[pIdx] = gDiff * gDenim * notDaisy * smoothstep(40, 180, sa);
        }
      }
    }

    return {
      furMask: boxBlur3x3U8(rawFur, w, h),
      garmentMask: boxBlur3x3U8(rawGarm, w, h),
    };
  })();

  maskCache.set(key, task);
  return task;
}

export function getRecoloredSpriteUrl(
  spriteKey: MascotSpriteKey,
  spriteUrl: string,
  baseSpriteUrl: string,
  coatId: MascotCoatId,
  garmentVariant: GarmentVariantId = 'default'
): Promise<string> {
  if ((coatId === 'classic' && garmentVariant === 'default') || typeof document === 'undefined') {
    return Promise.resolve(spriteUrl);
  }

  const cacheKey = `${spriteKey}:${coatId}:${garmentVariant}`;
  const cached = recolorCache.get(cacheKey);
  if (cached) return cached;

  const coat = getCoatMeta(coatId);
  const gTarget = garmentVariant !== 'default' ? GARMENT_TARGET_RGB[garmentVariant] : null;

  const task = (async () => {
    try {
      const [spPx, masks] = await Promise.all([
        readImagePixels(spriteUrl),
        getSpriteMasks(spriteKey, spriteUrl, baseSpriteUrl),
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
      const { furMask, garmentMask } = masks;
      const total = w * h;

      for (let p = 0; p < total; p++) {
        const i = p * 4;
        if (px[i + 3] === 0) continue;

        const r0 = src[i];
        const g0 = src[i + 1];
        const b0 = src[i + 2];
        const rawLuma = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;

        let fr = px[i];
        let fg = px[i + 1];
        let fb = px[i + 2];

        if (coatId !== 'classic') {
          let m = furMask[p] / 255;
          if (m > 0.01) {
            if (coatId === 'panda') {
              m = Math.min(1, m * 1.25);
            }
            const luma = Math.max(0.48, Math.min(1.38, rawLuma / 138));
            const nr = Math.min(255, Math.max(0, tr * luma));
            const ng = Math.min(255, Math.max(0, tg * luma));
            const nb = Math.min(255, Math.max(0, tb * luma));
            fr = Math.round(fr * (1 - m) + nr * m);
            fg = Math.round(fg * (1 - m) + ng * m);
            fb = Math.round(fb * (1 - m) + nb * m);
          }
        }

        if (gTarget) {
          const gm = garmentMask[p] / 255;
          if (gm > 0.01) {
            const lumaG = Math.max(0.52, Math.min(1.42, rawLuma / 145));
            const nr = Math.min(255, Math.max(0, gTarget[0] * lumaG));
            const ng = Math.min(255, Math.max(0, gTarget[1] * lumaG));
            const nb = Math.min(255, Math.max(0, gTarget[2] * lumaG));
            fr = Math.round(fr * (1 - gm) + nr * gm);
            fg = Math.round(fg * (1 - gm) + ng * gm);
            fb = Math.round(fb * (1 - gm) + nb * gm);
          }
        }

        px[i] = fr;
        px[i + 1] = fg;
        px[i + 2] = fb;
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
