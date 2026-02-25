import * as THREE from 'three';
import { PlayerState } from './PlayerState';
import { slerpQuaternion } from '../utils/math';

/** 球体引力系统：计算向心引力并对齐角色朝向 */
export class SphericalGravity {
  private readonly _planetCenter: THREE.Vector3;
  private readonly _gravityDir = new THREE.Vector3();
  private readonly _targetUp = new THREE.Vector3();
  private readonly _targetQuat = new THREE.Quaternion();

  /** slerp 对齐速度，值越大对齐越快 */
  alignSpeed: number;

  constructor(planetCenter: THREE.Vector3, alignSpeed = 8) {
    this._planetCenter = planetCenter.clone();
    this.alignSpeed = alignSpeed;
  }

  /** 获取从玩家位置指向星球中心的引力向量（含大小） */
  getGravity(state: PlayerState): THREE.Vector3 {
    const config = state.getGravityConfig();
    this._gravityDir
      .copy(this._planetCenter)
      .sub(state.position)
      .normalize();
    return this._gravityDir.clone().multiplyScalar(config.gravity);
  }

  /** 用四元数 slerp 将角色 up 向量对齐到球面法线方向 */
  alignToSurface(state: PlayerState, delta: number): void {
    // 球面法线 = 从星球中心指向玩家位置的单位向量
    this._targetUp
      .copy(state.position)
      .sub(this._planetCenter)
      .normalize();

    // 计算从当前 up 旋转到目标 up 的四元数
    const rotationQuat = new THREE.Quaternion().setFromUnitVectors(
      state.up,
      this._targetUp,
    );

    // 组合到目标四元数
    this._targetQuat.copy(rotationQuat).multiply(state.quaternion);

    // slerp 平滑插值
    const t = Math.min(1, this.alignSpeed * delta);
    const result = slerpQuaternion(state.quaternion, this._targetQuat, t);

    state.quaternion.copy(result);
    state.up.copy(this._targetUp);
  }

  /** 更新星球中心位置 */
  setPlanetCenter(center: THREE.Vector3): void {
    this._planetCenter.copy(center);
  }
}
