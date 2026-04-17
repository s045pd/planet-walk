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
import { biomeAt } from './Biomes';
import { Dust } from './Dust';
import { Landmarks } from './Landmarks';
import { Sky, type SkyPhase } from './Sky';
import { Terrain } from './Terrain';
import { WalkDust } from './WalkDust';

export interface SurfaceSceneOptions {
  size: number;
  segments: number;
}

export interface SurfaceUpdateInput {
  position: Vector3;
  walking: boolean;
  sprinting: boolean;
}

export interface DayInfo {
  sunAltitude: number;
  dayFactor: number;
  nightFactor: number;
  sunsetFactor: number;
  phaseLabel: 'DAWN' | 'DAY' | 'SUNSET' | 'NIGHT';
  localTime: string;
}

const DAY_CYCLE_SECONDS = 300;

export class SurfaceScene {
  readonly root = new Object3D();
  private scene: Scene;
  private terrain: Terrain | null = null;
  private sky: Sky | null = null;
  private dust: Dust | null = null;
  private walkDust: WalkDust | null = null;
  private landmarks: Landmarks | null = null;
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private prevFog: Fog | null | undefined;
  private prevBg: Color | null;
  private config: PlanetConfig | null = null;
  private options: SurfaceSceneOptions;
  private cycleTime = DAY_CYCLE_SECONDS * 0.28;
  private fogColorHolder = new Color();
  private skyTopTmp = new Color();
  private skyHorizonTmp = new Color();
  private sunColorTmp = new Color();
  private dayInfo: DayInfo = {
    sunAltitude: 1,
    dayFactor: 1,
    nightFactor: 0,
    sunsetFactor: 0,
    phaseLabel: 'DAY',
    localTime: '12:00',
  };

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

    this.walkDust = new WalkDust({
      color: config.surfacePalette.dustColor.clone(),
      capacity: 180,
    });
    this.root.add(this.walkDust.points);

    this.landmarks = new Landmarks(config, config.id.charCodeAt(0) * 9 + 11);
    this.root.add(this.landmarks.root);

    this.hemi.color.copy(config.sky.horizon);
    this.hemi.groundColor.copy(config.surfacePalette.groundTint);
    this.hemi.intensity = config.surfacePalette.ambientIntensity;
    this.sun.color.copy(config.surfacePalette.sunColor);
    this.sun.intensity = config.surfacePalette.sunIntensity;
  }

  getHeightAt(x: number, z: number): number {
    return this.terrain ? this.terrain.getHeight(x, z) : 0;
  }

  getBiomeAt(x: number, z: number): string {
    if (!this.terrain) return 'unknown';
    return biomeAt(this.terrain.noise, x, z);
  }

  getDayInfo(): Readonly<DayInfo> {
    return this.dayInfo;
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

  update(delta: number, input: SurfaceUpdateInput): void {
    if (!this.root.visible || !this.config) return;

    this.cycleTime = (this.cycleTime + delta) % DAY_CYCLE_SECONDS;
    const t = this.cycleTime / DAY_CYCLE_SECONDS;
    const angle = t * Math.PI * 2;
    const sunAltitude = Math.sin(angle);
    const sunHoriz = Math.cos(angle);

    const dayFactor = Math.max(0, Math.min(1, (sunAltitude + 0.15) / 0.45));
    const nightFactor = 1 - dayFactor;
    const sunsetBand = Math.max(0, 1 - Math.abs(sunAltitude) / 0.32);
    const sunsetFactor = sunsetBand * Math.max(0, 1 - Math.abs(sunHoriz) * 0.2);

    const { sky, surfacePalette } = this.config;
    this.skyTopTmp.copy(sky.top).lerp(surfacePalette.nightTop, nightFactor);
    this.skyHorizonTmp.copy(sky.horizon).lerp(surfacePalette.nightHorizon, nightFactor);

    if (sunsetFactor > 0.01) {
      this.skyHorizonTmp.lerp(surfacePalette.sunsetTint, sunsetFactor * 0.65);
      this.skyTopTmp.lerp(surfacePalette.sunsetTint, sunsetFactor * 0.35);
    }

    this.sunColorTmp.copy(surfacePalette.sunColor);
    if (sunsetFactor > 0.01) this.sunColorTmp.lerp(surfacePalette.sunsetTint, sunsetFactor * 0.55);

    const sunDir: [number, number, number] = [sunHoriz, Math.max(sunAltitude, -0.05), 0.25];
    const starVisibility = Math.max(0, nightFactor - 0.1) * surfacePalette.starVisibility;

    const phase: SkyPhase = {
      top: this.skyTopTmp,
      horizon: this.skyHorizonTmp,
      sunDir,
      sunColor: this.sunColorTmp,
      sunSize: 0.0025 + sunsetFactor * 0.0015,
      starVisibility,
    };
    if (this.sky) this.sky.setPhase(phase);

    this.sun.color.copy(this.sunColorTmp);
    this.sun.intensity = surfacePalette.sunIntensity * (0.05 + 0.95 * dayFactor);
    this.hemi.color.copy(this.skyHorizonTmp);
    this.hemi.groundColor.copy(surfacePalette.groundTint);
    this.hemi.intensity = surfacePalette.ambientIntensity * (0.2 + 0.8 * dayFactor);

    const p = input.position;
    this.sun.position.set(
      p.x + sunHoriz * 220,
      Math.max(sunAltitude, -0.05) * 200 + 40,
      p.z + 120,
    );
    this.sun.target.position.copy(p);
    this.sun.target.updateMatrixWorld();

    this.fogColorHolder.copy(this.skyHorizonTmp);
    this.scene.background = this.fogColorHolder.clone();
    if (this.scene.fog instanceof Fog) this.scene.fog.color.copy(this.fogColorHolder);

    if (this.dust) {
      this.dust.setOrigin(p);
      this.dust.update(delta);
    }
    if (this.walkDust) {
      this.walkDust.setEmitter(p, input.walking, input.sprinting);
      this.walkDust.update(delta);
    }

    const phaseLabel: DayInfo['phaseLabel'] =
      sunAltitude > 0.3 ? 'DAY' :
      sunAltitude > -0.1 ? (sunHoriz > 0 ? 'DAWN' : 'SUNSET') :
      'NIGHT';
    const hours = Math.floor(((t + 0.75) % 1) * 24);
    const minutes = Math.floor((((t + 0.75) % 1) * 24 * 60) % 60);
    this.dayInfo = {
      sunAltitude,
      dayFactor,
      nightFactor,
      sunsetFactor,
      phaseLabel,
      localTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    };
  }

  dispose(): void {
    this.unloadMeshes();
    this.root.remove(this.sun, this.hemi);
  }

  private unloadMeshes(): void {
    if (this.terrain) { this.root.remove(this.terrain.root); this.terrain.dispose(); this.terrain = null; }
    if (this.sky) { this.root.remove(this.sky.mesh); this.sky.dispose(); this.sky = null; }
    if (this.dust) { this.root.remove(this.dust.points); this.dust.dispose(); this.dust = null; }
    if (this.walkDust) { this.root.remove(this.walkDust.points); this.walkDust.dispose(); this.walkDust = null; }
    if (this.landmarks) { this.root.remove(this.landmarks.root); this.landmarks.dispose(); this.landmarks = null; }
  }

  getLandmarkLabel(): string | null {
    return this.landmarks ? this.landmarks.profile.label : null;
  }
}
