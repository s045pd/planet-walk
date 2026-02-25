import * as THREE from 'three';
import type { IDisposable } from '../../core/types';

const BASE = import.meta.env.BASE_URL;
const OCEAN_MASK_PATH = BASE + 'assets/textures/earth/ocean_mask.jpg';

const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D oceanMask;
uniform vec3 sunDirection;
uniform float fresnelPower;
uniform float fresnelIntensity;
uniform vec3 specularColor;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vUv;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);

  // 海洋 mask：白色=海洋
  float mask = texture2D(oceanMask, vUv).r;

  // Fresnel 反射
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), fresnelPower);
  fresnel *= fresnelIntensity;

  // 高光：基于太阳方向的 Blinn-Phong
  vec3 halfDir = normalize(sunDirection + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 64.0);

  // 仅在光照面显示高光
  float sunFacing = max(dot(normal, sunDirection), 0.0);

  vec3 color = specularColor * (fresnel + spec) * sunFacing * mask;
  float alpha = (fresnel + spec) * sunFacing * mask;

  gl_FragColor = vec4(color, alpha * 0.6);
}
`;

/**
 * 海洋高光 — Fresnel反射 + Blinn-Phong高光
 */
export class OceanEffect implements IDisposable {
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

  constructor(planetRadius: number, segments: number) {
    const radius = planetRadius * 1.002;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        oceanMask: { value: null },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        fresnelPower: { value: 3.0 },
        fresnelIntensity: { value: 0.8 },
        specularColor: { value: new THREE.Color(0.8, 0.9, 1.0) },
      },
      transparent: true,
      depthWrite: false,
    });

    const loader = new THREE.TextureLoader();
    loader.load(
      OCEAN_MASK_PATH,
      (tex) => {
        tex.anisotropy = 8;
        material.uniforms.oceanMask.value = tex;
      },
      undefined,
      () => { /* 静默跳过 */ },
    );

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'earth-ocean';
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.mesh.material.uniforms.sunDirection.value.copy(dir);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const mat = this.mesh.material;
    const mask = mat.uniforms.oceanMask.value as THREE.Texture | null;
    mask?.dispose();
    mat.dispose();
  }
}
