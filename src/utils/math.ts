import * as THREE from 'three';

/** 将角度转为弧度 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/** 将弧度转为角度 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/** 在两个四元数之间平滑插值 */
export function slerpQuaternion(
  from: THREE.Quaternion,
  to: THREE.Quaternion,
  t: number,
): THREE.Quaternion {
  return from.clone().slerp(to, t);
}

/** 将值限制在 [min, max] 范围内 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
