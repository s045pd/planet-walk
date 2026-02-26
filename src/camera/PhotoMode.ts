import * as THREE from 'three';
import type { IUpdatable } from '../core/types';
import type { InputManager } from '../core/InputManager';
import { clamp } from '../utils/math';

export interface PhotoModeConfig {
  camera: THREE.PerspectiveCamera;
  input: InputManager;
  moveSpeed?: number;
  lookSensitivity?: number;
  boostMultiplier?: number;
  minFov?: number;
  maxFov?: number;
}

/** 照片模式自由相机：6DOF位移 + 鼠标旋转 */
export class PhotoMode implements IUpdatable {
  readonly camera: THREE.PerspectiveCamera;

  private readonly input: InputManager;
  private readonly moveSpeed: number;
  private readonly lookSensitivity: number;
  private readonly boostMultiplier: number;
  private readonly minFov: number;
  private readonly maxFov: number;

  private enabled = false;

  private readonly savedPosition = new THREE.Vector3();
  private readonly savedQuaternion = new THREE.Quaternion();
  private savedFov = 60;

  private yaw = 0;
  private pitch = 0;

  private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();

  constructor(config: PhotoModeConfig) {
    this.camera = config.camera;
    this.input = config.input;
    this.moveSpeed = config.moveSpeed ?? 120;
    this.lookSensitivity = config.lookSensitivity ?? 0.0022;
    this.boostMultiplier = config.boostMultiplier ?? 2.5;
    this.minFov = config.minFov ?? 30;
    this.maxFov = config.maxFov ?? 110;
  }

  get active(): boolean {
    return this.enabled;
  }

  enter(): void {
    if (this.enabled) {
      return;
    }

    this.savedPosition.copy(this.camera.position);
    this.savedQuaternion.copy(this.camera.quaternion);
    this.savedFov = this.camera.fov;

    this.syncAnglesFromCamera();
    this.input.consumeMouseDelta();
    this.enabled = true;
  }

  exit(restoreCamera = true): void {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;
    this.input.consumeMouseDelta();

    if (restoreCamera) {
      this.camera.position.copy(this.savedPosition);
      this.camera.quaternion.copy(this.savedQuaternion);
      this.setFov(this.savedFov);
    }
  }

  setFov(fov: number): void {
    this.camera.fov = clamp(fov, this.minFov, this.maxFov);
    this.camera.updateProjectionMatrix();
  }

  getFov(): number {
    return this.camera.fov;
  }

  update(delta: number): void {
    if (!this.enabled) {
      return;
    }

    const mouseDelta = this.input.consumeMouseDelta();
    this.yaw -= mouseDelta.x * this.lookSensitivity;
    this.pitch = clamp(
      this.pitch - mouseDelta.y * this.lookSensitivity,
      -Math.PI * 0.495,
      Math.PI * 0.495,
    );

    this.euler.set(this.pitch, this.yaw, 0);
    this.camera.quaternion.setFromEuler(this.euler);

    const axis = this.input.getMovementAxis();
    const vertical =
      (this.input.isPressed('KeyE') ? 1 : 0) -
      (this.input.isPressed('KeyQ') ? 1 : 0);

    this.forward.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.right.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.up.set(0, 1, 0).applyQuaternion(this.camera.quaternion);

    this.movement
      .set(0, 0, 0)
      .addScaledVector(this.forward, axis.forward)
      .addScaledVector(this.right, axis.right)
      .addScaledVector(this.up, vertical);

    if (this.movement.lengthSq() < 1e-8) {
      return;
    }

    this.movement.normalize();
    const boost =
      this.input.isPressed('ShiftLeft') || this.input.isPressed('ShiftRight');
    const speed = this.moveSpeed * (boost ? this.boostMultiplier : 1);
    this.camera.position.addScaledVector(this.movement, speed * delta);
  }

  private syncAnglesFromCamera(): void {
    this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.yaw = this.euler.y;
    this.pitch = clamp(this.euler.x, -Math.PI * 0.495, Math.PI * 0.495);
  }
}
