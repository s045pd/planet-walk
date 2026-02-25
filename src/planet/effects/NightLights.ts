import * as THREE from 'three';
import type { IDisposable } from '../../core/types';

const NIGHT_TEXTURE_PATH = '/assets/textures/earth/night.jpg';

const vertexShader = /* glsl */ `
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D nightMap;
uniform vec3 sunDirection;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vec3 normal = normalize(vNormal);
  float dotNL = dot(normal, sunDirection);

  // 暗面过渡：完全背光时全亮，过渡带平滑衰减
  float nightFactor = smoothstep(-0.1, -0.3, dotNL);

  vec4 nightColor = texture2D(nightMap, vUv);
  gl_FragColor = vec4(nightColor.rgb * nightFactor, nightColor.a * nightFactor);
}
`;

/**
 * 夜景灯光 — 在星球暗面叠加城市灯光纹理
 */
export class NightLights implements IDisposable {
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;

  constructor(planetRadius: number, segments: number) {
    const radius = planetRadius * 1.001;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        nightMap: { value: null },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const loader = new THREE.TextureLoader();
    loader.load(
      NIGHT_TEXTURE_PATH,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        material.uniforms.nightMap.value = tex;
      },
      undefined,
      () => { /* 静默跳过 */ },
    );

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'earth-nightlights';
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.mesh.material.uniforms.sunDirection.value.copy(dir);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const mat = this.mesh.material;
    const nightMap = mat.uniforms.nightMap.value as THREE.Texture | null;
    nightMap?.dispose();
    mat.dispose();
  }
}
