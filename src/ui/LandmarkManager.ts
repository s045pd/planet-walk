import * as THREE from 'three';
import type { PlanetConfig } from '../planet/PlanetConfig';
import { LandmarkMarker } from './LandmarkMarker';
import { InfoCard } from './InfoCard';

/**
 * 地标管理器：管理所有POI标记、距离计算、点击交互
 */
export class LandmarkManager {
  private markers: LandmarkMarker[] = [];
  private readonly infoCard: InfoCard;
  private readonly mouse = new THREE.Vector2();
  private readonly camera: THREE.Camera;
  private radius = 0;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.infoCard = new InfoCard();
    document.addEventListener('click', this.onClick.bind(this));
  }

  /** 加载星球的地标数据 */
  loadPlanet(config: PlanetConfig, parent: THREE.Object3D): void {
    this.clear();
    this.radius = config.radius;

    for (const landmark of config.landmarks) {
      const marker = new LandmarkMarker(landmark, config.radius);
      this.markers.push(marker);
      parent.add(marker.group);
    }
  }

  /** 每帧更新：根据相机距离控制可见性和透明度 */
  update(cameraPosition: THREE.Vector3): void {
    for (const marker of this.markers) {
      const dist = cameraPosition.distanceTo(marker.position);
      const maxDist = this.radius * 0.5;

      if (dist > maxDist) {
        marker.setVisible(false);
      } else {
        marker.setVisible(true);
        const opacity = 1 - (dist / maxDist) * 0.7;
        marker.setOpacity(Math.max(0.3, opacity));
      }
    }
  }

  /** 获取最近地标及距离 */
  getNearest(position: THREE.Vector3): { name: string; distance: number } | null {
    let nearest: LandmarkMarker | null = null;
    let minDist = Infinity;

    for (const marker of this.markers) {
      const dist = position.distanceTo(marker.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = marker;
      }
    }

    return nearest ? { name: nearest.landmark.name, distance: minDist } : null;
  }

  /** 点击检测 */
  private onClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 检查是否点击了某个标记的sprite
    const sprites = this.markers
      .filter((m) => m.group.visible)
      .map((m) => m.sprite);

    if (sprites.length === 0) return;

    // 简单的屏幕距离检测（sprite没有geometry，用投影位置）
    for (const marker of this.markers) {
      if (!marker.group.visible) continue;
      const screenPos = marker.position.clone().project(this.camera);
      const dx = screenPos.x - this.mouse.x;
      const dy = screenPos.y - this.mouse.y;
      if (Math.sqrt(dx * dx + dy * dy) < 0.05) {
        const lm = marker.landmark;
        this.infoCard.show(
          lm.name,
          lm.description || '',
          lm.lat,
          lm.lng,
          event.clientX,
          event.clientY,
        );
        return;
      }
    }
  }

  /** 清除所有标记 */
  private clear(): void {
    for (const marker of this.markers) {
      marker.group.parent?.remove(marker.group);
      marker.dispose();
    }
    this.markers = [];
    this.infoCard.hide();
  }

  dispose(): void {
    this.clear();
    this.infoCard.dispose();
    document.removeEventListener('click', this.onClick.bind(this));
  }
}