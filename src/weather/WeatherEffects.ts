import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { WeatherType } from '../planet/PlanetConfig';

/** 天气效果接口 */
export interface IWeatherEffect extends IDisposable {
  attach(scene: THREE.Scene): void;
  detach(scene: THREE.Scene): void;
  update(delta: number, cameraPosition: THREE.Vector3): void;
}

// ─── 地球：雨效果 ───

export class RainEffect implements IWeatherEffect {
  private readonly points: THREE.Points;
  private readonly geometry: THREE.BufferGeometry;
  private readonly positions: Float32Array;
  private readonly velocities: Float32Array;
  private readonly count = 2000;
  private readonly radius: number;

  constructor(planetRadius: number) {
    this.radius = planetRadius;
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xaaccff, size: planetRadius * 0.001,
      transparent: true, opacity: 0.6, depthWrite: false,
    });
    this.points = new THREE.Points(this.geometry, mat);
    this.points.frustumCulled = false;
    for (let i = 0; i < this.count; i++) this.resetParticle(i);
  }

  private resetParticle(i: number): void {
    const i3 = i * 3;
    this.positions[i3] = (Math.random() - 0.5) * this.radius * 0.1;
    this.positions[i3 + 1] = Math.random() * this.radius * 0.05;
    this.positions[i3 + 2] = (Math.random() - 0.5) * this.radius * 0.1;
    this.velocities[i] = this.radius * 0.05 + Math.random() * this.radius * 0.03;
  }

  attach(scene: THREE.Scene): void { scene.add(this.points); }
  detach(scene: THREE.Scene): void { scene.remove(this.points); }

  update(delta: number, cameraPosition: THREE.Vector3): void {
    this.points.position.copy(cameraPosition);
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.positions[i3 + 1] -= this.velocities[i] * delta;
      if (this.positions[i3 + 1] < -this.radius * 0.02) this.resetParticle(i);
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geometry.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

// ─── 地球：雪效果 ───

export class SnowEffect implements IWeatherEffect {
  private readonly points: THREE.Points;
  private readonly geo: THREE.BufferGeometry;
  private readonly pos: Float32Array;
  private readonly drifts: Float32Array;
  private readonly spd: Float32Array;
  private readonly count = 1500;
  private readonly radius: number;
  private time = 0;

  constructor(planetRadius: number) {
    this.radius = planetRadius;
    this.pos = new Float32Array(this.count * 3);
    this.drifts = new Float32Array(this.count);
    this.spd = new Float32Array(this.count);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: planetRadius * 0.0015,
      transparent: true, opacity: 0.8, depthWrite: false,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    for (let i = 0; i < this.count; i++) this.resetSnow(i);
  }

  private resetSnow(i: number): void {
    const i3 = i * 3;
    this.pos[i3] = (Math.random() - 0.5) * this.radius * 0.1;
    this.pos[i3 + 1] = Math.random() * this.radius * 0.05;
    this.pos[i3 + 2] = (Math.random() - 0.5) * this.radius * 0.1;
    this.drifts[i] = (Math.random() - 0.5) * 2;
    this.spd[i] = this.radius * 0.01 + Math.random() * this.radius * 0.01;
  }

  attach(scene: THREE.Scene): void { scene.add(this.points); }
  detach(scene: THREE.Scene): void { scene.remove(this.points); }

  update(delta: number, cameraPosition: THREE.Vector3): void {
    this.time += delta;
    this.points.position.copy(cameraPosition);
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.pos[i3] += Math.sin(this.time + this.drifts[i]) * this.radius * 0.0005 * delta;
      this.pos[i3 + 1] -= this.spd[i] * delta;
      this.pos[i3 + 2] += Math.cos(this.time * 0.7 + this.drifts[i]) * this.radius * 0.0003 * delta;
      if (this.pos[i3 + 1] < -this.radius * 0.02) this.resetSnow(i);
    }
    this.geo.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

// ─── 地球：雾效果 ───

export class FogEffect implements IWeatherEffect {
  private fog: THREE.FogExp2 | null = null;
  private savedFog: THREE.Fog | THREE.FogExp2 | null = null;
  private scene: THREE.Scene | null = null;
  private readonly density: number;

  constructor(planetRadius: number) {
    this.density = 0.15 / planetRadius;
  }

  attach(scene: THREE.Scene): void {
    this.scene = scene;
    this.savedFog = scene.fog;
    this.fog = new THREE.FogExp2(0xcccccc, this.density);
    scene.fog = this.fog;
  }

  detach(scene: THREE.Scene): void {
    scene.fog = this.savedFog;
    this.fog = null;
    this.savedFog = null;
    this.scene = null;
  }

  update(_delta: number, _cameraPosition: THREE.Vector3): void {
    // 雾效不需要每帧更新
  }

  dispose(): void {
    if (this.scene) this.scene.fog = this.savedFog;
  }
}

// ─── 火星：增强沙尘暴（视觉遮蔽+橙色滤镜） ───

export class EnhancedDustStorm implements IWeatherEffect {
  private readonly overlay: THREE.Mesh;
  private readonly overlayMat: THREE.MeshBasicMaterial;
  private intensity = 0;

  constructor(_planetRadius: number) {
    // 全屏橙色滤镜覆盖层
    this.overlayMat = new THREE.MeshBasicMaterial({
      color: 0xcc6633,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    this.overlay = new THREE.Mesh(geo, this.overlayMat);
    this.overlay.renderOrder = 999;
  }

  attach(scene: THREE.Scene): void { scene.add(this.overlay); }
  detach(scene: THREE.Scene): void { scene.remove(this.overlay); }

  update(delta: number, cameraPosition: THREE.Vector3): void {
    // 滤镜跟随相机
    this.overlay.position.copy(cameraPosition);
    // 渐入效果
    this.intensity = Math.min(this.intensity + delta * 0.3, 0.35);
    this.overlayMat.opacity = this.intensity;
  }

  dispose(): void {
    this.overlay.geometry.dispose();
    this.overlayMat.dispose();
  }
}

// ─── 火星：蓝色日落效果 ───

export class BlueSunsetEffect implements IWeatherEffect {
  private readonly light: THREE.DirectionalLight;
  private savedColor: THREE.Color | null = null;
  private savedIntensity = 1;

  constructor(_planetRadius: number) {
    this.light = new THREE.DirectionalLight(0x4466aa, 0.6);
    this.light.position.set(-1, 0.1, 0);
  }

  attach(scene: THREE.Scene): void {
    // 保存现有主光源状态
    scene.traverse((obj) => {
      if (obj instanceof THREE.DirectionalLight && obj !== this.light) {
        this.savedColor = obj.color.clone();
        this.savedIntensity = obj.intensity;
        // 降低主光源强度模拟日落
        obj.color.set(0x886644);
        obj.intensity *= 0.4;
      }
    });
    scene.add(this.light);
  }

  detach(scene: THREE.Scene): void {
    scene.remove(this.light);
    // 恢复主光源
    if (this.savedColor) {
      scene.traverse((obj) => {
        if (obj instanceof THREE.DirectionalLight && obj !== this.light) {
          obj.color.copy(this.savedColor!);
          obj.intensity = this.savedIntensity;
        }
      });
    }
  }

  update(_delta: number, _cameraPosition: THREE.Vector3): void {
    // 静态光照效果
  }

  dispose(): void {
    // 无需额外清理
  }
}

// ─── 月球：月尘飘浮效果 ───

export class LunarDustEffect implements IWeatherEffect {
  private readonly points: THREE.Points;
  private readonly geo: THREE.BufferGeometry;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly count = 500;
  private readonly radius: number;
  private time = 0;

  constructor(planetRadius: number) {
    this.radius = planetRadius;
    this.pos = new Float32Array(this.count * 3);
    this.vel = new Float32Array(this.count * 3);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xbbbbbb, size: planetRadius * 0.0008,
      transparent: true, opacity: 0.4, depthWrite: false,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    for (let i = 0; i < this.count; i++) this.resetDust(i);
  }

  private resetDust(i: number): void {
    const i3 = i * 3;
    this.pos[i3] = (Math.random() - 0.5) * this.radius * 0.06;
    this.pos[i3 + 1] = Math.random() * this.radius * 0.01;
    this.pos[i3 + 2] = (Math.random() - 0.5) * this.radius * 0.06;
    this.vel[i3] = (Math.random() - 0.5) * this.radius * 0.001;
    this.vel[i3 + 1] = this.radius * 0.002 + Math.random() * this.radius * 0.003;
    this.vel[i3 + 2] = (Math.random() - 0.5) * this.radius * 0.001;
  }

  attach(scene: THREE.Scene): void { scene.add(this.points); }
  detach(scene: THREE.Scene): void { scene.remove(this.points); }

  update(delta: number, cameraPosition: THREE.Vector3): void {
    this.time += delta;
    this.points.position.copy(cameraPosition);
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      this.pos[i3] += this.vel[i3] * delta;
      // 缓慢上升（低重力月尘飘浮）
      this.pos[i3 + 1] += this.vel[i3 + 1] * delta * 0.3;
      this.pos[i3 + 2] += this.vel[i3 + 2] * delta;
      if (this.pos[i3 + 1] > this.radius * 0.02) this.resetDust(i);
    }
    this.geo.attributes.position.needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    (this.points.material as THREE.Material).dispose();
  }
}

// ─── 月球：极端光照对比 ───

export class ExtremeLightEffect implements IWeatherEffect {
  private savedIntensity = 1;
  private light: THREE.DirectionalLight | null = null;

  attach(scene: THREE.Scene): void {
    scene.traverse((obj) => {
      if (obj instanceof THREE.DirectionalLight && !this.light) {
        this.light = obj;
        this.savedIntensity = obj.intensity;
        obj.intensity = 2.5;
      }
    });
  }

  detach(_scene: THREE.Scene): void {
    if (this.light) {
      this.light.intensity = this.savedIntensity;
      this.light = null;
    }
  }

  update(_delta: number, _cameraPosition: THREE.Vector3): void {}
  dispose(): void {
    if (this.light) this.light.intensity = this.savedIntensity;
  }
}

// ─── 空效果（晴天/多云/稀薄大气/微陨石等无需额外视觉的天气） ───

export class NullEffect implements IWeatherEffect {
  attach(_scene: THREE.Scene): void {}
  detach(_scene: THREE.Scene): void {}
  update(_delta: number, _cameraPosition: THREE.Vector3): void {}
  dispose(): void {}
}

/** 根据天气类型创建对应效果实例 */
export function createWeatherEffect(type: WeatherType, planetRadius: number): IWeatherEffect {
  switch (type) {
    case 'rain': return new RainEffect(planetRadius);
    case 'snow': return new SnowEffect(planetRadius);
    case 'fog': return new FogEffect(planetRadius);
    case 'dust_storm': return new EnhancedDustStorm(planetRadius);
    case 'blue_sunset': return new BlueSunsetEffect(planetRadius);
    case 'lunar_dust': return new LunarDustEffect(planetRadius);
    case 'extreme_light': return new ExtremeLightEffect();
    default: return new NullEffect();
  }
}
