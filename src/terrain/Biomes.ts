import type { SimplexNoise } from './SimplexNoise';

export enum BiomeType {
  PLANITIA = 0,
  CRATER = 1,
  VALLES = 2,
  HIGHLAND = 3,
  VOLCANIC = 4,
}

type RGB = readonly [number, number, number];

export interface BiomeDefinition {
  name: string;
  baseHeight: number;
  heightScale: number;
  color: RGB;
  detailColor: RGB;
}

/** Mars-style biome definitions. */
export const BiomeConfig: Record<BiomeType, BiomeDefinition> = {
  [BiomeType.PLANITIA]: {
    name: 'Planitia',
    baseHeight: 0,
    heightScale: 2,
    color: [0.76, 0.50, 0.32],
    detailColor: [0.68, 0.44, 0.28],
  },
  [BiomeType.CRATER]: {
    name: 'Crater',
    baseHeight: -3,
    heightScale: 6,
    color: [0.55, 0.35, 0.22],
    detailColor: [0.48, 0.30, 0.18],
  },
  [BiomeType.VALLES]: {
    name: 'Valles',
    baseHeight: -8,
    heightScale: 12,
    color: [0.60, 0.38, 0.25],
    detailColor: [0.52, 0.32, 0.20],
  },
  [BiomeType.HIGHLAND]: {
    name: 'Highland',
    baseHeight: 4,
    heightScale: 8,
    color: [0.72, 0.48, 0.30],
    detailColor: [0.65, 0.42, 0.26],
  },
  [BiomeType.VOLCANIC]: {
    name: 'Volcanic',
    baseHeight: 6,
    heightScale: 10,
    color: [0.40, 0.28, 0.20],
    detailColor: [0.35, 0.22, 0.15],
  },
};

export function getBiomeAt(noise: SimplexNoise, wx: number, wz: number): BiomeType {
  const biomeValue = noise.fbm(wx * 0.002, wz * 0.002, 2, 2, 0.5);
  const ridgeValue = noise.noise2D(wx * 0.003, wz * 0.003);

  if (ridgeValue > 0.6) {
    return BiomeType.VALLES;
  }
  if (biomeValue < -0.3) {
    return BiomeType.CRATER;
  }
  if (biomeValue > 0.4) {
    return BiomeType.VOLCANIC;
  }
  if (biomeValue > 0.15) {
    return BiomeType.HIGHLAND;
  }
  return BiomeType.PLANITIA;
}
