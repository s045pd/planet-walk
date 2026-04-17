import {
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Object3D,
  Scene,
  Vector3,
} from 'three';

import type { PlanetConfig } from '../planet/PlanetConfigs';
import { Dust } from './Dust';
import { Sky } from './Sky';
import { Terrain } from './Terrain';

export interface SurfaceSceneOptions {
  size: number;
  segments: number;
}

export class SurfaceScene {
  readonly root = new Object3D();
  private scene: Scene;
  private terrain: Terrain | null = null;
  private sky: Sky | null = null;
  private dust: Dust | null = null;
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private prevFog: Fog | null | undefined;
  private prevBg: Color | null;
  private config: PlanetConfig | null = null;
  private options: SurfaceSceneOptions;

  constructor(scene: Scene, options: SurfaceSceneOptions) {
    this.scene = scene;
    this.options = options;

    this.sun = new DirectionalLight(0xffffff, 1.4);
    this.sun.position.set(50, 80, 40);
    this.hemi = new HemisphereLight(0xffffff, 0x000000, 0.55);
    this.root.add(this.sun, this.hemi);

    this.prevBg = this.scene.background as Color | null;
    this.prevFog = this.scene.fog as Fog | null | undefined;

    this.root.visible = false;
  }

  load(config: PlanetConfig): void {
    this.config = config;
    this.unloadMeshes();

    this.terrain = new Terrain({
      size: this.options.size,
      segments: this.options.segments,
      seed: config.id.charCodeAt(0) + config.id.length * 13,
      palette: config.surfacePalette,
    });
    this.root.add(this.terrain.root);

    this.sky = new Sky({
      top: config.sky.top.clone(),
      horizon: config.sky.horizon.clone(),
      sunColor: config.surfacePalette.sunColor.clone(),
      sunDir: [0.4, 0.8, 0.2],
      radius: this.options.size * 2.2,
    });
    this.root.add(this.sky.mesh);

    this.dust = new Dust({
      color: config.surfacePalette.dustColor.clone(),
      count: 240,
      radius: 35,
    });
    this.root.add(this.dust.points);

    this.hemi.color.copy(config.sky.horizon);
    this.hemi.groundColor.copy(config.surfacePalette.groundTint);
    this.hemi.intensity = config.surfacePalette.ambientIntensity;
    this.sun.color.copy(config.surfacePalette.sunColor);
    this.sun.intensity = config.surfacePalette.sunIntensity;
  }

  getHeightAt(x: number, z: number): number {
    return this.terrain ? this.terrain.getHeight(x, z) : 0;
  }

  activate(): void {
    if (!this.config) return;
    this.prevBg = this.scene.background as Color | null;
    this.prevFog = this.scene.fog as Fog | null | undefined;
    this.scene.background = this.config.sky.horizon.clone();
    this.scene.fog = new Fog(this.config.sky.horizon.clone().getHex(), 60, this.options.size * 0.95);
    this.root.visible = true;
  }

  deactivate(): void {
    this.scene.background = this.prevBg;
    this.scene.fog = this.prevFog ?? null;
    this.root.visible = false;
  }

  update(delta: number, playerPosition: Vector3): void {
    if (!this.root.visible) return;
    if (this.dust) {
      this.dust.setOrigin(playerPosition);
      this.dust.update(delta);
    }
    this.sun.position.set(playerPosition.x + 80, 120, playerPosition.z + 60);
    this.sun.target.position.copy(playerPosition);
    this.sun.target.updateMatrixWorld();
  }

  dispose(): void {
    this.unloadMeshes();
    this.root.remove(this.sun, this.hemi);
  }

  private unloadMeshes(): void {
    if (this.terrain) { this.root.remove(this.terrain.root); this.terrain.dispose(); this.terrain = null; }
    if (this.sky) { this.root.remove(this.sky.mesh); this.sky.dispose(); this.sky = null; }
    if (this.dust) { this.root.remove(this.dust.points); this.dust.dispose(); this.dust = null; }
  }
}
