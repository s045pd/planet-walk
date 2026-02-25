import * as THREE from 'three';

/**
 * GPU粒子系统基类：使用Points + BufferGeometry
 */
export abstract class ParticleSystem {
  protected readonly maxCount: number;
  protected readonly geometry: THREE.BufferGeometry;
  protected readonly points: THREE.Points;
  protected activeCount = 0;

  protected positions: Float32Array;
  protected velocities: Float32Array;
  protected lifetimes: Float32Array;
  protected ages: Float32Array;

  constructor(maxCount: number, material: THREE.PointsMaterial) {
    this.maxCount = maxCount;
    this.positions = new Float32Array(maxCount * 3);
    this.velocities = new Float32Array(maxCount * 3);
    this.lifetimes = new Float32Array(maxCount);
    this.ages = new Float32Array(maxCount);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setDrawRange(0, 0);

    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
  }

  get mesh(): THREE.Points {
    return this.points;
  }

  /** 发射一个粒子 */
  protected emit(px: number, py: number, pz: number, vx: number, vy: number, vz: number, lifetime: number): void {
    if (this.activeCount >= this.maxCount) return;
    const i = this.activeCount;
    const i3 = i * 3;
    this.positions[i3] = px;
    this.positions[i3 + 1] = py;
    this.positions[i3 + 2] = pz;
    this.velocities[i3] = vx;
    this.velocities[i3 + 1] = vy;
    this.velocities[i3 + 2] = vz;
    this.lifetimes[i] = lifetime;
    this.ages[i] = 0;
    this.activeCount++;
  }

  /** 每帧更新 */
  update(delta: number): void {
    this.onUpdate(delta);

    for (let i = 0; i < this.activeCount; i++) {
      this.ages[i] += delta;
      if (this.ages[i] >= this.lifetimes[i]) {
        this.swap(i, this.activeCount - 1);
        this.activeCount--;
        i--;
        continue;
      }
      const i3 = i * 3;
      this.positions[i3] += this.velocities[i3] * delta;
      this.positions[i3 + 1] += this.velocities[i3 + 1] * delta;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * delta;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, this.activeCount);
  }

  /** 交换两个粒子数据（用于池回收） */
  private swap(a: number, b: number): void {
    const a3 = a * 3, b3 = b * 3;
    for (let j = 0; j < 3; j++) {
      [this.positions[a3 + j], this.positions[b3 + j]] = [this.positions[b3 + j], this.positions[a3 + j]];
      [this.velocities[a3 + j], this.velocities[b3 + j]] = [this.velocities[b3 + j], this.velocities[a3 + j]];
    }
    [this.lifetimes[a], this.lifetimes[b]] = [this.lifetimes[b], this.lifetimes[a]];
    [this.ages[a], this.ages[b]] = [this.ages[b], this.ages[a]];
  }

  /** 子类实现：每帧发射逻辑 */
  protected abstract onUpdate(delta: number): void;

  dispose(): void {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}
