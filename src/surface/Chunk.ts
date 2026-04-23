import {
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';

import { biomeAt, buildBiomes, heightAt, type BiomeDef, type BiomeId, type SurfacePalette } from './Biomes';
import type { SimplexNoise } from './Noise';

export interface ChunkOptions {
  cx: number;
  cz: number;
  chunkSize: number;
  segments: number;
  noise: SimplexNoise;
  palette: SurfacePalette;
  extraHeight?: (x: number, z: number) => number;
}

export class Chunk {
  readonly mesh: Mesh;
  readonly cx: number;
  readonly cz: number;
  private biomes: Record<BiomeId, BiomeDef>;

  constructor(options: ChunkOptions) {
    this.cx = options.cx;
    this.cz = options.cz;
    this.biomes = buildBiomes(options.palette);

    const worldX = options.cx * options.chunkSize;
    const worldZ = options.cz * options.chunkSize;

    // one extra row/column shared with neighbors prevents visible seams under lighting
    const geo = new PlaneGeometry(options.chunkSize, options.chunkSize, options.segments, options.segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const tmp = new Color();

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localZ = pos.getZ(i);
      const wx = localX + worldX;
      const wz = localZ + worldZ;

      const baseH = heightAt(options.noise, wx, wz, this.biomes);
      const extra = options.extraHeight ? options.extraHeight(wx, wz) : 0;
      const h = baseH + extra;
      pos.setY(i, h);

      const id = biomeAt(options.noise, wx, wz);
      const def = this.biomes[id];
      const detailMix = options.noise.noise2D(wx * 0.1, wz * 0.1) * 0.5 + 0.5;
      tmp.r = def.color.r + (def.detail.r - def.color.r) * detailMix;
      tmp.g = def.color.g + (def.detail.g - def.color.g) * detailMix;
      tmp.b = def.color.b + (def.detail.b - def.color.b) * detailMix;
      const elevationTint = extra > 1 ? Math.max(0.55, 1 - extra * 0.008) : 1;
      const shade = Math.max(0.75, Math.min(1.25, 1 + h * 0.012)) * elevationTint;
      colors[i * 3 + 0] = tmp.r * shade;
      colors[i * 3 + 1] = tmp.g * shade;
      colors[i * 3 + 2] = tmp.b * shade;
    }

    geo.setAttribute('color', new BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      roughness: 0.95,
      metalness: 0.0,
    });

    this.mesh = new Mesh(geo, mat);
    this.mesh.position.set(worldX + options.chunkSize / 2, 0, worldZ + options.chunkSize / 2);
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshStandardMaterial).dispose();
  }
}
