import * as THREE from 'three';
import type { PlayerState } from '../player/PlayerState';
import { clamp } from '../utils/math';

/** 第三人称相机：围绕玩家头部的球坐标跟随 */
export class ThirdPersonMode {
  readonly camera: THREE.PerspectiveCamera;

  distance = 8;
  minDistance = 3;
  maxDistance = 25;
  pitch = 0.3;
  yaw = 0;
  eyeHeight = 1.85;
  sensitivity = 0.002;
  zoomSpeed = 0.0018;

  private readonly _anchor = new THREE.Vector3();
  private readonly _offset = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _lookTarget = new THREE.Vector3();
  private readonly _worldForward = new THREE.Vector3(0, 0, -1);
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);
  private readonly _worldRight = new THREE.Vector3(1, 0, 0);

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  applyMouseDelta(dx: number, dy: number): void {
    this.yaw -= dx * this.sensitivity;
    this.pitch = clamp(this.pitch - dy * this.sensitivity, -1.2, 1.2);
  }

  applyZoom(delta: number): void {
    const scale = Math.exp(delta * this.zoomSpeed);
    this.distance = clamp(this.distance * scale, this.minDistance, this.maxDistance);
  }

  update(state: PlayerState): void {
    this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
    this._anchor.copy(state.position).addScaledVector(state.up, this.eyeHeight);

    this._forward
      .copy(this._worldForward)
      .applyQuaternion(state.quaternion)
      .addScaledVector(state.up, -this._forward.dot(state.up));
    if (this._forward.lengthSq() < 1e-8) {
      this.camera.getWorldDirection(this._forward);
      this._forward.addScaledVector(state.up, -this._forward.dot(state.up));
      if (this._forward.lengthSq() < 1e-8) {
        this._forward.crossVectors(this._worldUp, state.up);
      }
      if (this._forward.lengthSq() < 1e-8) {
        this._forward.crossVectors(this._worldRight, state.up);
      }
      if (this._forward.lengthSq() < 1e-8) {
        this._forward.set(0, 0, -1);
      }
    }
    this._forward.normalize();
    this._right.crossVectors(this._forward, state.up).normalize();

    const horizontalDistance = this.distance * Math.cos(this.pitch);
    this._offset
      .copy(this._forward)
      .multiplyScalar(-Math.cos(this.yaw) * horizontalDistance)
      .addScaledVector(this._right, Math.sin(this.yaw) * horizontalDistance)
      .addScaledVector(state.up, this.distance * Math.sin(this.pitch));

    this.camera.position.copy(this._anchor).add(this._offset);
    this.camera.up.copy(state.up);
    this._lookTarget.copy(state.position).addScaledVector(state.up, this.eyeHeight);
    this.camera.lookAt(this._lookTarget);
  }
}
