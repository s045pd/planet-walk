import * as THREE from 'three';
import type { IDisposable } from '../../core/types';

/**
 * 云层效果 — 半透明球壳，独立于星球缓慢自转
 */
export class CloudLayer implements IDisposable {
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly cloudsPath?: string;
  private rotationSpeed = 0.002;
  private textureLoaded = false;
  private disposed = false;

  constructor(
    planetRadius: number,
    segments: number,
    cloudsPath?: string,
    autoLoad = true,
  ) {
    const radius = planetRadius * 1.005;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    this.cloudsPath = cloudsPath;

    const material = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'earth-clouds';
    this.mesh.visible = false;

    if (autoLoad) {
      void this.loadTexture();
    }
  }

  update(delta: number): void {
    this.mesh.rotation.y += this.rotationSpeed * delta;
  }

  loadTexture(): Promise<void> {
    if (this.textureLoaded || !this.cloudsPath || this.disposed) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.textureLoader.load(
        this.cloudsPath!,
        (tex) => {
          if (this.disposed) {
            tex.dispose();
            resolve();
            return;
          }

          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          const material = this.mesh.material;
          const oldMap = material.map;
          const oldAlpha = material.alphaMap;
          material.map = tex;
          material.alphaMap = tex;
          material.opacity = 0.4;
          material.needsUpdate = true;
          this.mesh.visible = true;

          if (oldMap && oldMap !== tex) {
            oldMap.dispose();
          }
          if (oldAlpha && oldAlpha !== tex && oldAlpha !== oldMap) {
            oldAlpha.dispose();
          }
          this.textureLoaded = true;
          resolve();
        },
        undefined,
        () => {
          this.mesh.visible = false;
          resolve();
        },
      );
    });
  }

  dispose(): void {
    this.disposed = true;
    this.mesh.geometry.dispose();
    const mat = this.mesh.material;
    const map = mat.map;
    const alphaMap = mat.alphaMap;
    map?.dispose();
    if (alphaMap && alphaMap !== map) {
      alphaMap.dispose();
    }
    mat.dispose();
  }
}
