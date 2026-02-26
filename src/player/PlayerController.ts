import * as THREE from 'three';
import type { IUpdatable, IDisposable } from '../core/types';
import type { InputManager } from '../core/InputManager';
import { PlayerState } from './PlayerState';
import { SphericalGravity } from './SphericalGravity';
import { FirstPersonMode } from '../camera/FirstPersonMode';

const INERTIA_FACTOR = 0.88;
const MARS_GRAVITY = 3.72;
const WALK_SPEED = 4;
const RUN_SPEED = 8;
const JUMP_VELOCITY = 5;
const TURN_LERP_FACTOR = 0.15;
const MAX_DELTA_TIME = 0.1;

type TextureImageSource = CanvasImageSource & {
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
};

interface HeightTextureData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

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
  runSpeed?: number;
  jumpForce?: number;
  onFootstep?: (planetId: string) => void;
}

/** 球面第一人称控制器：WASD 移动 + 鼠标视角 + 跳跃 */
export class PlayerController implements IUpdatable, IDisposable {
  readonly state: PlayerState;
  readonly firstPerson: FirstPersonMode;
  enabled = true;

  private readonly input: InputManager;
  private readonly gravity: SphericalGravity;
  private surfaceMeshes: THREE.Object3D[];
  private readonly planetCenter: THREE.Vector3;

  private readonly walkSpeed: number;
  private readonly runSpeed: number;
  private readonly jumpVelocity: number;
  private gravityStrength: number;
  private activeMoveSpeed: number;
  private readonly onFootstep: ((planetId: string) => void) | null;
  private _syncCameraInController = true;
  private _mouseLookHandler: ((dx: number, dy: number) => void) | null = null;

  /** 角色与地表间距（脚底悬浮高度） */
  private readonly playerHeight = 2;

  /** 判定地面的阈值 */
  private readonly groundSnapThreshold = 0.25;

  /** 跟随地形高度时的最大贴地速度 */
  private readonly terrainFollowSpeed = 28;

  /** 地形检测射线长度（会按位移高度动态更新） */
  private terrainProbeDistance = 24;
  private footstepCooldown = 0;

  private readonly groundRaycaster = new THREE.Raycaster();
  private readonly heightReadCanvas = document.createElement('canvas');
  private readonly heightReadContext = this.heightReadCanvas.getContext('2d', {
    willReadFrequently: true,
  });
  private readonly heightTextureCache = new WeakMap<THREE.Texture, HeightTextureData>();

  /** 复用临时向量 */
  private readonly _moveDir = new THREE.Vector3();
  private readonly _targetVelocity = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _surfaceDir = new THREE.Vector3();
  private readonly _targetQuat = new THREE.Quaternion();
  private readonly _turnBasis = new THREE.Matrix4();
  private readonly _down = new THREE.Vector3();
  private readonly _sampleUv = new THREE.Vector2();
  private readonly _worldForward = new THREE.Vector3(0, 0, -1);
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);
  private readonly _distanceAnchor = new THREE.Vector3();
  private hasDistanceAnchor = false;
  private walkDistanceDelta = 0;
  private totalWalkDistance = 0;

  constructor(config: PlayerControllerConfig) {
    this.input = config.input;
    this.planetCenter = config.planetCenter.clone();
    this.surfaceMeshes = config.surfaceMeshes;
    this.walkSpeed = config.moveSpeed ?? WALK_SPEED;
    this.runSpeed = config.runSpeed ?? RUN_SPEED;
    this.jumpVelocity = config.jumpForce ?? JUMP_VELOCITY;
    this.gravityStrength = config.gravity ?? MARS_GRAVITY;
    this.activeMoveSpeed = this.walkSpeed;
    this.onFootstep = config.onFootstep ?? null;

    // 初始位置：星球表面正上方
    const startPos = new THREE.Vector3(0, config.planetRadius + 2, 0);
    this.state = new PlayerState(startPos, config.planetId ?? 'earth');
    this.state.switchPlanet(config.planetId ?? 'earth', {
      name: config.planetId ?? 'earth',
      gravity: this.gravityStrength,
      radius: config.planetRadius,
    });

    this.gravity = new SphericalGravity(this.planetCenter);
    this.firstPerson = new FirstPersonMode(config.camera);
    this._mouseLookHandler = (dx: number, dy: number): void => {
      this.firstPerson.applyMouseDelta(dx, dy);
    };
    this.updateTerrainProbeDistance();
  }

  update(delta: number): void {
    if (!this.enabled) return;

    // 限制 delta 防止大跳帧
    const dt = Math.min(delta, MAX_DELTA_TIME);

    this.handleMouseLook();
    this.handleMovement();
    this.handleJump();
    this.applyGravity(dt);
    this.applyVelocity(dt);
    this.resolveTerrainCollision(dt);
    this.alignToSurface(dt);
    this.rotateTowardMovement();
    this.trackWalkDistance();
    this.updateFootsteps(dt);
    if (this._syncCameraInController) {
      this.firstPerson.update(this.state);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.resetWalkDistanceAnchor();
    }
  }

  setMouseLookHandler(handler: ((dx: number, dy: number) => void) | null): void {
    this._mouseLookHandler = handler;
  }

  setCameraSyncEnabled(enabled: boolean): void {
    this._syncCameraInController = enabled;
  }

  consumeWalkDistanceDelta(): number {
    const delta = this.walkDistanceDelta;
    this.walkDistanceDelta = 0;
    return delta;
  }

  getTotalWalkDistance(): number {
    return this.totalWalkDistance;
  }

  /** 将玩家状态与当前相机位置同步，避免模式切换跳变 */
  syncToCamera(cameraPosition: THREE.Vector3, planetCenter: THREE.Vector3): void {
    this._surfaceDir.copy(cameraPosition).sub(planetCenter);
    if (this._surfaceDir.lengthSq() < 1e-8) {
      this._surfaceDir.set(0, 1, 0);
    } else {
      this._surfaceDir.normalize();
    }

    this.state.up.copy(this._surfaceDir);
    this.state.position
      .copy(cameraPosition)
      .addScaledVector(this._surfaceDir, -this.firstPerson.eyeHeight);
    this.state.quaternion.setFromUnitVectors(this._worldUp, this._surfaceDir);
    this.state.resetVelocity();
    this.state.onGround = false;
    this.footstepCooldown = 0;
    this.resetWalkDistanceAnchor();
    this.firstPerson.update(this.state);
  }

  private handleMouseLook(): void {
    const mouse = this.input.consumeMouseDelta();
    if ((mouse.x !== 0 || mouse.y !== 0) && this._mouseLookHandler) {
      this._mouseLookHandler(mouse.x, mouse.y);
    }
  }

  private handleMovement(): void {
    const axis = this.input.getMovementAxis();
    const isRunning = this.input.isPressed('ShiftLeft') || this.input.isPressed('ShiftRight');
    this.activeMoveSpeed = isRunning ? this.runSpeed : this.walkSpeed;

    const up = this.state.up;

    // 获取相机在切平面上的前方和右方
    this._forward.copy(this.firstPerson.getForwardOnSurface(up));
    this._right.copy(this.firstPerson.getRightOnSurface(up));

    // 合成移动方向
    this._moveDir.set(0, 0, 0);
    this._moveDir.addScaledVector(this._forward, axis.forward);
    this._moveDir.addScaledVector(this._right, axis.right);

    const hasInput = this._moveDir.lengthSq() > 1e-8;
    if (hasInput) {
      this._moveDir.normalize();
    } else {
      this._moveDir.set(0, 0, 0);
    }

    const targetSpeed = hasInput ? this.activeMoveSpeed : 0;
    this._targetVelocity.copy(this._moveDir).multiplyScalar(targetSpeed);

    this._surfaceDir.copy(this.state.velocity);
    const normalSpeed = this._surfaceDir.dot(up);
    this._surfaceDir.addScaledVector(up, -normalSpeed);
    this._surfaceDir.multiplyScalar(INERTIA_FACTOR);
    this._surfaceDir.addScaledVector(this._targetVelocity, 1 - INERTIA_FACTOR);

    this.state.velocity.copy(this._surfaceDir);
    this.state.velocity.addScaledVector(up, normalSpeed);
  }

  private handleJump(): void {
    if (!this.input.consumeJump()) return;
    if (!this.state.onGround) return;

    // 跳跃方向 = 球面法线（up），并设置初速度
    const normalSpeed = this.state.velocity.dot(this.state.up);
    this.state.velocity.addScaledVector(this.state.up, -normalSpeed);
    this.state.velocity.addScaledVector(this.state.up, this.jumpVelocity);
    this.state.onGround = false;
  }

  private applyGravity(dt: number): void {
    const g = this.gravity.getGravity(this.state);
    if (g.lengthSq() > 1e-8) {
      g.setLength(this.gravityStrength);
    }
    this.state.velocity.addScaledVector(g, dt);
  }

  private applyVelocity(dt: number): void {
    this.state.position.addScaledVector(this.state.velocity, dt);
  }

  private resolveTerrainCollision(dt: number): void {
    this._down.copy(this.planetCenter).sub(this.state.position);
    const distanceToCenter = this._down.length();
    if (distanceToCenter < 1e-6) {
      this.state.onGround = false;
      return;
    }
    this._down.divideScalar(distanceToCenter);

    this.groundRaycaster.set(this.state.position, this._down);
    this.groundRaycaster.far = this.terrainProbeDistance;
    const hit = this.groundRaycaster.intersectObjects(this.surfaceMeshes, true)[0];

    if (!hit) {
      this.state.onGround = false;
      return;
    }

    const terrainDisplacement = this.getHitDisplacement(hit);
    const terrainDistance = Math.max(0, hit.distance - terrainDisplacement);
    const distanceError = terrainDistance - this.playerHeight;
    const nearGround = terrainDistance <= this.playerHeight + this.groundSnapThreshold;
    const downSpeed = this.state.velocity.dot(this._down);
    const canSnapToGround = nearGround && downSpeed >= -0.05;

    if (distanceError < 0 || canSnapToGround || this.state.onGround) {
      const maxSnapDistance = this.terrainFollowSpeed * dt;
      const correction = distanceError < 0
        ? distanceError
        : Math.min(distanceError, maxSnapDistance);
      if (Math.abs(correction) > 1e-4) {
        this.state.position.addScaledVector(this._down, correction);
      }
    }

    if (canSnapToGround && downSpeed > 0) {
      this.state.velocity.addScaledVector(this._down, -downSpeed);
    }

    this.state.onGround = canSnapToGround;
  }

  private alignToSurface(dt: number): void {
    this.gravity.alignToSurface(this.state, dt);
  }

  private rotateTowardMovement(): void {
    const up = this.state.up;

    if (this._moveDir.lengthSq() > 1e-8) {
      this._surfaceDir.copy(this._moveDir);
    } else {
      this._surfaceDir.copy(this.state.velocity);
      const normalSpeed = this._surfaceDir.dot(up);
      this._surfaceDir.addScaledVector(up, -normalSpeed);
      if (this._surfaceDir.lengthSq() < 1e-4) {
        return;
      }
      this._surfaceDir.normalize();
    }

    this._forward
      .copy(this._worldForward)
      .applyQuaternion(this.state.quaternion);
    this._forward.addScaledVector(up, -this._forward.dot(up));
    if (this._forward.lengthSq() < 1e-8) {
      this._forward.copy(this._surfaceDir);
    } else {
      this._forward.normalize();
    }

    this._forward.lerp(this._surfaceDir, TURN_LERP_FACTOR);
    if (this._forward.lengthSq() < 1e-8) {
      return;
    }
    this._forward.normalize();

    this._right.crossVectors(this._forward, up);
    if (this._right.lengthSq() < 1e-8) {
      return;
    }
    this._right.normalize();

    this._turnBasis.makeBasis(
      this._right,
      up,
      this._down.copy(this._forward).multiplyScalar(-1),
    );
    this._targetQuat.setFromRotationMatrix(this._turnBasis);
    this.state.quaternion.slerp(this._targetQuat, TURN_LERP_FACTOR);
  }

  private updateFootsteps(dt: number): void {
    if (!this.onFootstep) {
      return;
    }

    const axis = this.input.getMovementAxis();
    const hasMovementInput =
      Math.abs(axis.forward) > 1e-3 ||
      Math.abs(axis.right) > 1e-3;
    if (!this.state.onGround || !hasMovementInput) {
      this.footstepCooldown = 0;
      return;
    }

    this._surfaceDir.copy(this.state.velocity);
    const normalSpeed = this._surfaceDir.dot(this.state.up);
    this._surfaceDir.addScaledVector(this.state.up, -normalSpeed);
    const horizontalSpeed = this._surfaceDir.length();
    if (horizontalSpeed < 0.2) {
      this.footstepCooldown = 0;
      return;
    }

    this.footstepCooldown -= dt;
    if (this.footstepCooldown > 0) {
      return;
    }

    this.onFootstep(this.state.currentPlanet);
    const cadence = THREE.MathUtils.clamp(horizontalSpeed / this.walkSpeed, 0.65, 1.5);
    this.footstepCooldown = THREE.MathUtils.clamp(0.44 / cadence, 0.18, 0.55);
  }

  private trackWalkDistance(): void {
    if (!this.hasDistanceAnchor) {
      this._distanceAnchor.copy(this.state.position);
      this.hasDistanceAnchor = true;
      return;
    }

    const step = this.state.position.distanceTo(this._distanceAnchor);
    this._distanceAnchor.copy(this.state.position);
    if (step <= 1e-4) {
      return;
    }

    this.walkDistanceDelta += step;
    this.totalWalkDistance += step;
  }

  private resetWalkDistanceAnchor(): void {
    this.hasDistanceAnchor = false;
    this.walkDistanceDelta = 0;
  }

  private getHitDisplacement(hit: THREE.Intersection): number {
    if (!hit.uv) return 0;

    const material = this.getMeshStandardMaterial(hit.object);
    if (!material || !material.displacementMap) return 0;

    const heightValue = this.sampleDisplacementValue(material.displacementMap, hit.uv);
    return heightValue * material.displacementScale + material.displacementBias;
  }

  private sampleDisplacementValue(texture: THREE.Texture, uv: THREE.Vector2): number {
    const textureData = this.getHeightTextureData(texture);
    if (!textureData) return 0;

    this._sampleUv.copy(uv);
    texture.transformUv(this._sampleUv);

    const x = Math.min(
      textureData.width - 1,
      Math.max(0, Math.floor(this._sampleUv.x * (textureData.width - 1))),
    );
    const y = Math.min(
      textureData.height - 1,
      Math.max(0, Math.floor(this._sampleUv.y * (textureData.height - 1))),
    );

    return textureData.data[(y * textureData.width + x) * 4] / 255;
  }

  private getHeightTextureData(texture: THREE.Texture): HeightTextureData | null {
    const cached = this.heightTextureCache.get(texture);
    if (cached) return cached;
    if (!this.heightReadContext) return null;

    const source = texture.image as TextureImageSource | undefined;
    if (!source) return null;

    const width = this.pickDimension(source.videoWidth, source.width);
    const height = this.pickDimension(source.videoHeight, source.height);
    if (width <= 0 || height <= 0) return null;

    this.heightReadCanvas.width = width;
    this.heightReadCanvas.height = height;

    try {
      this.heightReadContext.clearRect(0, 0, width, height);
      this.heightReadContext.drawImage(source, 0, 0, width, height);
    } catch {
      return null;
    }

    const imageData = this.heightReadContext.getImageData(0, 0, width, height).data;
    const textureData: HeightTextureData = {
      width,
      height,
      data: new Uint8ClampedArray(imageData),
    };
    this.heightTextureCache.set(texture, textureData);
    return textureData;
  }

  private pickDimension(primary?: number, fallback?: number): number {
    if (typeof primary === 'number' && primary > 0) return primary;
    if (typeof fallback === 'number' && fallback > 0) return fallback;
    return 0;
  }

  private getMeshStandardMaterial(object: THREE.Object3D): THREE.MeshStandardMaterial | null {
    if (!(object instanceof THREE.Mesh)) return null;

    const { material } = object;
    if (material instanceof THREE.MeshStandardMaterial) {
      return material;
    }
    if (Array.isArray(material)) {
      for (const mat of material) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          return mat;
        }
      }
    }
    return null;
  }

  private updateTerrainProbeDistance(): void {
    let maxDisplacement = 0;
    for (const surface of this.surfaceMeshes) {
      surface.traverse((object) => {
        const material = this.getMeshStandardMaterial(object);
        if (!material) return;
        const displacementRange =
          Math.abs(material.displacementScale) + Math.abs(material.displacementBias);
        if (displacementRange > maxDisplacement) {
          maxDisplacement = displacementRange;
        }
      });
    }

    this.terrainProbeDistance = this.playerHeight + maxDisplacement + 16;
  }

  switchPlanet(config: {
    planetId: string;
    planetRadius: number;
    gravity: number;
    surfaceMeshes: THREE.Object3D[];
  }): void {
    this.gravityStrength = config.gravity;
    this.surfaceMeshes = config.surfaceMeshes;
    this.updateTerrainProbeDistance();
    this.state.switchPlanet(config.planetId, {
      name: config.planetId,
      gravity: this.gravityStrength,
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
    this.footstepCooldown = 0;
    this.resetWalkDistanceAnchor();
  }

  dispose(): void {
    this.firstPerson.dispose();
  }
}
