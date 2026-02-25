import { EARTH_GRAVITY, EARTH_RADIUS, MARS_GRAVITY, MARS_RADIUS, MOON_GRAVITY, MOON_RADIUS } from '../utils/constants';
import { Planet } from './Planet';
import type { PlanetConfig } from './PlanetConfig';

export type PlanetType = 'earth' | 'mars' | 'moon';

const BASE = import.meta.env.BASE_URL;

const PLANET_CONFIGS: Record<PlanetType, PlanetConfig> = {
  earth: {
    name: 'earth',
    radius: EARTH_RADIUS,
    gravity: EARTH_GRAVITY,
    segments: 128,
    textures: {
      diffusePath: BASE + 'assets/textures/earth/diffuse.jpg',
      nightPath: BASE + 'assets/textures/earth/night.jpg',
      cloudsPath: BASE + 'assets/textures/earth/clouds.jpg',
      fallbackColor: 0x2f6ca8,
    },
    atmosphere: {
      enabled: true,
      color: 0x66aaff,
      thickness: 0.02,
      opacity: 0.15,
    },
    terrain: {
      heightScale: 15,
      maxLodLevel: 15,
      tileResolution: 256,
    },
    landmarks: [
      { name: 'Mount Everest', lat: 27.9881, lng: 86.925, description: 'Earth highest peak' },
      { name: 'Grand Canyon', lat: 36.1069, lng: -112.1129, description: 'Colorado Plateau canyon system' },
    ],
  },
  mars: {
    name: 'mars',
    radius: MARS_RADIUS,
    gravity: MARS_GRAVITY,
    segments: 128,
    textures: {
      diffusePath: BASE + 'assets/textures/mars/diffuse.jpg',
      fallbackColor: 0xb5603c,
    },
    atmosphere: {
      enabled: true,
      color: 0xffb27a,
      thickness: 0.015,
      opacity: 0.08,
    },
    terrain: {
      heightScale: 10,
      maxLodLevel: 12,
      tileResolution: 256,
    },
    landmarks: [
      { name: 'Olympus Mons', lat: 18.65, lng: -133.8, description: 'Largest volcano in the Solar System' },
      { name: 'Valles Marineris', lat: -14.6, lng: -59.3, description: 'Massive canyon system near equator' },
      { name: 'Gale Crater', lat: -5.4, lng: 137.8, description: 'Curiosity rover landing site' },
      { name: 'Jezero Crater', lat: 18.38, lng: 77.58, description: 'Perseverance rover landing site' },
    ],
  },
  moon: {
    name: 'moon',
    radius: MOON_RADIUS,
    gravity: MOON_GRAVITY,
    segments: 128,
    textures: {
      diffusePath: BASE + 'assets/textures/moon/diffuse.jpg',
      fallbackColor: 0x9a9a9a,
    },
    atmosphere: {
      enabled: false,
      color: 0xffffff,
      thickness: 0,
      opacity: 0,
    },
    terrain: {
      heightScale: 8,
      maxLodLevel: 12,
      tileResolution: 256,
    },
    landmarks: [
      { name: 'Apollo 11 Landing Site', lat: 0.6741, lng: 23.4731, description: 'Sea of Tranquility' },
      { name: 'Tycho Crater', lat: -43.31, lng: -11.36, description: 'Prominent young impact crater' },
      { name: 'Copernicus Crater', lat: 9.62, lng: -20.08, description: 'Large ray crater' },
      { name: 'Shackleton Crater', lat: -89.9, lng: 0, description: 'South pole crater with permanent shadow' },
    ],
  },
};

/** 星球工厂：根据预设配置创建星球实例 */
export class PlanetFactory {
  static create(type: PlanetType): Planet {
    const config = PLANET_CONFIGS[type];
    return new Planet({
      ...config,
      textures: { ...config.textures },
      atmosphere: config.atmosphere ? { ...config.atmosphere } : undefined,
      terrain: config.terrain ? { ...config.terrain } : undefined,
      landmarks: config.landmarks.map((landmark) => ({ ...landmark })),
    });
  }

  static createEarth(): Planet {
    return this.create('earth');
  }

  static createMars(): Planet {
    return this.create('mars');
  }

  static createMoon(): Planet {
    return this.create('moon');
  }
}
