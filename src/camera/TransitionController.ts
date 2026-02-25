import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import { geoToCartesian } from '../utils/geo';
import { clamp } from '../utils/math';

export interface TransitionControllerConfig {
  camera: THREE.PerspectiveCamera;
  planetCenter?: THREE.Vector3;
  getPlanetRadius: () => number;
  atmosphereScale?: number;
  surfaceOffset?: number;
}

/** 太空→地表过渡控制器：按路径关键点执行平滑飞行动画 */
export class TransitionController implements IDisposable {
  readonly camera: THREE.PerspectiveCamera;

  private readonly _planetCenter = new THREE.Vector3();
  private readonly _getPlanetRadius: () => number;
  private readonly _atmosphereScale: number;
  private readonly _surfaceOffset: number;

  private _rafId = 0;
  private _activeResolve: (() => void) | null = null;

  private readonly _start = new THREE.Vector3();
  private readonly _atmosphere = new THREE.Vector3();
  private readonly _surface = new THREE.Vector3();
  private readonly _normal = new THREE.Vector3();
  private readonly _tmp = new THREE.Vector3();

  constructor(config: TransitionControllerConfig) {
    this.camera = config.camera;
    this._planetCenter.copy(config.planetCenter ?? new THREE.Vector3(0, 0, 0));
    this._getPlanetRadius = config.getPlanetRadius;
    this._atmosphereScale = config.atmosphereScale ?? 1.02;
    this._surfaceOffset = config.surfaceOffset ?? 2;
  }

  async animateToSurface(lat: number, lng: number, duration = 3000): Promise<void> {
    this.cancelCurrentAnimation();

    const radius = this._getPlanetRadius();
    const surfaceBase = geoToCartesian(lat, lng, radius).add(this._planetCenter);
    this._normal.copy(surfaceBase).sub(this._planetCenter).normalize();
    this._surface.copy(this._normal).multiplyScalar(radius + this._surfaceOffset).add(this._planetCenter);
    this._atmosphere
      .copy(this._normal)
      .multiplyScalar(radius * this._atmosphereScale)
      .add(this._planetCenter);
    this._start.copy(this.camera.position);

    if (duration <= 0) {
      this.camera.position.copy(this._surface);
      this.camera.lookAt(this._planetCenter);
      return;
    }

    await new Promise<void>((resolve) => {
      this._activeResolve = resolve;
      const startTime = performance.now();
      const split = 0.42;

      const step = (now: number): void => {
        const rawT = clamp((now - startTime) / duration, 0, 1);
        const eased = this.easeInOutCubic(rawT);

        if (eased < split) {
          this._tmp.lerpVectors(this._start, this._atmosphere, eased / split);
        } else {
          this._tmp.lerpVectors(this._atmosphere, this._surface, (eased - split) / (1 - split));
        }

        this.camera.position.copy(this._tmp);
        this.camera.lookAt(this._planetCenter);

        if (rawT < 1) {
          this._rafId = requestAnimationFrame(step);
        } else {
          this._rafId = 0;
          this._activeResolve = null;
          this.camera.position.copy(this._surface);
          this.camera.lookAt(this._planetCenter);
          resolve();
        }
      };

      this._rafId = requestAnimationFrame(step);
    });
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private cancelCurrentAnimation(): void {
    if (this._rafId !== 0) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    if (this._activeResolve) {
      const resolve = this._activeResolve;
      this._activeResolve = null;
      resolve();
    }
  }

  dispose(): void {
    this.cancelCurrentAnimation();
  }
}
