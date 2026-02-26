import * as THREE from 'three';
import type { PlanetType } from '../planet/PlanetFactory';
import { geoToCartesian } from '../utils/geo';
import { getPlanetScienceData, type PlanetSampleDefinition, type SamplePoiDefinition } from './ScienceData';

export interface SampleCollectorConfig {
  planetType: PlanetType;
  planetRadius: number;
  storageKey?: string;
}

export interface CollectedSampleEntry {
  id: string;
  planet: PlanetType;
  poiId: string;
  poiName: string;
  sampleId: string;
  sampleName: string;
  sampleDescription: string;
  collectedAt: string;
}

export interface NearbySampleTarget {
  poi: SamplePoiDefinition;
  sample: PlanetSampleDefinition;
  distance: number;
  collectRadius: number;
  alreadyCollected: boolean;
}

export interface CollectResult {
  ok: boolean;
  message: string;
  entry?: CollectedSampleEntry;
  nearby?: NearbySampleTarget;
}

interface StoredInventoryShape {
  entries: CollectedSampleEntry[];
}

export class SampleCollector {
  private readonly storageKey: string;
  private readonly inventory: CollectedSampleEntry[];
  private planetType: PlanetType;
  private planetRadius: number;

  private readonly tmpSurfaceDir = new THREE.Vector3();
  private readonly tmpPoiDir = new THREE.Vector3();

  constructor(config: SampleCollectorConfig) {
    this.storageKey = config.storageKey ?? 'planet-walk-science-samples-v1';
    this.planetType = config.planetType;
    this.planetRadius = config.planetRadius;
    this.inventory = this.loadInventory();
  }

  switchPlanet(planetType: PlanetType, planetRadius: number): void {
    this.planetType = planetType;
    this.planetRadius = planetRadius;
  }

  getInventory(): readonly CollectedSampleEntry[] {
    return this.inventory;
  }

  getNearbyTarget(position: THREE.Vector3): NearbySampleTarget | null {
    this.tmpSurfaceDir.copy(position).normalize();

    const scienceData = getPlanetScienceData(this.planetType);
    let nearest: NearbySampleTarget | null = null;

    for (const poi of scienceData.pois) {
      this.tmpPoiDir.copy(geoToCartesian(poi.lat, poi.lng, 1)).normalize();
      const dot = THREE.MathUtils.clamp(
        this.tmpSurfaceDir.dot(this.tmpPoiDir),
        -1,
        1,
      );
      const angle = Math.acos(dot);
      const distance = angle * this.planetRadius;
      const collectRadius = this.planetRadius * (poi.radiusScale ?? 0.03);
      if (distance > collectRadius) continue;

      const sample = scienceData.samples[poi.sampleId];
      if (!sample) continue;

      const candidate: NearbySampleTarget = {
        poi,
        sample,
        distance,
        collectRadius,
        alreadyCollected: this.hasCollected(poi.id),
      };

      if (!nearest || candidate.distance < nearest.distance) {
        nearest = candidate;
      }
    }

    return nearest;
  }

  collect(position: THREE.Vector3): CollectResult {
    const nearby = this.getNearbyTarget(position);
    if (!nearby) {
      return {
        ok: false,
        message: '附近没有可采集样本点，靠近 POI 后按 F 采集。',
      };
    }

    if (nearby.alreadyCollected) {
      return {
        ok: false,
        message: `${nearby.poi.name} 的样本已采集过。`,
        nearby,
      };
    }

    const entry: CollectedSampleEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      planet: this.planetType,
      poiId: nearby.poi.id,
      poiName: nearby.poi.name,
      sampleId: nearby.sample.id,
      sampleName: nearby.sample.name,
      sampleDescription: nearby.sample.description,
      collectedAt: new Date().toISOString(),
    };

    this.inventory.unshift(entry);
    this.saveInventory();

    return {
      ok: true,
      message: `已采集：${entry.sampleName}（${entry.poiName}）`,
      entry,
      nearby: { ...nearby, alreadyCollected: true },
    };
  }

  private hasCollected(poiId: string): boolean {
    return this.inventory.some(
      (entry) => entry.planet === this.planetType && entry.poiId === poiId,
    );
  }

  private loadInventory(): CollectedSampleEntry[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredInventoryShape;
      if (!parsed || !Array.isArray(parsed.entries)) {
        return [];
      }

      return parsed.entries.filter((entry) =>
        typeof entry.id === 'string' &&
        (
          entry.planet === 'earth' ||
          entry.planet === 'mars' ||
          entry.planet === 'moon' ||
          entry.planet === 'venus' ||
          entry.planet === 'europa'
        ) &&
        typeof entry.poiId === 'string' &&
        typeof entry.poiName === 'string' &&
        typeof entry.sampleId === 'string' &&
        typeof entry.sampleName === 'string' &&
        typeof entry.sampleDescription === 'string' &&
        typeof entry.collectedAt === 'string',
      );
    } catch {
      return [];
    }
  }

  private saveInventory(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const payload: StoredInventoryShape = {
      entries: this.inventory,
    };
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // 存储失败时忽略，不影响主流程
    }
  }
}
