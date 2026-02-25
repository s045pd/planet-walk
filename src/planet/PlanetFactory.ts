import { EARTH_GRAVITY, EARTH_RADIUS, MARS_GRAVITY, MARS_RADIUS, MOON_GRAVITY, MOON_RADIUS } from '../utils/constants';
import { Planet } from './Planet';
import type { PlanetConfig } from './PlanetConfig';

export type PlanetType = 'earth' | 'mars' | 'moon';

const PLANET_CONFIGS: Record<PlanetType, PlanetConfig> = {
  earth: {
    name: 'earth',
    radius: EARTH_RADIUS,
    gravity: EARTH_GRAVITY,
    segments: 128,
    textures: {
      diffusePath: '/assets/textures/earth/diffuse.jpg',
      normalPath: '/assets/textures/earth/normal.jpg',
      roughnessPath: '/assets/textures/earth/roughness.jpg',
      heightmapPath: '/assets/textures/earth/heightmap.png',
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
  },
  mars: {
    name: 'mars',
    radius: MARS_RADIUS,
    gravity: MARS_GRAVITY,
    segments: 128,
    textures: {
      diffusePath: '/assets/textures/mars/diffuse.jpg',
      normalPath: '/assets/textures/mars/normal.jpg',
      roughnessPath: '/assets/textures/mars/roughness.jpg',
      heightmapPath: '/assets/textures/mars/heightmap.png',
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
  },
  moon: {
    name: 'moon',
    radius: MOON_RADIUS,
    gravity: MOON_GRAVITY,
    segments: 128,
    textures: {
      diffusePath: '/assets/textures/moon/diffuse.jpg',
      normalPath: '/assets/textures/moon/normal.jpg',
      roughnessPath: '/assets/textures/moon/roughness.jpg',
      heightmapPath: '/assets/textures/moon/heightmap.png',
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
