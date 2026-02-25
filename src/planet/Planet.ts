import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { AtmosphereConfig, PlanetConfig } from './PlanetConfig';

/** 星球基类：球体网格 + 纹理 + 可选大气层 */
export class Planet implements IDisposable {
  readonly config: PlanetConfig;
  readonly root: THREE.Group;
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;

  private atmosphere?: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private readonly textureLoader = new THREE.TextureLoader();

  constructor(config: PlanetConfig) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = `${config.name}-root`;

    const geometry = new THREE.SphereGeometry(config.radius, config.segments, config.segments);
    const material = new THREE.MeshStandardMaterial({
      color: config.textures.fallbackColor,
      roughness: 1,
      metalness: 0,
    });

    const diffuseMap = this.loadTexture(config.textures.diffusePath, true);
    if (diffuseMap) {
      material.map = diffuseMap;
      material.color.set(0xffffff);
    }

    const normalMap = this.loadTexture(config.textures.normalPath, false);
    if (normalMap) {
      material.normalMap = normalMap;
      material.normalScale.set(1, 1);
    }

    const roughnessMap = this.loadTexture(config.textures.roughnessPath, false);
    if (roughnessMap) {
      material.roughnessMap = roughnessMap;
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = config.name;
    this.root.add(this.mesh);

    if (config.atmosphere?.enabled) {
      this.atmosphere = this.createAtmosphere(config.radius, config.atmosphere);
      this.root.add(this.atmosphere);
    }
  }

  private loadTexture(path: string | undefined, isColorMap: boolean): THREE.Texture | null {
    if (!path) {
      return null;
    }

    const texture = this.textureLoader.load(path);
    if (isColorMap) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.anisotropy = 8;
    return texture;
  }

  private createAtmosphere(radius: number, atmosphere: AtmosphereConfig): THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial> {
    const atmosphereRadius = radius * (1 + atmosphere.thickness);
    const geometry = new THREE.SphereGeometry(atmosphereRadius, this.config.segments, this.config.segments);
    const material = new THREE.MeshBasicMaterial({
      color: atmosphere.color,
      transparent: true,
      opacity: atmosphere.opacity,
      side: THREE.BackSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geometry, material);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();

    if (this.atmosphere) {
      this.atmosphere.geometry.dispose();
      this.atmosphere.material.dispose();
    }
  }
}
