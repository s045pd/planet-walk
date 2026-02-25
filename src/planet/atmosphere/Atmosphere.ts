import * as THREE from 'three';
import type { IDisposable } from '../../core/types';
import type { AtmosphereConfig } from '../PlanetConfig';
import { AtmosphereShader, type ScatteringParams } from './AtmosphereShader';

/** Default scattering presets for known planet types */
const SCATTERING_PRESETS: Record<string, ScatteringParams> = {
  earth: {
    rayleighCoeff: new THREE.Vector3(5.5e-3, 13.0e-3, 22.4e-3),
    mieCoeff: 21e-3,
    rayleighScale: 8.0,
    mieScale: 1.2,
    mieDirection: 0.758,
    intensity: 20.0,
  },
  mars: {
    rayleighCoeff: new THREE.Vector3(19.918e-3, 13.57e-3, 5.75e-3),
    mieCoeff: 36e-3,
    rayleighScale: 11.1,
    mieScale: 2.0,
    mieDirection: 0.63,
    intensity: 12.0,
  },
};

/**
 * Atmosphere manager — creates and manages the scattering shell mesh
 * for a planet. Handles creation, sun direction updates, and disposal.
 */
export class Atmosphere implements IDisposable {
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, AtmosphereShader>;
  private readonly shader: AtmosphereShader;

  constructor(
    planetRadius: number,
    segments: number,
    config: AtmosphereConfig,
    planetName?: string,
  ) {
    const atmosphereRadius = planetRadius * (1 + config.thickness);
    const params = this.resolveParams(config, planetName);

    this.shader = new AtmosphereShader(planetRadius, atmosphereRadius, params);

    const geometry = new THREE.SphereGeometry(atmosphereRadius, segments, segments);
    this.mesh = new THREE.Mesh(geometry, this.shader);
    this.mesh.name = `${planetName ?? 'planet'}-atmosphere`;
  }

  /** Update sun direction for lighting */
  setSunDirection(dir: THREE.Vector3): void {
    this.shader.setSunDirection(dir);
  }

  /** Update planet center when the planet moves */
  setPlanetCenter(center: THREE.Vector3): void {
    this.shader.setPlanetCenter(center);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.shader.dispose();
  }

  /** Resolve scattering params from config + optional preset */
  private resolveParams(config: AtmosphereConfig, planetName?: string): ScatteringParams {
    if (config.scattering) {
      const s = config.scattering;
      return {
        rayleighCoeff: new THREE.Vector3(s.rayleighCoeff.x, s.rayleighCoeff.y, s.rayleighCoeff.z),
        mieCoeff: s.mieCoeff,
        rayleighScale: s.rayleighScale,
        mieScale: s.mieScale,
        mieDirection: s.mieDirection,
        intensity: s.intensity,
      };
    }
    if (planetName && planetName in SCATTERING_PRESETS) {
      return SCATTERING_PRESETS[planetName];
    }
    // Fallback: derive from atmosphere color
    return this.paramsFromColor(config.color);
  }

  /** Generate approximate scattering params from a single color hint */
  private paramsFromColor(hex: number): ScatteringParams {
    const c = new THREE.Color(hex);
    return {
      rayleighCoeff: new THREE.Vector3(c.r * 20e-3, c.g * 20e-3, c.b * 20e-3),
      mieCoeff: 21e-3,
      rayleighScale: 8.0,
      mieScale: 1.2,
      mieDirection: 0.758,
      intensity: 15.0,
    };
  }
}
