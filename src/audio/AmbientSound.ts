import { ProceduralAudio } from './ProceduralAudio';

/**
 * 环境音循环管理：每个星球独立的环境音
 */
export class AmbientSound {
  private readonly ctx: AudioContext;
  private readonly proc: ProceduralAudio;
  private readonly gainNode: GainNode;
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private active = false;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.proc = new ProceduralAudio(ctx);
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(destination);
  }

  /** 启动环境音（根据星球类型选择不同音色） */
  start(planetName: string): void {
    this.stop();

    let freq: number;
    let q: number;

    switch (planetName) {
      case 'earth':
        freq = 300; q = 0.5; // 风声
        break;
      case 'mars':
        freq = 150; q = 1.2; // 低沉沙尘
        break;
      case 'moon':
        freq = 800; q = 8; // 高频微弱嗡鸣（近乎静谧）
        break;
      default:
        freq = 200; q = 1;
    }

    const wind = this.proc.createWind(freq, q);
    this.source = wind.source;
    this.filter = wind.filter;
    this.filter.connect(this.gainNode);
    this.source.start();
    this.active = true;

    // 淡入
    this.gainNode.gain.setTargetAtTime(
      planetName === 'moon' ? 0.02 : 0.08,
      this.ctx.currentTime,
      0.5,
    );
  }

  /** 停止环境音（淡出） */
  stop(): void {
    if (!this.active) return;

    this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);

    const src = this.source;
    if (src) {
      setTimeout(() => {
        try { src.stop(); } catch { /* already stopped */ }
      }, 500);
    }

    this.source = null;
    this.filter = null;
    this.active = false;
  }

  dispose(): void {
    this.stop();
    this.gainNode.disconnect();
  }
}
