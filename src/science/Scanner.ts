import * as THREE from 'three';
import type { PlanetType } from '../planet/PlanetFactory';
import { cartesianToGeo } from '../utils/geo';
import { classifyGeology } from './ScienceData';

type TextureImageSource = CanvasImageSource & {
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
};

interface HeightTextureData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface ScannerConfig {
  planetType: PlanetType;
  planetRadius: number;
  surfaceMesh: THREE.Object3D;
}

export interface ScanResult {
  altitude: number;
  slope: number;
  geologyType: string;
  lat: number;
  lng: number;
  distance: number;
}

export class Scanner {
  private planetType: PlanetType;
  private planetRadius: number;
  private surfaceMesh: THREE.Object3D;
  private active = false;

  private readonly raycaster = new THREE.Raycaster();
  private readonly centerNdc = new THREE.Vector2(0, 0);
  private readonly sampleUv = new THREE.Vector2();
  private readonly heightReadCanvas = document.createElement('canvas');
  private readonly heightReadContext = this.heightReadCanvas.getContext('2d', {
    willReadFrequently: true,
  });
  private readonly heightTextureCache = new WeakMap<THREE.Texture, HeightTextureData>();

  constructor(config: ScannerConfig) {
    this.planetType = config.planetType;
    this.planetRadius = config.planetRadius;
    this.surfaceMesh = config.surfaceMesh;
    this.raycaster.near = 0.1;
    this.raycaster.far = 100000;
  }

  get isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  switchPlanet(config: ScannerConfig): void {
    this.planetType = config.planetType;
    this.planetRadius = config.planetRadius;
    this.surfaceMesh = config.surfaceMesh;
  }

  scan(camera: THREE.Camera): ScanResult | null {
    if (!this.active) return null;

    this.raycaster.setFromCamera(this.centerNdc, camera);
    const hit = this.raycaster.intersectObject(this.surfaceMesh, true)[0];
    if (!hit) return null;

    const baseGeo = cartesianToGeo(hit.point, this.planetRadius);
    const displacement = this.getHitDisplacement(hit);
    const altitude = baseGeo.alt + displacement;
    const slope = this.computeSlope(hit, baseGeo.lat, displacement);

    return {
      altitude,
      slope,
      geologyType: classifyGeology(this.planetType, altitude, slope),
      lat: baseGeo.lat,
      lng: baseGeo.lng,
      distance: hit.distance,
    };
  }

  private computeSlope(
    hit: THREE.Intersection,
    latDeg: number,
    centerDisplacement: number,
  ): number {
    if (!hit.uv) return 0;
    const material = this.getMeshStandardMaterial(hit.object);
    if (!material || !material.displacementMap) return 0;

    const textureData = this.getHeightTextureData(material.displacementMap);
    if (!textureData) return 0;

    const du = 1 / Math.max(64, textureData.width);
    const dv = 1 / Math.max(64, textureData.height);
    const u = hit.uv.x;
    const v = hit.uv.y;

    const hLeft = this.sampleDisplacementAtUv(material, u - du, v);
    const hRight = this.sampleDisplacementAtUv(material, u + du, v);
    const hDown = this.sampleDisplacementAtUv(material, u, v - dv);
    const hUp = this.sampleDisplacementAtUv(material, u, v + dv);

    const latRad = THREE.MathUtils.degToRad(latDeg);
    const localRadius = this.planetRadius + centerDisplacement;
    const metersPerDu = Math.max(
      1e-4,
      2 * Math.PI * localRadius * Math.max(0.05, Math.cos(latRad)) * du,
    );
    const metersPerDv = Math.max(1e-4, Math.PI * localRadius * dv);
    const dzdx = (hRight - hLeft) / (2 * metersPerDu);
    const dzdy = (hUp - hDown) / (2 * metersPerDv);
    const gradient = Math.sqrt(dzdx * dzdx + dzdy * dzdy);

    return THREE.MathUtils.radToDeg(Math.atan(gradient));
  }

  private getHitDisplacement(hit: THREE.Intersection): number {
    if (!hit.uv) return 0;
    const material = this.getMeshStandardMaterial(hit.object);
    if (!material || !material.displacementMap) return 0;
    return this.sampleDisplacementAtUv(material, hit.uv.x, hit.uv.y);
  }

  private sampleDisplacementAtUv(
    material: THREE.MeshStandardMaterial,
    u: number,
    v: number,
  ): number {
    const displacementMap = material.displacementMap;
    if (!displacementMap) return 0;
    const textureData = this.getHeightTextureData(displacementMap);
    if (!textureData) return 0;

    this.sampleUv.set(u, v);
    displacementMap.transformUv(this.sampleUv);

    const x = Math.min(
      textureData.width - 1,
      Math.max(0, Math.floor(this.sampleUv.x * (textureData.width - 1))),
    );
    const y = Math.min(
      textureData.height - 1,
      Math.max(0, Math.floor(this.sampleUv.y * (textureData.height - 1))),
    );
    const sampleValue = textureData.data[(y * textureData.width + x) * 4] / 255;

    return sampleValue * material.displacementScale + material.displacementBias;
  }

  private getHeightTextureData(texture: THREE.Texture): HeightTextureData | null {
    const cached = this.heightTextureCache.get(texture);
    if (cached) return cached;
    if (!this.heightReadContext) return null;

    const source = texture.image as TextureImageSource | undefined;
    if (!source) return null;

    const width = this.pickDimension(source.videoWidth, source.width);
    const height = this.pickDimension(source.videoHeight, source.height);
    if (width <= 0 || height <= 0) return null;

    this.heightReadCanvas.width = width;
    this.heightReadCanvas.height = height;

    try {
      this.heightReadContext.clearRect(0, 0, width, height);
      this.heightReadContext.drawImage(source, 0, 0, width, height);
    } catch {
      return null;
    }

    const imageData = this.heightReadContext.getImageData(0, 0, width, height).data;
    const textureData: HeightTextureData = {
      width,
      height,
      data: new Uint8ClampedArray(imageData),
    };
    this.heightTextureCache.set(texture, textureData);
    return textureData;
  }

  private pickDimension(primary?: number, fallback?: number): number {
    if (typeof primary === 'number' && primary > 0) return primary;
    if (typeof fallback === 'number' && fallback > 0) return fallback;
    return 0;
  }

  private getMeshStandardMaterial(object: THREE.Object3D): THREE.MeshStandardMaterial | null {
    if (!(object instanceof THREE.Mesh)) return null;

    const { material } = object;
    if (material instanceof THREE.MeshStandardMaterial) {
      return material;
    }
    if (Array.isArray(material)) {
      for (const mat of material) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          return mat;
        }
      }
    }
    return null;
  }
}
