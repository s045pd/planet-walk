import { ProceduralAudio } from './ProceduralAudio';

/**
 * 环境音循环管理：每个星球独立的环境音
 */
export class AmbientSound {
  private readonly ctx: AudioContext;
  private readonly proc: ProceduralAudio;
  private readonly gainNode: GainNode;
  private readonly cleanupFns: Array<() => void> = [];
  private active = false;
  private crackleTimer: number | null = null;
  private stopTimer: number | null = null;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.proc = new ProceduralAudio(ctx);
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(destination);
  }

  /** 启动环境音（根据星球类型选择不同音色） */
  start(planetName: string): void {
    this.clearStopTimer();
    this.disposeGraph();
    this.clearCrackleTimer();
    this.active = true;

    switch (planetName) {
      case 'mars':
        this.startMarsAmbience();
        break;
      case 'moon':
        this.startMoonAmbience();
        break;
      case 'earth':
      default:
        this.startEarthAmbience();
        break;
    }

    // 淡入
    const now = this.ctx.currentTime;
    const current = Math.max(0.0001, this.gainNode.gain.value);
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(current, now);
    this.gainNode.gain.exponentialRampToValueAtTime(
      planetName === 'moon' ? 0.018 : 0.09,
      now + 0.8,
    );
  }

  /** 停止环境音（淡出） */
  stop(): void {
    if (!this.active && this.cleanupFns.length === 0) return;

    this.clearCrackleTimer();
    const now = this.ctx.currentTime;
    const current = Math.max(0.0001, this.gainNode.gain.value);
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(current, now);
    this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    this.stopTimer = window.setTimeout(() => {
      this.stopTimer = null;
      this.disposeGraph();
    }, 420);

    this.active = false;
  }

  dispose(): void {
    this.clearStopTimer();
    this.clearCrackleTimer();
    this.disposeGraph();
    this.gainNode.disconnect();
  }

  private startMarsAmbience(): void {
    const lowHowl = this.proc.createFilteredNoiseLoop({
      filterType: 'bandpass',
      frequency: 180,
      q: 1.1,
      gain: 0.21,
      duration: 5,
    });
    const sandHiss = this.proc.createFilteredNoiseLoop({
      filterType: 'highpass',
      frequency: 1200,
      q: 0.65,
      gain: 0.05,
      duration: 4,
    });

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.075;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 95;
    lfo.connect(lfoGain);
    lfoGain.connect(lowHowl.filter.frequency);

    lowHowl.gain.connect(this.gainNode);
    sandHiss.gain.connect(this.gainNode);
    lowHowl.source.start();
    sandHiss.source.start();
    lfo.start();

    this.cleanupFns.push(() => {
      try {
        lowHowl.source.stop();
      } catch {
        // ignored
      }
      try {
        sandHiss.source.stop();
      } catch {
        // ignored
      }
      try {
        lfo.stop();
      } catch {
        // ignored
      }
      lowHowl.source.disconnect();
      lowHowl.filter.disconnect();
      lowHowl.gain.disconnect();
      sandHiss.source.disconnect();
      sandHiss.filter.disconnect();
      sandHiss.gain.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
    });
  }

  private startMoonAmbience(): void {
    this.scheduleMoonCrackle();
  }

  private startEarthAmbience(): void {
    const lowBed = this.proc.createFilteredNoiseLoop({
      filterType: 'lowpass',
      frequency: 650,
      q: 0.7,
      gain: 0.07,
      duration: 5,
    });
    const leaves = this.proc.createFilteredNoiseLoop({
      filterType: 'bandpass',
      frequency: 2200,
      q: 1.0,
      gain: 0.045,
      duration: 4,
    });
    const birdLike = this.proc.createFilteredNoiseLoop({
      filterType: 'highpass',
      frequency: 3400,
      q: 0.8,
      gain: 0.018,
      duration: 3,
    });

    const lfo = this.ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 0.11;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(leaves.filter.frequency);

    lowBed.gain.connect(this.gainNode);
    leaves.gain.connect(this.gainNode);
    birdLike.gain.connect(this.gainNode);
    lowBed.source.start();
    leaves.source.start();
    birdLike.source.start();
    lfo.start();

    this.cleanupFns.push(() => {
      try {
        lowBed.source.stop();
      } catch {
        // ignored
      }
      try {
        leaves.source.stop();
      } catch {
        // ignored
      }
      try {
        birdLike.source.stop();
      } catch {
        // ignored
      }
      try {
        lfo.stop();
      } catch {
        // ignored
      }
      lowBed.source.disconnect();
      lowBed.filter.disconnect();
      lowBed.gain.disconnect();
      leaves.source.disconnect();
      leaves.filter.disconnect();
      leaves.gain.disconnect();
      birdLike.source.disconnect();
      birdLike.filter.disconnect();
      birdLike.gain.disconnect();
      lfo.disconnect();
      lfoGain.disconnect();
    });
  }

  private scheduleMoonCrackle(): void {
    if (!this.active) {
      return;
    }
    const delay = 3500 + Math.random() * 5500;
    this.crackleTimer = window.setTimeout(() => {
      this.crackleTimer = null;
      if (!this.active) {
        return;
      }
      this.playMoonCrackle();
      this.scheduleMoonCrackle();
    }, delay);
  }

  private playMoonCrackle(): void {
    const startTime = this.ctx.currentTime;
    const duration = 0.08 + Math.random() * 0.14;
    const source = this.proc.createNoiseSource(duration, false);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1400 + Math.random() * 2800;
    filter.Q.value = 6 + Math.random() * 5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.03, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);
    source.start(startTime);
    source.stop(startTime + duration + 0.02);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };

    if (Math.random() > 0.58) {
      const chirp = this.proc.createTone({
        frequency: 500 + Math.random() * 300,
        endFrequency: 1200 + Math.random() * 500,
        duration: 0.05,
        gain: 0.012,
        type: 'square',
        atTime: startTime,
      });
      chirp.gain.connect(this.gainNode);
      chirp.oscillator.start(startTime);
      chirp.oscillator.stop(startTime + chirp.duration + 0.02);
      chirp.oscillator.onended = () => {
        chirp.oscillator.disconnect();
        chirp.gain.disconnect();
      };
    }
  }

  private disposeGraph(): void {
    for (const cleanup of this.cleanupFns.splice(0)) {
      cleanup();
    }
  }

  private clearCrackleTimer(): void {
    if (this.crackleTimer !== null) {
      window.clearTimeout(this.crackleTimer);
      this.crackleTimer = null;
    }
  }

  private clearStopTimer(): void {
    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }
}
