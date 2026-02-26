import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import type { PlayerState } from '../player/PlayerState';
import { clamp } from '../utils/math';

/** 第一人称相机模式：跟随玩家位置，鼠标控制视角 */
export class FirstPersonMode implements IDisposable {
  readonly camera: THREE.PerspectiveCamera;

  /** 眼睛相对脚底的高度偏移 */
  eyeHeight = 1.6;

  /** 鼠标灵敏度 */
  sensitivity = 0.002;

  /** 俯仰角（弧度），限制在 ±85° */
  private _pitch = 0;

  /** 偏航角（弧度） */
  private _yaw = 0;

  /** 复用临时向量 */
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _eyePos = new THREE.Vector3();
  private readonly _quatYaw = new THREE.Quaternion();
  private readonly _quatPitch = new THREE.Quaternion();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  /** 应用鼠标增量旋转视角 */
  applyMouseDelta(dx: number, dy: number, sensitivityMultiplier = 1): void {
    const sensitivity = this.sensitivity * sensitivityMultiplier;
    this._yaw -= dx * sensitivity;
    this._pitch -= dy * sensitivity;
    this._pitch = clamp(this._pitch, -Math.PI * 0.47, Math.PI * 0.47);
  }

  /** 获取相机在球面切平面上的前方方向（用于移动） */
  getForwardOnSurface(up: THREE.Vector3): THREE.Vector3 {
    // 相机世界前方
    this.camera.getWorldDirection(this._forward);
    // 投影到切平面并归一化
    this._forward.sub(up.clone().multiplyScalar(this._forward.dot(up)));
    const len = this._forward.length();
    if (len > 1e-6) {
      this._forward.divideScalar(len);
    }
    return this._forward;
  }

  /** 获取相机在球面切平面上的右方方向 */
  getRightOnSurface(up: THREE.Vector3): THREE.Vector3 {
    this.getForwardOnSurface(up);
    this._right.crossVectors(this._forward, up).normalize();
    return this._right;
  }

  /** 每帧更新相机位置和朝向 */
  update(state: PlayerState): void {
    const up = state.up;

    // 眼睛位置 = 玩家位置 + up * eyeHeight
    this._eyePos.copy(up).multiplyScalar(this.eyeHeight).add(state.position);
    this.camera.position.copy(this._eyePos);

    // 构建朝向：先用玩家四元数作为基础（已对齐球面），再叠加 yaw + pitch
    // 偏航绕 up 轴旋转
    this._quatYaw.setFromAxisAngle(up, this._yaw);
    // 计算局部右轴用于俯仰
    this._forward.set(0, 0, -1).applyQuaternion(this._quatYaw).applyQuaternion(state.quaternion);
    this._right.crossVectors(this._forward, up).normalize();
    // 俯仰绕右轴旋转
    this._quatPitch.setFromAxisAngle(this._right, this._pitch);

    // 最终相机朝向
    const lookDir = this._forward.applyQuaternion(this._quatPitch);
    const target = this._eyePos.clone().add(lookDir);
    this.camera.up.copy(up);
    this.camera.lookAt(target);
  }

  dispose(): void {
    // 相机由外部管理，无需清理
  }
}
