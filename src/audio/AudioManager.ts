import { AmbientSound } from './AmbientSound';
import { ProceduralAudio } from './ProceduralAudio';

/**
 * 音效管理器单例：管理所有音频（环境音、脚步声、特效音）
 */
export class AudioManager {
  private static instance: AudioManager | null = null;
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
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 1;
    this.ambientGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1;
    this.sfxGain.connect(this.masterGain);

    this.ambient = new AmbientSound(this.ctx, this.ambientGain);
    this.initialized = true;
  }

  /** 切换星球环境音 */
  setPlanet(planetName: string): void {
    if (!this.initialized || planetName === this.currentPlanet) return;
    this.currentPlanet = planetName;
    this.ambient?.start(planetName);
  }

  /** 播放脚步声 */
  playFootstep(): void {
    if (!this.ctx || !this.proc || !this.sfxGain) return;

    const osc = this.proc.createFootstep();
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime + 0.05, 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
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

  /** 设置主音量 (0-1) */
  setMasterVolume(v: number): void {
    this.masterGain?.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.05);
  }

  /** 设置环境音音量 (0-1) */
  setAmbientVolume(v: number): void {
    this.ambientGain?.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.05);
  }

  /** 设置音效音量 (0-1) */
  setSfxVolume(v: number): void {
    this.sfxGain?.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.05);
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
}
