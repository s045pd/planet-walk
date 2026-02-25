import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlanetConfig } from './PlanetConfig';
import { Atmosphere } from './atmosphere/Atmosphere';
import { EarthEffects } from './effects/EarthEffects';
import { ProceduralTexture } from './ProceduralTexture';

/** 星球基类：球体网格 + 纹理 + 可选大气层 */
export class Planet implements IDisposable {
  readonly config: PlanetConfig;
  readonly root: THREE.Group;
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;

  private atmosphere?: Atmosphere;
  private earthEffects?: EarthEffects;
  private readonly sunDirection = new THREE.Vector3(1, 0.3, 0.5).normalize();
  private readonly textureLoader = new THREE.TextureLoader();

  constructor(config: PlanetConfig) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = `${config.name}-root`;

    const geometry = new THREE.SphereGeometry(config.radius, config.segments, config.segments);

    // 先用程序化纹理作为默认，外部纹理加载成功后再替换
    const proceduralMap = this.getProceduralTexture();

    const standardMaterial = new THREE.MeshStandardMaterial({
      color: proceduralMap ? 0xffffff : config.textures.fallbackColor,
      map: proceduralMap,
      roughness: 1,
      metalness: 0,
    });

    // 异步加载外部纹理（成功则替换程序化纹理）
    if (config.textures.diffusePath) {
      this.textureLoader.load(
        config.textures.diffusePath,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          standardMaterial.map = tex;
          standardMaterial.needsUpdate = true;
        },
      );
    }

    if (config.textures.normalPath) {
      this.textureLoader.load(config.textures.normalPath, (tex) => {
        standardMaterial.normalMap = tex;
        standardMaterial.normalScale.set(1, 1);
        standardMaterial.needsUpdate = true;
      });
    }

    this.mesh = new THREE.Mesh(geometry, standardMaterial);
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

    // 地球特效：云层+夜景+海洋高光
    if (config.name === 'earth') {
      this.earthEffects = new EarthEffects(config.radius, config.segments);
      this.root.add(this.earthEffects.root);
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

  /** 获取当前星球的程序化纹理 */
  private getProceduralTexture(): THREE.CanvasTexture | null {
    switch (this.config.name) {
      case 'earth': return ProceduralTexture.earth();
      case 'mars': return ProceduralTexture.mars();
      case 'moon': return ProceduralTexture.moon();
      default: return null;
    }
  }

  /** 每帧更新（地球特效等） */
  update(delta: number): void {
    this.earthEffects?.update(delta, this.sunDirection);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();

    if (this.atmosphere) {
      this.atmosphere.dispose();
    }

    if (this.earthEffects) {
      this.earthEffects.dispose();
    }
  }
}
