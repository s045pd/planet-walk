import { Vector3 } from 'three';

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function latLonToVec3(latDeg: number, lonDeg: number, radius: number, out = new Vector3()): Vector3 {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  const cosLat = Math.cos(lat);
  out.set(
    radius * cosLat * Math.cos(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.sin(lon),
  );
  return out;
}

export function vec3ToLatLon(pos: Vector3): { lat: number; lon: number } {
  const r = pos.length();
  if (r < 1e-6) return { lat: 0, lon: 0 };
  const lat = Math.asin(pos.y / r) * RAD;
  const lon = Math.atan2(pos.z, pos.x) * RAD;
  return { lat, lon };
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function damp(current: number, target: number, lambda: number, delta: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * delta));
}

export function formatDeg(value: number, axis: 'lat' | 'lon'): string {
  const sign = value >= 0 ? (axis === 'lat' ? '+' : '+') : '−';
  const abs = Math.abs(value).toFixed(3);
  return `${sign}${abs}°`;
}
