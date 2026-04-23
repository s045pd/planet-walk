import { Group } from 'three';

import type { SurfacePalette } from './Biomes';
import { buildBiomes, heightAt } from './Biomes';
import { Chunk } from './Chunk';
import { SimplexNoise } from './Noise';

export interface ChunkManagerOptions {
  chunkSize: number;
  chunkSegments: number;
  viewDistance: number; // in chunks radius
  seed: number;
  palette: SurfacePalette;
  extraHeight?: (x: number, z: number) => number;
}

export class ChunkManager {
  readonly root = new Group();
  readonly noise: SimplexNoise;
  private options: ChunkManagerOptions;
  private chunks = new Map<string, Chunk>();
  private lastCx: number | null = null;
  private lastCz: number | null = null;
  private biomes;

  constructor(options: ChunkManagerOptions) {
    this.options = options;
    this.noise = new SimplexNoise(options.seed);
    this.biomes = buildBiomes(options.palette);
  }

  private key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  update(playerX: number, playerZ: number, budgetPerFrame = 2): void {
    const { chunkSize, viewDistance } = this.options;
    const cx = Math.floor(playerX / chunkSize);
    const cz = Math.floor(playerZ / chunkSize);

    if (cx === this.lastCx && cz === this.lastCz) return;
    this.lastCx = cx;
    this.lastCz = cz;

    const needed = new Set<string>();
    let generated = 0;

    for (let dz = -viewDistance; dz <= viewDistance; dz++) {
      for (let dx = -viewDistance; dx <= viewDistance; dx++) {
        const k = this.key(cx + dx, cz + dz);
        needed.add(k);
        if (!this.chunks.has(k) && generated < budgetPerFrame) {
          this.spawn(cx + dx, cz + dz);
          generated++;
        }
      }
    }

    // if we ran out of budget, force re-check next frame
    if (generated >= budgetPerFrame) {
      this.lastCx = null;
      this.lastCz = null;
    }

    for (const [k, chunk] of this.chunks) {
      if (!needed.has(k)) {
        this.root.remove(chunk.mesh);
        chunk.dispose();
        this.chunks.delete(k);
      }
    }
  }

  /** Pre-generate the whole initial view cone around a world position. */
  preload(playerX: number, playerZ: number): void {
    const { chunkSize, viewDistance } = this.options;
    const cx = Math.floor(playerX / chunkSize);
    const cz = Math.floor(playerZ / chunkSize);
    this.lastCx = cx;
    this.lastCz = cz;
    for (let dz = -viewDistance; dz <= viewDistance; dz++) {
      for (let dx = -viewDistance; dx <= viewDistance; dx++) {
        const k = this.key(cx + dx, cz + dz);
        if (!this.chunks.has(k)) this.spawn(cx + dx, cz + dz);
      }
    }
  }

  /** Height in world coordinates — works anywhere, not just inside a loaded chunk. */
  getHeightAt(worldX: number, worldZ: number): number {
    let h = heightAt(this.noise, worldX, worldZ, this.biomes);
    if (this.options.extraHeight) h += this.options.extraHeight(worldX, worldZ);
    return h;
  }

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.root.remove(chunk.mesh);
      chunk.dispose();
    }
    this.chunks.clear();
    this.root.clear();
  }

  private spawn(cx: number, cz: number): void {
    const chunk = new Chunk({
      cx,
      cz,
      chunkSize: this.options.chunkSize,
      segments: this.options.chunkSegments,
      noise: this.noise,
      palette: this.options.palette,
      extraHeight: this.options.extraHeight,
    });
    this.chunks.set(this.key(cx, cz), chunk);
    this.root.add(chunk.mesh);
  }
}
