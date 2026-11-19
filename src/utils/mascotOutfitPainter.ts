export type GouacheOutfitLayerKey =
  | 'freezing'
  | 'blizzard'
  | 'rain'
  | 'storm'
  | 'warm'
  | 'hot'
  | 'night';

const W = 560;
const H = 420;

type Pt = readonly [number, number];
type Rgb = readonly [number, number, number];
type CubicSeg = readonly [Pt, Pt, Pt, Pt];

const layerCache = new Map<GouacheOutfitLayerKey, Promise<string>>();
let cachedGrainCanvas: HTMLCanvasElement | null = null;
let cachedBaseImg: Promise<HTMLImageElement> | null = null;
let cachedBaseUrl = '';

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

function getBaseSpriteImage(baseSpriteUrl: string): Promise<HTMLImageElement> {
  if (!cachedBaseImg || cachedBaseUrl !== baseSpriteUrl) {
    cachedBaseUrl = baseSpriteUrl;
    cachedBaseImg = loadMascotImage(baseSpriteUrl);
  }
  return cachedBaseImg;
}

function makeCanvas(w = W, h = H): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return [c, ctx];
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ];
}

function rgbStr(c: Rgb, alpha = 1): string {
  return alpha >= 0.999 ? `rgb(${c[0]},${c[1]},${c[2]})` : `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

function getGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (!cachedGrainCanvas) {
    const [gc, gctx] = makeCanvas(64, 64);
    const img = gctx.createImageData(64, 64);
    let seed = 0x51a9d3f7;
    for (let i = 0; i < img.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const v = (seed >>> 24) & 255;
      img.data[i] = v;
      img.data[i + 1] = Math.max(0, v - 6);
      img.data[i + 2] = Math.max(0, v - 14);
      img.data[i + 3] = 28;
    }
    gctx.putImageData(img, 0, 0);
    cachedGrainCanvas = gc;
  }
  return ctx.createPattern(cachedGrainCanvas, 'repeat');
}

function traceCubicLoop(ctx: CanvasRenderingContext2D, segments: readonly CubicSeg[]): void {
  if (segments.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(segments[0][0][0], segments[0][0][1]);
  for (const [, p1, p2, p3] of segments) {
    ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
  }
  ctx.closePath();
}

function paintGouacheLayer(
  fill: Rgb,
  light: Rgb,
  shadow: Rgb,
  bounds: readonly [number, number, number, number],
  drawMask: (ctx: CanvasRenderingContext2D) => void,
  grainAlpha = 0.24
): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas();
  drawMask(ctx);

  const [x0, y0, x1, y1] = bounds;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, rgbStr(mixRgb(fill, light, 0.28)));
  grad.addColorStop(0.48, rgbStr(fill));
  grad.addColorStop(1, rgbStr(mixRgb(fill, shadow, 0.34)));

  ctx.save();
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = 'source-atop';
  const grain = getGrainPattern(ctx);
  if (grain) {
    ctx.globalAlpha = grainAlpha;
    ctx.fillStyle = grain;
    ctx.fillRect(x0 - 8, y0 - 8, x1 - x0 + 16, y1 - y0 + 16);
  }
  ctx.restore();

  return canvas;
}

function clipLayerToMask(layer: HTMLCanvasElement, mask: CanvasImageSource): HTMLCanvasElement {
  const [out, ctx] = makeCanvas();
  ctx.drawImage(layer, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  return out;
}

function buildDilatedBodyMask(baseImg: HTMLImageElement): HTMLCanvasElement {
  const [c, ctx] = makeCanvas();
  const r = 3.5;
  const offsets: readonly Pt[] = [
    [0, 0],
    [-r, 0],
    [r, 0],
    [0, -r],
    [0, r],
    [-2.5, -2.5],
    [2.5, -2.5],
    [-2.5, 2.5],
    [2.5, 2.5],
  ];
  for (const [dx, dy] of offsets) {
    ctx.drawImage(baseImg, dx, dy, W, H);
  }
  return c;
}

function makeCastShadow(
  source: HTMLCanvasElement,
  clipMask: CanvasImageSource | null,
  dx: number,
  dy: number,
  blur: number,
  color: readonly [number, number, number, number]
): HTMLCanvasElement {
  const sw = 140;
  const sh = 105;
  const scale = 0.25;
  const [tint, tctx] = makeCanvas(sw, sh);
  tctx.drawImage(source, dx * scale, dy * scale, sw, sh);
  tctx.globalCompositeOperation = 'source-in';
  tctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
  tctx.fillRect(0, 0, sw, sh);

  const [blurred, bctx] = makeCanvas(sw, sh);
  const rad = Math.max(0.8, blur * scale * 0.55);
  const taps: readonly [number, number, number][] = [
    [0, 0, 0.24],
    [-rad, 0, 0.12],
    [rad, 0, 0.12],
    [0, -rad, 0.12],
    [0, rad, 0.12],
    [-rad * 0.72, -rad * 0.72, 0.07],
    [rad * 0.72, -rad * 0.72, 0.07],
    [-rad * 0.72, rad * 0.72, 0.07],
    [rad * 0.72, rad * 0.72, 0.07],
  ];
  const baseAlpha = color[3] / 255;
  for (const [ox, oy, weight] of taps) {
    bctx.globalAlpha = baseAlpha * weight * 1.45;
    bctx.drawImage(tint, ox, oy);
  }

  const [out, octx] = makeCanvas();
  octx.drawImage(blurred, 0, 0, W, H);
  if (clipMask) {
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(clipMask, 0, 0, W, H);
  }
  return out;
}

function composeLayers(...layers: HTMLCanvasElement[]): HTMLCanvasElement {
  const [out, ctx] = makeCanvas();
  for (const lyr of layers) {
    ctx.drawImage(lyr, 0, 0);
  }
  return out;
}

const JACKET_CURVES: readonly CubicSeg[] = [
  [[250, 144], [338, 132], [438, 144], [486, 204]],
  [[486, 204], [512, 264], [506, 340], [468, 374]],
  [[468, 374], [392, 388], [320, 386], [270, 374]],
  [[270, 374], [272, 316], [284, 236], [250, 144]],
];

function buildFreezingAndBlizzard(
  baseImg: HTMLImageElement,
  dilatedBody: HTMLCanvasElement
): { freezing: HTMLCanvasElement; blizzard: HTMLCanvasElement } {
  // 1. Olive-moss quilted winter puffer
  let jacket = paintGouacheLayer(
    [98, 128, 72],
    [152, 182, 114],
    [54, 74, 38],
    [255, 140, 495, 385],
    (ctx) => {
      traceCubicLoop(ctx, JACKET_CURVES);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.26
  );
  jacket = clipLayerToMask(jacket, dilatedBody);

  const jctx = jacket.getContext('2d')!;
  jctx.save();
  jctx.globalCompositeOperation = 'source-atop';
  jctx.lineCap = 'round';
  const stitchCurves: readonly CubicSeg[] = [
    [[294, 206], [360, 226], [426, 228], [488, 214]],
    [[286, 264], [358, 284], [432, 286], [498, 270]],
    [[278, 320], [350, 340], [424, 340], [488, 324]],
  ];
  for (const [p0, p1, p2, p3] of stitchCurves) {
    jctx.beginPath();
    jctx.moveTo(p0[0], p0[1]);
    jctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
    jctx.strokeStyle = 'rgba(56, 76, 40, 0.49)';
    jctx.lineWidth = 3;
    jctx.stroke();

    jctx.beginPath();
    jctx.moveTo(p0[0], p0[1] + 2.8);
    jctx.bezierCurveTo(p1[0], p1[1] + 2.8, p2[0], p2[1] + 2.8, p3[0], p3[1] + 2.8);
    jctx.strokeStyle = 'rgba(176, 204, 144, 0.35)';
    jctx.lineWidth = 2;
    jctx.stroke();
  }
  jctx.restore();

  const jacketShadow = makeCastShadow(jacket, baseImg, -4, 4, 7, [86, 46, 22, 82]);

  // 2. Plush cream faux-fur collar tucked right behind right ear & cheek
  const collarPuffs: readonly [number, number, number][] = [
    [274, 166, 15], [288, 192, 16], [298, 222, 17], [304, 252, 17],
    [304, 282, 17], [296, 314, 16], [282, 344, 15], [264, 366, 14],
    [256, 154, 14], [272, 182, 15], [282, 212, 16], [288, 244, 16],
    [288, 276, 16], [280, 308, 15], [268, 338, 14],
  ];
  const puffsLayer = paintGouacheLayer(
    [250, 242, 224],
    [255, 252, 244],
    [214, 194, 164],
    [240, 140, 320, 380],
    (ctx) => {
      ctx.fillStyle = '#000';
      for (const [cx, cy, r] of collarPuffs) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    0.18
  );
  const bibLayer = paintGouacheLayer(
    [250, 242, 224],
    [255, 252, 244],
    [214, 194, 164],
    [164, 336, 286, 382],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[168, 350], [212, 368], [260, 366], [284, 338]],
        [[284, 338], [276, 368], [224, 382], [164, 366]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.16
  );
  const collar = composeLayers(puffsLayer, bibLayer);
  const collarShadow = makeCastShadow(collar, baseImg, -4, 3, 6, [86, 48, 24, 72]);

  // 3. Hand-knit berry-red & cream pom-pom beanie
  const pom = paintGouacheLayer(
    [252, 245, 232],
    [255, 255, 250],
    [212, 192, 168],
    [190, 48, 242, 92],
    (ctx) => {
      ctx.fillStyle = '#000';
      for (const [ox, oy, r] of [
        [216, 70, 18],
        [204, 72, 13],
        [228, 72, 13],
        [216, 60, 12],
      ] as const) {
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    0.18
  );

  const dome = paintGouacheLayer(
    [198, 66, 72],
    [240, 128, 120],
    [132, 34, 42],
    [142, 70, 294, 152],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[142, 142], [154, 74], [264, 68], [294, 138]],
        [[294, 138], [254, 150], [184, 152], [142, 142]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.24
  );
  const dctx = dome.getContext('2d')!;
  dctx.save();
  dctx.globalCompositeOperation = 'source-atop';
  dctx.beginPath();
  dctx.moveTo(150, 122);
  dctx.quadraticCurveTo(218, 104, 288, 118);
  dctx.strokeStyle = 'rgba(250, 240, 220, 0.88)';
  dctx.lineWidth = 10.5;
  dctx.lineCap = 'round';
  dctx.stroke();
  dctx.restore();

  const cuff = paintGouacheLayer(
    [248, 238, 218],
    [255, 252, 244],
    [206, 186, 158],
    [132, 132, 304, 168],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[136, 146], [184, 132], [254, 132], [300, 144]],
        [[300, 144], [306, 162], [294, 168], [284, 166]],
        [[284, 166], [232, 156], [178, 158], [142, 166]],
        [[142, 166], [132, 162], [132, 150], [136, 146]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.2
  );
  const cctx = cuff.getContext('2d')!;
  cctx.save();
  cctx.globalCompositeOperation = 'source-atop';
  cctx.strokeStyle = 'rgba(182, 160, 132, 0.45)';
  cctx.lineWidth = 2.1;
  for (let rx = 148; rx < 294; rx += 14) {
    cctx.beginPath();
    cctx.moveTo(rx, 138);
    cctx.lineTo(rx - 2, 163);
    cctx.stroke();
  }
  cctx.restore();

  const beanieFull = composeLayers(pom, dome, cuff);
  const beanieShadow = makeCastShadow(cuff, baseImg, 0, 4.5, 6, [86, 46, 22, 85]);

  // 4. Hot cocoa mug on LEFT LEDGE
  const mug = paintGouacheLayer(
    [204, 72, 72],
    [240, 128, 118],
    [142, 40, 44],
    [52, 344, 108, 396],
    (ctx) => {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(98, 370, 11, -Math.PI * 0.48, Math.PI * 0.5);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.roundRect(52, 346, 42, 48, 9);
      ctx.fill();
    },
    0.2
  );
  const mctx = mug.getContext('2d')!;
  mctx.fillStyle = '#FCF4E8';
  mctx.beginPath();
  mctx.ellipse(73, 347, 21, 7, 0, 0, Math.PI * 2);
  mctx.fill();
  mctx.fillStyle = '#6A381E';
  mctx.beginPath();
  mctx.ellipse(73, 346.5, 17, 4.5, 0, 0, Math.PI * 2);
  mctx.fill();
  mctx.fillStyle = '#FFFDF8';
  for (const [mx, my, mr] of [
    [65, 345, 4.2],
    [74, 346, 4.5],
    [82, 344, 3.8],
  ] as const) {
    mctx.beginPath();
    mctx.arc(mx, my, mr, 0, Math.PI * 2);
    mctx.fill();
  }
  const mugShadow = makeCastShadow(mug, null, 0, 3, 5, [35, 20, 12, 82]);

  const freezing = composeLayers(
    jacketShadow,
    jacket,
    collarShadow,
    collar,
    beanieShadow,
    beanieFull,
    mugShadow,
    mug
  );

  // 5. Blizzard goggles + snow tufts
  const [goggles, gctx] = makeCanvas();
  gctx.strokeStyle = 'rgba(44, 56, 78, 0.96)';
  gctx.lineWidth = 10.5;
  gctx.lineCap = 'round';
  gctx.beginPath();
  gctx.moveTo(112, 214);
  gctx.quadraticCurveTo(120, 216, 126, 218);
  gctx.stroke();
  gctx.beginPath();
  gctx.moveTo(256, 226);
  gctx.quadraticCurveTo(292, 228, 322, 222);
  gctx.stroke();

  gctx.fillStyle = '#263044';
  gctx.beginPath();
  gctx.roundRect(116, 198, 144, 50, 23);
  gctx.fill();

  gctx.save();
  gctx.beginPath();
  gctx.moveTo(140, 205);
  gctx.lineTo(236, 205);
  gctx.arcTo(253, 205, 253, 222, 17);
  gctx.arcTo(253, 241, 236, 241, 17);
  gctx.lineTo(200, 241);
  gctx.lineTo(190, 231);
  gctx.lineTo(180, 241);
  gctx.lineTo(140, 241);
  gctx.arcTo(123, 241, 123, 224, 17);
  gctx.arcTo(123, 205, 140, 205, 17);
  gctx.closePath();
  const lensGrad = gctx.createLinearGradient(123, 205, 253, 241);
  lensGrad.addColorStop(0, 'rgba(248, 182, 92, 0.95)');
  lensGrad.addColorStop(0.55, 'rgba(228, 138, 122, 0.95)');
  lensGrad.addColorStop(1, 'rgba(202, 102, 158, 0.95)');
  gctx.fillStyle = lensGrad;
  gctx.fill();
  gctx.clip();

  gctx.strokeStyle = 'rgba(255, 250, 235, 0.52)';
  gctx.lineCap = 'round';
  gctx.lineWidth = 4.8;
  gctx.beginPath();
  gctx.moveTo(142, 209);
  gctx.lineTo(162, 236);
  gctx.stroke();
  gctx.lineWidth = 2.6;
  gctx.strokeStyle = 'rgba(255, 250, 235, 0.34)';
  gctx.beginPath();
  gctx.moveTo(154, 209);
  gctx.lineTo(168, 229);
  gctx.stroke();
  gctx.lineWidth = 4.6;
  gctx.strokeStyle = 'rgba(255, 250, 235, 0.5)';
  gctx.beginPath();
  gctx.moveTo(208, 210);
  gctx.lineTo(228, 237);
  gctx.stroke();
  gctx.restore();

  const gogglesShadow = makeCastShadow(goggles, baseImg, 1, 3.5, 4.5, [70, 38, 18, 80]);

  const snowTufts = paintGouacheLayer(
    [248, 252, 255],
    [255, 255, 255],
    [194, 218, 242],
    [168, 76, 452, 182],
    (ctx) => {
      ctx.fillStyle = '#000';
      for (const [sx, sy, sr] of [
        [178, 96, 8], [192, 90, 10], [206, 86, 9], [240, 88, 10], [254, 94, 8],
        [378, 152, 10], [394, 154, 12], [410, 158, 10], [426, 164, 9], [440, 170, 8],
      ] as const) {
        ctx.beginPath();
        ctx.ellipse(sx, sy, sr, sr * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    0.14
  );

  const blizzard = composeLayers(
    jacketShadow,
    jacket,
    collarShadow,
    collar,
    beanieShadow,
    beanieFull,
    gogglesShadow,
    goggles,
    snowTufts
  );

  return { freezing, blizzard };
}

function buildPoncho(
  baseImg: HTMLImageElement,
  dilatedBody: HTMLCanvasElement,
  fill: Rgb,
  light: Rgb,
  shadow: Rgb,
  button: Rgb
): HTMLCanvasElement {
  let cape = paintGouacheLayer(
    fill,
    light,
    shadow,
    [222, 132, 506, 388],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[222, 138], [328, 132], [444, 146], [492, 218]],
        [[492, 218], [512, 278], [500, 352], [464, 376]],
        [[464, 376], [382, 388], [304, 386], [254, 374]],
        [[254, 374], [246, 312], [256, 214], [222, 138]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.22
  );
  cape = clipLayerToMask(cape, dilatedBody);

  const cctx = cape.getContext('2d')!;
  cctx.save();
  cctx.globalCompositeOperation = 'source-atop';
  cctx.lineCap = 'round';
  cctx.beginPath();
  cctx.moveTo(292, 178);
  cctx.bezierCurveTo(342, 226, 360, 296, 350, 364);
  cctx.strokeStyle = rgbStr(light, 0.42);
  cctx.lineWidth = 5.5;
  cctx.stroke();
  cctx.beginPath();
  cctx.moveTo(358, 168);
  cctx.bezierCurveTo(416, 212, 444, 278, 442, 356);
  cctx.strokeStyle = rgbStr(shadow, 0.34);
  cctx.lineWidth = 4.5;
  cctx.stroke();
  cctx.restore();

  const hood = paintGouacheLayer(
    fill,
    light,
    shadow,
    [126, 128, 330, 354],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[126, 188], [142, 132], [224, 124], [284, 144]],
        [[284, 144], [328, 172], [334, 246], [304, 320]],
        [[304, 320], [284, 348], [254, 354], [244, 338]],
        [[244, 338], [276, 284], [284, 216], [264, 174]],
        [[264, 174], [230, 148], [168, 150], [126, 188]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.2
  );
  const hctx = hood.getContext('2d')!;
  for (const [bx, by] of [
    [284, 240],
    [288, 282],
    [282, 322],
  ] as const) {
    hctx.fillStyle = rgbStr(button, 0.96);
    hctx.beginPath();
    hctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    hctx.fill();
    hctx.fillStyle = 'rgba(255,255,255,0.65)';
    hctx.beginPath();
    hctx.arc(bx - 0.5, by - 1.5, 2, 0, Math.PI * 2);
    hctx.fill();
  }

  const capeShadow = makeCastShadow(cape, baseImg, -4, 4, 7, [86, 46, 22, 76]);
  const hoodShadow = makeCastShadow(hood, baseImg, -2.5, 4, 5.5, [86, 46, 22, 82]);
  return composeLayers(capeShadow, cape, hoodShadow, hood);
}

function buildWarm(baseImg: HTMLImageElement): HTMLCanvasElement {
  const kerchiefBody = paintGouacheLayer(
    [108, 176, 212],
    [168, 218, 244],
    [66, 124, 162],
    [162, 218, 292, 356],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[168, 338], [216, 360], [264, 346], [288, 282]],
        [[288, 282], [292, 254], [286, 222], [276, 218]],
        [[276, 218], [276, 268], [250, 328], [172, 328]],
        [[172, 328], [162, 330], [162, 336], [168, 338]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.19
  );
  const kerchiefTail = paintGouacheLayer(
    [96, 164, 202],
    [156, 208, 236],
    [58, 114, 152],
    [194, 340, 224, 382],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[212, 340], [228, 368], [216, 382], [200, 374]],
        [[200, 374], [194, 360], [200, 344], [212, 340]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.18
  );
  const kerchief = composeLayers(kerchiefBody, kerchiefTail);
  const kerchiefShadow = makeCastShadow(kerchief, baseImg, -2, 3.5, 5, [86, 48, 22, 68]);

  const brim = paintGouacheLayer(
    [232, 194, 108],
    [252, 228, 162],
    [186, 140, 62],
    [104, 124, 330, 174],
    (ctx) => {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(217, 149, 113, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    0.25
  );
  const bctx = brim.getContext('2d')!;
  bctx.strokeStyle = 'rgba(176, 128, 56, 0.38)';
  bctx.lineWidth = 2.2;
  bctx.beginPath();
  bctx.ellipse(217, 149, 101, 19, 0, 0.17, Math.PI - 0.1);
  bctx.stroke();

  const crown = paintGouacheLayer(
    [242, 208, 128],
    [255, 236, 178],
    [192, 148, 72],
    [160, 96, 276, 152],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[160, 142], [166, 94], [268, 94], [276, 142]],
        [[276, 142], [238, 152], [198, 152], [160, 142]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.23
  );

  const ribbon = paintGouacheLayer(
    [224, 122, 104],
    [246, 164, 144],
    [168, 72, 58],
    [160, 132, 276, 153],
    (ctx) => {
      ctx.beginPath();
      ctx.moveTo(161, 132);
      ctx.bezierCurveTo(200, 142, 238, 142, 275, 132);
      ctx.lineTo(276, 143);
      ctx.bezierCurveTo(238, 153, 198, 153, 160, 143);
      ctx.closePath();
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.17
  );

  const hatFull = composeLayers(brim, crown, ribbon);
  const hatShadow = makeCastShadow(brim, baseImg, 0, 6, 6.5, [86, 46, 22, 85]);

  // Iced lemonade glass on LEFT LEDGE
  const [cup, lctx] = makeCanvas();
  lctx.strokeStyle = '#52B8DE';
  lctx.lineWidth = 4.5;
  lctx.lineCap = 'round';
  lctx.beginPath();
  lctx.moveTo(72, 326);
  lctx.lineTo(78, 384);
  lctx.stroke();

  lctx.fillStyle = '#F6CA3E';
  lctx.beginPath();
  lctx.arc(93, 351, 11, 0, Math.PI * 2);
  lctx.fill();
  lctx.fillStyle = '#FEEC86';
  lctx.beginPath();
  lctx.arc(93, 351, 7, 0, Math.PI * 2);
  lctx.fill();

  const glassGrad = lctx.createLinearGradient(58, 348, 94, 394);
  glassGrad.addColorStop(0, 'rgba(255, 246, 174, 0.92)');
  glassGrad.addColorStop(1, 'rgba(240, 206, 92, 0.94)');
  lctx.fillStyle = glassGrad;
  lctx.beginPath();
  lctx.moveTo(58, 348);
  lctx.lineTo(94, 348);
  lctx.lineTo(88, 394);
  lctx.lineTo(64, 394);
  lctx.closePath();
  lctx.fill();
  lctx.strokeStyle = 'rgba(255, 253, 245, 0.9)';
  lctx.lineWidth = 2.2;
  lctx.stroke();

  lctx.fillStyle = 'rgba(255,255,255,0.55)';
  lctx.beginPath();
  lctx.roundRect(66, 358, 11, 11, 3);
  lctx.fill();
  lctx.fillStyle = 'rgba(255,255,255,0.45)';
  lctx.beginPath();
  lctx.roundRect(76, 366, 10, 10, 3);
  lctx.fill();

  const cupShadow = makeCastShadow(cup, null, 0, 2.5, 4.5, [35, 20, 12, 80]);
  return composeLayers(kerchiefShadow, kerchief, hatShadow, hatFull, cupShadow, cup);
}

function buildHot(baseImg: HTMLImageElement): HTMLCanvasElement {
  const ring = paintGouacheLayer(
    [132, 224, 244],
    [210, 248, 255],
    [72, 172, 204],
    [160, 218, 292, 356],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[168, 342], [220, 358], [266, 342], [288, 278]],
        [[288, 278], [292, 246], [284, 218], [272, 220]],
        [[272, 220], [276, 268], [252, 324], [170, 328]],
        [[170, 328], [158, 330], [158, 340], [168, 342]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.15
  );
  const rctx = ring.getContext('2d')!;
  rctx.beginPath();
  rctx.moveTo(176, 334);
  rctx.bezierCurveTo(228, 342, 264, 316, 278, 262);
  rctx.strokeStyle = 'rgba(255, 255, 255, 0.64)';
  rctx.lineWidth = 3.1;
  rctx.lineCap = 'round';
  rctx.stroke();
  const ringShadow = makeCastShadow(ring, baseImg, -2, 3.5, 5, [70, 44, 24, 65]);

  const cap = paintGouacheLayer(
    [250, 247, 238],
    [255, 255, 252],
    [208, 198, 180],
    [144, 118, 284, 148],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[144, 146], [172, 116], [256, 116], [284, 146]],
        [[284, 146], [238, 138], [190, 138], [144, 146]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.18
  );

  const visorRaw = paintGouacheLayer(
    [108, 212, 224],
    [178, 244, 248],
    [64, 158, 174],
    [112, 134, 278, 174],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[112, 162], [154, 132], [224, 132], [278, 152]],
        [[278, 152], [226, 166], [160, 174], [112, 162]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.14
  );
  const [visor, vctx] = makeCanvas();
  vctx.globalAlpha = 0.88;
  vctx.drawImage(visorRaw, 0, 0);
  vctx.globalAlpha = 1;
  vctx.beginPath();
  vctx.moveTo(126, 156);
  vctx.quadraticCurveTo(186, 138, 262, 150);
  vctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  vctx.lineWidth = 2.4;
  vctx.lineCap = 'round';
  vctx.stroke();

  const capFull = composeLayers(cap, visor);
  const capShadow = makeCastShadow(capFull, baseImg, -2, 5.5, 6, [86, 48, 22, 82]);
  return composeLayers(ringShadow, ring, capShadow, capFull);
}

function buildNight(baseImg: HTMLImageElement): HTMLCanvasElement {
  const pom = paintGouacheLayer(
    [252, 242, 210],
    [255, 252, 238],
    [210, 194, 152],
    [328, 106, 364, 134],
    (ctx) => {
      ctx.fillStyle = '#000';
      for (const [ox, oy, r] of [
        [346, 118, 13],
        [338, 120, 10],
        [353, 122, 10],
      ] as const) {
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    0.16
  );

  const cap = paintGouacheLayer(
    [66, 88, 146],
    [118, 144, 206],
    [38, 52, 98],
    [144, 70, 344, 148],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[144, 140], [172, 74], [278, 68], [344, 116]],
        [[344, 116], [314, 124], [294, 138], [296, 148]],
        [[296, 148], [246, 142], [186, 144], [144, 140]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.22
  );
  const cctx = cap.getContext('2d')!;
  cctx.fillStyle = 'rgba(254, 232, 128, 0.9)';
  for (const [sx, sy, sr] of [
    [208, 114, 4.5],
    [248, 102, 3.8],
    [288, 110, 3.2],
  ] as const) {
    cctx.beginPath();
    cctx.moveTo(sx, sy - sr);
    cctx.lineTo(sx + sr * 0.34, sy - sr * 0.34);
    cctx.lineTo(sx + sr, sy);
    cctx.lineTo(sx + sr * 0.34, sy + sr * 0.34);
    cctx.lineTo(sx, sy + sr);
    cctx.lineTo(sx - sr * 0.34, sy + sr * 0.34);
    cctx.lineTo(sx - sr, sy);
    cctx.lineTo(sx - sr * 0.34, sy - sr * 0.34);
    cctx.closePath();
    cctx.fill();
  }

  const trim = paintGouacheLayer(
    [242, 246, 255],
    [255, 255, 255],
    [192, 204, 224],
    [132, 132, 306, 168],
    (ctx) => {
      traceCubicLoop(ctx, [
        [[136, 144], [188, 130], [258, 132], [302, 148]],
        [[302, 148], [306, 162], [294, 168], [284, 164]],
        [[284, 164], [236, 152], [178, 154], [142, 164]],
        [[142, 164], [132, 160], [132, 148], [136, 144]],
      ]);
      ctx.fillStyle = '#000';
      ctx.fill();
    },
    0.18
  );

  const capFull = composeLayers(pom, cap, trim);
  const capShadow = makeCastShadow(trim, baseImg, 1, 4.5, 6, [46, 36, 56, 85]);

  const [rim, lrctx] = makeCanvas();
  const rg = lrctx.createRadialGradient(120, 320, 8, 120, 320, 62);
  rg.addColorStop(0, 'rgba(254, 214, 108, 0.24)');
  rg.addColorStop(1, 'rgba(254, 214, 108, 0)');
  lrctx.fillStyle = rg;
  lrctx.fillRect(50, 240, 140, 155);
  lrctx.globalCompositeOperation = 'destination-in';
  lrctx.drawImage(baseImg, 0, 0, W, H);

  return composeLayers(rim, capShadow, capFull);
}

function encodeCanvas(canvas: HTMLCanvasElement): string {
  const webp = canvas.toDataURL('image/webp', 0.88);
  if (webp.startsWith('data:image/webp')) return webp;
  return canvas.toDataURL('image/png');
}

export function getOutfitLayerUrl(
  layerKey: GouacheOutfitLayerKey,
  baseSpriteUrl: string
): Promise<string> {
  if (typeof document === 'undefined') {
    return Promise.resolve('');
  }
  const existing = layerCache.get(layerKey);
  if (existing) return existing;

  const task = (async () => {
    try {
      const baseImg = await getBaseSpriteImage(baseSpriteUrl);
      const dilatedBody = buildDilatedBodyMask(baseImg);

      if (layerKey === 'freezing' || layerKey === 'blizzard') {
        const pair = buildFreezingAndBlizzard(baseImg, dilatedBody);
        const fUri = encodeCanvas(pair.freezing);
        const bUri = encodeCanvas(pair.blizzard);
        layerCache.set('freezing', Promise.resolve(fUri));
        layerCache.set('blizzard', Promise.resolve(bUri));
        return layerKey === 'freezing' ? fUri : bUri;
      }
      if (layerKey === 'rain' || layerKey === 'storm') {
        const rainC = buildPoncho(
          baseImg,
          dilatedBody,
          [246, 202, 78],
          [255, 234, 148],
          [204, 144, 38],
          [255, 252, 240]
        );
        const stormC = buildPoncho(
          baseImg,
          dilatedBody,
          [226, 128, 62],
          [248, 174, 110],
          [166, 74, 30],
          [255, 244, 226]
        );
        const rUri = encodeCanvas(rainC);
        const sUri = encodeCanvas(stormC);
        layerCache.set('rain', Promise.resolve(rUri));
        layerCache.set('storm', Promise.resolve(sUri));
        return layerKey === 'rain' ? rUri : sUri;
      }
      if (layerKey === 'warm') {
        return encodeCanvas(buildWarm(baseImg));
      }
      if (layerKey === 'hot') {
        return encodeCanvas(buildHot(baseImg));
      }
      return encodeCanvas(buildNight(baseImg));
    } catch {
      return '';
    }
  })();

  layerCache.set(layerKey, task);
  return task;
}
