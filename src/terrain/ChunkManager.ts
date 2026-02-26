import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import { CHUNK_SIZE, Chunk } from './Chunk';
import { SimplexNoise } from './SimplexNoise';

const VIEW_DISTANCE = 2;
const MAX_NEW_CHUNKS_PER_UPDATE = 2;

interface ChunkCoord {
  cx: number;
  cz: number;
}

/** Manages active terrain chunks around the player. */
export class ChunkManager implements IDisposable {
  private readonly scene: THREE.Scene;
  private readonly noise: SimplexNoise;
  private readonly chunks = new Map<string, Chunk>();

  private lastCX: number | null = null;
  private lastCZ: number | null = null;
  private olympusRoot: THREE.Group | null = null;
  private disposed = false;

  constructor(scene: THREE.Scene, seed = 42) {
    this.scene = scene;
    this.noise = new SimplexNoise(seed);
    this.createOlympusMons();
  }

  getChunkCoord(worldPos: THREE.Vector3): ChunkCoord {
    return {
      cx: Math.floor(worldPos.x / CHUNK_SIZE),
      cz: Math.floor(worldPos.z / CHUNK_SIZE),
    };
  }

  update(playerPosition: THREE.Vector3): void {
    if (this.disposed) {
      return;
    }

    const { cx, cz } = this.getChunkCoord(playerPosition);
    if (cx === this.lastCX && cz === this.lastCZ) {
      return;
    }

    this.lastCX = cx;
    this.lastCZ = cz;

    const needed = new Set<string>();
    let generated = 0;

    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        const targetCX = cx + dx;
        const targetCZ = cz + dz;
        const key = this.chunkKey(targetCX, targetCZ);
        needed.add(key);

        if (!this.chunks.has(key)) {
          if (generated >= MAX_NEW_CHUNKS_PER_UPDATE) {
            continue;
          }

          const chunk = new Chunk(targetCX, targetCZ, this.scene, this.noise);
          chunk.generate();
          this.chunks.set(key, chunk);
          generated++;
        }
      }
    }

    if (generated >= MAX_NEW_CHUNKS_PER_UPDATE) {
      this.lastCX = null;
      this.lastCZ = null;
    }

    for (const [key, chunk] of this.chunks) {
      if (!needed.has(key)) {
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }

  async loadInitialChunks(
    playerPosition: THREE.Vector3,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    if (this.disposed) {
      return;
    }

    const { cx, cz } = this.getChunkCoord(playerPosition);
    this.lastCX = cx;
    this.lastCZ = cz;

    const totalChunks = (VIEW_DISTANCE * 2 + 1) ** 2;
    let loaded = 0;

    for (let dx = -VIEW_DISTANCE; dx <= VIEW_DISTANCE; dx++) {
      for (let dz = -VIEW_DISTANCE; dz <= VIEW_DISTANCE; dz++) {
        const targetCX = cx + dx;
        const targetCZ = cz + dz;
        const key = this.chunkKey(targetCX, targetCZ);

        if (!this.chunks.has(key)) {
          const chunk = new Chunk(targetCX, targetCZ, this.scene, this.noise);
          chunk.generate();
          this.chunks.set(key, chunk);
        }

        loaded++;
        onProgress?.(loaded / totalChunks);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
      }
    }
  }

  getHeightAt(wx: number, wz: number): number {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.chunks.get(this.chunkKey(cx, cz));
    if (chunk) {
      return chunk.getHeight(wx, wz);
    }

    const tempChunk = new Chunk(cx, cz, this.scene, this.noise);
    return tempChunk.getHeight(wx, wz);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    for (const chunk of this.chunks.values()) {
      chunk.dispose();
    }
    this.chunks.clear();

    if (this.olympusRoot) {
      this.scene.remove(this.olympusRoot);
      this.disposeObjectTree(this.olympusRoot);
      this.olympusRoot = null;
    }
  }

  private chunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  private createOlympusMons(): void {
    const group = new THREE.Group();
    group.name = 'olympusMons';

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.3, 0.18, 0.12),
      emissive: new THREE.Color(0.08, 0.04, 0.02),
      roughness: 0.95,
      metalness: 0,
    });

    const olympus = new THREE.Mesh(
      new THREE.CylinderGeometry(40, 200, 120, 8),
      material,
    );
    olympus.position.set(0, 20, 1500);
    olympus.matrixAutoUpdate = false;
    olympus.updateMatrix();
    group.add(olympus);

    for (let i = 0; i < 3; i++) {
      const peak = new THREE.Mesh(
        new THREE.CylinderGeometry((20 + i * 10) * 0.5, (120 + i * 40) * 0.5, 50 + i * 15, 6),
        material,
      );
      peak.position.set(-200 + i * 200, 5, 1300 + i * 100);
      peak.matrixAutoUpdate = false;
      peak.updateMatrix();
      group.add(peak);
    }

    this.scene.add(group);
    this.olympusRoot = group;
  }

  private disposeObjectTree(root: THREE.Object3D): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();

    root.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        geometries.add(node.geometry);
        if (Array.isArray(node.material)) {
          for (const mat of node.material) {
            materials.add(mat);
          }
        } else {
          materials.add(node.material);
        }
      }
    });

    for (const geometry of geometries) {
      geometry.dispose();
    }
    for (const material of materials) {
      material.dispose();
    }
  }
}
