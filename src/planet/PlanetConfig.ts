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
  /** 夜间灯光贴图路径（地球） */
  nightPath?: string;
  /** 云层贴图路径（地球） */
  cloudsPath?: string;
  /** 海洋高光贴图路径（地球） */
  specularPath?: string;
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

/** 天气类型 */
export type WeatherType =
  | 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog'       // 地球
  | 'dust_storm' | 'blue_sunset' | 'thin_atmosphere'    // 火星
  | 'micro_impact' | 'lunar_dust' | 'extreme_light';    // 月球

/** 天气配置 */
export interface WeatherConfig {
  /** 可用天气类型列表 */
  types: WeatherType[];
  /** 天气自动切换间隔（秒） */
  changeInterval: number;
  /** 默认天气 */
  defaultWeather: WeatherType;
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
  weather?: WeatherConfig;
}
