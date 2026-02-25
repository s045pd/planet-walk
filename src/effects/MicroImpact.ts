import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

/**
 * 微陨石撞击闪光（月球）：随机位置的短促闪光
 */
export class MicroImpact extends ParticleSystem {
  private readonly radius: number;
  private timer = 0;
  private readonly interval = 5; // 每5秒一次撞击

  constructor(radius: number) {
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: radius * 0.005,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    super(100, mat);
    this.radius = radius;
  }

  protected onUpdate(delta: number): void {
    this.timer += delta;
    if (this.timer >= this.interval) {
      this.timer = 0;
      this.spawnImpact();
    }
  }

  private spawnImpact(): void {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const h = this.radius * 1.001;

    const px = h * Math.sin(phi) * Math.cos(theta);
    const py = h * Math.cos(phi);
    const pz = h * Math.sin(phi) * Math.sin(theta);

    // 径向爆炸粒子
    const normal = new THREE.Vector3(px, py, pz).normalize();
    const speed = this.radius * 0.01;

    for (let i = 0; i < 8; i++) {
      const spread = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5),
      ).normalize().add(normal).normalize();

      this.emit(
        px, py, pz,
        spread.x * speed,
        spread.y * speed,
        spread.z * speed,
        0.3 + Math.random() * 0.3,
      );
    }
  }
}
