import * as THREE from 'three';
import type { IUpdatable, IDisposable } from '../core/types';
import type { InputManager } from '../core/InputManager';
import { PlayerState } from './PlayerState';
import { SphericalGravity } from './SphericalGravity';
import { CollisionDetector } from './CollisionDetector';
import { FirstPersonMode } from '../camera/FirstPersonMode';

/** 球面第一人称控制器配置 */
export interface PlayerControllerConfig {
  camera: THREE.PerspectiveCamera;
  input: InputManager;
  planetCenter: THREE.Vector3;
  planetId?: string;
  planetRadius: number;
  surfaceMeshes: THREE.Object3D[];
  gravity?: number;
  moveSpeed?: number;
  jumpForce?: number;
}

/** 球面第一人称控制器：WASD 移动 + 鼠标视角 + 跳跃 */
export class PlayerController implements IUpdatable, IDisposable {
  readonly state: PlayerState;
  readonly firstPerson: FirstPersonMode;

  private readonly input: InputManager;
  private readonly gravity: SphericalGravity;
  private readonly collision: CollisionDetector;
  private surfaceMeshes: THREE.Object3D[];
  private readonly planetCenter: THREE.Vector3;

  private moveSpeed: number;
  private jumpForce: number;

  /** 地面摩擦衰减系数 */
  private readonly friction = 0.88;

  /** 空中阻力衰减系数 */
  private readonly airDrag = 0.98;

  /** 复用临时向量 */
  private readonly _moveDir = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _surfaceDir = new THREE.Vector3();
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);

  constructor(config: PlayerControllerConfig) {
    this.input = config.input;
    this.planetCenter = config.planetCenter.clone();
    this.surfaceMeshes = config.surfaceMeshes;
    this.moveSpeed = config.moveSpeed ?? 5;
    this.jumpForce = config.jumpForce ?? 4;

    // 初始位置：星球表面正上方
    const startPos = new THREE.Vector3(0, config.planetRadius + 2, 0);
    this.state = new PlayerState(startPos, config.planetId ?? 'earth');
    this.state.switchPlanet(config.planetId ?? 'earth', {
      name: config.planetId ?? 'earth',
      gravity: config.gravity ?? 9.81,
      radius: config.planetRadius,
    });

    this.gravity = new SphericalGravity(this.planetCenter);
    this.collision = new CollisionDetector(2);
    this.firstPerson = new FirstPersonMode(config.camera);
  }

  update(delta: number): void {
    // 限制 delta 防止大跳帧
    const dt = Math.min(delta, 0.05);

    this.handleMouseLook();
    this.handleMovement(dt);
    this.handleJump();
    this.applyGravity(dt);
    this.applyVelocity(dt);
    this.resolveCollision();
    this.alignToSurface(dt);
    this.firstPerson.update(this.state);
  }

  private handleMouseLook(): void {
    const mouse = this.input.consumeMouseDelta();
    if (mouse.x !== 0 || mouse.y !== 0) {
      this.firstPerson.applyMouseDelta(mouse.x, mouse.y);
    }
  }

  private handleMovement(dt: number): void {
    const axis = this.input.getMovementAxis();
    if (axis.forward === 0 && axis.right === 0) {
      // 无输入时施加摩擦
      this.applyFriction();
      return;
    }

    const up = this.state.up;

    // 获取相机在切平面上的前方和右方
    this._forward.copy(this.firstPerson.getForwardOnSurface(up));
    this._right.copy(this.firstPerson.getRightOnSurface(up));

    // 合成移动方向
    this._moveDir.set(0, 0, 0);
    this._moveDir.addScaledVector(this._forward, axis.forward);
    this._moveDir.addScaledVector(this._right, axis.right);

    const len = this._moveDir.length();
    if (len > 1e-6) {
      this._moveDir.divideScalar(len);
    }

    // 施加加速度到速度
    this.state.velocity.addScaledVector(this._moveDir, this.moveSpeed * dt);
    this.applyFriction();
  }

  private handleJump(): void {
    if (!this.input.consumeJump()) return;
    if (!this.state.onGround) return;

    // 跳跃方向 = 球面法线（up）
    this.state.velocity.addScaledVector(this.state.up, this.jumpForce);
    this.state.onGround = false;
  }

  private applyGravity(dt: number): void {
    const g = this.gravity.getGravity(this.state);
    this.state.velocity.addScaledVector(g, dt);
  }

  private applyVelocity(dt: number): void {
    this.state.position.addScaledVector(this.state.velocity, dt);
  }

  private applyFriction(): void {
    // 只衰减切平面方向的速度，不影响法线方向（重力/跳跃）
    const up = this.state.up;
    const normalSpeed = this.state.velocity.dot(up);
    const factor = this.state.onGround ? this.friction : this.airDrag;

    // 分离法线和切线分量
    this.state.velocity.addScaledVector(up, -normalSpeed);
    this.state.velocity.multiplyScalar(factor);
    this.state.velocity.addScaledVector(up, normalSpeed);
  }

  private resolveCollision(): void {
    this.collision.resolveGroundCollision(
      this.state,
      this.planetCenter,
      this.surfaceMeshes,
    );
  }

  private alignToSurface(dt: number): void {
    this.gravity.alignToSurface(this.state, dt);
  }

  switchPlanet(config: {
    planetId: string;
    planetRadius: number;
    gravity: number;
    surfaceMeshes: THREE.Object3D[];
  }): void {
    this.surfaceMeshes = config.surfaceMeshes;
    this.state.switchPlanet(config.planetId, {
      name: config.planetId,
      gravity: config.gravity,
      radius: config.planetRadius,
    });
    this.state.resetVelocity();
    this.state.onGround = false;

    this._surfaceDir
      .copy(this.state.position)
      .sub(this.planetCenter);
    if (this._surfaceDir.lengthSq() < 1e-8) {
      this._surfaceDir.set(0, 1, 0);
    } else {
      this._surfaceDir.normalize();
    }

    this.state.position.copy(this._surfaceDir).multiplyScalar(config.planetRadius + 2);
    this.state.up.copy(this._surfaceDir);
    this.state.quaternion.setFromUnitVectors(this._worldUp, this._surfaceDir);
  }

  dispose(): void {
    this.firstPerson.dispose();
  }
}
