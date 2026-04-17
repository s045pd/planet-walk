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
  readonly profile: LandmarkProfile;

  constructor(config: PlanetConfig, seed: number) {
    this.profile = profileOf(config.id);
    const base = config.surface.mid.clone().multiplyScalar(this.profile.primary.colorScale);
    this.material = new MeshStandardMaterial({
      color: base,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true,
      emissive: config.surface.low.clone().multiplyScalar(0.08),
    });

    const noise = new SimplexNoise(seed + 7);
    const specs: Array<[LandmarkSpec, number]> = [
      [this.profile.primary, 1],
      ...this.profile.secondaries.map((s): [LandmarkSpec, number] => [s, 0.85]),
    ];
    for (const [spec, variance] of specs) {
      const mesh = this.buildMountain(spec, variance, noise);
      this.meshes.push(mesh);
      this.root.add(mesh);
    }
  }

  dispose(): void {
    for (const m of this.meshes) {
      m.geometry.dispose();
    }
    this.material.dispose();
    this.root.clear();
  }

  private buildMountain(spec: LandmarkSpec, variance: number, noise: SimplexNoise): Mesh {
    const segs = 16;
    const geo = new ConeGeometry(spec.radius, spec.height, segs, 5, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n = noise.fbm(x * 0.03, z * 0.03, 3, 2, 0.5) * variance * spec.radius * 0.12;
      pos.setX(i, x + n * 0.6);
      pos.setZ(i, z + n * 0.6);
      if (y > -spec.height * 0.45) pos.setY(i, y + n * 0.25);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    const mesh = new Mesh(geo, this.material);
    mesh.position.copy(spec.offset);
    mesh.position.y = spec.height / 2 - 12;
    mesh.rotation.z = spec.tilt;
    mesh.rotation.y = Math.random() * Math.PI;
    return mesh;
  }
}
