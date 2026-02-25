import * as THREE from 'three';

/**
 * 视锥体裁剪工具类
 * 用于判断包围球或包围盒是否在相机的视锥体内
 */
export class FrustumCuller {
  private frustum: THREE.Frustum;
  private projScreenMatrix: THREE.Matrix4;

  constructor() {
    this.frustum = new THREE.Frustum();
    this.projScreenMatrix = new THREE.Matrix4();
  }

  /**
   * 根据相机更新视锥体
   * @param camera 当前渲染相机
   */
  update(camera: THREE.Camera): void {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  /**
   * 判断包围球是否在视锥体内
   * @param center 球心坐标
   * @param radius 球体半径
   * @returns 是否在视锥体内
   */
  intersectsSphere(center: THREE.Vector3, radius: number): boolean {
    const sphere = new THREE.Sphere(center, radius);
    return this.frustum.intersectsSphere(sphere);
  }

  /**
   * 判断包围盒是否在视锥体内
   * @param box 包围盒
   * @returns 是否在视锥体内
   */
  intersectsBox(box: THREE.Box3): boolean {
    return this.frustum.intersectsBox(box);
  }
}
