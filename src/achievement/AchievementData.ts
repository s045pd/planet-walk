import type { PlanetType } from '../planet/PlanetFactory';
import type { WeatherType } from '../planet/PlanetConfig';

export type AchievementCategory = 'exploration' | 'discovery' | 'challenge';

export type SampleType = 'sediment' | 'oxide' | 'regolith';

export interface HiddenPoi {
  id: string;
  planet: PlanetType;
  name: string;
  lat: number;
  lng: number;
}

export type AchievementCondition =
  | { type: 'land_planets'; targets: PlanetType[] }
  | { type: 'walk_distance'; target: number }
  | { type: 'max_altitude'; target: number }
  | { type: 'min_altitude'; target: number }
  | { type: 'scan_sites'; target: number }
  | { type: 'collect_samples'; targets: SampleType[] }
  | { type: 'find_hidden_poi'; target: number }
  | { type: 'walk_streak'; targetSeconds: number }
  | { type: 'photo_planets'; targets: PlanetType[] }
  | { type: 'weather_cycle'; targets: WeatherType[] };

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: AchievementCondition;
}

export const ACHIEVEMENT_STORAGE_KEY = 'planet-walk-achievements-v1';

export const ALL_WEATHER_TYPES: WeatherType[] = [
  'clear',
  'cloudy',
  'rain',
  'snow',
  'fog',
  'dust_storm',
  'blue_sunset',
  'thin_atmosphere',
  'micro_impact',
  'lunar_dust',
  'extreme_light',
];

export const ALL_SAMPLE_TYPES: SampleType[] = ['sediment', 'oxide', 'regolith'];

export const PLANET_SAMPLE_TYPES: Record<PlanetType, SampleType> = {
  earth: 'sediment',
  mars: 'oxide',
  moon: 'regolith',
  venus: 'oxide',
  europa: 'regolith',
};

export const HIDDEN_POIS: HiddenPoi[] = [
  { id: 'hidden-earth-trench', planet: 'earth', name: 'Hadal Trench', lat: 11.4, lng: 142.2 },
  { id: 'hidden-mars-cave', planet: 'mars', name: 'Arsia Cave Pit', lat: -9.7, lng: -120.1 },
  { id: 'hidden-moon-rille', planet: 'moon', name: 'Schroter Valley', lat: 25.2, lng: -50.8 },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'land-earth',
    name: '蓝色起点',
    description: '首次在地球着陆',
    icon: 'planet',
    category: 'exploration',
    condition: { type: 'land_planets', targets: ['earth'] },
  },
  {
    id: 'land-mars',
    name: '红色着陆',
    description: '首次在火星着陆',
    icon: 'planet',
    category: 'exploration',
    condition: { type: 'land_planets', targets: ['mars'] },
  },
  {
    id: 'land-moon',
    name: '银灰第一步',
    description: '首次在月球着陆',
    icon: 'planet',
    category: 'exploration',
    condition: { type: 'land_planets', targets: ['moon'] },
  },
  {
    id: 'land_venus',
    name: '金云穿行者',
    description: '首次在金星着陆',
    icon: 'planet',
    category: 'exploration',
    condition: { type: 'land_planets', targets: ['venus'] },
  },
  {
    id: 'land_europa',
    name: '冰壳首踏',
    description: '首次在欧罗巴着陆',
    icon: 'planet',
    category: 'exploration',
    condition: { type: 'land_planets', targets: ['europa'] },
  },
  {
    id: 'land-all-planets',
    name: '五界旅者',
    description: '在全部五个星球都完成首次着陆',
    icon: 'orbit',
    category: 'exploration',
    condition: { type: 'land_planets', targets: ['earth', 'mars', 'moon', 'venus', 'europa'] },
  },
  {
    id: 'walk-1km',
    name: '初阶徒步',
    description: '累计行走 1,000 米',
    icon: 'boots',
    category: 'exploration',
    condition: { type: 'walk_distance', target: 1000 },
  },
  {
    id: 'walk-5km',
    name: '长征漫游',
    description: '累计行走 5,000 米',
    icon: 'boots',
    category: 'exploration',
    condition: { type: 'walk_distance', target: 5000 },
  },
  {
    id: 'reach-high-point',
    name: '高点观测者',
    description: '到达海拔 120 米以上',
    icon: 'summit',
    category: 'exploration',
    condition: { type: 'max_altitude', target: 120 },
  },
  {
    id: 'reach-low-point',
    name: '贴地飞行',
    description: '将最低海拔压到 2.2 米或更低',
    icon: 'depth',
    category: 'exploration',
    condition: { type: 'min_altitude', target: 2.2 },
  },
  {
    id: 'scan-5-sites',
    name: '初级扫描员',
    description: '扫描 5 个不同地点',
    icon: 'scan',
    category: 'discovery',
    condition: { type: 'scan_sites', target: 5 },
  },
  {
    id: 'scan-15-sites',
    name: '全域制图师',
    description: '扫描 15 个不同地点',
    icon: 'scan',
    category: 'discovery',
    condition: { type: 'scan_sites', target: 15 },
  },
  {
    id: 'collect-all-samples',
    name: '样本总成',
    description: '采集全部样本类型',
    icon: 'sample',
    category: 'discovery',
    condition: { type: 'collect_samples', targets: [...ALL_SAMPLE_TYPES] },
  },
  {
    id: 'find-hidden-poi',
    name: '秘密坐标',
    description: '找到一个隐藏 POI',
    icon: 'secret',
    category: 'discovery',
    condition: { type: 'find_hidden_poi', target: 1 },
  },
  {
    id: 'walk-streak-60',
    name: '不停步',
    description: '连续行走 60 秒',
    icon: 'streak',
    category: 'challenge',
    condition: { type: 'walk_streak', targetSeconds: 60 },
  },
  {
    id: 'walk-streak-180',
    name: '耐力狂奔',
    description: '连续行走 180 秒',
    icon: 'streak',
    category: 'challenge',
    condition: { type: 'walk_streak', targetSeconds: 180 },
  },
  {
    id: 'photo-all-planets',
    name: '行星摄影师',
    description: '在全部五个星球都拍一张照片',
    icon: 'camera',
    category: 'challenge',
    condition: { type: 'photo_planets', targets: ['earth', 'mars', 'moon', 'venus', 'europa'] },
  },
  {
    id: 'weather-master',
    name: '气象总管',
    description: '经历全部天气类型',
    icon: 'weather',
    category: 'challenge',
    condition: { type: 'weather_cycle', targets: [...ALL_WEATHER_TYPES] },
  },
];
