import * as THREE from 'three';
import type { IDisposable } from '../../core/types';

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
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly nightPath?: string;
  private textureLoaded = false;
  private disposed = false;

  constructor(
    planetRadius: number,
    segments: number,
    nightPath?: string,
    autoLoad = true,
  ) {
    const radius = planetRadius * 1.001;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    this.nightPath = nightPath;

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

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'earth-nightlights';

    if (autoLoad) {
      void this.loadTexture();
    }
  }

  setSunDirection(dir: THREE.Vector3): void {
    this.mesh.material.uniforms.sunDirection.value.copy(dir);
  }

  loadTexture(): Promise<void> {
    if (this.textureLoaded || !this.nightPath || this.disposed) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.textureLoader.load(
        this.nightPath!,
        (tex) => {
          if (this.disposed) {
            tex.dispose();
            resolve();
            return;
          }

          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          const material = this.mesh.material;
          const oldTexture = material.uniforms.nightMap.value as THREE.Texture | null;
          material.uniforms.nightMap.value = tex;
          if (oldTexture && oldTexture !== tex) {
            oldTexture.dispose();
          }
          this.textureLoaded = true;
          resolve();
        },
        undefined,
        () => {
          resolve();
        },
      );
    });
  }

  dispose(): void {
    this.disposed = true;
    this.mesh.geometry.dispose();
    const mat = this.mesh.material;
    const nightMap = mat.uniforms.nightMap.value as THREE.Texture | null;
    nightMap?.dispose();
    mat.dispose();
  }
}
