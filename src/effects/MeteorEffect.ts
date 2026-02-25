import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

/**
 * 流星特效（地球）：随机方向划过天际
 */
export class MeteorEffect extends ParticleSystem {
  private readonly radius: number;
  private timer = 0;
  private readonly interval = 3; // 每3秒一颗流星

  constructor(radius: number) {
    const mat = new THREE.PointsMaterial({
      color: 0xffffcc,
      size: radius * 0.003,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    super(200, mat);
    this.radius = radius;
  }

  protected onUpdate(delta: number): void {
    this.timer += delta;
    if (this.timer >= this.interval) {
      this.timer = 0;
      this.spawnMeteor();
    }
  }

  private spawnMeteor(): void {
    // 随机起点（大气层上方）
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const h = this.radius * 1.15;

    const px = h * Math.sin(phi) * Math.cos(theta);
    const py = h * Math.cos(phi);
    const pz = h * Math.sin(phi) * Math.sin(theta);

    // 切线方向速度
    const speed = this.radius * 0.3;
    const vx = (Math.random() - 0.5) * speed;
    const vy = -Math.abs(Math.random() * speed * 0.5);
    const vz = (Math.random() - 0.5) * speed;

    // 拖尾：发射多个粒子
    for (let i = 0; i < 15; i++) {
      const t = i * 0.02;
      this.emit(
        px - vx * t, py - vy * t, pz - vz * t,
        vx, vy, vz,
        0.8 + Math.random() * 0.4,
      );
    }
  }
}
