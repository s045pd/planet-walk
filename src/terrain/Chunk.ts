import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import { BiomeConfig, BiomeType, getBiomeAt } from './Biomes';
import type { SimplexNoise } from './SimplexNoise';

export const CHUNK_SIZE = 32;
const CHUNK_RES = 16;
const DECORATION_STEP = 8;
const DECORATION_THRESHOLD = -0.3;
const UP_AXIS = new THREE.Vector3(0, 1, 0);

interface DecorationPoint {
  wx: number;
  wz: number;
  height: number;
  scale: number;
  rotationY: number;
  biome: BiomeType;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose();
    }
    return;
  }
  material.dispose();
}

/** Single generated terrain chunk. */
export class Chunk implements IDisposable {
  readonly cx: number;
  readonly cz: number;

  private readonly scene: THREE.Scene;
  private readonly noise: SimplexNoise;
  private mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> | null = null;
  private decorations: THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> | null = null;
  private disposed = false;

  private readonly tempMatrix = new THREE.Matrix4();
  private readonly tempQuaternion = new THREE.Quaternion();
  private readonly tempPosition = new THREE.Vector3();
  private readonly tempScale = new THREE.Vector3();

  constructor(cx: number, cz: number, scene: THREE.Scene, noise: SimplexNoise) {
    this.cx = cx;
    this.cz = cz;
    this.scene = scene;
    this.noise = noise;
  }

  generate(): this {
    if (this.disposed || this.mesh) {
      return this;
    }

    const worldX = this.cx * CHUNK_SIZE;
    const worldZ = this.cz * CHUNK_SIZE;

    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_RES, CHUNK_RES);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const lx = positions.getX(i);
      const lz = positions.getZ(i);
      const wx = lx + worldX + CHUNK_SIZE * 0.5;
      const wz = lz + worldZ + CHUNK_SIZE * 0.5;

      const height = this.getHeight(wx, wz);
      positions.setY(i, height);

      const biome = getBiomeAt(this.noise, wx, wz);
      const config = BiomeConfig[biome];
      const d = this.noise.noise2D(wx * 0.1, wz * 0.1) * 0.5 + 0.5;

      const r = config.color[0] + (config.detailColor[0] - config.color[0]) * d;
      const g = config.color[1] + (config.detailColor[1] - config.color[1]) * d;
      const b = config.color[2] + (config.detailColor[2] - config.color[2]) * d;
      const factor = Math.max(0.7, Math.min(1.3, 1 + height * 0.02));

      colors[i * 3] = r * factor;
      colors[i * 3 + 1] = g * factor;
      colors[i * 3 + 2] = b * factor;
    }

    positions.needsUpdate = true;
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.96,
      metalness: 0.04,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.name = `chunk_${this.cx}_${this.cz}`;
    ground.position.set(worldX + CHUNK_SIZE * 0.5, 0, worldZ + CHUNK_SIZE * 0.5);
    ground.matrixAutoUpdate = false;
    ground.updateMatrix();
    ground.frustumCulled = true;

    this.scene.add(ground);
    this.mesh = ground;

    this.generateDecorations(worldX, worldZ);
    return this;
  }

  getHeight(wx: number, wz: number): number {
    const biome = getBiomeAt(this.noise, wx, wz);
    const config = BiomeConfig[biome];

    let h = config.baseHeight;
    h += this.noise.fbm(wx * 0.01, wz * 0.01, 2, 2, 0.5) * config.heightScale;
    h += this.noise.noise2D(wx * 0.05, wz * 0.05) * 1.5;

    if (biome === BiomeType.CRATER) {
      const craterNoise = this.noise.noise2D(wx * 0.008, wz * 0.008);
      if (craterNoise > 0.3) {
        h -= (craterNoise - 0.3) * 12;
      }
    }

    if (biome === BiomeType.VALLES) {
      const ridge = this.noise.ridgeNoise(wx * 0.003, wz * 0.003, 2, 2, 0.5);
      if (ridge > 0.75) {
        h -= (ridge - 0.75) * 30;
      }
    }

    return h;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      disposeMaterial(this.mesh.material);
      this.mesh = null;
    }

    if (this.decorations) {
      this.scene.remove(this.decorations);
      this.decorations.geometry.dispose();
      disposeMaterial(this.decorations.material);
      this.decorations = null;
    }
  }

  private generateDecorations(worldX: number, worldZ: number): void {
    const points: DecorationPoint[] = [];

    for (let dx = 0; dx < CHUNK_SIZE; dx += DECORATION_STEP) {
      for (let dz = 0; dz < CHUNK_SIZE; dz += DECORATION_STEP) {
        const wx = worldX + dx;
        const wz = worldZ + dz;
        const densityNoise = this.noise.noise2D(wx * 0.5, wz * 0.5);
        if (densityNoise > DECORATION_THRESHOLD) {
          continue;
        }

        points.push({
          wx,
          wz,
          height: this.getHeight(wx, wz),
          scale: 0.4 + (densityNoise + 1) * 0.4,
          rotationY: densityNoise * Math.PI,
          biome: getBiomeAt(this.noise, wx, wz),
        });
      }
    }

    if (points.length === 0) {
      return;
    }

    const firstBiome = BiomeConfig[points[0].biome];
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(
        firstBiome.color[0] * 0.7,
        firstBiome.color[1] * 0.7,
        firstBiome.color[2] * 0.7,
      ),
      roughness: 1,
      metalness: 0,
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const instances = new THREE.InstancedMesh(geometry, material, points.length);
    instances.name = `decor_${this.cx}_${this.cz}`;
    instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    instances.matrixAutoUpdate = false;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      this.tempPosition.set(point.wx, point.height - 0.1, point.wz);
      this.tempQuaternion.setFromAxisAngle(UP_AXIS, point.rotationY);
      this.tempScale.set(point.scale, point.scale * 0.6, point.scale);

      this.tempMatrix.compose(this.tempPosition, this.tempQuaternion, this.tempScale);
      instances.setMatrixAt(i, this.tempMatrix);
    }

    instances.instanceMatrix.needsUpdate = true;
    instances.updateMatrix();

    this.scene.add(instances);
    this.decorations = instances;
  }
}
