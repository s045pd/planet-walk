import { PerspectiveCamera, Quaternion, Vector3 } from 'three';

import { Input } from '../core/Input';
import type { PlanetConfig } from '../planet/PlanetConfigs';
import type { SurfaceScene } from '../surface/SurfaceScene';
import { clamp, latLonToVec3, vec3ToLatLon } from '../utils/math';

const WORLD_UP = new Vector3(0, 1, 0);

export interface PlayerSnapshot {
  position: Vector3;
  up: Vector3;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  heading: number;
  pitch: number;
  roll: number;
}

export class Player {
  private camera: PerspectiveCamera;
  private input: Input;
  private position = new Vector3();
  private velocity = new Vector3();
  private up = new Vector3(0, 1, 0);
  private forward = new Vector3(0, 0, -1);
  private right = new Vector3(1, 0, 0);

  private yaw = 0;
  private pitch = 0;
  private headHeight = 1.7;
  private planetRadius = 1000;
  private gravity = 9.81;
  private onGround = true;
  private config: PlanetConfig | null = null;
  private mode: 'orbit' | 'surface' = 'orbit';
  private surface: SurfaceScene | null = null;

  constructor(camera: PerspectiveCamera, input: Input) {
    this.camera = camera;
    this.input = input;
  }

  setConfig(config: PlanetConfig, landing?: { lat: number; lon: number }): void {
    this.config = config;
    this.planetRadius = config.radius;
    this.gravity = config.gravity;
    const site = landing ?? config.landingSite;
    this.placeAt(site.lat, site.lon);
    this.yaw = 0;
    this.pitch = 0;
  }

  enterSurface(surface: SurfaceScene): void {
    this.surface = surface;
    this.mode = 'surface';
    const groundY = surface.getHeightAt(0, 0);
    this.position.set(0, groundY + this.headHeight, 0);
    this.velocity.set(0, 0, 0);
    this.up.set(0, 1, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.rebuildPlanarBasis();
    this.applyPlanarCamera();
    this.onGround = true;
  }

  exitSurface(): void {
    this.mode = 'orbit';
    this.surface = null;
    if (this.config) this.placeAt(this.config.landingSite.lat, this.config.landingSite.lon);
  }

  placeAt(latDeg: number, lonDeg: number): void {
    latLonToVec3(latDeg, lonDeg, this.planetRadius + this.headHeight, this.position);
    this.up.copy(this.position).normalize();
    this.rebuildSphericalBasis();
    this.velocity.set(0, 0, 0);
    this.applySphericalCamera();
  }

  update(delta: number): void {
    if (!this.config) return;
    if (this.mode === 'surface' && this.surface) {
      this.updateSurface(delta, this.surface);
    } else {
      this.updateSpherical(delta);
    }
  }

  snapshot(): PlayerSnapshot {
    if (this.mode === 'surface' && this.surface) {
      const speed = this.velocity.length();
      const heading = ((-this.yaw * 180) / Math.PI % 360 + 360) % 360;
      return {
        position: this.position.clone(),
        up: new Vector3(0, 1, 0),
        lat: this.config?.landingSite.lat ?? 0,
        lon: this.config?.landingSite.lon ?? 0,
        altitude: this.position.y,
        speed,
        heading,
        pitch: (this.pitch * 180) / Math.PI,
        roll: 0,
      };
    }
    const { lat, lon } = vec3ToLatLon(this.position);
    const altitude = this.position.length() - this.planetRadius;
    const speed = this.velocity.length();
    const heading = ((Math.atan2(this.forward.x, this.forward.z) * 180) / Math.PI % 360 + 360) % 360;
    return {
      position: this.position.clone(),
      up: this.up.clone(),
      lat,
      lon,
      altitude,
      speed,
      heading,
      pitch: (this.pitch * 180) / Math.PI,
      roll: 0,
    };
  }

  private updateSurface(delta: number, surface: SurfaceScene): void {
    if (this.input.isPointerLocked) {
      const m = this.input.consumeMouseDelta();
      this.yaw -= m.x * 0.0022;
      this.pitch = clamp(this.pitch - m.y * 0.0022, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    }

    this.rebuildPlanarBasis();

    const moveDir = new Vector3();
    if (this.input.isActive('forward')) moveDir.add(this.forward);
    if (this.input.isActive('back')) moveDir.sub(this.forward);
    if (this.input.isActive('right')) moveDir.add(this.right);
    if (this.input.isActive('left')) moveDir.sub(this.right);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const sprint = this.input.isActive('sprint') ? 2.2 : 1.0;
    const speed = 6 * sprint;
    const tangent = new Vector3(this.velocity.x, 0, this.velocity.z);
    const target = moveDir.multiplyScalar(speed);
    tangent.lerp(target, this.onGround ? 0.22 : 0.05);

    let vy = this.velocity.y - this.gravity * delta;
    if (this.onGround && this.input.isActive('jump')) vy = Math.sqrt(2 * this.gravity * 2.2);

    this.velocity.set(tangent.x, vy, tangent.z);
    this.position.addScaledVector(this.velocity, delta);

    const groundY = surface.getHeightAt(this.position.x, this.position.z) + this.headHeight;
    if (this.position.y <= groundY + 1e-3) {
      this.position.y = groundY;
      this.velocity.y = Math.max(this.velocity.y, 0);
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.applyPlanarCamera();
  }

  private updateSpherical(delta: number): void {
    if (this.input.isPointerLocked) {
      const m = this.input.consumeMouseDelta();
      this.yaw -= m.x * 0.0022;
      this.pitch = clamp(this.pitch - m.y * 0.0022, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    }

    this.up.copy(this.position).normalize();
    this.rebuildSphericalBasis();

    const moveDir = new Vector3();
    if (this.input.isActive('forward')) moveDir.add(this.forward);
    if (this.input.isActive('back')) moveDir.sub(this.forward);
    if (this.input.isActive('right')) moveDir.add(this.right);
    if (this.input.isActive('left')) moveDir.sub(this.right);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const sprint = this.input.isActive('sprint') ? 2.2 : 1.0;
    const speed = 6 * sprint;
    const tangentVel = this.velocity.clone().projectOnPlane(this.up);
    const target = moveDir.multiplyScalar(speed);
    tangentVel.lerp(target, this.onGround ? 0.22 : 0.03);

    const radialVel = this.velocity.dot(this.up);
    let vertical = radialVel - this.gravity * 3 * delta;
    if (this.onGround && this.input.isActive('jump')) {
      vertical = Math.sqrt(2 * this.gravity * 3 * 2.2);
    }

    this.velocity.copy(tangentVel).add(this.up.clone().multiplyScalar(vertical));
    this.position.addScaledVector(this.velocity, delta);

    const surfaceR = this.planetRadius + this.headHeight;
    if (this.position.length() <= surfaceR + 1e-3) {
      this.position.setLength(surfaceR);
      this.velocity.copy(tangentVel);
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.applySphericalCamera();
  }

  private rebuildSphericalBasis(): void {
    const ref = Math.abs(this.up.dot(WORLD_UP)) > 0.95 ? new Vector3(0, 0, 1) : WORLD_UP;
    this.right.copy(ref).cross(this.up).normalize();
    this.forward.copy(this.up).cross(this.right).normalize();
    const q = new Quaternion().setFromAxisAngle(this.up, this.yaw);
    this.forward.applyQuaternion(q);
    this.right.applyQuaternion(q);
  }

  private rebuildPlanarBasis(): void {
    this.forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.up.set(0, 1, 0);
  }

  private applySphericalCamera(): void {
    this.camera.position.copy(this.position);
    const look = this.forward.clone();
    const q = new Quaternion().setFromAxisAngle(this.right, this.pitch);
    look.applyQuaternion(q);
    this.camera.up.copy(this.up);
    this.camera.lookAt(this.position.clone().add(look));
  }

  private applyPlanarCamera(): void {
    this.camera.position.copy(this.position);
    const look = this.forward.clone();
    const q = new Quaternion().setFromAxisAngle(this.right, this.pitch);
    look.applyQuaternion(q);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.position.clone().add(look));
  }
}
