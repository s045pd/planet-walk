import * as THREE from 'three';

/** 星球重力参数配置 */
export interface GravityConfig {
  readonly name: string;
  readonly gravity: number;
  readonly radius: number;
}

/** 预设星球重力参数 */
export const PLANET_GRAVITY: Record<string, GravityConfig> = {
  earth: { name: '地球', gravity: 9.81, radius: 1000 },
  mars: { name: '火星', gravity: 3.72, radius: 532 },
  moon: { name: '月球', gravity: 1.62, radius: 272 },
  venus: { name: '金星', gravity: 8.87, radius: 950 },
  europa: { name: '欧罗巴', gravity: 1.315, radius: 245 },
};

/** 玩家状态：位置、朝向、速度 */
export class PlayerState {
  readonly position: THREE.Vector3;
  readonly velocity: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
  readonly up: THREE.Vector3;

  onGround = false;
  currentPlanet: string;
  private gravityConfig: GravityConfig;

  constructor(initialPosition: THREE.Vector3, planet = 'earth') {
    this.position = initialPosition.clone();
    this.velocity = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.up = new THREE.Vector3(0, 1, 0);
    this.currentPlanet = planet;
    this.gravityConfig = PLANET_GRAVITY[planet] ?? PLANET_GRAVITY.earth;
  }

  /** 获取当前星球的重力配置 */
  getGravityConfig(): GravityConfig {
    return this.gravityConfig;
  }

  /** 切换星球 */
  switchPlanet(planetId: string, gravityConfig?: GravityConfig): void {
    this.currentPlanet = planetId;
    this.gravityConfig =
      gravityConfig ??
      PLANET_GRAVITY[planetId] ??
      PLANET_GRAVITY.earth;
  }

  /** 重置速度 */
  resetVelocity(): void {
    this.velocity.set(0, 0, 0);
  }
}
