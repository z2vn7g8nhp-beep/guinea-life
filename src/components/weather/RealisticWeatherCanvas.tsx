import React, { useEffect, useRef } from 'react';
import type { TimeOfDay, WeatherCondition } from '../../types/weather';

interface RealisticWeatherCanvasProps {
  condition: WeatherCondition;
  temperature: number;
  windSpeed: number;
  cloudCover: number;
  timeOfDay: TimeOfDay;
  onLightningFlash?: () => void;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  layer: number;
  opacity: number;
  width: number;
}

interface SplashRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  particles: Array<{ vx: number; vy: number; x: number; y: number }>;
}

interface GlassDrop {
  x: number;
  y: number;
  r: number;
  vy: number;
  sliding: boolean;
  wobblePhase: number;
  trail: Array<{ x: number; y: number; r: number }>;
}

interface SnowFlake {
  x: number;
  y: number;
  r: number;
  vy: number;
  vxDrift: number;
  phase: number;
  layer: number;
  rotation: number;
  rotSpeed: number;
  crystalline: boolean;
}

interface FogBank {
  x: number;
  yRatio: number;
  w: number;
  h: number;
  speed: number;
  alpha: number;
  phase: number;
}

interface WindStreak {
  x: number;
  y: number;
  len: number;
  speed: number;
  amp: number;
  freq: number;
  phase: number;
  alpha: number;
}

interface LightningSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  alpha: number;
}

interface LightningBolt {
  segments: LightningSegment[];
  life: number;
  maxLife: number;
  centerX: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface SkyTheme {
  top: [number, number, number];
  mid: [number, number, number];
  horizon: [number, number, number];
  cloudLit: [number, number, number];
  cloudShade: [number, number, number];
  sunGlow: [number, number, number];
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t),
  ];
}

function rgb255(c: [number, number, number], alpha = 1): string {
  return `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, ${alpha})`;
}

function getSkyTheme(condition: WeatherCondition, timeOfDay: TimeOfDay): SkyTheme {
  const isStorm = condition === 'thunderstorm' || condition === 'heavy-rain';
  const isRainy = condition === 'rain' || condition === 'drizzle' || condition === 'overcast';
  const isSnow = condition === 'snow' || condition === 'blizzard';
  const isFog = condition === 'fog';

  if (timeOfDay === 'night') {
    if (isStorm) {
      return {
        top: [0.025, 0.035, 0.075],
        mid: [0.055, 0.075, 0.14],
        horizon: [0.095, 0.125, 0.21],
        cloudLit: [0.18, 0.22, 0.34],
        cloudShade: [0.04, 0.05, 0.1],
        sunGlow: [0.45, 0.56, 0.85],
      };
    }
    if (isRainy || isFog) {
      return {
        top: [0.045, 0.07, 0.14],
        mid: [0.09, 0.13, 0.23],
        horizon: [0.16, 0.21, 0.33],
        cloudLit: [0.26, 0.32, 0.45],
        cloudShade: [0.08, 0.11, 0.19],
        sunGlow: [0.65, 0.75, 0.92],
      };
    }
    if (isSnow) {
      return {
        top: [0.06, 0.1, 0.2],
        mid: [0.13, 0.19, 0.34],
        horizon: [0.24, 0.33, 0.5],
        cloudLit: [0.48, 0.56, 0.72],
        cloudShade: [0.19, 0.25, 0.38],
        sunGlow: [0.76, 0.85, 0.98],
      };
    }
    return {
      top: [0.02, 0.045, 0.12],
      mid: [0.055, 0.11, 0.26],
      horizon: [0.13, 0.23, 0.44],
      cloudLit: [0.42, 0.52, 0.72],
      cloudShade: [0.12, 0.18, 0.33],
      sunGlow: [0.78, 0.87, 1.0],
    };
  }

  if (timeOfDay === 'dawn') {
    if (isStorm) {
      return {
        top: [0.11, 0.15, 0.25],
        mid: [0.24, 0.26, 0.37],
        horizon: [0.4, 0.34, 0.42],
        cloudLit: [0.54, 0.48, 0.56],
        cloudShade: [0.16, 0.18, 0.27],
        sunGlow: [0.95, 0.68, 0.56],
      };
    }
    return {
      top: [0.15, 0.28, 0.56],
      mid: [0.46, 0.47, 0.67],
      horizon: [0.95, 0.69, 0.58],
      cloudLit: [1.0, 0.89, 0.82],
      cloudShade: [0.54, 0.49, 0.64],
      sunGlow: [1.0, 0.78, 0.58],
    };
  }

  if (timeOfDay === 'sunset') {
    if (isStorm) {
      return {
        top: [0.09, 0.12, 0.21],
        mid: [0.22, 0.2, 0.31],
        horizon: [0.44, 0.28, 0.3],
        cloudLit: [0.6, 0.4, 0.42],
        cloudShade: [0.14, 0.13, 0.21],
        sunGlow: [0.96, 0.55, 0.38],
      };
    }
    if (isRainy || isFog) {
      return {
        top: [0.19, 0.25, 0.39],
        mid: [0.38, 0.37, 0.49],
        horizon: [0.66, 0.49, 0.46],
        cloudLit: [0.78, 0.62, 0.58],
        cloudShade: [0.31, 0.3, 0.4],
        sunGlow: [0.96, 0.66, 0.48],
      };
    }
    return {
      top: [0.11, 0.23, 0.5],
      mid: [0.46, 0.34, 0.54],
      horizon: [0.96, 0.56, 0.36],
      cloudLit: [1.0, 0.84, 0.66],
      cloudShade: [0.44, 0.32, 0.46],
      sunGlow: [1.0, 0.68, 0.35],
    };
  }

  // Daytime realistic atmospheric sky palettes
  if (isStorm) {
    return {
      top: [0.12, 0.17, 0.25],
      mid: [0.22, 0.28, 0.38],
      horizon: [0.37, 0.44, 0.54],
      cloudLit: [0.48, 0.54, 0.63],
      cloudShade: [0.16, 0.21, 0.29],
      sunGlow: [0.72, 0.78, 0.86],
    };
  }
  if (isRainy) {
    return {
      top: [0.23, 0.33, 0.46],
      mid: [0.38, 0.48, 0.6],
      horizon: [0.58, 0.66, 0.75],
      cloudLit: [0.78, 0.83, 0.89],
      cloudShade: [0.36, 0.43, 0.53],
      sunGlow: [0.85, 0.9, 0.96],
    };
  }
  if (isSnow) {
    return {
      top: [0.34, 0.45, 0.59],
      mid: [0.54, 0.64, 0.75],
      horizon: [0.78, 0.84, 0.91],
      cloudLit: [0.94, 0.96, 0.99],
      cloudShade: [0.58, 0.66, 0.77],
      sunGlow: [0.95, 0.97, 1.0],
    };
  }
  if (isFog) {
    return {
      top: [0.42, 0.5, 0.59],
      mid: [0.6, 0.66, 0.72],
      horizon: [0.79, 0.83, 0.87],
      cloudLit: [0.89, 0.92, 0.95],
      cloudShade: [0.62, 0.67, 0.73],
      sunGlow: [0.96, 0.96, 0.94],
    };
  }
  if (condition === 'partly-cloudy') {
    return {
      top: [0.11, 0.39, 0.74],
      mid: [0.31, 0.61, 0.89],
      horizon: [0.68, 0.84, 0.96],
      cloudLit: [1.0, 0.995, 0.985],
      cloudShade: [0.62, 0.73, 0.85],
      sunGlow: [1.0, 0.95, 0.84],
    };
  }
  return {
    top: [0.08, 0.36, 0.76],
    mid: [0.26, 0.58, 0.91],
    horizon: [0.64, 0.84, 0.98],
    cloudLit: [1.0, 0.995, 0.99],
    cloudShade: [0.69, 0.8, 0.92],
    sunGlow: [1.0, 0.95, 0.82],
  };
}

const VERTEX_SHADER_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform float uWindOffset;
uniform vec2 uParallax;

uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyHorizon;
uniform vec3 uCloudLit;
uniform vec3 uCloudShade;
uniform vec3 uSunGlow;

uniform float uCloudCoverage;
uniform float uCloudDensity;
uniform float uSunStrength;
uniform vec2 uSunPos;
uniform float uMoonStrength;
uniform float uStarStrength;
uniform float uNightFactor;
uniform float uFogFactor;
uniform float uLightningFlash;
uniform float uLightningX;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p = rot * p * 2.03 + vec2(17.1, 31.7);
    a *= 0.5;
  }
  return v;
}

float cloudField(vec2 p, float coverage) {
  vec2 q = vec2(
    fbm4(p * 0.55 + vec2(0.0, uTime * 0.008)),
    fbm4(p * 0.55 + vec2(5.2, 1.3 - uTime * 0.006))
  );
  float base = fbm4(p + q * 0.95);
  float detail = noise2(p * 3.4 + q * 1.4) * 0.14;
  float threshold = mix(0.68, 0.24, coverage);
  return smoothstep(threshold, threshold + 0.34, base + detail);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float aspect = uResolution.x / max(1.0, uResolution.y);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  // 1. Atmospheric Sky Gradient (Rayleigh-like vertical profile)
  float h = clamp(uv.y, 0.0, 1.0);
  vec3 sky = mix(uSkyHorizon, uSkyMid, smoothstep(0.02, 0.52, h));
  sky = mix(sky, uSkyTop, smoothstep(0.45, 0.98, h));

  // 2. Twinkling Procedural Stars (clear/partly-cloudy night)
  if (uStarStrength > 0.01 && h > 0.12) {
    vec2 starUv = (uv + uParallax * 0.025) * vec2(aspect * 120.0, 120.0);
    vec2 cell = floor(starUv);
    vec2 frac = fract(starUv) - 0.5;
    float rnd = hash21(cell);
    if (rnd > 0.955) {
      vec2 jitter = (vec2(hash21(cell + 13.7), hash21(cell + 47.1)) - 0.5) * 0.55;
      float d = length(frac - jitter);
      float size = mix(0.035, 0.095, fract(rnd * 97.0));
      float twinkle = 0.55 + 0.45 * sin(uTime * (1.5 + rnd * 3.5) + rnd * 40.0);
      float starGlow = smoothstep(size, 0.0, d) * twinkle * uStarStrength * smoothstep(0.12, 0.38, h);
      vec3 starCol = mix(vec3(0.84, 0.91, 1.0), vec3(1.0, 0.93, 0.82), fract(rnd * 31.3));
      sky += starCol * starGlow * 1.35;
    }
  }

  // 3. Sun / Moon Disc + Atmospheric Mie Scattering Halo
  vec2 sunUv = uSunPos + uParallax * 0.04;
  vec2 sunP = (sunUv - 0.5) * vec2(aspect, 1.0);
  float distSun = length(p - sunP);

  if (uSunStrength > 0.01) {
    float mieWide = exp(-distSun * 2.1) * 0.34;
    float mieTight = exp(-distSun * 7.5) * 0.48;
    float disc = smoothstep(0.056, 0.036, distSun);
    // Subtle crepuscular shafts around sun
    float angle = atan(p.y - sunP.y, p.x - sunP.x);
    float shafts = 0.5 + 0.5 * sin(angle * 7.0 + uTime * 0.25) * cos(angle * 3.0 - uTime * 0.15);
    float rayGlow = exp(-distSun * 2.6) * shafts * 0.12;
    sky += uSunGlow * (mieWide + mieTight + rayGlow) * uSunStrength;
    sky = mix(sky, vec3(1.0, 0.99, 0.94), disc * clamp(uSunStrength * 1.2, 0.0, 1.0));
  }

  if (uMoonStrength > 0.01) {
    float moonHalo = exp(-distSun * 4.0) * 0.26 + exp(-distSun * 14.0) * 0.32;
    float moonDisc = smoothstep(0.044, 0.039, distSun);
    vec2 mLocal = (p - sunP) / 0.042;
    float craterNoise = fbm4(mLocal * 2.6 + vec2(3.1, 7.4));
    vec3 moonSurface = mix(vec3(0.82, 0.86, 0.93), vec3(0.98, 0.99, 1.0), smoothstep(0.35, 0.72, craterNoise));
    sky += vec3(0.68, 0.79, 0.98) * moonHalo * uMoonStrength;
    sky = mix(sky, moonSurface, moonDisc * uMoonStrength);
  }

  // 4. Perspective-Projected 3D Cloud Deck
  float horizonMask = smoothstep(0.08, 0.34, h);
  if (horizonMask > 0.002) {
    float planeY = max(0.075, h - 0.07);
    float perspectiveZ = 1.15 / planeY;
    vec2 cloudCoord = vec2(
      (uv.x - 0.5) * aspect * perspectiveZ * 0.95 + uWindOffset * 0.22 + uParallax.x * 0.18,
      perspectiveZ * 0.85 + uWindOffset * 0.03 + uParallax.y * 0.08
    );

    float cDensity = cloudField(cloudCoord, uCloudCoverage);
    // Directional light sampling toward sun for crisp silver-lining / backlit tops
    vec2 toSun = normalize(sunP - p + vec2(0.001, 0.25));
    float cSunSample = cloudField(cloudCoord + toSun * 0.24, uCloudCoverage);
    float lightTransmit = exp(-(cSunSample - cDensity * 0.35) * 1.65);

    // Second high-altitude wispy cloud layer for depth
    vec2 highCoord = cloudCoord * 1.65 + vec2(12.4 - uWindOffset * 0.08, 4.1);
    float highDensity = cloudField(highCoord, clamp(uCloudCoverage * 0.78, 0.0, 1.0)) * 0.45;

    float totalAlpha = clamp((cDensity * 0.92 + highDensity * (1.0 - cDensity * 0.5)) * uCloudDensity, 0.0, 0.98);
    totalAlpha *= horizonMask;

    // Cloud shading: sunlit top edge + depth belly + backlit sun scatter
    float forwardScatter = exp(-distSun * 3.0) * (1.0 - uNightFactor * 0.7) * 0.45;
    vec3 litCol = uCloudLit + uSunGlow * forwardScatter;
    vec3 cloudCol = mix(uCloudShade, litCol, clamp(lightTransmit * 0.82 + 0.12, 0.0, 1.0));

    // Internal volumetric lightning cloud glow during thunderstorm
    if (uLightningFlash > 0.01) {
      float flashDist = abs(uv.x - uLightningX);
      float internalGlow = exp(-flashDist * 3.6) * uLightningFlash * (0.45 + cDensity * 0.85);
      cloudCol += vec3(0.74, 0.84, 1.0) * internalGlow;
    }

    // Distance atmospheric aerial perspective near the horizon
    cloudCol = mix(uSkyHorizon, cloudCol, smoothstep(0.08, 0.42, h));
    sky = mix(sky, cloudCol, totalAlpha);
  }

  // 5. Distant Atmospheric Horizon Mist & Fog Veil
  float lowerMist = smoothstep(0.32, 0.0, h) * (0.42 + uFogFactor * 0.48);
  vec3 mistColor = mix(uSkyHorizon, mix(uSkyHorizon, vec3(0.82, 0.86, 0.90), 0.35), uFogFactor);
  sky = mix(sky, mistColor, clamp(lowerMist, 0.0, 0.92));

  if (uFogFactor > 0.05) {
    float fogWaves = fbm4(vec2(uv.x * 3.5 + uWindOffset * 0.14, uv.y * 4.5));
    sky = mix(sky, mistColor, uFogFactor * (0.35 + fogWaves * 0.25));
  }

  // Global lightning ambient sky flash
  if (uLightningFlash > 0.01) {
    sky += vec3(0.55, 0.66, 0.92) * uLightningFlash * 0.22;
  }

  // Subtle filmic vignette for text legibility at extreme top/bottom
  float edgeShade = smoothstep(0.0, 0.14, uv.y) * smoothstep(1.0, 0.82, uv.y);
  sky *= mix(0.84, 1.0, edgeShade);

  gl_FragColor = vec4(clamp(sky, 0.0, 1.0), 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function createLightningBolt(w: number, h: number): LightningBolt {
  const startX = w * (0.18 + Math.random() * 0.64);
  const startY = h * (0.04 + Math.random() * 0.1);
  const endY = h * (0.52 + Math.random() * 0.26);
  const segments: LightningSegment[] = [];

  const subdivide = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    disp: number,
    depth: number,
    width: number,
    alpha: number
  ) => {
    if (depth <= 0) {
      segments.push({ x1, y1, x2, y2, width, alpha });
      return;
    }
    const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * disp;
    const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * disp * 0.25;
    subdivide(x1, y1, midX, midY, disp * 0.54, depth - 1, width, alpha);
    subdivide(midX, midY, x2, y2, disp * 0.54, depth - 1, width, alpha);

    if (depth >= 2 && Math.random() < 0.42) {
      const branchLen = Math.hypot(x2 - x1, y2 - y1) * (0.48 + Math.random() * 0.4);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const bx = midX + dir * branchLen * (0.42 + Math.random() * 0.45);
      const by = midY + branchLen * (0.62 + Math.random() * 0.35);
      subdivide(midX, midY, bx, by, disp * 0.4, depth - 2, Math.max(1, width * 0.55), alpha * 0.72);
    }
  };

  subdivide(startX, startY, startX + (Math.random() - 0.5) * 160, endY, 115, 5, 2.8, 1);
  return {
    segments,
    life: 0.32,
    maxLife: 0.32,
    centerX: startX / Math.max(1, w),
  };
}

export const RealisticWeatherCanvas: React.FC<RealisticWeatherCanvasProps> = ({
  condition,
  temperature,
  windSpeed,
  cloudCover,
  timeOfDay,
  onLightningFlash,
}) => {
  const skyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({
    condition,
    temperature,
    windSpeed,
    cloudCover,
    timeOfDay,
    onLightningFlash,
  });
  propsRef.current = {
    condition,
    temperature,
    windSpeed,
    cloudCover,
    timeOfDay,
    onLightningFlash,
  };

  const pointerRef = useRef({ x: 0.5, y: 0.35 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX / Math.max(1, window.innerWidth);
      pointerRef.current.y = e.clientY / Math.max(1, window.innerHeight);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    const skyCanvas = skyCanvasRef.current;
    const fxCanvas = fxCanvasRef.current;
    if (!skyCanvas || !fxCanvas) return;

    const fxCtx = fxCanvas.getContext('2d');
    if (!fxCtx) return;

    // Layer 1: Try WebGL1 Volumetric Sky Shader, fallback cleanly to soft Canvas2D sky
    let gl: WebGLRenderingContext | null = null;
    let glProgram: WebGLProgram | null = null;
    let glReady = false;
    try {
      gl = skyCanvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
      if (gl) {
        glProgram = createProgram(gl);
        if (glProgram) {
          const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
          const posLoc = gl.getAttribLocation(glProgram, 'aPosition');
          gl.enableVertexAttribArray(posLoc);
          gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
          gl.useProgram(glProgram);
          glReady = true;
        }
      }
    } catch {
      glReady = false;
    }

    const fallbackCtx = !glReady ? skyCanvas.getContext('2d') : null;

    const uniforms =
      glReady && gl && glProgram
        ? {
            uResolution: gl.getUniformLocation(glProgram, 'uResolution'),
            uTime: gl.getUniformLocation(glProgram, 'uTime'),
            uWindOffset: gl.getUniformLocation(glProgram, 'uWindOffset'),
            uParallax: gl.getUniformLocation(glProgram, 'uParallax'),
            uSkyTop: gl.getUniformLocation(glProgram, 'uSkyTop'),
            uSkyMid: gl.getUniformLocation(glProgram, 'uSkyMid'),
            uSkyHorizon: gl.getUniformLocation(glProgram, 'uSkyHorizon'),
            uCloudLit: gl.getUniformLocation(glProgram, 'uCloudLit'),
            uCloudShade: gl.getUniformLocation(glProgram, 'uCloudShade'),
            uSunGlow: gl.getUniformLocation(glProgram, 'uSunGlow'),
            uCloudCoverage: gl.getUniformLocation(glProgram, 'uCloudCoverage'),
            uCloudDensity: gl.getUniformLocation(glProgram, 'uCloudDensity'),
            uSunStrength: gl.getUniformLocation(glProgram, 'uSunStrength'),
            uSunPos: gl.getUniformLocation(glProgram, 'uSunPos'),
            uMoonStrength: gl.getUniformLocation(glProgram, 'uMoonStrength'),
            uStarStrength: gl.getUniformLocation(glProgram, 'uStarStrength'),
            uNightFactor: gl.getUniformLocation(glProgram, 'uNightFactor'),
            uFogFactor: gl.getUniformLocation(glProgram, 'uFogFactor'),
            uLightningFlash: gl.getUniformLocation(glProgram, 'uLightningFlash'),
            uLightningX: gl.getUniformLocation(glProgram, 'uLightningX'),
          }
        : null;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      const skyDpr = Math.min(window.devicePixelRatio || 1, 1.25);
      skyCanvas.width = Math.max(1, Math.floor(width * skyDpr));
      skyCanvas.height = Math.max(1, Math.floor(height * skyDpr));
      skyCanvas.style.width = `${width}px`;
      skyCanvas.style.height = `${height}px`;
      if (glReady && gl) {
        gl.viewport(0, 0, skyCanvas.width, skyCanvas.height);
      } else if (fallbackCtx) {
        fallbackCtx.setTransform(skyDpr, 0, 0, skyDpr, 0, 0);
      }

      const fxDpr = Math.min(window.devicePixelRatio || 1, 2);
      fxCanvas.width = Math.max(1, Math.floor(width * fxDpr));
      fxCanvas.height = Math.max(1, Math.floor(height * fxDpr));
      fxCanvas.style.width = `${width}px`;
      fxCanvas.style.height = `${height}px`;
      fxCtx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Layer 2 particle pools
    const raindrops: RainDrop[] = Array.from({ length: 300 }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        len: 14 + layer * 14 + Math.random() * 12,
        speed: 560 + layer * 260 + Math.random() * 180,
        layer,
        opacity: 0.14 + layer * 0.14,
        width: 0.7 + layer * 0.45,
      };
    });

    const splashes: SplashRing[] = [];

    const glassDrops: GlassDrop[] = Array.from({ length: 36 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2 + Math.random() * 4.2,
      vy: 0,
      sliding: Math.random() < 0.25,
      wobblePhase: Math.random() * Math.PI * 2,
      trail: [],
    }));

    const snowflakes: SnowFlake[] = Array.from({ length: 190 }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r:
          layer === 2
            ? 4.2 + Math.random() * 4.5
            : layer === 1
            ? 2.1 + Math.random() * 2.0
            : 1.0 + Math.random() * 1.1,
        vy: 28 + layer * 24 + Math.random() * 20,
        vxDrift: (Math.random() - 0.5) * 18,
        phase: Math.random() * Math.PI * 2,
        layer,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.4,
        crystalline: layer === 1 && Math.random() < 0.45,
      };
    });

    const fogBanks: FogBank[] = Array.from({ length: 8 }, (_, i) => ({
      x: (i / 8) * (width + 500) - 250,
      yRatio: 0.28 + (i % 4) * 0.17,
      w: 440 + Math.random() * 360,
      h: 150 + Math.random() * 130,
      speed: 10 + Math.random() * 16,
      alpha: 0.1 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
    }));

    const windStreaks: WindStreak[] = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      len: 140 + Math.random() * 220,
      speed: 240 + Math.random() * 220,
      amp: 9 + Math.random() * 16,
      freq: 0.014 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.07 + Math.random() * 0.1,
    }));

    let lightningBolt: LightningBolt | null = null;
    let lightningFlash = 0;
    let lightningX = 0.5;
    let nextLightningCountdown = 1.6;
    let meteor: Meteor | null = null;
    let nextMeteorCountdown = 5.5;

    // Smoothed atmospheric uniform states
    let curTheme: SkyTheme = getSkyTheme(propsRef.current.condition, propsRef.current.timeOfDay);
    let curCoverage = 0.45;
    let curDensity = 0.72;
    let curSunStrength = 0.8;
    let curMoonStrength = 0;
    let curStarStrength = 0;
    let curNightFactor = 0;
    let curFogFactor = 0;
    let curSunPos: [number, number] = [0.76, 0.78];

    let windOffset = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    let rafId = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsed += dt;

      const {
        condition: cond,
        temperature: temp,
        windSpeed: wind,
        cloudCover: cover,
        timeOfDay: tod,
        onLightningFlash,
      } = propsRef.current;

      windOffset += dt * (0.28 + clamp(wind, 0, 70) * 0.032);

      // Lightning trigger
      if (cond === 'thunderstorm') {
        nextLightningCountdown -= dt;
        if (nextLightningCountdown <= 0) {
          lightningBolt = createLightningBolt(width, height);
          lightningFlash = 0.95;
          lightningX = lightningBolt.centerX;
          nextLightningCountdown = 2.8 + Math.random() * 4.4;
          onLightningFlash?.();
        }
      } else {
        lightningBolt = null;
        lightningFlash = Math.max(0, lightningFlash - dt * 3);
      }

      const blend = Math.min(1, dt * 3.0);
      const targetTheme = getSkyTheme(cond, tod);
      curTheme = {
        top: lerpRgb(curTheme.top, targetTheme.top, blend),
        mid: lerpRgb(curTheme.mid, targetTheme.mid, blend),
        horizon: lerpRgb(curTheme.horizon, targetTheme.horizon, blend),
        cloudLit: lerpRgb(curTheme.cloudLit, targetTheme.cloudLit, blend),
        cloudShade: lerpRgb(curTheme.cloudShade, targetTheme.cloudShade, blend),
        sunGlow: lerpRgb(curTheme.sunGlow, targetTheme.sunGlow, blend),
      };

      const isNight = tod === 'night';
      const isStorm = cond === 'thunderstorm' || cond === 'heavy-rain';
      const isRainy = cond === 'drizzle' || cond === 'rain' || isStorm;
      const isSnow = cond === 'snow' || cond === 'blizzard';

      const targetCoverage =
        cond === 'clear'
          ? clamp(cover / 100, 0.14, 0.34)
          : cond === 'partly-cloudy'
          ? 0.5
          : cond === 'windy'
          ? 0.44
          : cond === 'fog'
          ? 0.62
          : cond === 'snow'
          ? 0.76
          : cond === 'blizzard'
          ? 0.88
          : cond === 'overcast'
          ? 0.84
          : 0.92;

      const targetDensity =
        cond === 'clear'
          ? 0.42
          : cond === 'partly-cloudy' || cond === 'windy'
          ? 0.78
          : cond === 'fog'
          ? 0.65
          : 0.94;

      const targetSun =
        isNight || isStorm || cond === 'rain' || cond === 'overcast' || isSnow
          ? 0
          : cond === 'clear' || cond === 'windy'
          ? 1
          : cond === 'partly-cloudy'
          ? 0.82
          : cond === 'drizzle'
          ? 0.25
          : 0.3;

      const targetMoon =
        isNight && !isStorm && cond !== 'rain' && cond !== 'blizzard'
          ? cond === 'clear'
            ? 1
            : cond === 'partly-cloudy' || cond === 'windy'
            ? 0.76
            : 0.22
          : 0;

      const targetStar =
        isNight && (cond === 'clear' || cond === 'partly-cloudy' || cond === 'windy')
          ? cond === 'clear'
            ? 1
            : 0.6
          : 0;

      const targetSunPos: [number, number] = [
        tod === 'dawn' ? 0.25 : tod === 'sunset' ? 0.76 : 0.76,
        tod === 'dawn' || tod === 'sunset' ? 0.46 : 0.79, // WebGL UV y=1 top
      ];

      curCoverage = lerp(curCoverage, targetCoverage, blend);
      curDensity = lerp(curDensity, targetDensity, blend);
      curSunStrength = lerp(curSunStrength, targetSun, blend);
      curMoonStrength = lerp(curMoonStrength, targetMoon, blend);
      curStarStrength = lerp(curStarStrength, targetStar, blend);
      curNightFactor = lerp(curNightFactor, isNight ? 1 : 0, blend);
      curFogFactor = lerp(curFogFactor, cond === 'fog' ? 0.85 : cond === 'drizzle' ? 0.2 : 0, blend);
      curSunPos = [lerp(curSunPos[0], targetSunPos[0], blend), lerp(curSunPos[1], targetSunPos[1], blend)];

      const px = pointerRef.current.x - 0.5;
      const py = pointerRef.current.y - 0.5;

      // Render Layer 1 Sky
      if (glReady && gl && uniforms) {
        gl.uniform2f(uniforms.uResolution, skyCanvas.width, skyCanvas.height);
        gl.uniform1f(uniforms.uTime, elapsed);
        gl.uniform1f(uniforms.uWindOffset, windOffset);
        gl.uniform2f(uniforms.uParallax, px, -py);

        gl.uniform3f(uniforms.uSkyTop, curTheme.top[0], curTheme.top[1], curTheme.top[2]);
        gl.uniform3f(uniforms.uSkyMid, curTheme.mid[0], curTheme.mid[1], curTheme.mid[2]);
        gl.uniform3f(uniforms.uSkyHorizon, curTheme.horizon[0], curTheme.horizon[1], curTheme.horizon[2]);
        gl.uniform3f(uniforms.uCloudLit, curTheme.cloudLit[0], curTheme.cloudLit[1], curTheme.cloudLit[2]);
        gl.uniform3f(uniforms.uCloudShade, curTheme.cloudShade[0], curTheme.cloudShade[1], curTheme.cloudShade[2]);
        gl.uniform3f(uniforms.uSunGlow, curTheme.sunGlow[0], curTheme.sunGlow[1], curTheme.sunGlow[2]);

        gl.uniform1f(uniforms.uCloudCoverage, curCoverage);
        gl.uniform1f(uniforms.uCloudDensity, curDensity);
        gl.uniform1f(uniforms.uSunStrength, curSunStrength);
        gl.uniform2f(uniforms.uSunPos, curSunPos[0], curSunPos[1]);
        gl.uniform1f(uniforms.uMoonStrength, curMoonStrength);
        gl.uniform1f(uniforms.uStarStrength, curStarStrength);
        gl.uniform1f(uniforms.uNightFactor, curNightFactor);
        gl.uniform1f(uniforms.uFogFactor, curFogFactor);
        gl.uniform1f(uniforms.uLightningFlash, lightningFlash);
        gl.uniform1f(uniforms.uLightningX, lightningX);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (fallbackCtx) {
        // Graceful Canvas2D atmospheric fallback
        const g = fallbackCtx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, rgb255(curTheme.top));
        g.addColorStop(0.55, rgb255(curTheme.mid));
        g.addColorStop(1, rgb255(curTheme.horizon));
        fallbackCtx.fillStyle = g;
        fallbackCtx.fillRect(0, 0, width, height);

        if (curSunStrength > 0.05) {
          const sx = curSunPos[0] * width;
          const sy = (1 - curSunPos[1]) * height;
          const sg = fallbackCtx.createRadialGradient(sx, sy, 8, sx, sy, Math.max(width, height) * 0.45);
          sg.addColorStop(0, `rgba(255,252,238,${curSunStrength * 0.9})`);
          sg.addColorStop(0.2, rgb255(curTheme.sunGlow, curSunStrength * 0.35));
          sg.addColorStop(1, rgb255(curTheme.sunGlow, 0));
          fallbackCtx.fillStyle = sg;
          fallbackCtx.fillRect(0, 0, width, height);
        }

        // Soft volumetric mist clouds (radial soft gradients, never hard circles)
        for (let i = 0; i < 6; i++) {
          const cx = (((i * 290 + windOffset * 34 * (0.6 + (i % 3) * 0.25)) % (width + 420)) + (width + 420)) % (width + 420) - 210;
          const cy = height * (0.14 + (i % 3) * 0.11);
          const rx = 210 + (i % 3) * 70;
          const ry = 70 + (i % 2) * 25;
          const cg = fallbackCtx.createRadialGradient(cx, cy - ry * 0.2, 10, cx, cy, rx);
          cg.addColorStop(0, rgb255(curTheme.cloudLit, curDensity * 0.45));
          cg.addColorStop(0.55, rgb255(curTheme.cloudShade, curDensity * 0.22));
          cg.addColorStop(1, rgb255(curTheme.cloudShade, 0));
          fallbackCtx.fillStyle = cg;
          fallbackCtx.beginPath();
          fallbackCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          fallbackCtx.fill();
        }
      }

      // Render Layer 2 Foreground Particles & Optical Effects
      fxCtx.clearRect(0, 0, width, height);

      if (lightningFlash > 0.01) {
        lightningFlash = Math.max(0, lightningFlash - dt * 2.9);
      }

      // Shooting stars on clear/partly-cloudy night
      if (isNight && (cond === 'clear' || cond === 'partly-cloudy')) {
        nextMeteorCountdown -= dt;
        if (nextMeteorCountdown <= 0 && !meteor) {
          meteor = {
            x: width * (0.18 + Math.random() * 0.6),
            y: height * (0.06 + Math.random() * 0.2),
            vx: 460 + Math.random() * 200,
            vy: 150 + Math.random() * 100,
            life: 0.52,
            maxLife: 0.52,
          };
          nextMeteorCountdown = 6.5 + Math.random() * 9;
        }
        if (meteor) {
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          meteor.life -= dt;
          const mAlpha = Math.max(0, meteor.life / meteor.maxLife);
          const mGrad = fxCtx.createLinearGradient(
            meteor.x,
            meteor.y,
            meteor.x - meteor.vx * 0.13,
            meteor.y - meteor.vy * 0.13
          );
          mGrad.addColorStop(0, `rgba(255, 255, 255, ${mAlpha})`);
          mGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          fxCtx.strokeStyle = mGrad;
          fxCtx.lineWidth = 1.8;
          fxCtx.beginPath();
          fxCtx.moveTo(meteor.x, meteor.y);
          fxCtx.lineTo(meteor.x - meteor.vx * 0.13, meteor.y - meteor.vy * 0.13);
          fxCtx.stroke();
          if (meteor.life <= 0) meteor = null;
        }
      }

      // Branching lightning bolt
      if (lightningBolt && lightningBolt.life > 0) {
        lightningBolt.life -= dt;
        const boltAlpha = Math.max(0, lightningBolt.life / lightningBolt.maxLife);
        fxCtx.save();
        fxCtx.lineCap = 'round';
        fxCtx.lineJoin = 'round';
        for (const seg of lightningBolt.segments) {
          fxCtx.strokeStyle = `rgba(170, 205, 255, ${boltAlpha * seg.alpha * 0.45})`;
          fxCtx.lineWidth = seg.width * 4.5;
          fxCtx.beginPath();
          fxCtx.moveTo(seg.x1, seg.y1);
          fxCtx.lineTo(seg.x2, seg.y2);
          fxCtx.stroke();

          fxCtx.strokeStyle = `rgba(248, 250, 255, ${boltAlpha * seg.alpha})`;
          fxCtx.lineWidth = seg.width;
          fxCtx.beginPath();
          fxCtx.moveTo(seg.x1, seg.y1);
          fxCtx.lineTo(seg.x2, seg.y2);
          fxCtx.stroke();
        }
        fxCtx.restore();
      }

      // Drifting fog mist banks
      if (cond === 'fog' || cond === 'drizzle') {
        const fogStrength = cond === 'fog' ? 0.9 : 0.26;
        for (const fb of fogBanks) {
          fb.x += (fb.speed + wind * 0.45) * dt;
          if (fb.x - fb.w * 0.5 > width) fb.x = -fb.w * 0.6;
          const fy = height * fb.yRatio + Math.sin(elapsed * 0.35 + fb.phase) * 14;
          const grad = fxCtx.createRadialGradient(fb.x, fy, fb.h * 0.1, fb.x, fy, fb.w * 0.52);
          const fAlpha = fb.alpha * fogStrength;
          const fogTone = isNight ? '128, 148, 182' : '236, 244, 252';
          grad.addColorStop(0, `rgba(${fogTone}, ${fAlpha})`);
          grad.addColorStop(0.6, `rgba(${fogTone}, ${fAlpha * 0.4})`);
          grad.addColorStop(1, `rgba(${fogTone}, 0)`);
          fxCtx.fillStyle = grad;
          fxCtx.beginPath();
          fxCtx.ellipse(fb.x, fy, fb.w * 0.55, fb.h * 0.5, 0, 0, Math.PI * 2);
          fxCtx.fill();
        }
      }

      // Slanted rain streaks + ground splashes + camera glass droplets
      if (isRainy) {
        const rainDensity = cond === 'drizzle' ? 0.35 : cond === 'rain' ? 0.68 : 1;
        const activeDrops = Math.floor(raindrops.length * rainDensity);
        const speedMult = cond === 'drizzle' ? 0.68 : cond === 'rain' ? 1 : 1.32;
        const windTilt = (wind / 42) * 0.36 + (cond === 'thunderstorm' ? 0.14 : 0.04);

        fxCtx.save();
        fxCtx.lineCap = 'round';
        for (let i = 0; i < activeDrops; i++) {
          const d = raindrops[i];
          const vy = d.speed * speedMult;
          const vx = vy * windTilt;
          d.x += vx * dt;
          d.y += vy * dt;

          if (d.y > height + 20) {
            if (d.layer >= 1 && splashes.length < 30 && Math.random() < 0.22) {
              const sy = height - 8 - Math.random() * 24;
              splashes.push({
                x: d.x,
                y: sy,
                radius: 2,
                maxRadius: 10 + d.layer * 6,
                alpha: 0.48,
                particles: [
                  { x: d.x, y: sy, vx: -26 - Math.random() * 24, vy: -32 - Math.random() * 22 },
                  { x: d.x, y: sy, vx: 26 + Math.random() * 24, vy: -32 - Math.random() * 22 },
                ],
              });
            }
            d.y = -30 - Math.random() * 80;
            d.x = Math.random() * (width + 240) - 120;
          }
          if (d.x > width + 140) d.x -= width + 240;

          const tailX = d.x - windTilt * d.len * speedMult;
          const tailY = d.y - d.len * speedMult;
          const grad = fxCtx.createLinearGradient(tailX, tailY, d.x, d.y);
          grad.addColorStop(0, 'rgba(210, 232, 255, 0)');
          grad.addColorStop(1, `rgba(220, 238, 255, ${d.opacity})`);
          fxCtx.strokeStyle = grad;
          fxCtx.lineWidth = d.width;
          fxCtx.beginPath();
          fxCtx.moveTo(tailX, tailY);
          fxCtx.lineTo(d.x, d.y);
          fxCtx.stroke();
        }
        fxCtx.restore();

        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.radius += dt * 40;
          sp.alpha -= dt * 1.45;
          if (sp.alpha <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(i, 1);
            continue;
          }
          fxCtx.strokeStyle = `rgba(215, 236, 255, ${sp.alpha * 0.65})`;
          fxCtx.lineWidth = 1.1;
          fxCtx.beginPath();
          fxCtx.ellipse(sp.x, sp.y, sp.radius, sp.radius * 0.34, 0, 0, Math.PI * 2);
          fxCtx.stroke();

          fxCtx.fillStyle = `rgba(232, 245, 255, ${sp.alpha * 0.8})`;
          for (const p of sp.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 170 * dt;
            fxCtx.beginPath();
            fxCtx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
            fxCtx.fill();
          }
        }

        // Camera lens droplets
        const activeGlass = cond === 'drizzle' ? 14 : cond === 'rain' ? 24 : 36;
        for (let i = 0; i < activeGlass; i++) {
          const gd = glassDrops[i];
          if (gd.sliding) {
            gd.vy = Math.min(44, gd.vy + dt * 13);
            gd.y += gd.vy * dt;
            gd.x += Math.sin(elapsed * 3 + gd.wobblePhase) * 0.22;
            if (Math.random() < 0.32) {
              gd.trail.push({ x: gd.x, y: gd.y - gd.r * 0.5, r: gd.r * 0.36 });
              if (gd.trail.length > 7) gd.trail.shift();
            }
            if (gd.y > height + 16) {
              gd.y = -10;
              gd.x = Math.random() * width;
              gd.vy = 2;
              gd.trail = [];
            }
          }

          for (const tr of gd.trail) {
            fxCtx.fillStyle = 'rgba(210, 232, 255, 0.12)';
            fxCtx.beginPath();
            fxCtx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
            fxCtx.fill();
          }

          const dropGrad = fxCtx.createRadialGradient(
            gd.x - gd.r * 0.28,
            gd.y - gd.r * 0.28,
            gd.r * 0.1,
            gd.x,
            gd.y,
            gd.r
          );
          dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
          dropGrad.addColorStop(0.55, 'rgba(180, 214, 248, 0.14)');
          dropGrad.addColorStop(1, 'rgba(30, 58, 96, 0.24)');

          fxCtx.fillStyle = dropGrad;
          fxCtx.beginPath();
          fxCtx.arc(gd.x, gd.y, gd.r, 0, Math.PI * 2);
          fxCtx.fill();

          fxCtx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
          fxCtx.lineWidth = 0.65;
          fxCtx.stroke();

          fxCtx.fillStyle = 'rgba(255, 255, 255, 0.68)';
          fxCtx.beginPath();
          fxCtx.arc(gd.x - gd.r * 0.34, gd.y - gd.r * 0.34, Math.max(0.7, gd.r * 0.22), 0, Math.PI * 2);
          fxCtx.fill();
        }
      }

      // Multi-depth snow & frost vignette
      if (isSnow) {
        const snowDensity = cond === 'blizzard' ? 1 : 0.65;
        const activeSnow = Math.floor(snowflakes.length * snowDensity);
        const snowWind = cond === 'blizzard' ? Math.max(68, wind * 3.2) : wind * 1.3;

        for (let i = 0; i < activeSnow; i++) {
          const sf = snowflakes[i];
          const sway = Math.sin(elapsed * 1.6 + sf.phase) * (15 + sf.layer * 9);
          sf.x += (snowWind * (0.4 + sf.layer * 0.35) + sf.vxDrift + sway) * dt;
          sf.y += sf.vy * (cond === 'blizzard' ? 1.4 : 1) * dt;
          sf.rotation += sf.rotSpeed * dt;

          if (sf.y > height + 18) {
            sf.y = -16;
            sf.x = Math.random() * width;
          }
          if (sf.x > width + 24) sf.x = -20;
          if (sf.x < -24) sf.x = width + 20;

          if (sf.layer === 2) {
            const fgGrad = fxCtx.createRadialGradient(sf.x, sf.y, 0, sf.x, sf.y, sf.r);
            fgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.66)');
            fgGrad.addColorStop(0.6, 'rgba(235, 246, 255, 0.24)');
            fgGrad.addColorStop(1, 'rgba(235, 246, 255, 0)');
            fxCtx.fillStyle = fgGrad;
            fxCtx.beginPath();
            fxCtx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2);
            fxCtx.fill();
          } else if (sf.crystalline) {
            fxCtx.save();
            fxCtx.translate(sf.x, sf.y);
            fxCtx.rotate(sf.rotation);
            fxCtx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
            fxCtx.lineWidth = 0.95;
            for (let arm = 0; arm < 3; arm++) {
              fxCtx.rotate(Math.PI / 3);
              fxCtx.beginPath();
              fxCtx.moveTo(-sf.r, 0);
              fxCtx.lineTo(sf.r, 0);
              fxCtx.stroke();
            }
            fxCtx.restore();
          } else {
            fxCtx.fillStyle = `rgba(255, 255, 255, ${0.4 + sf.layer * 0.24})`;
            fxCtx.beginPath();
            fxCtx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2);
            fxCtx.fill();
          }
        }
      }

      if (temp <= 0 || isSnow) {
        const frostStrength = isSnow ? 0.22 : Math.min(0.2, (1 - temp) * 0.03);
        const frostGrad = fxCtx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.min(width, height) * 0.36,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.75
        );
        frostGrad.addColorStop(0, 'rgba(210, 238, 255, 0)');
        frostGrad.addColorStop(1, `rgba(205, 236, 255, ${frostStrength})`);
        fxCtx.fillStyle = frostGrad;
        fxCtx.fillRect(0, 0, width, height);
      }

      // Wind streaks
      if (cond === 'windy' || wind >= 24) {
        const windFactor = Math.min(2, wind / 22);
        fxCtx.save();
        for (const ws of windStreaks) {
          ws.x += ws.speed * windFactor * dt;
          if (ws.x - ws.len > width) {
            ws.x = -ws.len - Math.random() * 140;
            ws.y = Math.random() * height * 0.85;
          }
          const grad = fxCtx.createLinearGradient(ws.x - ws.len, ws.y, ws.x, ws.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${ws.alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          fxCtx.strokeStyle = grad;
          fxCtx.lineWidth = 1.2;
          fxCtx.beginPath();
          for (let xOff = 0; xOff <= ws.len; xOff += 14) {
            const sx = ws.x - ws.len + xOff;
            const sy = ws.y + Math.sin(xOff * ws.freq + elapsed * 3 + ws.phase) * ws.amp;
            if (xOff === 0) fxCtx.moveTo(sx, sy);
            else fxCtx.lineTo(sx, sy);
          }
          fxCtx.stroke();
        }
        fxCtx.restore();
      }

      // Scorching sun heat shimmer near lower horizon
      if (temp >= 31 && !isNight && (cond === 'clear' || cond === 'partly-cloudy' || cond === 'windy')) {
        fxCtx.save();
        for (let i = 0; i < 4; i++) {
          const hy = height * (0.74 + i * 0.055);
          const waveOffset = Math.sin(elapsed * 4 + i * 1.4) * 16;
          const shimmerGrad = fxCtx.createLinearGradient(0, hy, width, hy);
          shimmerGrad.addColorStop(0, 'rgba(255, 232, 178, 0)');
          shimmerGrad.addColorStop(0.5, 'rgba(255, 240, 198, 0.055)');
          shimmerGrad.addColorStop(1, 'rgba(255, 232, 178, 0)');
          fxCtx.strokeStyle = shimmerGrad;
          fxCtx.lineWidth = 2.2;
          fxCtx.beginPath();
          fxCtx.moveTo(0, hy + waveOffset * 0.15);
          fxCtx.bezierCurveTo(
            width * 0.33,
            hy - waveOffset * 0.3,
            width * 0.66,
            hy + waveOffset * 0.3,
            width,
            hy
          );
          fxCtx.stroke();
        }
        fxCtx.restore();
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={skyCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
      <canvas
        ref={fxCanvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
    </>
  );
};
