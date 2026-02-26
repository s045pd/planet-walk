import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlanetConfig } from './PlanetConfig';
import { Atmosphere } from './atmosphere/Atmosphere';
import { EarthEffects } from './effects/EarthEffects';
import { ProceduralTexture } from './ProceduralTexture';
import { HeightmapGenerator } from './HeightmapGenerator';

type MeshStandardTextureSlot =
  | 'map'
  | 'normalMap'
  | 'roughnessMap'
  | 'displacementMap';

/** 星球基类：球体网格 + 纹理 + 可选大气层 */
export class Planet implements IDisposable {
  readonly config: PlanetConfig;
  readonly root: THREE.Group;
  readonly mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;

  private atmosphere?: Atmosphere;
  private earthEffects?: EarthEffects;
  private readonly sunDirection = new THREE.Vector3(1, 0.3, 0.5).normalize();
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly preloadImageLoader = new THREE.ImageLoader();
  private readonly ownedTextures = new Set<THREE.Texture>();
  private disposed = false;
  private deferredTexturesLoaded = false;

  constructor(config: PlanetConfig) {
    this.config = config;
    this.root = new THREE.Group();
    this.root.name = `${config.name}-root`;

    const geometry = new THREE.SphereGeometry(config.radius, config.segments, config.segments);
    const terrainHeightScale = config.terrain?.heightScale ?? 0;

    // 先用程序化纹理作为默认，外部纹理加载成功后再替换
    const proceduralMap = this.getProceduralTexture();
    if (proceduralMap) {
      this.trackTexture(proceduralMap);
    }

    const standardMaterial = new THREE.MeshStandardMaterial({
      color: proceduralMap ? 0xffffff : config.textures.fallbackColor,
      map: proceduralMap,
      roughness: 1,
      metalness: 0,
      transparent: false,
      opacity: 1,
      depthWrite: true,
      displacementScale: terrainHeightScale,
      displacementBias: terrainHeightScale > 0 ? -terrainHeightScale * 0.5 : 0,
    });

    if (!config.textures.heightmapPath && proceduralMap) {
      this.applyGeneratedHeightmap(standardMaterial, proceduralMap);
    }

    // 异步加载外部纹理（成功则替换程序化纹理）
    if (config.textures.diffusePath) {
      this.loadTexture(
        config.textures.diffusePath,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          this.assignMaterialTexture(standardMaterial, 'map', tex);
          if (!config.textures.heightmapPath) {
            this.applyGeneratedHeightmap(standardMaterial, tex);
          }
          standardMaterial.needsUpdate = true;
        },
      );
    }

    if (config.textures.normalPath) {
      this.loadTexture(config.textures.normalPath, (tex) => {
        tex.colorSpace = THREE.NoColorSpace;
        tex.anisotropy = 8;
        this.assignMaterialTexture(standardMaterial, 'normalMap', tex);
        standardMaterial.normalScale.set(1, 1);
        standardMaterial.needsUpdate = true;
      });
    }

    if (config.textures.roughnessPath) {
      this.loadTexture(config.textures.roughnessPath, (tex) => {
        tex.colorSpace = THREE.NoColorSpace;
        tex.anisotropy = 8;
        this.assignMaterialTexture(standardMaterial, 'roughnessMap', tex);
        standardMaterial.needsUpdate = true;
      });
    }

    if (config.textures.heightmapPath) {
      this.loadTexture(
        config.textures.heightmapPath,
        (tex) => {
          this.configureHeightTexture(tex);
          this.assignMaterialTexture(standardMaterial, 'displacementMap', tex);
          standardMaterial.needsUpdate = true;
        },
        () => {
          const diffuse = standardMaterial.map;
          if (diffuse) {
            this.applyGeneratedHeightmap(standardMaterial, diffuse);
          }
          standardMaterial.needsUpdate = true;
        },
      );
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
      this.earthEffects = new EarthEffects(config.radius, config.segments, {
        cloudsPath: config.textures.cloudsPath,
        nightPath: config.textures.nightPath,
        oceanMaskPath: config.textures.specularPath,
        deferTextureLoad: true,
      });
      this.root.add(this.earthEffects.root);
    }

    this.setSunDirection(this.sunDirection);
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
          this.preloadImageLoader.load(
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

  loadDeferredTextures(): Promise<void> {
    if (this.deferredTexturesLoaded || !this.earthEffects) {
      return Promise.resolve();
    }
    this.deferredTexturesLoaded = true;
    return this.earthEffects.loadDeferredTextures();
  }

  /** 获取当前星球的程序化纹理 */
  private getProceduralTexture(): THREE.CanvasTexture | null {
    switch (this.config.name) {
      case 'earth': return ProceduralTexture.earth();
      case 'mars': return ProceduralTexture.mars();
      case 'moon': return ProceduralTexture.moon();
      case 'venus': return ProceduralTexture.venus();
      case 'europa': return ProceduralTexture.europa();
      default: return null;
    }
  }

  /** 每帧更新（地球特效等） */
  update(delta: number): void {
    this.earthEffects?.update(delta, this.sunDirection);
  }

  setSunDirection(direction: THREE.Vector3): void {
    this.sunDirection.copy(direction).normalize();
    this.atmosphere?.setSunDirection(this.sunDirection);
  }

  setAtmosphereLighting(daylight: number, twilight: number): void {
    this.atmosphere?.setDynamicScattering(daylight, twilight);
  }

  private applyGeneratedHeightmap(
    material: THREE.MeshStandardMaterial,
    diffuseTexture: THREE.Texture,
  ): void {
    const generated = HeightmapGenerator.fromTexture(diffuseTexture);
    if (!generated) return;
    this.configureHeightTexture(generated);
    this.assignMaterialTexture(material, 'displacementMap', generated);
  }

  private configureHeightTexture(texture: THREE.Texture): void {
    texture.colorSpace = THREE.NoColorSpace;
    texture.anisotropy = 8;
  }

  private loadTexture(
    path: string,
    onLoad: (texture: THREE.Texture) => void,
    onError?: () => void,
  ): void {
    this.textureLoader.load(
      path,
      (texture) => {
        if (this.disposed) {
          texture.dispose();
          return;
        }
        this.trackTexture(texture);
        onLoad(texture);
      },
      undefined,
      () => {
        onError?.();
      },
    );
  }

  private assignMaterialTexture(
    material: THREE.MeshStandardMaterial,
    slot: MeshStandardTextureSlot,
    texture: THREE.Texture,
  ): void {
    const previous = material[slot];
    if (previous && previous !== texture) {
      this.disposeTexture(previous);
    }
    material[slot] = texture;
    this.trackTexture(texture);
  }

  private trackTexture(texture: THREE.Texture): void {
    this.ownedTextures.add(texture);
  }

  private disposeTexture(texture: THREE.Texture): void {
    this.ownedTextures.delete(texture);
    texture.dispose();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    this.mesh.geometry.dispose();
    const material = this.mesh.material;
    if (material.map) this.disposeTexture(material.map);
    if (material.normalMap) this.disposeTexture(material.normalMap);
    if (material.roughnessMap) this.disposeTexture(material.roughnessMap);
    if (material.displacementMap) this.disposeTexture(material.displacementMap);
    this.mesh.material.dispose();

    if (this.atmosphere) {
      this.atmosphere.dispose();
    }

    if (this.earthEffects) {
      this.earthEffects.dispose();
    }

    for (const texture of this.ownedTextures) {
      texture.dispose();
    }
    this.ownedTextures.clear();
  }
}
