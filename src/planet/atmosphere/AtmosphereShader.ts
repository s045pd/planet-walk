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
  private readonly baseRayleighCoeff: THREE.Vector3;
  private readonly baseMieCoeff: number;
  private readonly baseIntensity: number;
  private readonly scratchRayleigh = new THREE.Vector3();

  constructor(
    planetRadius: number,
    atmosphereRadius: number,
    params: ScatteringParams,
  ) {
    const rayleighCoeff = params.rayleighCoeff.clone();
    super({
      vertexShader: atmosphereVert,
      fragmentShader: atmosphereFrag,
      uniforms: {
        planetRadius: { value: planetRadius },
        atmosphereRadius: { value: atmosphereRadius },
        planetCenter: { value: new THREE.Vector3(0, 0, 0) },
        sunDirection: { value: new THREE.Vector3(0, 1, 0) },
        rayleighCoeff: { value: rayleighCoeff.clone() },
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

    this.baseRayleighCoeff = rayleighCoeff;
    this.baseMieCoeff = params.mieCoeff;
    this.baseIntensity = params.intensity;
  }

  /** Update the sun direction (normalized world-space vector) */
  setSunDirection(dir: THREE.Vector3): void {
    this.uniforms.sunDirection.value.copy(dir).normalize();
  }

  /** Update the planet center in world space */
  setPlanetCenter(center: THREE.Vector3): void {
    this.uniforms.planetCenter.value.copy(center);
  }

  /**
   * 根据昼夜与晨昏强度动态调节散射参数。
   * daylight: 0=夜晚, 1=白天
   * twilight: 0=非晨昏, 1=接近日出/日落
   */
  setDynamicScattering(daylight: number, twilight: number): void {
    const dayFactor = THREE.MathUtils.clamp(daylight, 0, 1);
    const sunsetFactor = THREE.MathUtils.clamp(twilight, 0, 1);
    const warmBoost = sunsetFactor * (1 - dayFactor * 0.6);

    const rayleigh = this.scratchRayleigh.copy(this.baseRayleighCoeff);
    rayleigh.x *= THREE.MathUtils.lerp(0.3, 1.0, dayFactor) * (1 + warmBoost * 1.4);
    rayleigh.y *= THREE.MathUtils.lerp(0.35, 1.0, dayFactor) * (1 + warmBoost * 0.45);
    rayleigh.z *= THREE.MathUtils.lerp(0.45, 1.0, dayFactor) * (1 - warmBoost * 0.45);

    this.uniforms.rayleighCoeff.value.copy(rayleigh);
    this.uniforms.mieCoeff.value = this.baseMieCoeff
      * (THREE.MathUtils.lerp(0.5, 1.0, dayFactor) + warmBoost * 0.25);
    this.uniforms.intensity.value = this.baseIntensity
      * (THREE.MathUtils.lerp(0.28, 1.0, dayFactor) + warmBoost * 0.28);
  }
}
