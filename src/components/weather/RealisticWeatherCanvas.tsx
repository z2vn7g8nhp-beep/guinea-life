import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface NightStar {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
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
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

type WeatherPhotoKey =
  | 'clear-day'
  | 'partly-cloudy-day'
  | 'overcast-day'
  | 'rain-day'
  | 'thunderstorm'
  | 'snow-day'
  | 'fog-day'
  | 'sunset'
  | 'clear-night';

function resolveBackdropKey(condition: WeatherCondition, timeOfDay: TimeOfDay): WeatherPhotoKey {
  if (condition === 'thunderstorm') return 'thunderstorm';
  if (condition === 'rain' || condition === 'heavy-rain' || condition === 'drizzle') {
    return 'rain-day';
  }
  if (condition === 'snow' || condition === 'blizzard') {
    return 'snow-day';
  }
  if (condition === 'fog') {
    return 'fog-day';
  }
  if (timeOfDay === 'sunset' || timeOfDay === 'dawn') {
    return 'sunset';
  }
  if (timeOfDay === 'night') {
    return 'clear-night';
  }
  if (condition === 'overcast') {
    return 'overcast-day';
  }
  if (condition === 'partly-cloudy' || condition === 'windy') {
    return 'partly-cloudy-day';
  }
  return 'clear-day';
}

function getMoodFilter(condition: WeatherCondition, timeOfDay: TimeOfDay): string {
  if (timeOfDay === 'night') {
    if (
      condition === 'rain' ||
      condition === 'heavy-rain' ||
      condition === 'drizzle' ||
      condition === 'thunderstorm' ||
      condition === 'overcast' ||
      condition === 'fog' ||
      condition === 'snow' ||
      condition === 'blizzard'
    ) {
      return 'brightness(0.42) contrast(1.12) saturate(0.88) hue-rotate(8deg)';
    }
    return 'brightness(0.96) contrast(1.04)';
  }
  if (timeOfDay === 'dawn') {
    if (condition === 'clear' || condition === 'partly-cloudy' || condition === 'windy') {
      return 'brightness(1.03) saturate(0.92) hue-rotate(-10deg)';
    }
    return 'brightness(0.88) saturate(0.95)';
  }
  if (timeOfDay === 'sunset') {
    if (condition === 'rain' || condition === 'heavy-rain' || condition === 'overcast') {
      return 'brightness(0.76) sepia(0.18) saturate(1.06)';
    }
  }
  if (condition === 'heavy-rain') {
    return 'brightness(0.82) contrast(1.1)';
  }
  if (condition === 'drizzle') {
    return 'brightness(1.04) saturate(0.9)';
  }
  return 'none';
}

function createLightningBolt(w: number, h: number): LightningBolt {
  const startX = w * (0.2 + Math.random() * 0.6);
  const startY = h * (0.04 + Math.random() * 0.1);
  const endY = h * (0.48 + Math.random() * 0.25);
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
      const branchLen = Math.hypot(x2 - x1, y2 - y1) * (0.46 + Math.random() * 0.38);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const bx = midX + dir * branchLen * (0.4 + Math.random() * 0.45);
      const by = midY + branchLen * (0.6 + Math.random() * 0.35);
      subdivide(midX, midY, bx, by, disp * 0.4, depth - 2, Math.max(1, width * 0.55), alpha * 0.72);
    }
  };

  subdivide(startX, startY, startX + (Math.random() - 0.5) * 150, endY, 105, 5, 2.8, 1);
  return {
    segments,
    life: 0.32,
    maxLife: 0.32,
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

  const photoKey = useMemo(
    () => resolveBackdropKey(condition, timeOfDay),
    [condition, timeOfDay]
  );
  const moodFilter = useMemo(
    () => getMoodFilter(condition, timeOfDay),
    [condition, timeOfDay]
  );

  // Smooth crossfade between active & previous photo
  const [activePhoto, setActivePhoto] = useState<WeatherPhotoKey>(photoKey);
  const [prevPhoto, setPrevPhoto] = useState<WeatherPhotoKey | null>(null);

  useEffect(() => {
    if (photoKey === activePhoto) return;
    setPrevPhoto(activePhoto);
    setActivePhoto(photoKey);
    const id = window.setTimeout(() => setPrevPhoto(null), 750);
    return () => window.clearTimeout(id);
  }, [photoKey, activePhoto]);

  useEffect(() => {
    const fxCanvas = fxCanvasRef.current;
    if (!fxCanvas) return;
    const ctx = fxCanvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      fxCanvas.width = Math.max(1, Math.floor(width * dpr));
      fxCanvas.height = Math.max(1, Math.floor(height * dpr));
      fxCanvas.style.width = `${width}px`;
      fxCanvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const raindrops: RainDrop[] = Array.from({ length: 280 }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        len: 14 + layer * 14 + Math.random() * 12,
        speed: 580 + layer * 250 + Math.random() * 160,
        layer,
        opacity: 0.16 + layer * 0.14,
        width: 0.75 + layer * 0.45,
      };
    });

    const splashes: SplashRing[] = [];

    const glassDrops: GlassDrop[] = Array.from({ length: 34 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 2 + Math.random() * 4,
      vy: 0,
      sliding: Math.random() < 0.25,
      wobblePhase: Math.random() * Math.PI * 2,
      trail: [],
    }));

    const snowflakes: SnowFlake[] = Array.from({ length: 180 }, (_, i) => {
      const layer = i % 3;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r:
          layer === 2
            ? 4.2 + Math.random() * 4.4
            : layer === 1
            ? 2.1 + Math.random() * 2.0
            : 1.0 + Math.random() * 1.1,
        vy: 28 + layer * 24 + Math.random() * 18,
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
      w: 440 + Math.random() * 340,
      h: 150 + Math.random() * 130,
      speed: 10 + Math.random() * 16,
      alpha: 0.11 + Math.random() * 0.12,
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
      alpha: 0.08 + Math.random() * 0.1,
    }));

    const nightStars: NightStar[] = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.55,
      r: 0.6 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      speed: 1.2 + Math.random() * 2.2,
    }));

    let lightningBolt: LightningBolt | null = null;
    let lightningFlash = 0;
    let nextLightningCountdown = 1.6;
    let meteor: Meteor | null = null;
    let nextMeteorCountdown = 5.5;

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
        timeOfDay: tod,
        onLightningFlash: flashCb,
      } = propsRef.current;

      ctx.clearRect(0, 0, width, height);

      const isNight = tod === 'night';
      const isStorm = cond === 'thunderstorm' || cond === 'heavy-rain';
      const isRainy = cond === 'drizzle' || cond === 'rain' || isStorm;
      const isSnow = cond === 'snow' || cond === 'blizzard';

      // Subtle live star twinkle & occasional shooting star on clear/partly-cloudy nights
      if (isNight && (cond === 'clear' || cond === 'partly-cloudy' || cond === 'windy')) {
        const starBoost = cond === 'clear' ? 0.75 : 0.45;
        for (const s of nightStars) {
          const twinkle = 0.25 + 0.75 * Math.sin(elapsed * s.speed + s.phase);
          ctx.fillStyle = `rgba(240, 248, 255, ${twinkle * starBoost})`;
          ctx.beginPath();
          ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        nextMeteorCountdown -= dt;
        if (nextMeteorCountdown <= 0 && !meteor) {
          meteor = {
            x: width * (0.18 + Math.random() * 0.58),
            y: height * (0.06 + Math.random() * 0.2),
            vx: 440 + Math.random() * 200,
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
          const mGrad = ctx.createLinearGradient(
            meteor.x,
            meteor.y,
            meteor.x - meteor.vx * 0.13,
            meteor.y - meteor.vy * 0.13
          );
          mGrad.addColorStop(0, `rgba(255, 255, 255, ${mAlpha})`);
          mGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = mGrad;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - meteor.vx * 0.13, meteor.y - meteor.vy * 0.13);
          ctx.stroke();
          if (meteor.life <= 0) meteor = null;
        }
      }

      // Thunderstorm lightning flash + branching bolt
      if (cond === 'thunderstorm') {
        nextLightningCountdown -= dt;
        if (nextLightningCountdown <= 0) {
          lightningBolt = createLightningBolt(width, height);
          lightningFlash = 0.92;
          nextLightningCountdown = 2.8 + Math.random() * 4.2;
          flashCb?.();
        }
      } else {
        lightningBolt = null;
        lightningFlash = Math.max(0, lightningFlash - dt * 3);
      }

      if (lightningFlash > 0.01) {
        ctx.fillStyle = `rgba(218, 232, 255, ${lightningFlash * 0.26})`;
        ctx.fillRect(0, 0, width, height);
        lightningFlash = Math.max(0, lightningFlash - dt * 2.9);
      }

      if (lightningBolt && lightningBolt.life > 0) {
        lightningBolt.life -= dt;
        const boltAlpha = Math.max(0, lightningBolt.life / lightningBolt.maxLife);
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const seg of lightningBolt.segments) {
          ctx.strokeStyle = `rgba(170, 205, 255, ${boltAlpha * seg.alpha * 0.45})`;
          ctx.lineWidth = seg.width * 4.2;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();

          ctx.strokeStyle = `rgba(248, 250, 255, ${boltAlpha * seg.alpha})`;
          ctx.lineWidth = seg.width;
          ctx.beginPath();
          ctx.moveTo(seg.x1, seg.y1);
          ctx.lineTo(seg.x2, seg.y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Fog mist drift
      if (cond === 'fog' || cond === 'drizzle') {
        const fogStrength = cond === 'fog' ? 0.85 : 0.24;
        for (const fb of fogBanks) {
          fb.x += (fb.speed + wind * 0.45) * dt;
          if (fb.x - fb.w * 0.5 > width) fb.x = -fb.w * 0.6;
          const fy = height * fb.yRatio + Math.sin(elapsed * 0.35 + fb.phase) * 14;
          const grad = ctx.createRadialGradient(fb.x, fy, fb.h * 0.1, fb.x, fy, fb.w * 0.52);
          const fAlpha = fb.alpha * fogStrength;
          const fogTone = isNight ? '128, 148, 182' : '240, 246, 252';
          grad.addColorStop(0, `rgba(${fogTone}, ${fAlpha})`);
          grad.addColorStop(0.6, `rgba(${fogTone}, ${fAlpha * 0.4})`);
          grad.addColorStop(1, `rgba(${fogTone}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(fb.x, fy, fb.w * 0.55, fb.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rain streaks + ground splashes + refractive camera-lens droplets
      if (isRainy) {
        const rainDensity = cond === 'drizzle' ? 0.36 : cond === 'rain' ? 0.68 : 1;
        const activeDrops = Math.floor(raindrops.length * rainDensity);
        const speedMult = cond === 'drizzle' ? 0.68 : cond === 'rain' ? 1 : 1.32;
        const windTilt = (wind / 42) * 0.36 + (cond === 'thunderstorm' ? 0.14 : 0.04);

        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < activeDrops; i++) {
          const d = raindrops[i];
          const vy = d.speed * speedMult;
          const vx = vy * windTilt;
          d.x += vx * dt;
          d.y += vy * dt;

          if (d.y > height + 20) {
            if (d.layer >= 1 && splashes.length < 28 && Math.random() < 0.22) {
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
          const grad = ctx.createLinearGradient(tailX, tailY, d.x, d.y);
          grad.addColorStop(0, 'rgba(210, 232, 255, 0)');
          grad.addColorStop(1, `rgba(225, 240, 255, ${d.opacity})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = d.width;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
        ctx.restore();

        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.radius += dt * 40;
          sp.alpha -= dt * 1.45;
          if (sp.alpha <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = `rgba(215, 236, 255, ${sp.alpha * 0.62})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius, sp.radius * 0.34, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `rgba(232, 245, 255, ${sp.alpha * 0.78})`;
          for (const p of sp.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 170 * dt;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const activeGlass = cond === 'drizzle' ? 12 : cond === 'rain' ? 22 : 34;
        for (let i = 0; i < activeGlass; i++) {
          const gd = glassDrops[i];
          if (gd.sliding) {
            gd.vy = Math.min(44, gd.vy + dt * 13);
            gd.y += gd.vy * dt;
            gd.x += Math.sin(elapsed * 3 + gd.wobblePhase) * 0.22;
            if (Math.random() < 0.32) {
              gd.trail.push({ x: gd.x, y: gd.y - gd.r * 0.5, r: gd.r * 0.35 });
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
            ctx.fillStyle = 'rgba(210, 232, 255, 0.12)';
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2);
            ctx.fill();
          }

          const dropGrad = ctx.createRadialGradient(
            gd.x - gd.r * 0.28,
            gd.y - gd.r * 0.28,
            gd.r * 0.1,
            gd.x,
            gd.y,
            gd.r
          );
          dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
          dropGrad.addColorStop(0.55, 'rgba(180, 214, 248, 0.14)');
          dropGrad.addColorStop(1, 'rgba(30, 58, 96, 0.22)');

          ctx.fillStyle = dropGrad;
          ctx.beginPath();
          ctx.arc(gd.x, gd.y, gd.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.lineWidth = 0.65;
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.beginPath();
          ctx.arc(gd.x - gd.r * 0.34, gd.y - gd.r * 0.34, Math.max(0.7, gd.r * 0.22), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Multi-depth snow + sub-zero frost vignette
      if (isSnow) {
        const snowDensity = cond === 'blizzard' ? 1 : 0.68;
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
            ctx.fillStyle = `rgba(255, 255, 255, ${0.46 + sf.layer * 0.24})`;
            ctx.beginPath();
            ctx.arc(sf.x, sf.y, sf.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (temp <= 0 || isSnow) {
        const frostStrength = isSnow ? 0.22 : Math.min(0.2, (1 - temp) * 0.03);
        const frostGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.min(width, height) * 0.36,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.75
        );
        frostGrad.addColorStop(0, 'rgba(210, 238, 255, 0)');
        frostGrad.addColorStop(1, `rgba(205, 236, 255, ${frostStrength})`);
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Wind streaks
      if (cond === 'windy' || wind >= 24) {
        const windFactor = Math.min(2, wind / 22);
        ctx.save();
        for (const ws of windStreaks) {
          ws.x += ws.speed * windFactor * dt;
          if (ws.x - ws.len > width) {
            ws.x = -ws.len - Math.random() * 140;
            ws.y = Math.random() * height * 0.85;
          }
          const grad = ctx.createLinearGradient(ws.x - ws.len, ws.y, ws.x, ws.y);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${ws.alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let xOff = 0; xOff <= ws.len; xOff += 14) {
            const sx = ws.x - ws.len + xOff;
            const sy = ws.y + Math.sin(xOff * ws.freq + elapsed * 3 + ws.phase) * ws.amp;
            if (xOff === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // Scorching sun heat shimmer near lower horizon
      if (temp >= 31 && !isNight && (cond === 'clear' || cond === 'partly-cloudy' || cond === 'windy')) {
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const hy = height * (0.74 + i * 0.055);
          const waveOffset = Math.sin(elapsed * 4 + i * 1.4) * 16;
          const shimmerGrad = ctx.createLinearGradient(0, hy, width, hy);
          shimmerGrad.addColorStop(0, 'rgba(255, 232, 178, 0)');
          shimmerGrad.addColorStop(0.5, 'rgba(255, 240, 198, 0.055)');
          shimmerGrad.addColorStop(1, 'rgba(255, 232, 178, 0)');
          ctx.strokeStyle = shimmerGrad;
          ctx.lineWidth = 2.2;
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

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const base = import.meta.env.BASE_URL || '/';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-950">
      {/* Previous sky backdrop during crossfade */}
      {prevPhoto && (
        <img
          src={`${base}assets/weather/${prevPhoto}.webp`}
          alt=""
          draggable={false}
          className="animate-sky-breathe absolute inset-0 h-full w-full object-cover object-center"
          style={{ filter: moodFilter }}
        />
      )}

      {/* Active photorealistic sky photograph */}
      <img
        key={activePhoto}
        src={`${base}assets/weather/${activePhoto}.webp`}
        alt=""
        draggable={false}
        className="animate-sky-breathe animate-ui-fade absolute inset-0 h-full w-full object-cover object-center transition-all duration-700"
        style={{ filter: moodFilter }}
      />

      {/* Subtle atmospheric contrast scrim for razor-sharp white text on bright skies */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(8,14,28,0.34) 0%, rgba(8,14,28,0.06) 28%, rgba(8,14,28,0.12) 66%, rgba(8,14,28,0.42) 100%)',
        }}
      />

      {/* Live 2D Particle Weather Engine (Rain, Glass Droplets, Lightning, Snow, Fog, Wind) */}
      <canvas ref={fxCanvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};
