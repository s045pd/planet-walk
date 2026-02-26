import * as THREE from 'three';
import type { IUpdatable, IDisposable } from '../core/types';
import type { InputManager } from '../core/InputManager';
import { PlayerState } from './PlayerState';
import { SphericalGravity } from './SphericalGravity';
import { FirstPersonMode } from '../camera/FirstPersonMode';

const BASE_SPEED = 10;

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
  jumpForce?: number;
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

  private moveSpeed: number;
  private jumpForce: number;
  private _syncCameraInController = true;
  private _mouseLookHandler: ((dx: number, dy: number) => void) | null = null;

  /** 地面摩擦衰减系数 */
  private readonly friction = 0.88;

  /** 空中阻力衰减系数 */
  private readonly airDrag = 0.98;

  /** 角色与地表间距（脚底悬浮高度） */
  private readonly playerHeight = 2;

  /** 判定地面的阈值 */
  private readonly groundSnapThreshold = 0.25;

  /** 跟随地形高度时的最大贴地速度 */
  private readonly terrainFollowSpeed = 28;

  /** 地形检测射线长度（会按位移高度动态更新） */
  private terrainProbeDistance = 24;

  private readonly groundRaycaster = new THREE.Raycaster();
  private readonly heightReadCanvas = document.createElement('canvas');
  private readonly heightReadContext = this.heightReadCanvas.getContext('2d', {
    willReadFrequently: true,
  });
  private readonly heightTextureCache = new WeakMap<THREE.Texture, HeightTextureData>();

  /** 复用临时向量 */
  private readonly _moveDir = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _surfaceDir = new THREE.Vector3();
  private readonly _down = new THREE.Vector3();
  private readonly _sampleUv = new THREE.Vector2();
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);

  constructor(config: PlayerControllerConfig) {
    this.input = config.input;
    this.planetCenter = config.planetCenter.clone();
    this.surfaceMeshes = config.surfaceMeshes;
    this.moveSpeed = config.moveSpeed ?? BASE_SPEED;
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
    this.firstPerson = new FirstPersonMode(config.camera);
    this._mouseLookHandler = (dx: number, dy: number): void => {
      this.firstPerson.applyMouseDelta(dx, dy);
    };
    this.updateTerrainProbeDistance();
  }

  update(delta: number): void {
    if (!this.enabled) return;

    // 限制 delta 防止大跳帧
    const dt = Math.min(delta, 0.05);

    this.handleMouseLook();
    this.handleMovement(dt);
    this.handleJump();
    this.applyGravity(dt);
    this.applyVelocity(dt);
    this.resolveTerrainCollision(dt);
    this.alignToSurface(dt);
    if (this._syncCameraInController) {
      this.firstPerson.update(this.state);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setMouseLookHandler(handler: ((dx: number, dy: number) => void) | null): void {
    this._mouseLookHandler = handler;
  }

  setCameraSyncEnabled(enabled: boolean): void {
    this._syncCameraInController = enabled;
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
    this.firstPerson.update(this.state);
  }

  private handleMouseLook(): void {
    const mouse = this.input.consumeMouseDelta();
    if ((mouse.x !== 0 || mouse.y !== 0) && this._mouseLookHandler) {
      this._mouseLookHandler(mouse.x, mouse.y);
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
    this.surfaceMeshes = config.surfaceMeshes;
    this.updateTerrainProbeDistance();
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
