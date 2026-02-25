import * as THREE from 'three';
import type { IDisposable } from './types';
import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR, EARTH_RADIUS } from '../utils/constants';

/** 相机系统 */
export class CameraSystem implements IDisposable {
  readonly camera: THREE.PerspectiveCamera;

  constructor() {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, CAMERA_NEAR, CAMERA_FAR);
    this.camera.position.set(0, 0, EARTH_RADIUS * 3);
    this.camera.lookAt(0, 0, 0);
  }

  resize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    // 相机无需特殊清理
  }
}
