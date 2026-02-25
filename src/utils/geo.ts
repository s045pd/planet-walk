import * as THREE from 'three';

/** 经纬度转 3D 笛卡尔坐标 */
export function geoToCartesian(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/** 3D 坐标转经纬度 */
export function cartesianToGeo(
  position: THREE.Vector3,
  radius: number,
): { lat: number; lng: number; alt: number } {
  const alt = position.length() - radius;
  const normalized = position.clone().normalize();
  const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI);
  const lng =
    Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;

  return { lat, lng: ((lng + 540) % 360) - 180, alt };
}
