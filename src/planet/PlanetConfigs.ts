import { Color } from 'three';

import type { BiomePalette, SurfacePalette } from '../surface/Biomes';

export interface PlanetSurfacePalette extends SurfacePalette {
  sunColor: Color;
  dustColor: Color;
  groundTint: Color;
  nightTop: Color;
  nightHorizon: Color;
  sunsetTint: Color;
  starVisibility: number;
  sunIntensity: number;
  ambientIntensity: number;
}

export interface PlanetConfig {
  id: string;
  name: string;
  catalogue: string;
  tagline: string;
  radius: number;
  gravity: number;
  rotationPeriod: number;
  atmosphereColor: Color;
  atmosphereIntensity: number;
  surface: {
    low: Color;
    mid: Color;
    high: Color;
    polar: Color;
    roughness: number;
    cratering: number;
    banding: number;
  };
  sky: {
    top: Color;
    horizon: Color;
  };
  surfacePalette: PlanetSurfacePalette;
  solLabel: string;
  landingSite: { lat: number; lon: number; name: string };
  notes: string[];
}

const rgb = (r: number, g: number, b: number): Color => new Color(r / 255, g / 255, b / 255);

interface SurfacePaletteOpts {
  detail: number;
  heightScale: number;
  sun: Color;
  dust: Color;
  ground: Color;
  nightTop: Color;
  nightHorizon: Color;
  sunset: Color;
  stars: number;
  sunI: number;
  ambI: number;
}

const surfacePalette = (palette: BiomePalette, opts: SurfacePaletteOpts): PlanetSurfacePalette => ({
  palette,
  detailShift: opts.detail,
  heightScale: opts.heightScale,
  sunColor: opts.sun,
  dustColor: opts.dust,
  groundTint: opts.ground,
  nightTop: opts.nightTop,
  nightHorizon: opts.nightHorizon,
  sunsetTint: opts.sunset,
  starVisibility: opts.stars,
  sunIntensity: opts.sunI,
  ambientIntensity: opts.ambI,
});

export const PLANET_CONFIGS: PlanetConfig[] = [
  {
    id: 'terra',
    name: 'TERRA',
    catalogue: '001 · SOL-III',
    tagline: 'Blue oasis · liquid water · 1.0 g reference',
    radius: 1000,
    gravity: 9.81,
    rotationPeriod: 86_400,
    atmosphereColor: rgb(90, 150, 255),
    atmosphereIntensity: 1.3,
    surface: {
      low: rgb(20, 55, 110),
      mid: rgb(40, 120, 80),
      high: rgb(120, 100, 70),
      polar: rgb(230, 238, 245),
      roughness: 0.55,
      cratering: 0.0,
      banding: 0.05,
    },
    sky: { top: rgb(12, 22, 44), horizon: rgb(100, 140, 200) },
    surfacePalette: surfacePalette(
      {
        plain:    [0.42, 0.55, 0.28],
        crater:   [0.38, 0.30, 0.20],
        ridge:    [0.55, 0.50, 0.42],
        highland: [0.30, 0.45, 0.22],
        basalt:   [0.32, 0.32, 0.30],
      },
      {
        detail: 0.05, heightScale: 1.1,
        sun: rgb(255, 248, 235), dust: rgb(220, 225, 230), ground: rgb(45, 80, 50),
        nightTop: rgb(3, 5, 15), nightHorizon: rgb(14, 22, 40),
        sunset: rgb(255, 135, 70), stars: 0.7,
        sunI: 1.4, ambI: 0.55,
      },
    ),
    solLabel: 'UTC',
    landingSite: { lat: 27.988, lon: 86.925, name: 'Sagarmatha · Himalaya' },
    notes: ['29% land · 71% hydrosphere', 'Biosphere active', 'Magnetic field nominal'],
  },
  {
    id: 'mars',
    name: 'MARS',
    catalogue: '002 · SOL-IV',
    tagline: 'Rust desert · thin CO₂ · Valles Marineris',
    radius: 532,
    gravity: 3.72,
    rotationPeriod: 88_642,
    atmosphereColor: rgb(210, 130, 90),
    atmosphereIntensity: 0.55,
    surface: {
      low: rgb(82, 32, 18),
      mid: rgb(158, 81, 48),
      high: rgb(210, 145, 95),
      polar: rgb(240, 235, 225),
      roughness: 0.7,
      cratering: 0.35,
      banding: 0.0,
    },
    sky: { top: rgb(20, 12, 10), horizon: rgb(180, 110, 80) },
    surfacePalette: surfacePalette(
      {
        plain:    [0.76, 0.50, 0.32],
        crater:   [0.55, 0.35, 0.22],
        ridge:    [0.60, 0.38, 0.25],
        highland: [0.72, 0.48, 0.30],
        basalt:   [0.40, 0.28, 0.20],
      },
      {
        detail: 0.06, heightScale: 1.2,
        sun: rgb(255, 216, 175), dust: rgb(220, 150, 100), ground: rgb(90, 40, 20),
        nightTop: rgb(3, 2, 5), nightHorizon: rgb(20, 14, 14),
        sunset: rgb(90, 130, 220), stars: 0.85,
        sunI: 1.2, ambI: 0.45,
      },
    ),
    solLabel: 'LMST',
    landingSite: { lat: -14.502, lon: 175.83, name: 'Jezero Approach' },
    notes: ['Atm. pressure 0.6 kPa', 'Olympus Mons +21,229 m', 'Dust storm cycle · low'],
  },
  {
    id: 'luna',
    name: 'LUNA',
    catalogue: '003 · EARTH-I',
    tagline: 'Silver regolith · no atm · tidally locked',
    radius: 272,
    gravity: 1.62,
    rotationPeriod: 2_360_591,
    atmosphereColor: rgb(120, 120, 130),
    atmosphereIntensity: 0.0,
    surface: {
      low: rgb(55, 55, 58),
      mid: rgb(140, 138, 135),
      high: rgb(210, 208, 200),
      polar: rgb(230, 230, 225),
      roughness: 0.85,
      cratering: 0.9,
      banding: 0.0,
    },
    sky: { top: rgb(0, 0, 0), horizon: rgb(10, 10, 12) },
    surfacePalette: surfacePalette(
      {
        plain:    [0.45, 0.45, 0.42],
        crater:   [0.26, 0.26, 0.24],
        ridge:    [0.55, 0.53, 0.48],
        highland: [0.66, 0.64, 0.58],
        basalt:   [0.32, 0.32, 0.30],
      },
      {
        detail: 0.08, heightScale: 1.5,
        sun: rgb(255, 255, 245), dust: rgb(180, 180, 170), ground: rgb(60, 60, 60),
        nightTop: rgb(0, 0, 0), nightHorizon: rgb(3, 3, 5),
        sunset: rgb(80, 80, 90), stars: 1.0,
        sunI: 1.6, ambI: 0.12,
      },
    ),
    solLabel: 'UTC',
    landingSite: { lat: 0.673, lon: 23.473, name: 'Mare Tranquillitatis' },
    notes: ['Vacuum surface', 'Day/night swing 250 K', 'Crater density · high'],
  },
  {
    id: 'venus',
    name: 'VENUS',
    catalogue: '004 · SOL-II',
    tagline: 'Sulfuric haze · 92 atm · retrograde',
    radius: 950,
    gravity: 8.87,
    rotationPeriod: 20_995_200,
    atmosphereColor: rgb(255, 200, 120),
    atmosphereIntensity: 2.1,
    surface: {
      low: rgb(110, 70, 30),
      mid: rgb(210, 170, 100),
      high: rgb(245, 220, 160),
      polar: rgb(250, 235, 200),
      roughness: 0.3,
      cratering: 0.1,
      banding: 0.6,
    },
    sky: { top: rgb(120, 70, 20), horizon: rgb(255, 190, 110) },
    surfacePalette: surfacePalette(
      {
        plain:    [0.78, 0.58, 0.30],
        crater:   [0.60, 0.40, 0.22],
        ridge:    [0.70, 0.50, 0.26],
        highland: [0.88, 0.68, 0.38],
        basalt:   [0.40, 0.25, 0.12],
      },
      {
        detail: 0.05, heightScale: 0.9,
        sun: rgb(255, 180, 90), dust: rgb(235, 185, 110), ground: rgb(120, 70, 20),
        nightTop: rgb(40, 20, 10), nightHorizon: rgb(80, 45, 18),
        sunset: rgb(255, 110, 40), stars: 0.0,
        sunI: 1.1, ambI: 0.75,
      },
    ),
    solLabel: 'VST',
    landingSite: { lat: 3.2, lon: 298.0, name: 'Ishtar Terra · Maxwell' },
    notes: ['Surface 464 °C', '96.5% CO₂ atmosphere', 'Retrograde rotation'],
  },
  {
    id: 'europa',
    name: 'EUROPA',
    catalogue: '005 · JUPITER-II',
    tagline: 'Ice shell · cryosea · chaos terrain',
    radius: 240,
    gravity: 1.31,
    rotationPeriod: 306_720,
    atmosphereColor: rgb(180, 210, 240),
    atmosphereIntensity: 0.25,
    surface: {
      low: rgb(140, 135, 150),
      mid: rgb(210, 220, 235),
      high: rgb(250, 250, 255),
      polar: rgb(255, 255, 255),
      roughness: 0.15,
      cratering: 0.05,
      banding: 0.35,
    },
    sky: { top: rgb(4, 8, 18), horizon: rgb(80, 100, 140) },
    surfacePalette: surfacePalette(
      {
        plain:    [0.82, 0.88, 0.95],
        crater:   [0.55, 0.62, 0.72],
        ridge:    [0.88, 0.92, 0.97],
        highland: [0.94, 0.96, 1.00],
        basalt:   [0.40, 0.52, 0.70],
      },
      {
        detail: 0.06, heightScale: 0.6,
        sun: rgb(215, 225, 255), dust: rgb(180, 210, 245), ground: rgb(160, 190, 220),
        nightTop: rgb(1, 2, 10), nightHorizon: rgb(6, 12, 28),
        sunset: rgb(180, 200, 240), stars: 0.95,
        sunI: 0.8, ambI: 0.4,
      },
    ),
    solLabel: 'JST',
    landingSite: { lat: 12.5, lon: 180.0, name: 'Conamara Chaos' },
    notes: ['Subsurface ocean suspected', 'Surface −170 °C', 'Jupiter radiation · high'],
  },
];

export const DEFAULT_PLANET_ID = 'mars';
