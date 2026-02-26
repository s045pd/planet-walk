import type { IDisposable } from '../core/types';
import { getLocale, onLocaleChange, t } from '../i18n';

export const STATS_STORAGE_KEY = 'planet-walk-stats';

interface StatsState {
  version: 1;
  totalWalkDistanceMeters: number;
  samplesCollected: number;
  totalPlayTimeSeconds: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
}

interface BadgeDefinition {
  id: string;
  icon: string;
  titleKey: string;
  unlocked: (state: StatsState) => boolean;
}

const BADGES: BadgeDefinition[] = [
  {
    id: 'walker-1km',
    icon: '🥾',
    titleKey: 'stats.badge.walker.1km',
    unlocked: (state) => state.totalWalkDistanceMeters >= 1_000,
  },
  {
    id: 'walker-10km',
    icon: '🥾',
    titleKey: 'stats.badge.walker.10km',
    unlocked: (state) => state.totalWalkDistanceMeters >= 10_000,
  },
  {
    id: 'walker-100km',
    icon: '🥾',
    titleKey: 'stats.badge.walker.100km',
    unlocked: (state) => state.totalWalkDistanceMeters >= 100_000,
  },
  {
    id: 'samples-5',
    icon: '🧪',
    titleKey: 'stats.badge.samples.5',
    unlocked: (state) => state.samplesCollected >= 5,
  },
  {
    id: 'samples-20',
    icon: '🧪',
    titleKey: 'stats.badge.samples.20',
    unlocked: (state) => state.samplesCollected >= 20,
  },
  {
    id: 'samples-50',
    icon: '🧪',
    titleKey: 'stats.badge.samples.50',
    unlocked: (state) => state.samplesCollected >= 50,
  },
  {
    id: 'achievements-50',
    icon: '🏆',
    titleKey: 'stats.badge.achievements.50',
    unlocked: (state) => getAchievementRatio(state) >= 0.5,
  },
  {
    id: 'achievements-100',
    icon: '🏆',
    titleKey: 'stats.badge.achievements.100',
    unlocked: (state) => getAchievementRatio(state) >= 1,
  },
];

function getAchievementRatio(state: StatsState): number {
  if (state.achievementsTotal <= 0) {
    return 0;
  }
  return state.achievementsUnlocked / state.achievementsTotal;
}

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

export class StatsPanel implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly summaryTitle: HTMLDivElement;
  private readonly badgesTitle: HTMLDivElement;
  private readonly metricDistanceLabel: HTMLDivElement;
  private readonly metricSamplesLabel: HTMLDivElement;
  private readonly metricAchievementsLabel: HTMLDivElement;
  private readonly metricPlayTimeLabel: HTMLDivElement;
  private readonly metricDistanceValue: HTMLDivElement;
  private readonly metricSamplesValue: HTMLDivElement;
  private readonly metricAchievementsValue: HTMLDivElement;
  private readonly metricPlayTimeValue: HTMLDivElement;
  private readonly badgesGrid: HTMLDivElement;

  private readonly storageKey: string;
  private readonly unsubscribeLocaleChange: () => void;
  private readonly state: StatsState;

  private dirty = false;
  private visible = false;
  private needsRender = true;
  private renderScheduled = false;

  constructor(storageKey = STATS_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.state = this.loadState();

    this.root = document.createElement('div');
    this.root.style.display = 'none';
    this.root.style.flex = '1';
    this.root.style.overflowY = 'auto';
    this.root.style.padding = '12px 14px 20px 14px';

    const summarySection = document.createElement('section');
    summarySection.style.display = 'flex';
    summarySection.style.flexDirection = 'column';
    summarySection.style.gap = '8px';

    this.summaryTitle = document.createElement('div');
    this.summaryTitle.style.fontSize = 'clamp(12px, 3vw, 13px)';
    this.summaryTitle.style.fontWeight = '700';
    this.summaryTitle.style.color = '#b5d8ff';
    this.summaryTitle.style.padding = '6px 4px';

    const metricGrid = document.createElement('div');
    metricGrid.style.display = 'grid';
    metricGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    metricGrid.style.gap = '9px';

    const distanceCard = this.createMetricCard();
    this.metricDistanceLabel = distanceCard.label;
    this.metricDistanceValue = distanceCard.value;

    const sampleCard = this.createMetricCard();
    this.metricSamplesLabel = sampleCard.label;
    this.metricSamplesValue = sampleCard.value;

    const achievementCard = this.createMetricCard();
    this.metricAchievementsLabel = achievementCard.label;
    this.metricAchievementsValue = achievementCard.value;

    const playTimeCard = this.createMetricCard();
    this.metricPlayTimeLabel = playTimeCard.label;
    this.metricPlayTimeValue = playTimeCard.value;

    metricGrid.append(
      distanceCard.card,
      sampleCard.card,
      achievementCard.card,
      playTimeCard.card,
    );

    summarySection.append(this.summaryTitle, metricGrid);

    const badgesSection = document.createElement('section');
    badgesSection.style.marginTop = '14px';
    badgesSection.style.display = 'flex';
    badgesSection.style.flexDirection = 'column';
    badgesSection.style.gap = '8px';

    this.badgesTitle = document.createElement('div');
    this.badgesTitle.style.fontSize = 'clamp(12px, 3vw, 13px)';
    this.badgesTitle.style.fontWeight = '700';
    this.badgesTitle.style.color = '#b5d8ff';
    this.badgesTitle.style.padding = '6px 4px';

    this.badgesGrid = document.createElement('div');
    this.badgesGrid.style.display = 'grid';
    this.badgesGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    this.badgesGrid.style.gap = '8px';

    badgesSection.append(this.badgesTitle, this.badgesGrid);
    this.root.append(summarySection, badgesSection);

    this.unsubscribeLocaleChange = onLocaleChange(() => {
      this.applyStaticTexts();
      this.requestRender();
    });

    this.applyStaticTexts();
    this.render();
  }

  getElement(): HTMLDivElement {
    return this.root;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.style.display = visible ? 'block' : 'none';
    if (visible) {
      this.requestRender();
    }
  }

  addWalkDistance(distanceMeters: number): void {
    const value = clampNonNegative(distanceMeters);
    if (value <= 0) {
      return;
    }
    this.state.totalWalkDistanceMeters += value;
    this.dirty = true;
    this.requestRender();
  }

  addCollectedSamples(count = 1): void {
    const value = Math.floor(clampNonNegative(count));
    if (value <= 0) {
      return;
    }
    this.state.samplesCollected += value;
    this.dirty = true;
    this.requestRender();
  }

  addPlayTime(deltaSeconds: number): void {
    const value = clampNonNegative(deltaSeconds);
    if (value <= 0) {
      return;
    }
    this.state.totalPlayTimeSeconds += value;
    this.dirty = true;
    this.requestRender();
  }

  setAchievementProgress(unlocked: number, total: number): void {
    const safeUnlocked = Math.max(0, Math.floor(unlocked));
    const safeTotal = Math.max(0, Math.floor(total));
    if (
      safeUnlocked === this.state.achievementsUnlocked &&
      safeTotal === this.state.achievementsTotal
    ) {
      return;
    }
    this.state.achievementsUnlocked = safeUnlocked;
    this.state.achievementsTotal = safeTotal;
    this.dirty = true;
    this.requestRender();
  }

  flush(force = false): void {
    if (!force && !this.dirty) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      this.dirty = false;
    } catch {
      // ignore storage failures
    }
  }

  dispose(): void {
    this.flush(true);
    this.unsubscribeLocaleChange();
    this.root.remove();
  }

  private createMetricCard(): {
    card: HTMLElement;
    label: HTMLDivElement;
    value: HTMLDivElement;
  } {
    const card = document.createElement('article');
    card.style.borderRadius = '9px';
    card.style.padding = '10px 11px';
    card.style.background = 'rgba(17, 27, 44, 0.55)';
    card.style.border = '1px solid rgba(147, 171, 210, 0.35)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '4px';

    const label = document.createElement('div');
    label.style.fontSize = 'clamp(10px, 2.6vw, 11px)';
    label.style.opacity = '0.78';

    const value = document.createElement('div');
    value.style.fontSize = 'clamp(15px, 3.9vw, 18px)';
    value.style.fontWeight = '700';
    value.style.color = '#eef6ff';

    card.append(label, value);
    return { card, label, value };
  }

  private applyStaticTexts(): void {
    this.summaryTitle.textContent = t('stats.summaryTitle');
    this.badgesTitle.textContent = t('stats.badges.title');
    this.metricDistanceLabel.textContent = t('stats.metric.distance');
    this.metricSamplesLabel.textContent = t('stats.metric.samples');
    this.metricAchievementsLabel.textContent = t('stats.metric.achievements');
    this.metricPlayTimeLabel.textContent = t('stats.metric.playTime');
  }

  private requestRender(): void {
    this.needsRender = true;
    if (!this.visible || this.renderScheduled) {
      return;
    }

    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.renderScheduled = false;
      if (!this.visible || !this.needsRender) {
        return;
      }
      this.render();
    });
  }

  private render(): void {
    this.needsRender = false;

    const distanceKm = this.state.totalWalkDistanceMeters / 1000;
    const distanceText = this.formatNumber(distanceKm, 2, 2);

    this.metricDistanceValue.textContent = t('stats.value.distanceKm', {
      value: distanceText,
    });
    this.metricSamplesValue.textContent = t('stats.value.samples', {
      value: this.formatNumber(this.state.samplesCollected),
    });

    const achievementRatio = getAchievementRatio(this.state);
    const achievementPercent = Math.min(100, Math.max(0, achievementRatio * 100));
    this.metricAchievementsValue.textContent = t('stats.value.achievements', {
      percent: this.formatNumber(achievementPercent, 0),
      unlocked: this.formatNumber(this.state.achievementsUnlocked),
      total: this.formatNumber(this.state.achievementsTotal),
    });

    this.metricPlayTimeValue.textContent = t('stats.value.playTime', {
      value: this.formatPlayTime(this.state.totalPlayTimeSeconds),
    });

    this.badgesGrid.innerHTML = '';
    for (const badge of BADGES) {
      this.badgesGrid.appendChild(this.createBadge(badge));
    }
  }

  private createBadge(definition: BadgeDefinition): HTMLElement {
    const unlocked = definition.unlocked(this.state);

    const badge = document.createElement('article');
    badge.style.borderRadius = '9px';
    badge.style.padding = '9px 10px';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '8px';
    badge.style.border = unlocked
      ? '1px solid rgba(123, 236, 180, 0.65)'
      : '1px solid rgba(147, 171, 210, 0.35)';
    badge.style.background = unlocked
      ? 'rgba(15, 44, 36, 0.42)'
      : 'rgba(17, 27, 44, 0.55)';

    const icon = document.createElement('div');
    icon.textContent = definition.icon;
    icon.style.width = '26px';
    icon.style.height = '26px';
    icon.style.borderRadius = '50%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.background = unlocked
      ? 'rgba(122, 245, 183, 0.2)'
      : 'rgba(138, 188, 255, 0.18)';
    icon.style.border = unlocked
      ? '1px solid rgba(122, 245, 183, 0.75)'
      : '1px solid rgba(138, 188, 255, 0.45)';

    const body = document.createElement('div');
    body.style.minWidth = '0';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '2px';

    const title = document.createElement('div');
    title.textContent = t(definition.titleKey);
    title.style.fontSize = 'clamp(11px, 2.8vw, 12px)';
    title.style.fontWeight = '700';

    const status = document.createElement('div');
    status.textContent = unlocked
      ? t('stats.badge.unlocked')
      : t('stats.badge.locked');
    status.style.fontSize = 'clamp(10px, 2.6vw, 11px)';
    status.style.opacity = '0.8';

    body.append(title, status);
    badge.append(icon, body);
    return badge;
  }

  private formatPlayTime(totalSecondsRaw: number): string {
    const totalSeconds = Math.max(0, Math.floor(totalSecondsRaw));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${this.pad2(minutes)}:${this.pad2(seconds)}`;
    }
    return `${minutes}:${this.pad2(seconds)}`;
  }

  private pad2(value: number): string {
    return String(value).padStart(2, '0');
  }

  private formatNumber(
    value: number,
    minimumFractionDigits = 0,
    maximumFractionDigits = minimumFractionDigits,
  ): string {
    return new Intl.NumberFormat(getLocale(), {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(value);
  }

  private loadState(): StatsState {
    const fallback: StatsState = {
      version: 1,
      totalWalkDistanceMeters: 0,
      samplesCollected: 0,
      totalPlayTimeSeconds: 0,
      achievementsUnlocked: 0,
      achievementsTotal: 0,
    };

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw) as Partial<StatsState>;
      if (parsed.version !== 1) {
        return fallback;
      }

      return {
        version: 1,
        totalWalkDistanceMeters: clampNonNegative(parsed.totalWalkDistanceMeters ?? 0),
        samplesCollected: Math.floor(clampNonNegative(parsed.samplesCollected ?? 0)),
        totalPlayTimeSeconds: clampNonNegative(parsed.totalPlayTimeSeconds ?? 0),
        achievementsUnlocked: Math.floor(clampNonNegative(parsed.achievementsUnlocked ?? 0)),
        achievementsTotal: Math.floor(clampNonNegative(parsed.achievementsTotal ?? 0)),
      };
    } catch {
      return fallback;
    }
  }
}
