import type { IDisposable } from '../core/types';
import {
  type AchievementStatus,
  type AchievementManager,
} from '../achievement/AchievementManager';
import type { AchievementCategory } from '../achievement/AchievementData';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  exploration: '探索成就',
  discovery: '发现成就',
  challenge: '挑战成就',
};

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

export class AchievementPanel implements IDisposable {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly content: HTMLDivElement;
  private readonly manager: AchievementManager;
  private readonly unsubscribe: () => void;
  private visible = false;
  private closeTimer = 0;

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

    const header = document.createElement('div');
    header.style.padding = '18px 18px 12px 18px';
    header.style.borderBottom = '1px solid rgba(130, 177, 255, 0.28)';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.gap = '10px';

    const headerLeft = document.createElement('div');
    headerLeft.style.minWidth = '0';

    const title = document.createElement('div');
    title.textContent = '成就';
    title.style.fontSize = '22px';
    title.style.fontWeight = '700';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Press Tab to close';
    subtitle.style.marginTop = '4px';
    subtitle.style.fontSize = '12px';
    subtitle.style.opacity = '0.75';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = '✕';
    closeButton.setAttribute('aria-label', 'Close achievement panel');
    closeButton.style.width = '28px';
    closeButton.style.height = '28px';
    closeButton.style.borderRadius = '8px';
    closeButton.style.border = '1px solid rgba(148, 196, 255, 0.55)';
    closeButton.style.background = 'rgba(10, 23, 42, 0.95)';
    closeButton.style.color = '#eef6ff';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '14px';
    closeButton.style.lineHeight = '1';
    closeButton.addEventListener('click', () => this.close());

    headerLeft.append(title, subtitle);
    header.append(headerLeft, closeButton);

    this.content = document.createElement('div');
    this.content.style.flex = '1';
    this.content.style.overflowY = 'auto';
    this.content.style.padding = '12px 14px 20px 14px';
    this.content.style.display = 'flex';
    this.content.style.flexDirection = 'column';
    this.content.style.gap = '12px';

    this.panel.append(header, this.content);
    this.root.appendChild(this.panel);
    document.body.appendChild(this.root);

    this.unsubscribe = this.manager.onChange((statuses) => {
      if (this.visible) {
        this.render(statuses);
      }
    });
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
    this.render(this.manager.getStatuses());
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
    this.panel.style.transform = 'translateX(100%)';
    window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      if (!this.visible) {
        this.root.style.display = 'none';
      }
    }, 240);
  }

  dispose(): void {
    this.unsubscribe();
    window.clearTimeout(this.closeTimer);
    this.root.remove();
  }

  private render(statuses: AchievementStatus[]): void {
    this.content.innerHTML = '';
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
      heading.textContent = CATEGORY_LABELS[category];
      heading.style.fontSize = '13px';
      heading.style.fontWeight = '700';
      heading.style.color = '#b5d8ff';
      heading.style.padding = '6px 4px';
      section.appendChild(heading);

      for (const status of group) {
        section.appendChild(this.createCard(status));
      }

      this.content.appendChild(section);
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
    name.style.fontSize = '14px';
    name.style.fontWeight = '700';

    left.append(icon, name);

    const badge = document.createElement('span');
    badge.textContent = status.unlocked ? '已解锁' : '未解锁';
    badge.style.fontSize = '11px';
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
    desc.style.fontSize = '12px';
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
    progressText.style.fontSize = '11px';
    progressText.style.opacity = '0.82';

    card.append(row, desc, progressTrack, progressText);

    if (status.unlockedAt) {
      const unlockedAt = document.createElement('div');
      unlockedAt.textContent = `解锁时间: ${new Date(status.unlockedAt).toLocaleString()}`;
      unlockedAt.style.fontSize = '11px';
      unlockedAt.style.opacity = '0.72';
      card.appendChild(unlockedAt);
    }

    return card;
  }
}
