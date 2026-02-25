import * as THREE from 'three';
import type { PlanetLandmark } from '../planet/PlanetConfig';
import { geoToCartesian } from '../utils/geo';

/**
 * 地标3D标记：Sprite Billboard悬浮在地标上方
 */
export class LandmarkMarker {
  readonly landmark: PlanetLandmark;
  readonly sprite: THREE.Sprite;
  readonly position: THREE.Vector3;
  private readonly label: THREE.Sprite;
  readonly group: THREE.Group;

  constructor(landmark: PlanetLandmark, radius: number) {
    this.landmark = landmark;
    this.position = geoToCartesian(landmark.lat, landmark.lng, radius);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // 标记点 — 发光小球
    const pinMap = this.createPinTexture();
    const pinMat = new THREE.SpriteMaterial({ map: pinMap, depthTest: false, transparent: true });
    this.sprite = new THREE.Sprite(pinMat);
    this.sprite.scale.set(radius * 0.008, radius * 0.008, 1);
    // 沿法线方向抬高
    const normal = this.position.clone().normalize();
    this.sprite.position.copy(normal.multiplyScalar(radius * 0.015));
    this.group.add(this.sprite);

    // 文字标签
    const labelMap = this.createLabelTexture(landmark.name);
    const labelMat = new THREE.SpriteMaterial({ map: labelMap, depthTest: false, transparent: true });
    this.label = new THREE.Sprite(labelMat);
    this.label.scale.set(radius * 0.025, radius * 0.008, 1);
    const labelOffset = this.position.clone().normalize().multiplyScalar(radius * 0.025);
    this.label.position.copy(labelOffset);
    this.group.add(this.label);
  }

  /** 生成标记点纹理 */
  private createPinTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 发光圆点
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 200, 50, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 150, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /** 生成文字标签纹理 */
  private createLabelTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.roundRect(0, 0, 256, 64, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    return new THREE.CanvasTexture(canvas);
  }

  /** 设置可见性（基于距离） */
  setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  /** 设置透明度（基于距离淡入淡出） */
  setOpacity(opacity: number): void {
    (this.sprite.material as THREE.SpriteMaterial).opacity = opacity;
    (this.label.material as THREE.SpriteMaterial).opacity = opacity;
  }

  dispose(): void {
    (this.sprite.material as THREE.SpriteMaterial).map?.dispose();
    (this.sprite.material as THREE.SpriteMaterial).dispose();
    (this.label.material as THREE.SpriteMaterial).map?.dispose();
    (this.label.material as THREE.SpriteMaterial).dispose();
  }
}
