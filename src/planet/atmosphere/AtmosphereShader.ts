import * as THREE from 'three';
import atmosphereVert from '../../shaders/atmosphere.vert?raw';
import atmosphereFrag from '../../shaders/atmosphere.frag?raw';

/** Scattering parameters that vary per planet */
export interface ScatteringParams {
  /** Rayleigh scattering coefficients (RGB, wavelength-dependent) */
  rayleighCoeff: THREE.Vector3;
  /** Mie scattering coefficient (scalar) */
  mieCoeff: number;
  /** Rayleigh scale height (km-equivalent in scene units) */
  rayleighScale: number;
  /** Mie scale height */
  mieScale: number;
  /** Mie preferred scattering direction (g), typically 0.75–0.99 */
  mieDirection: number;
  /** Sun intensity multiplier */
  intensity: number;
}

/**
 * Creates a ShaderMaterial implementing Rayleigh/Mie atmospheric scattering.
 * Wraps the GLSL shaders with typed uniform access.
 */
export class AtmosphereShader extends THREE.ShaderMaterial {
  constructor(
    planetRadius: number,
    atmosphereRadius: number,
    params: ScatteringParams,
  ) {
    super({
      vertexShader: atmosphereVert,
      fragmentShader: atmosphereFrag,
      uniforms: {
        planetRadius: { value: planetRadius },
        atmosphereRadius: { value: atmosphereRadius },
        planetCenter: { value: new THREE.Vector3(0, 0, 0) },
        sunDirection: { value: new THREE.Vector3(0, 1, 0) },
        rayleighCoeff: { value: params.rayleighCoeff.clone() },
        mieCoeff: { value: params.mieCoeff },
        rayleighScale: { value: params.rayleighScale },
        mieScale: { value: params.mieScale },
        mieDirection: { value: params.mieDirection },
        intensity: { value: params.intensity },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }

  /** Update the sun direction (normalized world-space vector) */
  setSunDirection(dir: THREE.Vector3): void {
    this.uniforms.sunDirection.value.copy(dir).normalize();
  }

  /** Update the planet center in world space */
  setPlanetCenter(center: THREE.Vector3): void {
    this.uniforms.planetCenter.value.copy(center);
  }
}
