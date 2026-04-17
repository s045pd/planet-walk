import {
  BufferAttribute,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  BoxGeometry,
} from 'three';

import { biomeAt, buildBiomes, heightAt, type BiomeDef, type BiomeId, type SurfacePalette } from './Biomes';
import { SimplexNoise } from './Noise';

export interface TerrainOptions {
  size: number;
  segments: number;
  seed: number;
  palette: SurfacePalette;
}

export class Terrain {
  readonly root = new Object3D();
  readonly mesh: Mesh;
  readonly noise: SimplexNoise;
  private biomes: Record<BiomeId, BiomeDef>;
  private options: TerrainOptions;
  private rocks: InstancedMesh | null = null;

  constructor(options: TerrainOptions) {
    this.options = options;
    this.noise = new SimplexNoise(options.seed);
    this.biomes = buildBiomes(options.palette);

    const geo = new PlaneGeometry(options.size, options.size, options.segments, options.segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const tmp = new Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(this.noise, x, z, this.biomes);
      pos.setY(i, h);

      const id = biomeAt(this.noise, x, z);
      const def = this.biomes[id];
      const d = this.noise.noise2D(x * 0.1, z * 0.1) * 0.5 + 0.5;
      tmp.r = def.color.r + (def.detail.r - def.color.r) * d;
      tmp.g = def.color.g + (def.detail.g - def.color.g) * d;
      tmp.b = def.color.b + (def.detail.b - def.color.b) * d;
      const shade = Math.max(0.75, Math.min(1.25, 1 + h * 0.012));
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
    this.mesh.receiveShadow = true;
    this.root.add(this.mesh);

    this.scatterRocks();
  }

  getHeight(x: number, z: number): number {
    const half = this.options.size / 2;
    const cx = Math.max(-half, Math.min(half, x));
    const cz = Math.max(-half, Math.min(half, z));
    return heightAt(this.noise, cx, cz, this.biomes);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as MeshStandardMaterial).dispose();
    if (this.rocks) {
      this.rocks.geometry.dispose();
      (this.rocks.material as MeshStandardMaterial).dispose();
    }
    this.root.clear();
  }

  private scatterRocks(): void {
    const count = 260;
    const geo = new BoxGeometry(1, 0.7, 1);
    const mat = new MeshStandardMaterial({
      color: 0x000000,
      vertexColors: true,
      roughness: 1.0,
      flatShading: true,
    });
    const mesh = new InstancedMesh(geo, mat, count);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    const m = new Matrix4();
    const half = this.options.size / 2 - 10;
    let placed = 0;
    for (let attempt = 0; attempt < count * 3 && placed < count; attempt++) {
      const x = (Math.random() - 0.5) * 2 * half;
      const z = (Math.random() - 0.5) * 2 * half;
      const n = this.noise.noise2D(x * 0.5, z * 0.5);
      if (n < -0.25) {
        const y = this.getHeight(x, z) - 0.1;
        const s = 0.5 + (n + 1) * 0.6;
        m.makeScale(s, s * 0.55, s);
        m.setPosition(x, y, z);
        mesh.setMatrixAt(placed, m);
        const id = biomeAt(this.noise, x, z);
        const base = this.biomes[id].color;
        mesh.setColorAt(placed, base.clone().multiplyScalar(0.65));
        placed++;
      }
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.rocks = mesh;
    this.root.add(mesh);
  }
}
