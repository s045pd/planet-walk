import * as THREE from 'three';
import type { IDisposable } from '../../core/types';

/**
 * 云层效果 — 半透明球壳，独立于星球缓慢自转
 */
export class CloudLayer implements IDisposable {
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshPhongMaterial>;
  private rotationSpeed = 0.002;

  constructor(planetRadius: number, segments: number, cloudsPath?: string) {
    const radius = planetRadius * 1.005;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);

    const material = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: THREE.FrontSide,
    });

    if (cloudsPath) {
      const loader = new THREE.TextureLoader();
      loader.load(cloudsPath, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        material.map = tex;
        material.alphaMap = tex;
        material.needsUpdate = true;
      }, undefined, () => { /* 静默跳过 */ });
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'earth-clouds';
  }

  update(delta: number): void {
    this.mesh.rotation.y += this.rotationSpeed * delta;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    const mat = this.mesh.material;
    mat.map?.dispose();
    mat.alphaMap?.dispose();
    mat.dispose();
  }
}
