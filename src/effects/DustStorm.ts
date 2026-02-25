import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';

/**
 * 沙尘暴特效（火星）：风向驱动的沙尘粒子
 */
export class DustStorm extends ParticleSystem {
  private readonly radius: number;
  private timer = 0;
  private readonly windDir = new THREE.Vector3(1, 0.1, 0.5).normalize();

  constructor(radius: number) {
    const mat = new THREE.PointsMaterial({
      color: 0xc4875a,
      size: radius * 0.002,
      transparent: true,
      opacity: 0.5,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    super(1500, mat);
    this.radius = radius;
  }

  protected onUpdate(delta: number): void {
    this.timer += delta;
    if (this.timer >= 0.1) {
      this.timer = 0;
      this.spawnDust();
    }
  }

  private spawnDust(): void {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.PI * 0.3 + Math.random() * Math.PI * 0.4;
    const h = this.radius * 1.005;

    const px = h * Math.sin(phi) * Math.cos(theta);
    const py = h * Math.cos(phi);
    const pz = h * Math.sin(phi) * Math.sin(theta);

    const speed = this.radius * 0.02;
    for (let i = 0; i < 5; i++) {
      this.emit(
        px + (Math.random() - 0.5) * this.radius * 0.01,
        py + (Math.random() - 0.5) * this.radius * 0.01,
        pz + (Math.random() - 0.5) * this.radius * 0.01,
        this.windDir.x * speed + (Math.random() - 0.5) * speed * 0.3,
        this.windDir.y * speed + (Math.random() - 0.5) * speed * 0.3,
        this.windDir.z * speed + (Math.random() - 0.5) * speed * 0.3,
        2 + Math.random() * 3,
      );
    }
  }
}
