import { AmbientSound } from './AmbientSound';
import { ProceduralAudio } from './ProceduralAudio';

/**
 * 音效管理器单例：管理所有音频（环境音、脚步声、特效音）
 */
export class AudioManager {
  private static instance: AudioManager | null = null;

  masterVolume = 0.5;
  ambientVolume = 1;
  sfxVolume = 1;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambient: AmbientSound | null = null;
  private proc: ProceduralAudio | null = null;
  private initialized = false;
  private currentPlanet = '';

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** 初始化音频上下文（需要用户交互后调用） */
  init(): void {
    if (this.initialized) return;

    this.ctx = new AudioContext();
    this.proc = new ProceduralAudio(this.ctx);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.ambientVolume;
    this.ambientGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.ambient = new AmbientSound(this.ctx, this.ambientGain);
    this.initialized = true;
  }

  /** 切换星球环境音 */
  setPlanet(planetName: string): void {
    if (planetName === this.currentPlanet) return;
    this.currentPlanet = planetName;
    if (!this.initialized) return;
    this.ambient?.start(planetName);
  }

  /** 播放脚步声 */
  playFootstep(planetName = this.currentPlanet): void {
    if (!this.ctx || !this.proc || !this.sfxGain) return;
    this.resume();

    const at = this.ctx.currentTime;
    const step = this.proc.createFootstep(planetName || 'earth', at);
    const gain = this.ctx.createGain();
    gain.gain.value = 0.14 + Math.random() * 0.05;

    step.output.connect(gain);
    gain.connect(this.sfxGain);
    step.tone.start(at);
    step.tone.stop(at + step.duration + 0.02);
    step.noise.start(at);
    step.noise.stop(at + step.duration + 0.01);

    let cleaned = false;
    const cleanup = (): void => {
      if (cleaned) return;
      cleaned = true;
      step.tone.disconnect();
      step.noise.disconnect();
      step.output.disconnect();
      gain.disconnect();
    };
    step.tone.onended = cleanup;
  }

  /** 播放大气层穿越音效 */
  playAtmosphereEntry(): void {
    if (!this.ctx || !this.proc || !this.sfxGain) return;

    const osc = this.proc.createAtmosphereEntry();
    const gain = this.ctx.createGain();
    gain.gain.value = 0.2;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime + 1.5, 0.4);

    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.5);
  }

  /** 播放 UI 点击反馈音 */
  playUIClick(): void {
    if (!this.ctx || !this.proc || !this.sfxGain) return;
    this.resume();

    const at = this.ctx.currentTime;
    const click = this.proc.createTone({
      frequency: 920,
      endFrequency: 660,
      duration: 0.055,
      type: 'square',
      gain: 0.09,
      atTime: at,
    });
    const clickGain = this.ctx.createGain();
    clickGain.gain.value = 1;
    click.gain.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.oscillator.start(at);
    click.oscillator.stop(at + click.duration + 0.015);

    const transient = this.proc.createNoiseSource(0.03, false);
    const transientFilter = this.ctx.createBiquadFilter();
    transientFilter.type = 'highpass';
    transientFilter.frequency.value = 1800;
    const transientGain = this.ctx.createGain();
    transientGain.gain.setValueAtTime(0.0001, at);
    transientGain.gain.linearRampToValueAtTime(0.018, at + 0.004);
    transientGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.025);
    transient.connect(transientFilter);
    transientFilter.connect(transientGain);
    transientGain.connect(this.sfxGain);
    transient.start(at);
    transient.stop(at + 0.03);

    click.oscillator.onended = () => {
      click.oscillator.disconnect();
      click.gain.disconnect();
      clickGain.disconnect();
    };
    transient.onended = () => {
      transient.disconnect();
      transientFilter.disconnect();
      transientGain.disconnect();
    };
  }

  /** 播放成就解锁提示音（上行音阶） */
  playAchievementUnlock(): void {
    if (!this.ctx || !this.proc || !this.sfxGain) return;
    this.resume();

    const proc = this.proc;
    const sfxGain = this.sfxGain;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      const at = now + index * 0.11;
      const tone = proc.createTone({
        frequency,
        endFrequency: frequency * 1.03,
        duration: 0.22,
        gain: 0.12,
        type: 'triangle',
        atTime: at,
      });
      tone.gain.connect(sfxGain);
      tone.oscillator.start(at);
      tone.oscillator.stop(at + tone.duration + 0.02);
      tone.oscillator.onended = () => {
        tone.oscillator.disconnect();
        tone.gain.disconnect();
      };
    });
  }

  /** 设置主音量 (0-1) */
  setMasterVolume(v: number): void {
    this.masterVolume = this.clampVolume(v);
    this.masterGain?.gain.setTargetAtTime(
      this.masterVolume,
      this.ctx?.currentTime ?? 0,
      0.05,
    );
  }

  /** 设置环境音音量 (0-1) */
  setAmbientVolume(v: number): void {
    this.ambientVolume = this.clampVolume(v);
    this.ambientGain?.gain.setTargetAtTime(
      this.ambientVolume,
      this.ctx?.currentTime ?? 0,
      0.05,
    );
  }

  /** 设置音效音量 (0-1) */
  setSfxVolume(v: number): void {
    this.sfxVolume = this.clampVolume(v);
    this.sfxGain?.gain.setTargetAtTime(
      this.sfxVolume,
      this.ctx?.currentTime ?? 0,
      0.05,
    );
  }

  /** 恢复音频上下文（浏览器自动暂停策略） */
  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  dispose(): void {
    this.ambient?.dispose();
    this.masterGain?.disconnect();
    this.ctx?.close();
    AudioManager.instance = null;
    this.initialized = false;
  }

  private clampVolume(v: number): number {
    return Math.min(1, Math.max(0, v));
  }
}
