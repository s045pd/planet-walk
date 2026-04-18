import {
  ConeGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from 'three';

import type { PlanetConfig } from '../planet/PlanetConfigs';
import { SimplexNoise } from './Noise';

export interface LandmarkSpec {
  offset: Vector3;
  radius: number;
  height: number;
  tilt: number;
  colorScale: number;
}

export interface LandmarkProfile {
  distance: number;
  primary: LandmarkSpec;
  secondaries: LandmarkSpec[];
  label: string;
}

const profileOf = (id: string): LandmarkProfile => {
  switch (id) {
    case 'mars':
      return {
        distance: 360,
        primary: { offset: new Vector3(0, 0, -360), radius: 200, height: 110, tilt: 0, colorScale: 0.55 },
        secondaries: [
          { offset: new Vector3(-260, 0, -310), radius: 60, height: 40, tilt: 0.06, colorScale: 0.48 },
          { offset: new Vector3(180, 0, -330), radius: 70, height: 52, tilt: -0.04, colorScale: 0.50 },
        ],
        label: 'Olympus Mons',
      };
    case 'terra':
      return {
        distance: 360,
        primary: { offset: new Vector3(60, 0, -340), radius: 220, height: 140, tilt: 0, colorScale: 0.6 },
        secondaries: [
          { offset: new Vector3(-220, 0, -300), radius: 90, height: 76, tilt: 0.05, colorScale: 0.5 },
          { offset: new Vector3(280, 0, -280), radius: 110, height: 90, tilt: -0.03, colorScale: 0.55 },
          { offset: new Vector3(-120, 0, -380), radius: 140, height: 100, tilt: 0.02, colorScale: 0.58 },
        ],
        label: 'Himalayan Ridge',
      };
    case 'luna':
      return {
        distance: 340,
        primary: { offset: new Vector3(20, 0, -320), radius: 160, height: 48, tilt: 0, colorScale: 0.7 },
        secondaries: [
          { offset: new Vector3(-240, 0, -280), radius: 100, height: 28, tilt: 0.04, colorScale: 0.65 },
          { offset: new Vector3(210, 0, -300), radius: 130, height: 40, tilt: -0.03, colorScale: 0.68 },
        ],
        label: 'Crater Rim',
      };
    case 'venus':
      return {
        distance: 380,
        primary: { offset: new Vector3(-40, 0, -380), radius: 240, height: 96, tilt: 0, colorScale: 0.5 },
        secondaries: [
          { offset: new Vector3(200, 0, -320), radius: 90, height: 56, tilt: -0.04, colorScale: 0.48 },
        ],
        label: 'Maxwell Montes',
      };
    case 'europa':
      return {
        distance: 320,
        primary: { offset: new Vector3(0, 0, -320), radius: 180, height: 30, tilt: 0, colorScale: 0.7 },
        secondaries: [
          { offset: new Vector3(-210, 0, -280), radius: 70, height: 18, tilt: 0.08, colorScale: 0.66 },
          { offset: new Vector3(180, 0, -290), radius: 90, height: 22, tilt: -0.06, colorScale: 0.72 },
          { offset: new Vector3(40, 0, -400), radius: 110, height: 26, tilt: 0.02, colorScale: 0.68 },
        ],
        label: 'Conamara Chaos',
      };
    default:
      return {
        distance: 340,
        primary: { offset: new Vector3(0, 0, -340), radius: 180, height: 70, tilt: 0, colorScale: 0.5 },
        secondaries: [],
        label: 'Distant Ridge',
      };
  }
};

export class Landmarks {
  readonly root = new Group();
  private meshes: Mesh[] = [];
  private material: MeshStandardMaterial;
  private specs: LandmarkSpec[];
  private noise: SimplexNoise;
  readonly profile: LandmarkProfile;

  constructor(config: PlanetConfig, seed: number) {
    this.profile = profileOf(config.id);
    this.specs = [this.profile.primary, ...this.profile.secondaries];
    this.noise = new SimplexNoise(seed + 7);

    const base = config.surface.high.clone().multiplyScalar(this.profile.primary.colorScale);
    this.material = new MeshStandardMaterial({
      color: base,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true,
      emissive: config.surface.low.clone().multiplyScalar(0.05),
    });

    // small rocky cap mesh atop each peak adds silhouette punch above the fbm terrain dome
    for (const spec of this.specs) {
      const mesh = this.buildCap(spec);
      this.meshes.push(mesh);
      this.root.add(mesh);
    }
  }

  /**
   * Contribution to ground height at (x, z) — quintic falloff within each peak's footprint.
   * Summed with terrain fbm so landmarks become solid, walkable massifs.
   */
  heightField(x: number, z: number): number {
    let total = 0;
    for (const spec of this.specs) {
      const dx = x - spec.offset.x;
      const dz = z - spec.offset.z;
      const d = Math.hypot(dx, dz);
      if (d >= spec.radius) continue;
      const t = 1 - d / spec.radius;
      const smooth = t * t * (3 - 2 * t); // smoothstep
      const jitter = 0.88 + this.noise.noise2D(x * 0.02, z * 0.02) * 0.12;
      total += smooth * spec.height * 0.82 * jitter;
    }
    return total;
  }

  positionCapMeshes(heightAt: (x: number, z: number) => number): void {
    for (let i = 0; i < this.specs.length; i++) {
      const spec = this.specs[i];
      const mesh = this.meshes[i];
      if (!mesh) continue;
      const terrainY = heightAt(spec.offset.x, spec.offset.z);
      mesh.position.x = spec.offset.x;
      mesh.position.z = spec.offset.z;
      // cap sits so its tip pokes a bit above the terrain dome peak
      mesh.position.y = terrainY - spec.height * 0.18;
    }
  }

  dispose(): void {
    for (const m of this.meshes) {
      m.geometry.dispose();
    }
    this.material.dispose();
    this.root.clear();
  }

  private buildCap(spec: LandmarkSpec): Mesh {
    const capHeight = spec.height * 0.55;
    const capRadius = spec.radius * 0.35;
    const geo = new ConeGeometry(capRadius, capHeight, 12, 3, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = this.noise.fbm(x * 0.04, z * 0.04, 3, 2, 0.5) * capRadius * 0.18;
      pos.setX(i, x + n * 0.6);
      pos.setZ(i, z + n * 0.6);
      if (y > -capHeight * 0.4) pos.setY(i, y + n * 0.3);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mesh = new Mesh(geo, this.material);
    mesh.rotation.z = spec.tilt;
    mesh.rotation.y = Math.random() * Math.PI;
    return mesh;
  }
}
