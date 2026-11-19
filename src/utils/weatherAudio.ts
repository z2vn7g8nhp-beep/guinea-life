import type { WeatherCondition } from '../types/weather';

class WeatherAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private thunderTimer: number | null = null;
  private enabled = false;
  private currentCondition: WeatherCondition = 'clear';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startBaseGraph(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.noiseSource) return;

    const buffer = this.createPinkNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.7;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.16;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(this.masterGain);

    source.start();
    lfo.start();

    this.noiseSource = source;
    this.filterNode = filter;
    this.lfoOsc = lfo;
    this.lfoGain = lfoGain;
  }

  public setEnabled(enable: boolean, condition: WeatherCondition, windSpeed: number): void {
    this.enabled = enable;
    this.currentCondition = condition;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (enable) {
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      this.startBaseGraph();
      this.applyWeatherProfile(condition, windSpeed);
      this.scheduleThunderIfNeeded();
    } else {
      this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      if (this.thunderTimer !== null) {
        window.clearTimeout(this.thunderTimer);
        this.thunderTimer = null;
      }
    }
  }

  public update(condition: WeatherCondition, windSpeed: number): void {
    this.currentCondition = condition;
    if (!this.enabled) return;
    this.applyWeatherProfile(condition, windSpeed);
    this.scheduleThunderIfNeeded();
  }

  private applyWeatherProfile(condition: WeatherCondition, windSpeed: number): void {
    if (!this.ctx || !this.masterGain || !this.filterNode || !this.lfoGain || !this.lfoOsc) return;
    const now = this.ctx.currentTime;

    let targetGain = 0.08;
    let freq = 420;
    let q = 0.6;
    let lfoDepth = 120;
    let lfoRate = 0.15;

    switch (condition) {
      case 'drizzle':
        targetGain = 0.16;
        freq = 1650;
        lfoDepth = 180;
        break;
      case 'rain':
        targetGain = 0.28;
        freq = 2200;
        lfoDepth = 260;
        break;
      case 'heavy-rain':
      case 'thunderstorm':
        targetGain = 0.42;
        freq = 2700;
        lfoDepth = 420;
        lfoRate = 0.22;
        break;
      case 'blizzard':
      case 'windy':
        targetGain = 0.26;
        freq = 640 + Math.min(windSpeed * 12, 500);
        q = 2.6;
        lfoDepth = 320;
        lfoRate = 0.26;
        break;
      case 'snow':
      case 'fog':
        targetGain = 0.11;
        freq = 320;
        lfoDepth = 80;
        break;
      default:
        targetGain = 0.06 + Math.min(windSpeed / 120, 0.12);
        freq = 440 + windSpeed * 6;
        lfoDepth = 110;
        break;
    }

    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.45);
    this.filterNode.frequency.setTargetAtTime(freq, now, 0.5);
    this.filterNode.Q.setTargetAtTime(q, now, 0.5);
    this.lfoGain.gain.setTargetAtTime(lfoDepth, now, 0.5);
    this.lfoOsc.frequency.setTargetAtTime(lfoRate, now, 0.5);
  }

  public triggerThunder(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const buffer = this.createPinkNoiseBuffer(ctx, 2.5);
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(55, now + 2.2);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.01, now);
    env.gain.linearRampToValueAtTime(0.85, now + 0.08);
    env.gain.exponentialRampToValueAtTime(0.01, now + 2.4);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.masterGain);
    src.start(now);
    src.stop(now + 2.5);
  }

  private scheduleThunderIfNeeded(): void {
    if (this.thunderTimer !== null) {
      window.clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }
    if (!this.enabled || this.currentCondition !== 'thunderstorm') return;

    const delay = 3800 + Math.random() * 5200;
    this.thunderTimer = window.setTimeout(() => {
      this.triggerThunder();
      this.scheduleThunderIfNeeded();
    }, delay);
  }

  public playPetChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    const notes = [680, 920];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + idx * 0.08 + 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.15);
    });
  }
}

export const weatherAudio = new WeatherAudioEngine();
