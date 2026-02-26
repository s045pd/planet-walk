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
  private readonly frustum = new THREE.Frustum();
  private readonly viewProjection = new THREE.Matrix4();
  private readonly cameraForward = new THREE.Vector3();
  private readonly cameraUp = new THREE.Vector3();
  private readonly toMarker = new THREE.Vector3();
  private readonly markerWorld = new THREE.Vector3();
  private readonly markerNormal = new THREE.Vector3();
  private readonly onDocumentClick = (event: MouseEvent): void => this.onClick(event);
  private radius = 0;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.infoCard = new InfoCard();
    document.addEventListener('click', this.onDocumentClick);
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
    this.camera.updateMatrixWorld();
    this.viewProjection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.viewProjection);
    this.camera.getWorldDirection(this.cameraForward);
    this.cameraUp.copy(cameraPosition).normalize();

    for (const marker of this.markers) {
      marker.group.getWorldPosition(this.markerWorld);
      const dist = cameraPosition.distanceTo(this.markerWorld);
      const maxDist = this.radius * 0.45;
      if (dist > maxDist) {
        marker.setVisible(false);
        continue;
      }

      // 地标必须位于相机可见半球（地表附近），避免抬头看天空出现漂浮文字
      this.markerNormal.copy(this.markerWorld).normalize();
      const surfaceFacing = this.markerNormal.dot(this.cameraUp);
      if (surfaceFacing < 0.12) {
        marker.setVisible(false);
        continue;
      }

      // 地标需要在当前视锥内且位于视线前方
      if (!this.frustum.containsPoint(this.markerWorld)) {
        marker.setVisible(false);
        continue;
      }

      this.toMarker.copy(this.markerWorld).sub(cameraPosition);
      const toMarkerLength = this.toMarker.length();
      if (toMarkerLength <= 1e-6) {
        marker.setVisible(false);
        continue;
      }
      this.toMarker.divideScalar(toMarkerLength);
      const viewFacing = this.cameraForward.dot(this.toMarker);
      if (viewFacing < 0.05) {
        marker.setVisible(false);
        continue;
      }

      marker.setVisible(true);
      const distanceFade = 1 - (dist / maxDist) * 0.7;
      const viewFade = THREE.MathUtils.smoothstep(viewFacing, 0.05, 0.45);
      marker.setOpacity(Math.max(0.2, distanceFade * viewFade));
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
    document.removeEventListener('click', this.onDocumentClick);
  }
}
