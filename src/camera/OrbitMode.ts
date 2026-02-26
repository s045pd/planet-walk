import * as THREE from 'three';
import type { IDisposable, IUpdatable } from '../core/types';
import { clamp } from '../utils/math';

export interface OrbitModeConfig {
  camera: THREE.PerspectiveCamera;
  domElement: HTMLElement;
  target?: THREE.Vector3;
  minDistance?: number;
  maxDistance?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  damping?: number;
}

/** 轨道相机模式：左键拖拽旋转，滚轮缩放，阻尼平滑 */
export class OrbitMode implements IUpdatable, IDisposable {
  readonly camera: THREE.PerspectiveCamera;
  readonly domElement: HTMLElement;

  enabled = false;
  rotateSpeed: number;
  zoomSpeed: number;
  damping: number;
  minDistance: number;
  maxDistance: number;

  private readonly _target = new THREE.Vector3();
  private readonly _spherical = new THREE.Spherical();
  private readonly _offset = new THREE.Vector3();

  private _distance = 1;
  private _phi = Math.PI * 0.5;
  private _theta = 0;

  private _targetDistance = 1;
  private _targetPhi = Math.PI * 0.5;
  private _targetTheta = 0;

  private _isDragging = false;
  private _lastMouseX = 0;
  private _lastMouseY = 0;

  constructor(config: OrbitModeConfig) {
    this.camera = config.camera;
    this.domElement = config.domElement;
    this.rotateSpeed = (config.rotateSpeed ?? 0.005) * 3;
    this.zoomSpeed = config.zoomSpeed ?? 0.0018;
    this.damping = config.damping ?? 10;
    this.minDistance = config.minDistance ?? 10;
    this.maxDistance = config.maxDistance ?? 10000;
    this._target.copy(config.target ?? new THREE.Vector3(0, 0, 0));

    this.syncFromCamera();
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }
    this.enabled = enabled;
    this._isDragging = false;
    if (enabled) {
      this.syncFromCamera();
    }
  }

  setTarget(target: THREE.Vector3): void {
    this._target.copy(target);
    this.syncFromCamera();
  }

  setDistanceLimits(minDistance: number, maxDistance: number): void {
    const clampedMin = Math.max(0.1, minDistance);
    const clampedMax = Math.max(clampedMin, maxDistance);
    this.minDistance = clampedMin;
    this.maxDistance = clampedMax;
    this._distance = clamp(this._distance, clampedMin, clampedMax);
    this._targetDistance = clamp(this._targetDistance, clampedMin, clampedMax);
  }

  syncFromCamera(): void {
    this._offset.copy(this.camera.position).sub(this._target);
    if (this._offset.lengthSq() < 1e-8) {
      this._offset.set(0, 0, 1);
    }
    this._spherical.setFromVector3(this._offset);
    this._distance = clamp(this._spherical.radius, this.minDistance, this.maxDistance);
    this._phi = clamp(this._spherical.phi, 1e-3, Math.PI - 1e-3);
    this._theta = this._spherical.theta;
    this._targetDistance = this._distance;
    this._targetPhi = this._phi;
    this._targetTheta = this._theta;
    this.updateCameraTransform();
  }

  update(delta: number): void {
    if (!this.enabled) return;

    const alpha = 1 - Math.exp(-this.damping * Math.max(delta, 0));
    this._distance += (this._targetDistance - this._distance) * alpha;
    this._phi += (this._targetPhi - this._phi) * alpha;
    this._theta += (this._targetTheta - this._theta) * alpha;
    this._phi = clamp(this._phi, 1e-3, Math.PI - 1e-3);
    this.updateCameraTransform();
  }

  private updateCameraTransform(): void {
    this._spherical.radius = this._distance;
    this._spherical.phi = this._phi;
    this._spherical.theta = this._theta;
    this._offset.setFromSpherical(this._spherical);
    this.camera.position.copy(this._target).add(this._offset);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this._target);
  }

  private onMouseDown = (event: MouseEvent): void => {
    if (!this.enabled || event.button !== 0) return;
    this._isDragging = true;
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this._isDragging) return;
    const dx = event.clientX - this._lastMouseX;
    const dy = event.clientY - this._lastMouseY;
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;

    this._targetTheta -= dx * this.rotateSpeed;
    this._targetPhi = clamp(
      this._targetPhi + dy * this.rotateSpeed,
      1e-3,
      Math.PI - 1e-3,
    );
  };

  private onMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      this._isDragging = false;
    }
  };

  private onWheel = (event: WheelEvent): void => {
    if (!this.enabled) return;
    event.preventDefault();
    const scale = Math.exp(event.deltaY * this.zoomSpeed);
    this._targetDistance = clamp(
      this._targetDistance * scale,
      this.minDistance,
      this.maxDistance,
    );
  };

  dispose(): void {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}
