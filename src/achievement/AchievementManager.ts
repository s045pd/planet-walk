import type { IDisposable } from '../core/types';
import type { PlanetType } from '../planet/PlanetFactory';
import type { WeatherType } from '../planet/PlanetConfig';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_STORAGE_KEY,
  type AchievementCondition,
  type AchievementDefinition,
  type SampleType,
} from './AchievementData';

interface AchievementRuntimeState {
  landedPlanets: Set<PlanetType>;
  totalWalkDistance: number;
  maxAltitude: number;
  minAltitude: number | null;
  scannedSites: Set<string>;
  collectedSamples: Set<SampleType>;
  hiddenPois: Set<string>;
  walkStreakSeconds: number;
  maxWalkStreakSeconds: number;
  photoPlanets: Set<PlanetType>;
  seenWeathers: Set<WeatherType>;
}

interface AchievementPersistedState {
  version: 1;
  landedPlanets: PlanetType[];
  totalWalkDistance: number;
  maxAltitude: number;
  minAltitude: number | null;
  scannedSites: string[];
  collectedSamples: SampleType[];
  hiddenPois: string[];
  maxWalkStreakSeconds: number;
  photoPlanets: PlanetType[];
  seenWeathers: WeatherType[];
  unlockedAt: Record<string, string>;
}

export type AchievementEvent =
  | { type: 'planet_landed'; planet: PlanetType }
  | { type: 'distance_walked'; distance: number }
  | { type: 'altitude_updated'; altitude: number }
  | { type: 'site_scanned'; siteId: string }
  | { type: 'sample_collected'; sampleType: SampleType }
  | { type: 'hidden_poi_found'; poiId: string }
  | { type: 'walk_streak_tick'; moving: boolean; delta: number }
  | { type: 'photo_taken'; planet: PlanetType }
  | { type: 'weather_changed'; weather: WeatherType };

export interface AchievementProgress {
  current: number;
  target: number;
  ratio: number;
  text: string;
}

export interface AchievementStatus {
  definition: AchievementDefinition;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: AchievementProgress;
}

type ChangeListener = (statuses: AchievementStatus[]) => void;
type UnlockListener = (status: AchievementStatus) => void;

export class AchievementManager implements IDisposable {
  private readonly definitions: AchievementDefinition[];
  private readonly storageKey: string;
  private readonly state: AchievementRuntimeState;
  private readonly unlockedAt = new Map<string, string>();
  private readonly changeListeners = new Set<ChangeListener>();
  private readonly unlockListeners = new Set<UnlockListener>();

  constructor(
    definitions: AchievementDefinition[] = ACHIEVEMENTS,
    storageKey = ACHIEVEMENT_STORAGE_KEY,
  ) {
    this.definitions = definitions;
    this.storageKey = storageKey;
    this.state = {
      landedPlanets: new Set<PlanetType>(),
      totalWalkDistance: 0,
      maxAltitude: 0,
      minAltitude: null,
      scannedSites: new Set<string>(),
      collectedSamples: new Set<SampleType>(),
      hiddenPois: new Set<string>(),
      walkStreakSeconds: 0,
      maxWalkStreakSeconds: 0,
      photoPlanets: new Set<PlanetType>(),
      seenWeathers: new Set<WeatherType>(),
    };

    this.loadFromStorage();
  }

  onChange(listener: ChangeListener): () => void {
    this.changeListeners.add(listener);
    listener(this.getStatuses());
    return (): void => {
      this.changeListeners.delete(listener);
    };
  }

  onUnlock(listener: UnlockListener): () => void {
    this.unlockListeners.add(listener);
    return (): void => {
      this.unlockListeners.delete(listener);
    };
  }

  getStatuses(): AchievementStatus[] {
    return this.definitions.map((definition) => this.buildStatus(definition));
  }

  recordEvent(event: AchievementEvent): void {
    let changed = false;

    switch (event.type) {
      case 'planet_landed':
        changed = this.addToSet(this.state.landedPlanets, event.planet) || changed;
        break;
      case 'distance_walked':
        if (event.distance > 0) {
          this.state.totalWalkDistance += event.distance;
          changed = true;
        }
        break;
      case 'altitude_updated':
        if (event.altitude > this.state.maxAltitude) {
          this.state.maxAltitude = event.altitude;
          changed = true;
        }
        if (this.state.minAltitude === null || event.altitude < this.state.minAltitude) {
          this.state.minAltitude = event.altitude;
          changed = true;
        }
        break;
      case 'site_scanned':
        changed = this.addToSet(this.state.scannedSites, event.siteId) || changed;
        break;
      case 'sample_collected':
        changed = this.addToSet(this.state.collectedSamples, event.sampleType) || changed;
        break;
      case 'hidden_poi_found':
        changed = this.addToSet(this.state.hiddenPois, event.poiId) || changed;
        break;
      case 'walk_streak_tick': {
        if (event.moving) {
          const delta = Math.max(0, event.delta);
          if (delta > 0) {
            this.state.walkStreakSeconds += delta;
            changed = true;
          }
          if (this.state.walkStreakSeconds > this.state.maxWalkStreakSeconds) {
            this.state.maxWalkStreakSeconds = this.state.walkStreakSeconds;
            changed = true;
          }
        } else if (this.state.walkStreakSeconds > 0) {
          this.state.walkStreakSeconds = 0;
          changed = true;
        }
        break;
      }
      case 'photo_taken':
        changed = this.addToSet(this.state.photoPlanets, event.planet) || changed;
        break;
      case 'weather_changed':
        changed = this.addToSet(this.state.seenWeathers, event.weather) || changed;
        break;
    }

    if (!changed) {
      return;
    }

    const newlyUnlocked = this.evaluateUnlocks();
    this.saveToStorage();
    const statuses = this.getStatuses();
    this.notifyChange(statuses);

    if (newlyUnlocked.length > 0) {
      for (const status of newlyUnlocked) {
        for (const listener of this.unlockListeners) {
          listener(status);
        }
      }
    }
  }

  dispose(): void {
    this.changeListeners.clear();
    this.unlockListeners.clear();
  }

  private evaluateUnlocks(): AchievementStatus[] {
    const unlocked: AchievementStatus[] = [];
    for (const definition of this.definitions) {
      if (this.unlockedAt.has(definition.id)) {
        continue;
      }
      if (!this.isUnlocked(definition.condition)) {
        continue;
      }
      const now = new Date().toISOString();
      this.unlockedAt.set(definition.id, now);
      unlocked.push(this.buildStatus(definition));
    }
    return unlocked;
  }

  private isUnlocked(condition: AchievementCondition): boolean {
    switch (condition.type) {
      case 'land_planets':
        return this.countTargets(this.state.landedPlanets, condition.targets) >= condition.targets.length;
      case 'walk_distance':
        return this.state.totalWalkDistance >= condition.target;
      case 'max_altitude':
        return this.state.maxAltitude >= condition.target;
      case 'min_altitude':
        return this.state.minAltitude !== null && this.state.minAltitude <= condition.target;
      case 'scan_sites':
        return this.state.scannedSites.size >= condition.target;
      case 'collect_samples':
        return this.countTargets(this.state.collectedSamples, condition.targets) >= condition.targets.length;
      case 'find_hidden_poi':
        return this.state.hiddenPois.size >= condition.target;
      case 'walk_streak':
        return this.state.maxWalkStreakSeconds >= condition.targetSeconds;
      case 'photo_planets':
        return this.countTargets(this.state.photoPlanets, condition.targets) >= condition.targets.length;
      case 'weather_cycle':
        return this.countTargets(this.state.seenWeathers, condition.targets) >= condition.targets.length;
    }
  }

  private buildStatus(definition: AchievementDefinition): AchievementStatus {
    const unlockedAt = this.unlockedAt.get(definition.id) ?? null;
    const progress = this.getProgress(definition.condition);
    return {
      definition,
      unlocked: unlockedAt !== null,
      unlockedAt,
      progress,
    };
  }

  private getProgress(condition: AchievementCondition): AchievementProgress {
    switch (condition.type) {
      case 'land_planets': {
        const current = this.countTargets(this.state.landedPlanets, condition.targets);
        const target = condition.targets.length;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current}/${target} 星球`,
        };
      }
      case 'walk_distance': {
        const current = this.state.totalWalkDistance;
        const target = condition.target;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${this.formatDistance(current)} / ${this.formatDistance(target)}`,
        };
      }
      case 'max_altitude': {
        const current = this.state.maxAltitude;
        const target = condition.target;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current.toFixed(1)} m / ${target.toFixed(1)} m`,
        };
      }
      case 'min_altitude': {
        const target = condition.target;
        const current = this.state.minAltitude ?? 0;
        const ratio =
          this.state.minAltitude === null
            ? 0
            : Math.min(1, target / Math.max(this.state.minAltitude, target));
        return {
          current,
          target,
          ratio,
          text:
            this.state.minAltitude === null
              ? `-- / <= ${target.toFixed(1)} m`
              : `${this.state.minAltitude.toFixed(1)} m / <= ${target.toFixed(1)} m`,
        };
      }
      case 'scan_sites': {
        const current = this.state.scannedSites.size;
        const target = condition.target;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current}/${target} 地点`,
        };
      }
      case 'collect_samples': {
        const current = this.countTargets(this.state.collectedSamples, condition.targets);
        const target = condition.targets.length;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current}/${target} 样本`,
        };
      }
      case 'find_hidden_poi': {
        const current = this.state.hiddenPois.size;
        const target = condition.target;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current}/${target} 隐藏点`,
        };
      }
      case 'walk_streak': {
        const current = this.state.maxWalkStreakSeconds;
        const target = condition.targetSeconds;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current.toFixed(1)} s / ${target.toFixed(0)} s`,
        };
      }
      case 'photo_planets': {
        const current = this.countTargets(this.state.photoPlanets, condition.targets);
        const target = condition.targets.length;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current}/${target} 星球`,
        };
      }
      case 'weather_cycle': {
        const current = this.countTargets(this.state.seenWeathers, condition.targets);
        const target = condition.targets.length;
        return {
          current,
          target,
          ratio: this.ratio(current, target),
          text: `${current}/${target} 天气`,
        };
      }
    }
  }

  private countTargets<T>(set: Set<T>, targets: T[]): number {
    let count = 0;
    for (const target of targets) {
      if (set.has(target)) {
        count += 1;
      }
    }
    return count;
  }

  private ratio(current: number, target: number): number {
    if (target <= 0) {
      return 1;
    }
    return Math.max(0, Math.min(1, current / target));
  }

  private addToSet<T>(set: Set<T>, value: T): boolean {
    const before = set.size;
    set.add(value);
    return set.size !== before;
  }

  private formatDistance(meters: number): string {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  }

  private notifyChange(statuses: AchievementStatus[]): void {
    for (const listener of this.changeListeners) {
      listener(statuses);
    }
  }

  private saveToStorage(): void {
    const payload: AchievementPersistedState = {
      version: 1,
      landedPlanets: Array.from(this.state.landedPlanets),
      totalWalkDistance: this.state.totalWalkDistance,
      maxAltitude: this.state.maxAltitude,
      minAltitude: this.state.minAltitude,
      scannedSites: Array.from(this.state.scannedSites),
      collectedSamples: Array.from(this.state.collectedSamples),
      hiddenPois: Array.from(this.state.hiddenPois),
      maxWalkStreakSeconds: this.state.maxWalkStreakSeconds,
      photoPlanets: Array.from(this.state.photoPlanets),
      seenWeathers: Array.from(this.state.seenWeathers),
      unlockedAt: Object.fromEntries(this.unlockedAt),
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<AchievementPersistedState>;
      if (parsed.version !== 1) {
        return;
      }
      if (Array.isArray(parsed.landedPlanets)) {
        this.state.landedPlanets = new Set(parsed.landedPlanets);
      }
      if (typeof parsed.totalWalkDistance === 'number') {
        this.state.totalWalkDistance = parsed.totalWalkDistance;
      }
      if (typeof parsed.maxAltitude === 'number') {
        this.state.maxAltitude = parsed.maxAltitude;
      }
      if (typeof parsed.minAltitude === 'number' || parsed.minAltitude === null) {
        this.state.minAltitude = parsed.minAltitude;
      }
      if (Array.isArray(parsed.scannedSites)) {
        this.state.scannedSites = new Set(parsed.scannedSites);
      }
      if (Array.isArray(parsed.collectedSamples)) {
        this.state.collectedSamples = new Set(parsed.collectedSamples);
      }
      if (Array.isArray(parsed.hiddenPois)) {
        this.state.hiddenPois = new Set(parsed.hiddenPois);
      }
      if (typeof parsed.maxWalkStreakSeconds === 'number') {
        this.state.maxWalkStreakSeconds = parsed.maxWalkStreakSeconds;
      }
      if (Array.isArray(parsed.photoPlanets)) {
        this.state.photoPlanets = new Set(parsed.photoPlanets);
      }
      if (Array.isArray(parsed.seenWeathers)) {
        this.state.seenWeathers = new Set(parsed.seenWeathers);
      }
      if (parsed.unlockedAt && typeof parsed.unlockedAt === 'object') {
        for (const [id, unlockedAt] of Object.entries(parsed.unlockedAt)) {
          if (typeof unlockedAt === 'string') {
            this.unlockedAt.set(id, unlockedAt);
          }
        }
      }
    } catch {
      // ignore
    }
  }
}
