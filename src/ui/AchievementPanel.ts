import type { IDisposable } from '../core/types';
import {
  type AchievementStatus,
  type AchievementManager,
} from '../achievement/AchievementManager';
import type { AchievementCategory } from '../achievement/AchievementData';
import { getLocale, onLocaleChange, t } from '../i18n';
import { StatsPanel } from './StatsPanel';

const ICON_EMOJI: Record<string, string> = {
  planet: '🪐',
  orbit: '🌍',
  boots: '🥾',
  summit: '⛰️',
  depth: '⬇️',
  scan: '🔬',
  sample: '🧪',
  secret: '🗝️',
  streak: '🏃',
  camera: '📷',
  weather: '🌦️',
};

type PanelTab = 'achievements' | 'stats';

export class AchievementPanel implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly content: HTMLDivElement;
  private readonly achievementContent: HTMLDivElement;
  private readonly title: HTMLDivElement;
  private readonly subtitle: HTMLDivElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly achievementsTabButton: HTMLButtonElement;
  private readonly statsTabButton: HTMLButtonElement;
  private readonly manager: AchievementManager;
  private readonly statsPanel: StatsPanel;
  private readonly unsubscribe: () => void;
  private readonly unsubscribeLocaleChange: () => void;

  private visible = false;
  private closeTimer = 0;
  private activeTab: PanelTab = 'achievements';
  private latestStatuses: AchievementStatus[] = [];

  constructor(manager: AchievementManager) {
    this.manager = manager;

    this.root = document.createElement('div');
    this.root.style.position = 'fixed';
    this.root.style.inset = '0';
    this.root.style.background = 'rgba(0, 0, 0, 0.45)';
    this.root.style.zIndex = '115';
    this.root.style.display = 'none';
    this.root.style.pointerEvents = 'auto';
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) {
        this.close();
      }
    });

    this.panel = document.createElement('div');
    this.panel.style.position = 'absolute';
    this.panel.style.top = '0';
    this.panel.style.right = '0';
    this.panel.style.height = '100%';
    this.panel.style.width = 'min(460px, 92vw)';
    this.panel.style.transform = 'translateX(100%)';
    this.panel.style.transition = 'transform 0.24s ease';
    this.panel.style.background =
      'linear-gradient(180deg, rgba(8, 20, 40, 0.96), rgba(7, 14, 28, 0.96))';
    this.panel.style.borderLeft = '1px solid rgba(157, 201, 255, 0.4)';
    this.panel.style.boxShadow = '-16px 0 32px rgba(0, 0, 0, 0.35)';
    this.panel.style.display = 'flex';
    this.panel.style.flexDirection = 'column';
    this.panel.style.color = '#eaf4ff';
    this.panel.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    this.panel.style.maxHeight = '100%';
    this.panel.style.overflow = 'hidden';

    const header = document.createElement('div');
    header.style.padding = '18px 18px 12px 18px';
    header.style.borderBottom = '1px solid rgba(130, 177, 255, 0.28)';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.gap = '10px';

    const headerLeft = document.createElement('div');
    headerLeft.style.minWidth = '0';

    this.title = document.createElement('div');
    this.title.style.fontSize = 'clamp(18px, 4.8vw, 22px)';
    this.title.style.fontWeight = '700';

    this.subtitle = document.createElement('div');
    this.subtitle.style.marginTop = '4px';
    this.subtitle.style.fontSize = 'clamp(11px, 2.8vw, 12px)';
    this.subtitle.style.opacity = '0.75';

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.textContent = '✕';
    this.closeButton.style.width = '44px';
    this.closeButton.style.height = '44px';
    this.closeButton.style.borderRadius = '8px';
    this.closeButton.style.border = '1px solid rgba(148, 196, 255, 0.55)';
    this.closeButton.style.background = 'rgba(10, 23, 42, 0.95)';
    this.closeButton.style.color = '#eef6ff';
    this.closeButton.style.cursor = 'pointer';
    this.closeButton.style.fontSize = 'clamp(13px, 3.4vw, 14px)';
    this.closeButton.style.lineHeight = '1';
    this.closeButton.addEventListener('click', () => this.close());

    headerLeft.append(this.title, this.subtitle);
    header.append(headerLeft, this.closeButton);

    const tabBar = document.createElement('div');
    tabBar.style.display = 'flex';
    tabBar.style.gap = '8px';
    tabBar.style.padding = '10px 14px';
    tabBar.style.borderBottom = '1px solid rgba(130, 177, 255, 0.2)';

    this.achievementsTabButton = this.createTabButton(() => {
      this.setActiveTab('achievements');
    });
    this.statsTabButton = this.createTabButton(() => {
      this.setActiveTab('stats');
    });

    tabBar.append(this.achievementsTabButton, this.statsTabButton);

    this.content = document.createElement('div');
    this.content.style.flex = '1';
    this.content.style.overflow = 'hidden';

    this.achievementContent = document.createElement('div');
    this.achievementContent.style.height = '100%';
    this.achievementContent.style.overflowY = 'auto';
    this.achievementContent.style.padding = '12px 14px 20px 14px';
    this.achievementContent.style.display = 'flex';
    this.achievementContent.style.flexDirection = 'column';
    this.achievementContent.style.gap = '12px';

    this.statsPanel = new StatsPanel();
    this.statsPanel.setVisible(false);

    this.content.append(this.achievementContent, this.statsPanel.getElement());

    this.panel.append(header, tabBar, this.content);
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);
    this.applyResponsiveLayout();
    window.addEventListener('resize', this.onResize);

    this.unsubscribe = this.manager.onChange((statuses) => {
      this.latestStatuses = statuses;
      const unlockedCount = statuses.filter((status) => status.unlocked).length;
      this.statsPanel.setAchievementProgress(unlockedCount, statuses.length);

      if (this.visible && this.activeTab === 'achievements') {
        this.renderAchievements(statuses);
      }
    });

    this.unsubscribeLocaleChange = onLocaleChange(() => {
      this.applyStaticTexts();
      if (this.visible && this.activeTab === 'achievements') {
        this.renderAchievements(this.latestStatuses);
      }
    });

    this.applyStaticTexts();
    this.updateTabUI();
  }

  get isOpen(): boolean {
    return this.visible;
  }

  toggle(): void {
    if (this.visible) {
      this.close();
      return;
    }
    this.open();
  }

  open(): void {
    if (this.visible) {
      return;
    }
    this.visible = true;
    if (this.activeTab === 'achievements') {
      this.renderAchievements(this.latestStatuses.length > 0 ? this.latestStatuses : this.manager.getStatuses());
    }
    this.updateTabUI();
    this.root.style.display = 'block';
    this.panel.style.transform = 'translateX(100%)';
    requestAnimationFrame(() => {
      this.panel.style.transform = 'translateX(0)';
    });
  }

  close(): void {
    if (!this.visible) {
      return;
    }
    this.visible = false;
    this.statsPanel.setVisible(false);
    this.panel.style.transform = 'translateX(100%)';
    window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      if (!this.visible) {
        this.root.style.display = 'none';
      }
    }, 240);
  }

  addWalkDistance(distanceMeters: number): void {
    this.statsPanel.addWalkDistance(distanceMeters);
  }

  addCollectedSamples(count = 1): void {
    this.statsPanel.addCollectedSamples(count);
  }

  addPlayTime(deltaSeconds: number): void {
    this.statsPanel.addPlayTime(deltaSeconds);
  }

  saveStats(force = false): void {
    this.statsPanel.flush(force);
  }

  dispose(): void {
    this.unsubscribe();
    this.unsubscribeLocaleChange();
    window.clearTimeout(this.closeTimer);
    window.removeEventListener('resize', this.onResize);
    this.statsPanel.dispose();
    this.root.remove();
  }

  private createTabButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.style.flex = '1';
    button.style.borderRadius = '8px';
    button.style.padding = '8px 10px';
    button.style.fontSize = 'clamp(12px, 3vw, 13px)';
    button.style.fontWeight = '700';
    button.style.cursor = 'pointer';
    button.style.border = '1px solid rgba(141, 173, 222, 0.45)';
    button.style.background = 'rgba(17, 27, 44, 0.55)';
    button.style.color = '#d9e8ff';
    button.addEventListener('click', onClick);
    return button;
  }

  private setActiveTab(tab: PanelTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.updateTabUI();
  }

  private updateTabUI(): void {
    const achievementActive = this.activeTab === 'achievements';
    this.achievementContent.style.display = achievementActive ? 'flex' : 'none';
    this.statsPanel.setVisible(this.visible && !achievementActive);

    if (achievementActive && this.visible) {
      this.renderAchievements(this.latestStatuses);
    }

    this.applyTabButtonStyle(this.achievementsTabButton, achievementActive);
    this.applyTabButtonStyle(this.statsTabButton, !achievementActive);
    this.achievementsTabButton.setAttribute('aria-pressed', String(achievementActive));
    this.statsTabButton.setAttribute('aria-pressed', String(!achievementActive));
  }

  private applyTabButtonStyle(button: HTMLButtonElement, active: boolean): void {
    button.style.background = active
      ? 'rgba(122, 245, 183, 0.2)'
      : 'rgba(17, 27, 44, 0.55)';
    button.style.color = active ? '#e9fff5' : '#d9e8ff';
    button.style.border = active
      ? '1px solid rgba(122, 245, 183, 0.75)'
      : '1px solid rgba(141, 173, 222, 0.45)';
  }

  private renderAchievements(statuses: AchievementStatus[]): void {
    this.achievementContent.innerHTML = '';
    const categories: AchievementCategory[] = ['exploration', 'discovery', 'challenge'];

    for (const category of categories) {
      const group = statuses.filter((status) => status.definition.category === category);
      if (group.length === 0) {
        continue;
      }

      const section = document.createElement('section');
      section.style.display = 'flex';
      section.style.flexDirection = 'column';
      section.style.gap = '8px';

      const heading = document.createElement('div');
      heading.textContent = t(`achievementPanel.category.${category}`);
      heading.style.fontSize = 'clamp(12px, 3vw, 13px)';
      heading.style.fontWeight = '700';
      heading.style.color = '#b5d8ff';
      heading.style.padding = '6px 4px';
      section.appendChild(heading);

      for (const status of group) {
        section.appendChild(this.createCard(status));
      }

      this.achievementContent.appendChild(section);
    }
  }

  private createCard(status: AchievementStatus): HTMLElement {
    const card = document.createElement('article');
    card.style.padding = '10px 11px';
    card.style.borderRadius = '9px';
    card.style.border = status.unlocked
      ? '1px solid rgba(123, 236, 180, 0.65)'
      : '1px solid rgba(147, 171, 210, 0.35)';
    card.style.background = status.unlocked
      ? 'rgba(15, 44, 36, 0.42)'
      : 'rgba(17, 27, 44, 0.55)';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '7px';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.gap = '8px';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '8px';

    const icon = document.createElement('div');
    icon.textContent = ICON_EMOJI[status.definition.icon] ?? '🏆';
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.borderRadius = '50%';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.fontSize = '16px';
    icon.style.background = 'rgba(138, 188, 255, 0.18)';
    icon.style.border = '1px solid rgba(138, 188, 255, 0.45)';

    const name = document.createElement('div');
    name.textContent = status.definition.name;
    name.style.fontSize = 'clamp(13px, 3.3vw, 14px)';
    name.style.fontWeight = '700';

    left.append(icon, name);

    const badge = document.createElement('span');
    badge.textContent = status.unlocked
      ? t('achievementPanel.badge.unlocked')
      : t('achievementPanel.badge.locked');
    badge.style.fontSize = 'clamp(10px, 2.6vw, 11px)';
    badge.style.padding = '2px 7px';
    badge.style.borderRadius = '999px';
    badge.style.color = status.unlocked ? '#072114' : '#d9e8ff';
    badge.style.background = status.unlocked
      ? 'rgba(122, 245, 183, 0.85)'
      : 'rgba(141, 173, 222, 0.25)';
    badge.style.border = status.unlocked
      ? '1px solid rgba(122, 245, 183, 0.95)'
      : '1px solid rgba(141, 173, 222, 0.45)';

    row.append(left, badge);

    const desc = document.createElement('div');
    desc.textContent = status.definition.description;
    desc.style.fontSize = 'clamp(11px, 3vw, 12px)';
    desc.style.opacity = '0.9';

    const progressTrack = document.createElement('div');
    progressTrack.style.height = '7px';
    progressTrack.style.borderRadius = '999px';
    progressTrack.style.overflow = 'hidden';
    progressTrack.style.background = 'rgba(95, 124, 173, 0.32)';

    const progressFill = document.createElement('div');
    progressFill.style.height = '100%';
    progressFill.style.width = `${Math.round(status.progress.ratio * 100)}%`;
    progressFill.style.background = status.unlocked
      ? 'linear-gradient(90deg, #8dfac7, #4cd39a)'
      : 'linear-gradient(90deg, #9ec8ff, #6e9bff)';
    progressTrack.appendChild(progressFill);

    const progressText = document.createElement('div');
    progressText.textContent = status.progress.text;
    progressText.style.fontSize = 'clamp(10px, 2.6vw, 11px)';
    progressText.style.opacity = '0.82';

    card.append(row, desc, progressTrack, progressText);

    if (status.unlockedAt) {
      const unlockedAt = document.createElement('div');
      unlockedAt.textContent = t('achievementPanel.unlockedAt', {
        time: new Date(status.unlockedAt).toLocaleString(getLocale()),
      });
      unlockedAt.style.fontSize = 'clamp(10px, 2.6vw, 11px)';
      unlockedAt.style.opacity = '0.72';
      card.appendChild(unlockedAt);
    }

    return card;
  }

  private onResize = (): void => {
    this.applyResponsiveLayout();
  };

  private applyResponsiveLayout(): void {
    const compactViewport = window.innerWidth <= 600 || window.innerHeight <= 700;
    if (compactViewport) {
      this.panel.style.top = 'max(8px, env(safe-area-inset-top))';
      this.panel.style.right = '8px';
      this.panel.style.height = 'auto';
      this.panel.style.maxHeight = '80vh';
      this.panel.style.width = 'min(460px, calc(100vw - 16px))';
      this.panel.style.borderRadius = '12px';
      this.panel.style.border = '1px solid rgba(157, 201, 255, 0.4)';
      return;
    }

    this.panel.style.top = '0';
    this.panel.style.right = '0';
    this.panel.style.height = '100%';
    this.panel.style.maxHeight = '100%';
    this.panel.style.width = 'min(460px, 92vw)';
    this.panel.style.borderRadius = '0';
    this.panel.style.border = 'none';
    this.panel.style.borderLeft = '1px solid rgba(157, 201, 255, 0.4)';
  }

  private applyStaticTexts(): void {
    this.title.textContent = t('achievementPanel.title');
    this.subtitle.textContent = t('achievementPanel.subtitle');
    this.closeButton.setAttribute('aria-label', t('achievementPanel.closeAria'));
    this.achievementsTabButton.textContent = t('achievementPanel.tab.achievements');
    this.statsTabButton.textContent = t('achievementPanel.tab.stats');
  }
}
