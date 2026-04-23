import { Color } from 'three';
import type { SimplexNoise } from './Noise';

export type BiomeId = 'plain' | 'crater' | 'ridge' | 'highland' | 'basalt';

export interface BiomeDef {
  id: BiomeId;
  baseHeight: number;
  heightScale: number;
  color: Color;
  detail: Color;
}

export interface BiomePalette {
  plain: [number, number, number];
  crater: [number, number, number];
  ridge: [number, number, number];
  highland: [number, number, number];
  basalt: [number, number, number];
}

export interface SurfacePalette {
  palette: BiomePalette;
  detailShift: number;
  heightScale: number;
}

const rgb = (arr: [number, number, number]): Color => new Color(arr[0], arr[1], arr[2]);

export function buildBiomes(surface: SurfacePalette): Record<BiomeId, BiomeDef> {
  const s = surface.detailShift;
  const h = surface.heightScale;
  const mix = (c: [number, number, number], delta: number): Color =>
    new Color(Math.max(0, c[0] + delta), Math.max(0, c[1] + delta), Math.max(0, c[2] + delta));
  return {
    plain: { id: 'plain', baseHeight: 0, heightScale: 2 * h, color: rgb(surface.palette.plain), detail: mix(surface.palette.plain, -s) },
    crater: { id: 'crater', baseHeight: -3, heightScale: 6 * h, color: rgb(surface.palette.crater), detail: mix(surface.palette.crater, -s) },
    ridge: { id: 'ridge', baseHeight: -6, heightScale: 10 * h, color: rgb(surface.palette.ridge), detail: mix(surface.palette.ridge, -s) },
    highland: { id: 'highland', baseHeight: 3, heightScale: 6 * h, color: rgb(surface.palette.highland), detail: mix(surface.palette.highland, -s) },
    basalt: { id: 'basalt', baseHeight: 5, heightScale: 8 * h, color: rgb(surface.palette.basalt), detail: mix(surface.palette.basalt, -s) },
  };
}

export function biomeAt(noise: SimplexNoise, x: number, z: number): BiomeId {
  const b = noise.fbm(x * 0.002, z * 0.002, 2, 2, 0.5);
  const r = noise.noise2D(x * 0.003, z * 0.003);
  if (r > 0.6) return 'ridge';
  if (b < -0.3) return 'crater';
  if (b > 0.4) return 'basalt';
  if (b > 0.15) return 'highland';
  return 'plain';
}

export function heightAt(noise: SimplexNoise, x: number, z: number, biomes: Record<BiomeId, BiomeDef>): number {
  const id = biomeAt(noise, x, z);
  const def = biomes[id];
  let h = def.baseHeight;
  h += noise.fbm(x * 0.01, z * 0.01, 3, 2, 0.5) * def.heightScale;
  h += noise.noise2D(x * 0.05, z * 0.05) * 1.2;
  if (id === 'crater') {
    const cn = noise.noise2D(x * 0.008, z * 0.008);
    if (cn > 0.3) h -= (cn - 0.3) * 12;
  }
  if (id === 'ridge') {
    const rn = noise.ridge(x * 0.003, z * 0.003, 2, 2, 0.5);
    if (rn > 0.7) h -= (rn - 0.7) * 26;
  }
  return h;
}
