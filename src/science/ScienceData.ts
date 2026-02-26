import type { PlanetType } from '../planet/PlanetFactory';

export interface PlanetSampleDefinition {
  id: string;
  name: string;
  description: string;
}

export interface SamplePoiDefinition {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sampleId: string;
  radiusScale?: number;
}

interface GeologyRule {
  label: string;
  minAltitude?: number;
  maxAltitude?: number;
  minSlope?: number;
  maxSlope?: number;
}

export interface PlanetScienceData {
  samples: Record<string, PlanetSampleDefinition>;
  pois: SamplePoiDefinition[];
  geologyRules: GeologyRule[];
}

const SCIENCE_DATA: Record<PlanetType, PlanetScienceData> = {
  earth: {
    samples: {
      earth_rock: {
        id: 'earth_rock',
        name: '岩石样本',
        description: '硅酸盐岩碎屑，适合分析风化与构造活动。',
      },
      earth_water: {
        id: 'earth_water',
        name: '水样',
        description: '地表水样本，可用于矿物与有机物痕量分析。',
      },
    },
    pois: [
      {
        id: 'earth-everest-site',
        name: '珠峰坡脚采样点',
        lat: 27.9881,
        lng: 86.925,
        sampleId: 'earth_rock',
        radiusScale: 0.03,
      },
      {
        id: 'earth-canyon-site',
        name: '大峡谷河段采样点',
        lat: 36.1069,
        lng: -112.1129,
        sampleId: 'earth_water',
        radiusScale: 0.03,
      },
    ],
    geologyRules: [
      { label: '山地基岩', minAltitude: 6, minSlope: 20 },
      { label: '河谷沉积层', maxAltitude: 0.5, maxSlope: 8 },
      { label: '风化岩层', minSlope: 12 },
      { label: '冲积平原', maxSlope: 12 },
    ],
  },
  mars: {
    samples: {
      mars_soil: {
        id: 'mars_soil',
        name: '土壤样本',
        description: '富含氧化铁的细颗粒尘土，代表典型火星风化层。',
      },
      mars_ice: {
        id: 'mars_ice',
        name: '冰样',
        description: '浅层挥发分冰晶，用于分析古气候演化。',
      },
    },
    pois: [
      {
        id: 'mars-olympus-site',
        name: '奥林帕斯山坡采样点',
        lat: 18.65,
        lng: -133.8,
        sampleId: 'mars_soil',
        radiusScale: 0.035,
      },
      {
        id: 'mars-jezero-site',
        name: '杰泽罗冻土采样点',
        lat: 18.38,
        lng: 77.58,
        sampleId: 'mars_ice',
        radiusScale: 0.035,
      },
    ],
    geologyRules: [
      { label: '火山高地玄武岩', minAltitude: 3, minSlope: 18 },
      { label: '极区冻土层', maxAltitude: -1.5, maxSlope: 16 },
      { label: '风积尘土平原', maxSlope: 10 },
      { label: '冲刷碎屑地层', minSlope: 10 },
    ],
  },
  moon: {
    samples: {
      moon_regolith: {
        id: 'moon_regolith',
        name: '月壤样本',
        description: '细粒月壤，适合分析太空风化与太阳风注入。',
      },
      moon_meteorite: {
        id: 'moon_meteorite',
        name: '陨石碎片',
        description: '撞击残留碎片，可用于追踪外来天体成分。',
      },
    },
    pois: [
      {
        id: 'moon-apollo-site',
        name: '静海月壤采样点',
        lat: 0.6741,
        lng: 23.4731,
        sampleId: 'moon_regolith',
        radiusScale: 0.04,
      },
      {
        id: 'moon-tycho-site',
        name: '第谷陨石坑采样点',
        lat: -43.31,
        lng: -11.36,
        sampleId: 'moon_meteorite',
        radiusScale: 0.04,
      },
    ],
    geologyRules: [
      { label: '撞击坑壁岩屑', minSlope: 24 },
      { label: '月海玄武质平原', maxAltitude: -0.8, maxSlope: 14 },
      { label: '高地斜长岩', minAltitude: 1.5, maxSlope: 18 },
      { label: '细粒月壤层', maxSlope: 18 },
    ],
  },
};

export function getPlanetScienceData(planet: PlanetType): PlanetScienceData {
  return SCIENCE_DATA[planet];
}

export function classifyGeology(
  planet: PlanetType,
  altitude: number,
  slope: number,
): string {
  const rules = SCIENCE_DATA[planet].geologyRules;
  for (const rule of rules) {
    if (rule.minAltitude !== undefined && altitude < rule.minAltitude) continue;
    if (rule.maxAltitude !== undefined && altitude > rule.maxAltitude) continue;
    if (rule.minSlope !== undefined && slope < rule.minSlope) continue;
    if (rule.maxSlope !== undefined && slope > rule.maxSlope) continue;
    return rule.label;
  }
  return '未分类地层';
}
