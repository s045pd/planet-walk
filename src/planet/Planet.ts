import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  Object3D,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';

import { atmosphereFrag, atmosphereVert, planetFrag, planetVert, starfieldFrag, starfieldVert } from './shaders';
import type { PlanetConfig } from './PlanetConfigs';

export class Planet {
  readonly root = new Object3D();
  readonly surface: Mesh;
  readonly atmosphere: Mesh | null = null;
  readonly config: PlanetConfig;
  private readonly surfaceMaterial: ShaderMaterial;
  private readonly atmosphereMaterial: ShaderMaterial | null = null;
  private readonly sunDir = new Vector3(1, 0.35, 0.6).normalize();

  constructor(config: PlanetConfig) {
    this.config = config;

    const geo = new SphereGeometry(config.radius, 128, 96);
    this.surfaceMaterial = new ShaderMaterial({
      vertexShader: planetVert,
      fragmentShader: planetFrag,
      uniforms: {
        uBaseLow: { value: config.surface.low.clone() },
        uBaseMid: { value: config.surface.mid.clone() },
        uBaseHigh: { value: config.surface.high.clone() },
        uPolar: { value: config.surface.polar.clone() },
        uSunDir: { value: this.sunDir.clone() },
        uRoughness: { value: config.surface.roughness },
        uCratering: { value: config.surface.cratering },
        uBanding: { value: config.surface.banding },
        uTime: { value: 0 },
      },
    });
    this.surface = new Mesh(geo, this.surfaceMaterial);
    this.root.add(this.surface);

    if (config.atmosphereIntensity > 0.01) {
      const atmoGeo = new SphereGeometry(config.radius * 1.035, 96, 64);
      this.atmosphereMaterial = new ShaderMaterial({
        vertexShader: atmosphereVert,
        fragmentShader: atmosphereFrag,
        uniforms: {
          uColor: { value: config.atmosphereColor.clone() },
          uIntensity: { value: config.atmosphereIntensity },
          uSunDir: { value: this.sunDir.clone() },
        },
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      this.atmosphere = new Mesh(atmoGeo, this.atmosphereMaterial);
      this.root.add(this.atmosphere);
    }
  }

  update(delta: number): void {
    this.surface.rotation.y += delta * (2 * Math.PI) / Math.max(this.config.rotationPeriod / 120, 60);
    this.surfaceMaterial.uniforms.uTime.value += delta;
  }

  dispose(): void {
    this.surface.geometry.dispose();
    this.surfaceMaterial.dispose();
    if (this.atmosphere) {
      this.atmosphere.geometry.dispose();
      this.atmosphereMaterial?.dispose();
    }
    this.root.clear();
  }
}

export function createStarfield(count = 2400, radius = 20_000): Points {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const brightness = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = radius * (0.85 + Math.random() * 0.15);
    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    sizes[i] = Math.random() < 0.02 ? 3 + Math.random() * 2 : 0.8 + Math.random() * 1.2;
    brightness[i] = 0.4 + Math.random() * 0.6;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geo.setAttribute('aBrightness', new BufferAttribute(brightness, 1));

  const mat = new ShaderMaterial({
    vertexShader: starfieldVert,
    fragmentShader: starfieldFrag,
    transparent: true,
    depthWrite: false,
  });

  return new Points(geo, mat);
}

export function applyPaletteToBackground(root: HTMLElement, config: PlanetConfig): void {
  const top = config.sky.top;
  const horizon = config.sky.horizon;
  root.style.setProperty('--sky-top', `rgb(${Math.round(top.r * 255)}, ${Math.round(top.g * 255)}, ${Math.round(top.b * 255)})`);
  root.style.setProperty('--sky-horizon', `rgb(${Math.round(horizon.r * 255)}, ${Math.round(horizon.g * 255)}, ${Math.round(horizon.b * 255)})`);
  const atm = config.atmosphereColor;
  root.style.setProperty('--accent-planet', `rgb(${Math.round(atm.r * 255)}, ${Math.round(atm.g * 255)}, ${Math.round(atm.b * 255)})`);
  void new Color();
}
