/**
 * Procedural Web Audio — no external files, everything synthesized per planet.
 * Kept minimal: ambient wind loop + footsteps + jump/land tones + sample beep.
 */

export interface AudioProfile {
  windGain: number;
  windFreq: number;
  windQ: number;
  footFreq: number;
  footGain: number;
}

const PROFILES: Record<string, AudioProfile> = {
  terra:  { windGain: 0.12, windFreq: 180, windQ: 0.7, footFreq: 780, footGain: 0.14 },
  mars:   { windGain: 0.09, windFreq: 90,  windQ: 0.5, footFreq: 520, footGain: 0.12 },
  luna:   { windGain: 0.00, windFreq: 0,   windQ: 0,   footFreq: 380, footGain: 0.07 },
  venus:  { windGain: 0.22, windFreq: 55,  windQ: 0.4, footFreq: 320, footGain: 0.15 },
  europa: { windGain: 0.06, windFreq: 260, windQ: 1.1, footFreq: 1400, footGain: 0.10 },
};

interface WindNodes {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private wind: WindNodes | null = null;
  private profile: AudioProfile = PROFILES.mars;
  private surfaceMode = false;
  private footTimer = 0;
  private muted = false;

  ensure(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    this.noiseBuf = this.buildNoise(2.2);
    this.startWind();
    this.applyProfile();
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  setPlanet(id: string): void {
    this.profile = PROFILES[id] ?? PROFILES.mars;
    this.applyProfile();
  }

  setSurfaceMode(active: boolean): void {
    this.surfaceMode = active;
    this.applyProfile();
  }

  setMuted(v: boolean): void {
    this.muted = v;
    if (this.master) this.master.gain.value = v ? 0 : 0.55;
  }

  isMuted(): boolean {
    return this.muted;
  }

  update(delta: number, walking: boolean, sprinting: boolean, onGround: boolean): void {
    if (!this.ctx || !this.surfaceMode) return;
    if (walking && onGround) {
      this.footTimer += delta;
      const interval = sprinting ? 0.30 : 0.46;
      if (this.footTimer >= interval) {
        this.footTimer = 0;
        this.footstep(sprinting);
      }
    } else {
      this.footTimer = 0;
    }
  }

  jump(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  land(intensity: number): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const clampedI = Math.max(0.2, Math.min(1, intensity));
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 260 + clampedI * 180;
    filter.Q.value = 0.9;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22 * clampedI, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(now);
    src.stop(now + 0.4);
  }

  sample(): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    const notes = [660, 880];
    for (let i = 0; i < notes.length; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = notes[i];
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain).connect(this.master);
      osc.start(start);
      osc.stop(start + 0.2);
    }
  }

  descentRumble(): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 160;
    filter.Q.value = 1.2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.3);
    gain.gain.setValueAtTime(0.28, now + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(now);
    src.stop(now + 2.0);
  }

  private footstep(sprinting: boolean): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const now = this.ctx.currentTime;
    const dur = sprinting ? 0.10 : 0.16;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.profile.footFreq + (Math.random() - 0.5) * 120;
    filter.Q.value = 1.4;
    const gain = this.ctx.createGain();
    const peak = this.profile.footGain * (sprinting ? 1.3 : 1.0);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  private applyProfile(): void {
    if (!this.wind || !this.ctx) return;
    const now = this.ctx.currentTime;
    const target = this.surfaceMode ? this.profile.windGain : 0;
    this.wind.gain.gain.cancelScheduledValues(now);
    this.wind.gain.gain.setValueAtTime(this.wind.gain.gain.value, now);
    this.wind.gain.gain.linearRampToValueAtTime(target, now + 0.7);
    if (this.profile.windFreq > 0) {
      this.wind.filter.frequency.cancelScheduledValues(now);
      this.wind.filter.frequency.linearRampToValueAtTime(this.profile.windFreq, now + 0.5);
      this.wind.filter.Q.linearRampToValueAtTime(this.profile.windQ, now + 0.5);
    }
  }

  private startWind(): void {
    if (!this.ctx || !this.master || !this.noiseBuf) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuf;
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 120;
    filter.Q.value = 0.6;
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(this.master);
    source.start();
    this.wind = { source, filter, gain };
  }

  private buildNoise(seconds: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not ready');
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.floor(sr * seconds), sr);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      // simple pinkish colouring for a less harsh hiss
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
    }
    return buf;
  }
}
