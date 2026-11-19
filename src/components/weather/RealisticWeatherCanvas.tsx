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

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
  hue: string;
}

interface CloudPuff {
  ox: number;
  oy: number;
  r: number;
  shade: number;
}

interface Cloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  layer: number; // 0 far, 1 mid, 2 near
  opacity: number;
  puffs: CloudPuff[];
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  layer: number; // 0 far, 1 mid, 2 near
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
  layer: number; // 0 far, 1 mid, 2 foreground bokeh
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

interface WindRibbon {
  x: number;
  y: number;
  len: number;
  speed: number;
  amp: number;
  freq: number;
  phase: number;
  alpha: number;
}

interface DriftingLeaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  rotSpeed: number;
  color: string;
  phase: number;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  r: number;
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

interface SkyPalette {
  top: [number, number, number];
  mid: [number, number, number];
  horizon: [number, number, number];
  cloudTop: [number, number, number];
  cloudBottom: [number, number, number];
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
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

function rgbStr(c: [number, number, number], alpha = 1): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

function getSkyPalette(condition: WeatherCondition, timeOfDay: TimeOfDay): SkyPalette {
  const isStorm = condition === 'thunderstorm' || condition === 'heavy-rain';
  const isRainy = condition === 'rain' || condition === 'drizzle' || condition === 'overcast';
  const isSnow = condition === 'snow' || condition === 'blizzard';
  const isFog = condition === 'fog';

  if (timeOfDay === 'night') {
    if (isStorm) {
      return {
        top: [9, 13, 28],
        mid: [18, 25, 48],
        horizon: [28, 38, 66],
        cloudTop: [46, 56, 86],
        cloudBottom: [14, 18, 34],
      };
    }
    if (isRainy || isFog) {
      return {
        top: [14, 21, 42],
        mid: [27, 38, 68],
        horizon: [45, 58, 92],
        cloudTop: [70, 84, 118],
        cloudBottom: [28, 36, 58],
      };
    }
    if (isSnow) {
      return {
        top: [18, 28, 56],
        mid: [36, 52, 92],
        horizon: [66, 88, 132],
        cloudTop: [120, 142, 178],
        cloudBottom: [52, 68, 102],
      };
    }
    return {
      top: [7, 13, 34],
      mid: [16, 30, 68],
      horizon: [33, 56, 108],
      cloudTop: [96, 122, 168],
      cloudBottom: [35, 50, 86],
    };
  }

  if (timeOfDay === 'dawn') {
    if (isStorm) {
      return {
        top: [32, 42, 68],
        mid: [62, 66, 94],
        horizon: [96, 86, 106],
        cloudTop: [110, 108, 132],
        cloudBottom: [42, 46, 68],
      };
    }
    return {
      top: [38, 64, 122],
      mid: [122, 118, 168],
      horizon: [242, 174, 148],
      cloudTop: [255, 225, 210],
      cloudBottom: [140, 128, 165],
    };
  }

  if (timeOfDay === 'sunset') {
    if (isStorm) {
      return {
        top: [28, 35, 58],
        mid: [58, 54, 80],
        horizon: [104, 72, 78],
        cloudTop: [128, 92, 102],
        cloudBottom: [38, 38, 56],
      };
    }
    if (isRainy || isFog) {
      return {
        top: [54, 68, 102],
        mid: [98, 96, 124],
        horizon: [166, 126, 118],
        cloudTop: [195, 162, 154],
        cloudBottom: [84, 82, 104],
      };
    }
    return {
      top: [32, 62, 128],
      mid: [128, 92, 142],
      horizon: [248, 148, 96],
      cloudTop: [255, 210, 170],
      cloudBottom: [125, 86, 118],
    };
  }

  // Daytime
  if (isStorm) {
    return {
      top: [24, 34, 52],
      mid: [42, 56, 78],
      horizon: [68, 84, 108],
      cloudTop: [94, 108, 128],
      cloudBottom: [30, 38, 54],
    };
  }
  if (isRainy) {
    return {
      top: [52, 74, 104],
      mid: [82, 104, 134],
      horizon: [126, 146, 172],
      cloudTop: [176, 190, 208],
      cloudBottom: [76, 92, 116],
    };
  }
  if (isSnow) {
    return {
      top: [82, 108, 142],
      mid: [128, 152, 182],
      horizon: [188, 204, 224],
      cloudTop: [232, 240, 250],
      cloudBottom: [132, 150, 176],
    };
  }
  if (isFog) {
    return {
      top: [96, 116, 138],
      mid: [142, 158, 174],
      horizon: [192, 202, 212],
      cloudTop: [224, 232, 240],
      cloudBottom: [148, 162, 176],
    };
  }
  if (condition === 'partly-cloudy') {
    return {
      top: [26, 98, 186],
      mid: [68, 148, 224],
      horizon: [152, 204, 244],
      cloudTop: [255, 255, 255],
      cloudBottom: [164, 192, 224],
    };
  }
  return {
    top: [18, 92, 196],
    mid: [54, 148, 236],
    horizon: [145, 208, 252],
    cloudTop: [255, 255, 255],
    cloudBottom: [182, 214, 244],
  };
}

function buildCloud(w: number, h: number, layer: number): Cloud {
  const puffCount = 6 + Math.floor(Math.random() * 4);
  const puffs: CloudPuff[] = [];
  for (let i = 0; i < puffCount; i++) {
    const t = i / (puffCount - 1) - 0.5;
    puffs.push({
      ox: t * 150 + (Math.random() - 0.5) * 28,
      oy: -Math.cos(t * Math.PI) * 24 + (Math.random() - 0.5) * 16,
      r: (38 + Math.random() * 34) * (1 - Math.abs(t) * 0.35),
      shade: Math.random() * 0.25,
    });
  }
  return {
    x: Math.random() * (w + 360) - 180,
    y: h * (0.08 + layer * 0.09 + Math.random() * 0.11),
    scale: 0.75 + layer * 0.38 + Math.random() * 0.35,
    speed: (8 + layer * 9 + Math.random() * 6),
    layer,
    opacity: 0.52 + layer * 0.16,
    puffs,
  };
}

function createLightningBolt(w: number, h: number): LightningBolt {
  const startX = w * (0.18 + Math.random() * 0.64);
  const startY = h * (0.04 + Math.random() * 0.12);
  const endY = h * (0.55 + Math.random() * 0.3);
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

    // Fork branch
    if (depth >= 2 && Math.random() < 0.42) {
      const branchLen = Math.hypot(x2 - x1, y2 - y1) * (0.5 + Math.random() * 0.45);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const bx = midX + dir * branchLen * (0.45 + Math.random() * 0.5);
      const by = midY + branchLen * (0.65 + Math.random() * 0.4);
      subdivide(midX, midY, bx, by, disp * 0.4, depth - 2, Math.max(1, width * 0.55), alpha * 0.72);
    }
  };

  subdivide(startX, startY, startX + (Math.random() - 0.5) * 180, endY, 130, 5, 3.2, 1);
  return {
    segments,
    life: 0.34,
    maxLife: 0.34,
    centerX: startX,
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef({ condition, temperature, windSpeed, cloudCover, timeOfDay, onLightningFlash });
  propsRef.current = { condition, temperature, windSpeed, cloudCover, timeOfDay, onLightningFlash };

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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Persistent scene pools
    const stars: Star[] = Array.from({ length: 135 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.68,
      radius: 0.55 + Math.random() * 1.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 2.2,
      hue: Math.random() < 0.2 ? '200, 228, 255' : Math.random() < 0.15 ? '255, 232, 198' : '255, 255, 255',
    }));

    const clouds: Cloud[] = Array.from({ length: 14 }, (_, i) => buildCloud(width, height, i % 3));

    const raindrops: RainDrop[] = Array.from({ length: 340 }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        len: 12 + layer * 13 + Math.random() * 12,
        speed: 520 + layer * 260 + Math.random() * 180,
        layer,
        opacity: 0.18 + layer * 0.16,
        width: 0.8 + layer * 0.55,
      };
    });

    const splashes: SplashRing[] = [];

    const glassDrops: GlassDrop[] = Array.from({ length: 44 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2 + Math.random() * 4.5,
      vy: 0,
      sliding: Math.random() < 0.28,
      wobblePhase: Math.random() * Math.PI * 2,
      trail: [],
    }));

    const snowflakes: SnowFlake[] = Array.from({ length: 200 }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: layer === 2 ? 4.5 + Math.random() * 4.5 : layer === 1 ? 2.2 + Math.random() * 2.2 : 1.1 + Math.random() * 1.1,
        vy: 28 + layer * 26 + Math.random() * 22,
        vxDrift: (Math.random() - 0.5) * 18,
        phase: Math.random() * Math.PI * 2,
        layer,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.4,
        crystalline: layer === 1 && Math.random() < 0.45,
      };
    });

    const fogBanks: FogBank[] = Array.from({ length: 9 }, (_, i) => ({
      x: (i / 9) * (width + 500) - 250,
      yRatio: 0.25 + (i % 4) * 0.18,
      w: 440 + Math.random() * 380,
      h: 150 + Math.random() * 140,
      speed: 10 + Math.random() * 18,
      alpha: 0.14 + Math.random() * 0.14,
      phase: Math.random() * Math.PI * 2,
    }));

    const windRibbons: WindRibbon[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.85,
      len: 140 + Math.random() * 220,
      speed: 240 + Math.random() * 220,
      amp: 10 + Math.random() * 18,
      freq: 0.014 + Math.random() * 0.012,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.08 + Math.random() * 0.12,
    }));

    const leaves: DriftingLeaf[] = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 70 + Math.random() * 95,
      vy: 18 + Math.random() * 32,
      size: 5 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 3.5,
      color: ['#f59e0b', '#ea580c', '#fbbf24', '#a3e635'][Math.floor(Math.random() * 4)],
      phase: Math.random() * Math.PI * 2,
    }));

    const fireflies: Firefly[] = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: height * (0.45 + Math.random() * 0.48),
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 14,
      phase: Math.random() * Math.PI * 2,
      r: 1.6 + Math.random() * 2,
    }));

    let lightningBolt: LightningBolt | null = null;
    let lightningFlash = 0;
    let nextLightningCountdown = 1.6;
    let meteor: Meteor | null = null;
    let nextMeteorCountdown = 5;

    let currentTop: [number, number, number] = [26, 98, 186];
    let currentMid: [number, number, number] = [68, 148, 224];
    let currentHorizon: [number, number, number] = [152, 204, 244];
    let currentCloudTop: [number, number, number] = [255, 255, 255];
    let currentCloudBottom: [number, number, number] = [164, 192, 224];

    let lastTime = performance.now();
    let elapsed = 0;
    let rafId = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
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

      // Smooth palette transition
      const targetPalette = getSkyPalette(cond, tod);
      const blendSpeed = Math.min(1, dt * 3.2);
      currentTop = lerpRgb(currentTop, targetPalette.top, blendSpeed);
      currentMid = lerpRgb(currentMid, targetPalette.mid, blendSpeed);
      currentHorizon = lerpRgb(currentHorizon, targetPalette.horizon, blendSpeed);
      currentCloudTop = lerpRgb(currentCloudTop, targetPalette.cloudTop, blendSpeed);
      currentCloudBottom = lerpRgb(currentCloudBottom, targetPalette.cloudBottom, blendSpeed);

      // 1. Sky Dome Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, rgbStr(currentTop));
      skyGrad.addColorStop(0.55, rgbStr(currentMid));
      skyGrad.addColorStop(1, rgbStr(currentHorizon));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Lightning sky flash
      if (cond === 'thunderstorm') {
        nextLightningCountdown -= dt;
        if (nextLightningCountdown <= 0) {
          lightningBolt = createLightningBolt(width, height);
          lightningFlash = 0.85;
          nextLightningCountdown = 2.6 + Math.random() * 4.5;
          onLightningFlash?.();
        }
      } else {
        lightningBolt = null;
        lightningFlash = Math.max(0, lightningFlash - dt * 3);
      }

      if (lightningFlash > 0.01) {
        ctx.fillStyle = `rgba(215, 228, 255, ${lightningFlash * 0.28})`;
        ctx.fillRect(0, 0, width, height);
        lightningFlash = Math.max(0, lightningFlash - dt * 2.8);
      }

      const pxShift = (pointerRef.current.x - 0.5) * 26;
      const pyShift = (pointerRef.current.y - 0.5) * 16;

      // 2. Stars & Moon (Night / Dawn)
      const isNightLike = tod === 'night';
      const starVisibility =
        tod === 'night'
          ? cond === 'clear'
            ? 1
            : cond === 'partly-cloudy'
            ? 0.65
            : cond === 'fog' || cond === 'overcast'
            ? 0.12
            : 0.05
          : tod === 'dawn' || tod === 'sunset'
          ? 0.18
          : 0;

      if (starVisibility > 0.02) {
        for (const s of stars) {
          const twinkle = 0.45 + 0.55 * Math.sin(elapsed * s.speed + s.phase);
          ctx.fillStyle = `rgba(${s.hue}, ${starVisibility * twinkle * 0.9})`;
          ctx.beginPath();
          ctx.arc(s.x * width + pxShift * 0.15, s.y * height + pyShift * 0.15, s.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Occasional shooting star on clear night
        if (isNightLike && (cond === 'clear' || cond === 'partly-cloudy')) {
          nextMeteorCountdown -= dt;
          if (nextMeteorCountdown <= 0 && !meteor) {
            meteor = {
              x: width * (0.2 + Math.random() * 0.6),
              y: height * (0.06 + Math.random() * 0.22),
              vx: 460 + Math.random() * 220,
              vy: 160 + Math.random() * 110,
              life: 0.55,
              maxLife: 0.55,
            };
            nextMeteorCountdown = 6 + Math.random() * 9;
          }
          if (meteor) {
            meteor.x += meteor.vx * dt;
            meteor.y += meteor.vy * dt;
            meteor.life -= dt;
            const mAlpha = Math.max(0, meteor.life / meteor.maxLife);
            const mGrad = ctx.createLinearGradient(
              meteor.x,
              meteor.y,
              meteor.x - meteor.vx * 0.14,
              meteor.y - meteor.vy * 0.14
            );
            mGrad.addColorStop(0, `rgba(255, 255, 255, ${mAlpha})`);
            mGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = mGrad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(meteor.x - meteor.vx * 0.14, meteor.y - meteor.vy * 0.14);
            ctx.stroke();
            if (meteor.life <= 0) meteor = null;
          }
        }

        // Moon
        if (isNightLike && cond !== 'thunderstorm' && cond !== 'heavy-rain') {
          const mx = width * 0.8 + pxShift * 0.25;
          const my = height * 0.18 + pyShift * 0.25;
          const moonAlpha = cond === 'clear' ? 1 : cond === 'partly-cloudy' ? 0.8 : 0.28;
          const halo = ctx.createRadialGradient(mx, my, 18, mx, my, 150);
          halo.addColorStop(0, `rgba(226, 238, 255, ${0.42 * moonAlpha})`);
          halo.addColorStop(0.45, `rgba(176, 204, 255, ${0.14 * moonAlpha})`);
          halo.addColorStop(1, 'rgba(176, 204, 255, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(mx, my, 150, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(248, 250, 255, ${0.96 * moonAlpha})`;
          ctx.beginPath();
          ctx.arc(mx, my, 27, 0, Math.PI * 2);
          ctx.fill();

          // Subtle moon surface craters
          ctx.fillStyle = `rgba(196, 210, 232, ${0.28 * moonAlpha})`;
          ctx.beginPath();
          ctx.arc(mx - 8, my - 5, 6, 0, Math.PI * 2);
          ctx.arc(mx + 9, my + 7, 4.5, 0, Math.PI * 2);
          ctx.arc(mx + 4, my - 11, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Sun, Volumetric God Rays & Lens Flare (Day / Dawn / Sunset)
      const isSunny =
        tod !== 'night' &&
        (cond === 'clear' || cond === 'partly-cloudy' || cond === 'windy');
      if (isSunny || (tod !== 'night' && cond === 'fog')) {
        const sunX = width * (tod === 'sunset' ? 0.76 : tod === 'dawn' ? 0.24 : 0.78) + pxShift * 0.35;
        const sunY =
          height * (tod === 'sunset' || tod === 'dawn' ? 0.56 : 0.19) + pyShift * 0.35;
        const sunIntensity =
          cond === 'clear' || cond === 'windy' ? 1 : cond === 'partly-cloudy' ? 0.78 : 0.35;

        // Atmospheric solar glow
        const outerGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, Math.max(width, height) * 0.48);
        const warmTint = tod === 'sunset' || tod === 'dawn' ? '255, 178, 108' : '255, 240, 198';
        outerGlow.addColorStop(0, `rgba(255, 252, 235, ${0.85 * sunIntensity})`);
        outerGlow.addColorStop(0.12, `rgba(${warmTint}, ${0.42 * sunIntensity})`);
        outerGlow.addColorStop(0.45, `rgba(${warmTint}, ${0.12 * sunIntensity})`);
        outerGlow.addColorStop(1, `rgba(${warmTint}, 0)`);
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, width, height);

        // Volumetric Crepuscular God Rays
        if (cond !== 'fog') {
          ctx.save();
          ctx.translate(sunX, sunY);
          const rayCount = 9;
          for (let r = 0; r < rayCount; r++) {
            const angle = (r / rayCount) * Math.PI * 1.15 + 0.35 + Math.sin(elapsed * 0.18 + r) * 0.04;
            const rayLen = Math.max(width, height) * 0.85;
            const spread = 0.07 + (r % 3) * 0.03;
            const rayAlpha = (0.045 + 0.025 * Math.sin(elapsed * 0.7 + r * 1.3)) * sunIntensity;
            const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, rayLen);
            grad.addColorStop(0, `rgba(255, 248, 224, ${rayAlpha * 1.6})`);
            grad.addColorStop(0.6, `rgba(255, 242, 200, ${rayAlpha * 0.45})`);
            grad.addColorStop(1, 'rgba(255, 242, 200, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle - spread) * rayLen, Math.sin(angle - spread) * rayLen);
            ctx.lineTo(Math.cos(angle + spread) * rayLen, Math.sin(angle + spread) * rayLen);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        // Solar disc
        ctx.fillStyle = `rgba(255, 252, 240, ${0.95 * sunIntensity})`;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
        ctx.fill();

        // Subtle optical bokeh lens flare along diagonal axis
        if (cond === 'clear' || cond === 'windy') {
          const cx = width * 0.5;
          const cy = height * 0.5;
          const dx = cx - sunX;
          const dy = cy - sunY;
          const flareStops = [
            { t: 0.45, r: 22, color: '255, 226, 165', a: 0.09 },
            { t: 0.78, r: 12, color: '175, 224, 255', a: 0.11 },
            { t: 1.15, r: 34, color: '255, 200, 140', a: 0.06 },
            { t: 1.45, r: 16, color: '255, 245, 210', a: 0.09 },
          ];
          for (const f of flareStops) {
            ctx.fillStyle = `rgba(${f.color}, ${f.a * sunIntensity})`;
            ctx.beginPath();
            ctx.arc(sunX + dx * f.t, sunY + dy * f.t, f.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 4. Volumetric Multi-Puff Clouds
      const targetCloudRatio =
        cond === 'clear'
          ? Math.max(0.12, cover / 100)
          : cond === 'partly-cloudy' || cond === 'windy'
          ? 0.55
          : cond === 'fog'
          ? 0.45
          : 1;
      const activeCloudCount = Math.max(2, Math.round(clouds.length * targetCloudRatio));
      const windMultiplier = 0.6 + wind / 22;

      for (let i = 0; i < activeCloudCount; i++) {
        const c = clouds[i];
        c.x += c.speed * windMultiplier * dt;
        if (c.x - 240 * c.scale > width) {
          c.x = -240 * c.scale;
          c.y = height * (0.06 + c.layer * 0.08 + Math.random() * 0.1);
        }

        const cloudAlpha =
          cond === 'clear'
            ? c.opacity * 0.38
            : cond === 'partly-cloudy'
            ? c.opacity * 0.75
            : c.opacity * 0.94;

        const litBoost = lightningFlash * 0.65;
        const topColor = lerpRgb(currentCloudTop, [235, 244, 255], litBoost);
        const botColor = lerpRgb(currentCloudBottom, [175, 196, 245], litBoost * 0.7);

        for (const puff of c.puffs) {
          const px = c.x + puff.ox * c.scale + pxShift * (0.12 + c.layer * 0.08);
          const py = c.y + puff.oy * c.scale + pyShift * (0.08 + c.layer * 0.05);
          const pr = puff.r * c.scale;

          const grad = ctx.createLinearGradient(px, py - pr, px, py + pr * 0.9);
          grad.addColorStop(0, rgbStr(topColor, cloudAlpha * (1 - puff.shade * 0.3)));
          grad.addColorStop(0.55, rgbStr(lerpRgb(topColor, botColor, 0.45), cloudAlpha * 0.85));
          grad.addColorStop(1, rgbStr(botColor, cloudAlpha * 0.25));

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Procedural Branching Lightning Bolt
      if (lightningBolt && lightningBolt.life > 0) {
        lightningBolt.life -= dt;
        const boltAlpha = Math.max(0, lightningBolt.life / lightningBolt.maxLife);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer electric glow
        for (const seg of lightningBolt.segments) {
          ctx.strokeStyle = `rgba(165, 200, 255, ${boltAlpha * seg.alpha * 0.48})`;
          ctx.lineWidth = seg.width * 5;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();

          // Bright white-violet core
          ctx.strokeStyle = `rgba(248, 250, 255, ${boltAlpha * seg.alpha})`;
          ctx.lineWidth = seg.width;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Drifting Fog Banks
      if (cond === 'fog' || cond === 'drizzle' || cond === 'overcast') {
        const fogStrength = cond === 'fog' ? 1 : cond === 'drizzle' ? 0.32 : 0.16;
        for (const fb of fogBanks) {
          fb.x += (fb.speed + wind * 0.5) * dt;
          if (fb.x - fb.w * 0.5 > width) fb.x = -fb.w * 0.6;
          const fy = height * fb.yRatio + Math.sin(elapsed * 0.35 + fb.phase) * 14;
          const grad = ctx.createRadialGradient(fb.x, fy, fb.h * 0.1, fb.x, fy, fb.w * 0.52);
          const fAlpha = fb.alpha * fogStrength;
          const fogTone = isNightLike ? '128, 148, 182' : '236, 244, 252';
          grad.addColorStop(0, `rgba(${fogTone}, ${fAlpha})`);
          grad.addColorStop(0.6, `rgba(${fogTone}, ${fAlpha * 0.45})`);
          grad.addColorStop(1, `rgba(${fogTone}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(fb.x, fy, fb.w * 0.55, fb.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 7. Rain + Splashes + Foreground Camera Glass Drops
      const isRain =
        cond === 'drizzle' || cond === 'rain' || cond === 'heavy-rain' || cond === 'thunderstorm';
      if (isRain) {
        const rainDensity =
          cond === 'drizzle' ? 0.34 : cond === 'rain' ? 0.68 : 1;
        const activeDrops = Math.floor(raindrops.length * rainDensity);
        const speedMult = cond === 'drizzle' ? 0.68 : cond === 'rain' ? 1 : 1.32;
        const windTilt = (wind / 42) * 0.38 + (cond === 'thunderstorm' ? 0.16 : 0.05);

        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < activeDrops; i++) {
          const d = raindrops[i];
          const vy = d.speed * speedMult;
          const vx = vy * windTilt;
          d.x += vx * dt;
          d.y += vy * dt;

          if (d.y > height + 20) {
            if (d.layer >= 1 && splashes.length < 36 && Math.random() < 0.24) {
              const sy = height - 8 - Math.random() * 26;
              splashes.push({
                x: d.x,
                y: sy,
                radius: 2,
                maxRadius: 10 + d.layer * 7,
                alpha: 0.55,
                particles: [
                  { x: d.x, y: sy, vx: -28 - Math.random() * 25, vy: -35 - Math.random() * 25 },
                  { x: d.x, y: sy, vx: 28 + Math.random() * 25, vy: -35 - Math.random() * 25 },
                ],
              });
            }
            d.y = -30 - Math.random() * 80;
            d.x = Math.random() * (width + 240) - 120;
          }
          if (d.x > width + 140) d.x -= width + 240;

          const tailX = d.x - windTilt * d.len * speedMult;
          const tailY = d.y - d.len * speedMult;
          const grad = ctx.createLinearGradient(tailX, tailY, d.x, d.y);
          grad.addColorStop(0, 'rgba(210, 232, 255, 0)');
          grad.addColorStop(1, `rgba(220, 238, 255, ${d.opacity})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
        ctx.restore();

        // Ground impact splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.radius += dt * 42;
          sp.alpha -= dt * 1.45;
          if (sp.alpha <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = `rgba(215, 236, 255, ${sp.alpha * 0.7})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius, sp.radius * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(232, 245, 255, ${sp.alpha * 0.85})`;
          for (const p of sp.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 170 * dt;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Hyper-realistic droplets clinging to the foreground glass lens
        const activeGlass = cond === 'drizzle' ? 18 : cond === 'rain' ? 30 : 44;
        for (let i = 0; i < activeGlass; i++) {
          const gd = glassDrops[i];
          if (gd.sliding) {
            gd.vy = Math.min(48, gd.vy + dt * 14);
            gd.y += gd.vy * dt;
            gd.x += Math.sin(elapsed * 3 + gd.wobblePhase) * 0.25;
            if (Math.random() < 0.35) {
              gd.trail.push({ x: gd.x, y: gd.y - gd.r * 0.5, r: gd.r * 0.38 });
              if (gd.trail.length > 8) gd.trail.shift();
            }
            if (gd.y > height + 16) {
              gd.y = -10;
              gd.x = Math.random() * width;
              gd.vy = 2;
              gd.trail = [];
            }
          }

          for (const tr of gd.trail) {
            ctx.fillStyle = 'rgba(210, 232, 255, 0.14)';
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // Refractive water bead
          const dropGrad = ctx.createRadialGradient(
            gd.x - gd.r * 0.28,
            gd.y - gd.r * 0.28,
            gd.r * 0.1,
            gd.x,
            gd.y,
            gd.r
          );
          dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
          dropGrad.addColorStop(0.55, 'rgba(180, 214, 248, 0.16)');
          dropGrad.addColorStop(1, 'rgba(30, 58, 96, 0.28)');

          ctx.fillStyle = dropGrad;
          ctx.beginPath();
          ctx.arc(gd.x, gd.y, gd.r, 0, Math.PI * 2);
          ctx.fill();

          // Crisp rim & top-left specular glint
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.lineWidth = 0.7;
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.arc(gd.x - gd.r * 0.34, gd.y - gd.r * 0.34, Math.max(0.8, gd.r * 0.22), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 8. Multi-Depth Parallax Snow & Sub-Zero Frost Vignette
      const isSnow = cond === 'snow' || cond === 'blizzard';
      if (isSnow) {
        const snowDensity = cond === 'blizzard' ? 1 : 0.65;
        const activeSnow = Math.floor(snowflakes.length * snowDensity);
        const snowWind = cond === 'blizzard' ? Math.max(70, wind * 3.4) : wind * 1.4;

        for (let i = 0; i < activeSnow; i++) {
          const sf = snowflakes[i];
          const sway = Math.sin(elapsed * 1.6 + sf.phase) * (16 + sf.layer * 10);
          sf.x += (snowWind * (0.4 + sf.layer * 0.35) + sf.vxDrift + sway) * dt;
          sf.y += sf.vy * (cond === 'blizzard' ? 1.45 : 1) * dt;
          sf.rotation += sf.rotSpeed * dt;

          if (sf.y > height + 18) {
            sf.y = -16;
            sf.x = Math.random() * width;
          }
          if (sf.x > width + 24) sf.x = -20;
          if (sf.x < -24) sf.x = width + 20;

          if (sf.layer === 2) {
            // Soft foreground bokeh snowflake
            const fgGrad = ctx.createRadialGradient(sf.x, sf.y, 0, sf.x, sf.y, sf.r);
            fgGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
            fgGrad.addColorStop(0.6, 'rgba(235, 246, 255, 0.28)');
            fgGrad.addColorStop(1, 'rgba(235, 246, 255, 0)');
            ctx.fillStyle = fgGrad;
            ctx.beginPath();
            ctx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2);
            ctx.fill();
          } else if (sf.crystalline) {
            ctx.save();
            ctx.translate(sf.x, sf.y);
            ctx.rotate(sf.rotation);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
            ctx.lineWidth = 1;
            for (let arm = 0; arm < 3; arm++) {
              ctx.rotate(Math.PI / 3);
              ctx.beginPath();
              ctx.moveTo(-sf.r, 0);
              ctx.lineTo(sf.r, 0);
              ctx.stroke();
            }
            ctx.restore();
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.42 + sf.layer * 0.26})`;
            ctx.beginPath();
            ctx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Frost edge vignette when freezing or snowing
      if (temp <= 2 || isSnow) {
        const frostStrength = isSnow ? 0.26 : Math.min(0.24, (3 - temp) * 0.04);
        const frostGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.min(width, height) * 0.34,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.74
        );
        frostGrad.addColorStop(0, 'rgba(210, 238, 255, 0)');
        frostGrad.addColorStop(1, `rgba(205, 236, 255, ${frostStrength})`);
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 9. Wind Ribbons & Fluttering Leaves
      if (cond === 'windy' || wind >= 24) {
        const windFactor = Math.min(2, wind / 22);
        ctx.save();
        for (const wr of windRibbons) {
          wr.x += wr.speed * windFactor * dt;
          if (wr.x - wr.len > width) {
            wr.x = -wr.len - Math.random() * 140;
            wr.y = Math.random() * height * 0.85;
          }
          const grad = ctx.createLinearGradient(wr.x - wr.len, wr.y, wr.x, wr.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${wr.alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let px = 0; px <= wr.len; px += 12) {
            const sx = wr.x - wr.len + px;
            const sy = wr.y + Math.sin(px * wr.freq + elapsed * 3 + wr.phase) * wr.amp;
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }

        if (!isSnow && !isRain) {
          for (const lf of leaves) {
            lf.x += lf.vx * windFactor * dt;
            lf.y += (lf.vy + Math.sin(elapsed * 2.5 + lf.phase) * 24) * dt;
            lf.rot += lf.rotSpeed * dt;
            if (lf.x > width + 30 || lf.y > height + 30) {
              lf.x = -24;
              lf.y = Math.random() * height * 0.7;
            }
            ctx.save();
            ctx.translate(lf.x, lf.y);
            ctx.rotate(lf.rot);
            ctx.fillStyle = lf.color;
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.ellipse(0, 0, lf.size, lf.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // 10. Summer Heat Shimmer & Warm Dust Motes (>= 30°C & Sunny)
      if (temp >= 30 && isSunny) {
        ctx.save();
        for (let i = 0; i < 6; i++) {
          const hy = height * (0.65 + i * 0.055);
          const waveOffset = Math.sin(elapsed * 4 + i * 1.4) * 18;
          const shimmerGrad = ctx.createLinearGradient(0, hy, width, hy);
          shimmerGrad.addColorStop(0, 'rgba(255, 232, 178, 0)');
          shimmerGrad.addColorStop(0.5, 'rgba(255, 240, 198, 0.065)');
          shimmerGrad.addColorStop(1, 'rgba(255, 232, 178, 0)');
          ctx.strokeStyle = shimmerGrad;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, hy + waveOffset * 0.15);
          ctx.bezierCurveTo(
            width * 0.33,
            hy - waveOffset * 0.3,
            width * 0.66,
            hy + waveOffset * 0.3,
            width,
            hy
          );
          ctx.stroke();
        }
        ctx.restore();
      }

      // 11. Warm Night Fireflies
      if (isNightLike && temp >= 16 && !isRain && !isSnow) {
        for (const ff of fireflies) {
          ff.x += ff.vx * dt;
          ff.y += ff.vy * dt;
          if (ff.x < 0 || ff.x > width) ff.vx *= -1;
          if (ff.y < height * 0.35 || ff.y > height * 0.94) ff.vy *= -1;
          const pulse = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(elapsed * 2.2 + ff.phase), 2);
          const fGrad = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.r * 5);
          fGrad.addColorStop(0, `rgba(253, 230, 138, ${pulse * 0.95})`);
          fGrad.addColorStop(0.4, `rgba(190, 242, 100, ${pulse * 0.38})`);
          fGrad.addColorStop(1, 'rgba(190, 242, 100, 0)');
          ctx.fillStyle = fGrad;
          ctx.beginPath();
          ctx.arc(ff.x, ff.y, ff.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
};
