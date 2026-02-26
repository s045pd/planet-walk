import * as THREE from 'three';
import type { IDisposable } from '../../core/types';
import { CloudLayer } from './CloudLayer';
import { NightLights } from './NightLights';
import { OceanEffect } from './OceanEffect';

export interface EarthEffectsConfig {
  cloudsPath?: string;
  nightPath?: string;
  deferTextureLoad?: boolean;
}

/**
 * 地球特效管理器 — 组合云层+夜景+海洋高光
 */
export class EarthEffects implements IDisposable {
  readonly root: THREE.Group;
  private clouds: CloudLayer;
  private nightLights: NightLights;
  private ocean: OceanEffect;
  private deferredTexturesLoaded = false;

  constructor(planetRadius: number, segments: number, config?: EarthEffectsConfig) {
    this.root = new THREE.Group();
    this.root.name = 'earth-effects';

    const autoLoad = !config?.deferTextureLoad;
    this.clouds = new CloudLayer(planetRadius, segments, config?.cloudsPath, autoLoad);
    this.nightLights = new NightLights(planetRadius, segments, config?.nightPath, autoLoad);
    this.ocean = new OceanEffect(planetRadius, segments);

    this.root.add(this.clouds.mesh);
    this.root.add(this.nightLights.mesh);
    this.root.add(this.ocean.mesh);
  }

  update(delta: number, sunDirection: THREE.Vector3): void {
    this.clouds.update(delta);
    this.nightLights.setSunDirection(sunDirection);
    this.ocean.setSunDirection(sunDirection);
  }

  loadDeferredTextures(): Promise<void> {
    if (this.deferredTexturesLoaded) {
      return Promise.resolve();
    }
    this.deferredTexturesLoaded = true;
    return Promise.all([
      this.clouds.loadTexture(),
      this.nightLights.loadTexture(),
    ]).then(() => {});
  }

  dispose(): void {
    this.clouds.dispose();
    this.nightLights.dispose();
    this.ocean.dispose();
  }
}
