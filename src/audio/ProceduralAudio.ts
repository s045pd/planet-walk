export interface NoiseLoop {
  source: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

export interface FootstepSound {
  tone: OscillatorNode;
  noise: AudioBufferSourceNode;
  output: GainNode;
  duration: number;
}

export interface ToneSound {
  oscillator: OscillatorNode;
  gain: GainNode;
  duration: number;
}

interface FootstepProfile {
  toneFrequency: number;
  toneType: OscillatorType;
  toneGain: number;
  noiseFrequency: number;
  noiseQ: number;
  noiseGain: number;
  duration: number;
}

/**
 * 程序化音效生成器：用Web Audio API生成各种音效
 */
export class ProceduralAudio {
  private readonly ctx: AudioContext;
  private readonly noiseBufferCache = new Map<number, AudioBuffer>();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /** 生成白噪声Buffer */
  createNoiseBuffer(duration: number): AudioBuffer {
    const key = Math.max(1, Math.round(duration * 1000));
    const cached = this.noiseBufferCache.get(key);
    if (cached) {
      return cached;
    }

    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * (key / 1000);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBufferCache.set(key, buffer);
    return buffer;
  }

  createNoiseSource(duration: number, loop: boolean): AudioBufferSourceNode {
    const source = this.ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(duration);
    source.loop = loop;
    return source;
  }

  /** 创建滤波噪声循环层 */
  createFilteredNoiseLoop(config: {
    filterType: BiquadFilterType;
    frequency: number;
    q?: number;
    gain?: number;
    duration?: number;
  }): NoiseLoop {
    const source = this.createNoiseSource(config.duration ?? 3, true);
    const filter = this.ctx.createBiquadFilter();
    filter.type = config.filterType;
    filter.frequency.value = config.frequency;
    filter.Q.value = config.q ?? 0.7;

    const gain = this.ctx.createGain();
    gain.gain.value = config.gain ?? 0.15;

    source.connect(filter);
    filter.connect(gain);
    return { source, filter, gain };
  }

  /** 创建脚步声（振荡器 + 噪声） */
  createFootstep(planetName: string, time = this.ctx.currentTime): FootstepSound {
    const profile = this.getFootstepProfile(planetName);
    const tone = this.ctx.createOscillator();
    tone.type = profile.toneType;
    tone.frequency.value = profile.toneFrequency * (0.92 + Math.random() * 0.16);

    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.0001, time);
    toneGain.gain.linearRampToValueAtTime(profile.toneGain, time + 0.01);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + profile.duration);

    const noise = this.createNoiseSource(profile.duration, false);
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = profile.noiseFrequency;
    noiseFilter.Q.value = profile.noiseQ;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, time);
    noiseGain.gain.linearRampToValueAtTime(profile.noiseGain, time + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + profile.duration);

    const output = this.ctx.createGain();
    output.gain.value = 1;

    tone.connect(toneGain);
    toneGain.connect(output);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(output);

    return { tone, noise, output, duration: profile.duration };
  }

  /** 创建通用提示音 */
  createTone(config: {
    frequency: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
    attack?: number;
    decay?: number;
    atTime?: number;
    endFrequency?: number;
  }): ToneSound {
    const atTime = config.atTime ?? this.ctx.currentTime;
    const duration = Math.max(0.01, config.duration);
    const attack = Math.max(0.001, config.attack ?? 0.008);
    const decay = Math.max(0.001, config.decay ?? duration - attack);
    const maxGain = Math.max(0.0001, config.gain ?? 0.15);

    const oscillator = this.ctx.createOscillator();
    oscillator.type = config.type ?? 'sine';
    oscillator.frequency.setValueAtTime(config.frequency, atTime);
    if (typeof config.endFrequency === 'number') {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, config.endFrequency),
        atTime + duration,
      );
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, atTime);
    gain.gain.linearRampToValueAtTime(maxGain, atTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, atTime + attack + decay);

    oscillator.connect(gain);
    return { oscillator, gain, duration };
  }

  /** 创建风声节点（滤波噪声） */
  createWind(frequency: number, q: number): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
    const noise = this.createNoiseSource(4, true);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    noise.connect(filter);
    return { source: noise, filter };
  }

  /** 创建大气层穿越音效（上升频率扫描） */
  createAtmosphereEntry(): OscillatorNode {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    return osc;
  }

  private getFootstepProfile(planetName: string): FootstepProfile {
    switch (planetName) {
      case 'mars':
        return {
          toneFrequency: 95,
          toneType: 'sine',
          toneGain: 0.17,
          noiseFrequency: 450,
          noiseQ: 0.55,
          noiseGain: 0.34,
          duration: 0.2,
        };
      case 'venus':
        return {
          toneFrequency: 110,
          toneType: 'triangle',
          toneGain: 0.18,
          noiseFrequency: 620,
          noiseQ: 0.6,
          noiseGain: 0.28,
          duration: 0.21,
        };
      case 'moon':
        return {
          toneFrequency: 190,
          toneType: 'square',
          toneGain: 0.1,
          noiseFrequency: 2150,
          noiseQ: 2.2,
          noiseGain: 0.15,
          duration: 0.11,
        };
      case 'europa':
        return {
          toneFrequency: 175,
          toneType: 'square',
          toneGain: 0.11,
          noiseFrequency: 1850,
          noiseQ: 1.9,
          noiseGain: 0.19,
          duration: 0.12,
        };
      case 'earth':
      default:
        return {
          toneFrequency: 135,
          toneType: 'triangle',
          toneGain: 0.14,
          noiseFrequency: 1250,
          noiseQ: 0.9,
          noiseGain: 0.26,
          duration: 0.16,
        };
    }
  }
}
