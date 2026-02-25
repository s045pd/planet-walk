import * as THREE from 'three';
import { PlayerState } from './PlayerState';

/** Raycaster碰撞检测：检测角色脚下是否接触地面 */
export class CollisionDetector {
  private readonly raycaster = new THREE.Raycaster();
  private readonly _down = new THREE.Vector3();

  /** 检测距离阈值（角色高度） */
  playerHeight: number;

  constructor(playerHeight = 2) {
    this.playerHeight = playerHeight;
  }

  /** 检测角色是否站在地面上，返回地面交点或null */
  detectGround(
    state: PlayerState,
    planetCenter: THREE.Vector3,
    meshes: THREE.Object3D[],
  ): THREE.Intersection | null {
    // 射线方向：从玩家位置指向星球中心（即"脚下"）
    this._down
      .copy(planetCenter)
      .sub(state.position)
      .normalize();

    this.raycaster.set(state.position, this._down);
    this.raycaster.far = this.playerHeight * 2;

    const hits = this.raycaster.intersectObjects(meshes, true);
    return hits.length > 0 ? hits[0] : null;
  }

  /** 将玩家约束在地面上方 */
  resolveGroundCollision(
    state: PlayerState,
    planetCenter: THREE.Vector3,
    meshes: THREE.Object3D[],
  ): void {
    const hit = this.detectGround(state, planetCenter, meshes);

    if (hit && hit.distance < this.playerHeight) {
      // 将玩家推到地面上方
      const surfaceNormal = new THREE.Vector3()
        .copy(state.position)
        .sub(planetCenter)
        .normalize();

      const correction = this.playerHeight - hit.distance;
      state.position.add(surfaceNormal.multiplyScalar(correction));

      // 清除向地面方向的速度分量
      const downSpeed = state.velocity.dot(this._down);
      if (downSpeed > 0) {
        state.velocity.sub(this._down.clone().multiplyScalar(downSpeed));
      }

      state.onGround = true;
    } else {
      state.onGround = false;
    }
  }
}
