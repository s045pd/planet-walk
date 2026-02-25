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

/** 大气层参数 */
export interface AtmosphereConfig {
  enabled: boolean;
  color: number;
  thickness: number;
  opacity: number;
}

/** 地形配置 */
export interface TerrainConfig {
  heightScale: number;
  maxLodLevel?: number;
  tileResolution?: number;
}

/** 预设兴趣点（地标） */
export interface PlanetLandmark {
  name: string;
  lat: number;
  lng: number;
  description?: string;
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
  landmarks: PlanetLandmark[];
}
