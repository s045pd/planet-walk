/** 星球纹理配置 */
export interface PlanetTextureConfig {
  /** 漫反射贴图路径 */
  diffusePath?: string;
  /** 法线贴图路径 */
  normalPath?: string;
  /** 粗糙度贴图路径 */
  roughnessPath?: string;
  /** 高度图路径 */
  heightmapPath?: string;
  /** 贴图未加载时的占位颜色 */
  fallbackColor: number;
}

/** 散射参数（可选，覆盖内置预设） */
export interface ScatteringConfig {
  rayleighCoeff: { x: number; y: number; z: number };
  mieCoeff: number;
  rayleighScale: number;
  mieScale: number;
  mieDirection: number;
  intensity: number;
}

/** 大气层参数 */
export interface AtmosphereConfig {
  enabled: boolean;
  color: number;
  thickness: number;
  opacity: number;
  /** Optional override for scattering params; if omitted, uses built-in presets */
  scattering?: ScatteringConfig;
}

/** 地形配置 */
export interface TerrainConfig {
  heightScale: number;
  maxLodLevel?: number;
  tileResolution?: number;
}

/** 星球配置 */
export interface PlanetConfig {
  name: string;
  radius: number;
  gravity: number;
  /** 球体分段数，128 用于高面数渲染 */
  segments: number;
  textures: PlanetTextureConfig;
  atmosphere?: AtmosphereConfig;
  terrain?: TerrainConfig;
}
