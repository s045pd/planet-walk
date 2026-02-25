import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlanetConfig } from './PlanetConfig';
import { TerrainMaterial } from './terrain/TerrainMaterial';
import { Atmosphere } from './atmosphere/Atmosphere';

/** 星球基类：球体网格 + 纹理 + 可选大气层 */
export class Planet implements IDisposable {
  readonly config: PlanetConfig;
  readonly root: THREE.Group;
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial | TerrainMaterial>;

  private atmosphere?: Atmosphere;
  private readonly textureLoader = new THREE.TextureLoader();

  constructor(config: PlanetConfig) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = `${config.name}-root`;

    const geometry = new THREE.SphereGeometry(config.radius, config.segments, config.segments);
    
    const diffuseMap = this.loadTexture(config.textures.diffusePath, true);
    const heightMap = this.loadTexture(config.textures.heightmapPath, false);

    let material: THREE.MeshStandardMaterial | TerrainMaterial;

    if (heightMap && config.terrain) {
      material = new TerrainMaterial({
        diffuseMap: diffuseMap || new THREE.Texture(), // Should handle null better in production
        heightMap: heightMap,
        heightScale: config.terrain.heightScale,
        color: new THREE.Color(config.textures.fallbackColor),
      });
    } else {
      const standardMaterial = new THREE.MeshStandardMaterial({
        color: config.textures.fallbackColor,
        roughness: 1,
        metalness: 0,
      });

      if (diffuseMap) {
        standardMaterial.map = diffuseMap;
        standardMaterial.color.set(0xffffff);
      }

      const normalMap = this.loadTexture(config.textures.normalPath, false);
      if (normalMap) {
        standardMaterial.normalMap = normalMap;
        standardMaterial.normalScale.set(1, 1);
      }

      const roughnessMap = this.loadTexture(config.textures.roughnessPath, false);
      if (roughnessMap) {
        standardMaterial.roughnessMap = roughnessMap;
      }
      
      material = standardMaterial;
    }

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = config.name;
    this.root.add(this.mesh);

    if (config.atmosphere?.enabled) {
      this.atmosphere = new Atmosphere(
        config.radius,
        config.segments,
        config.atmosphere,
        config.name,
      );
      this.root.add(this.atmosphere.mesh);
    }
  }

  /**
   * 异步加载所有纹理，通过 onProgress 回调报告进度 (0-100)
   */
  loadTextures(onProgress?: (percent: number) => void): Promise<void> {
    const paths = [
      this.config.textures.diffusePath,
      this.config.textures.normalPath,
      this.config.textures.roughnessPath,
      this.config.textures.heightmapPath,
    ].filter((p): p is string => !!p);

    if (paths.length === 0) {
      onProgress?.(100);
      return Promise.resolve();
    }

    let loaded = 0;
    const total = paths.length;

    const promises = paths.map(
      (path) =>
        new Promise<void>((resolve) => {
          this.textureLoader.load(
            path,
            () => {
              loaded++;
              onProgress?.(Math.round((loaded / total) * 100));
              resolve();
            },
            undefined,
            () => {
              // 纹理加载失败也算完成，不阻塞启动
              loaded++;
              onProgress?.(Math.round((loaded / total) * 100));
              resolve();
            },
          );
        }),
    );

    return Promise.all(promises).then(() => {});
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

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();

    if (this.atmosphere) {
      this.atmosphere.dispose();
    }
  }
}
