/**
 * 程序化音效生成器：用Web Audio API生成各种音效
 */
export class ProceduralAudio {
  private readonly ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  /** 生成白噪声Buffer */
  createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /** 创建风声节点（滤波噪声） */
  createWind(frequency: number, q: number): { source: AudioBufferSourceNode; filter: BiquadFilterNode } {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(4);
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;

    noise.connect(filter);
    return { source: noise, filter };
  }

  /** 创建脚步声（短促低频脉冲） */
  createFootstep(): OscillatorNode {
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;
    return osc;
  }

  /** 创建大气层穿越音效（上升频率扫描） */
  createAtmosphereEntry(): OscillatorNode {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    return osc;
  }
}