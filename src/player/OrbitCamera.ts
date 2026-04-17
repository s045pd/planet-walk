import { PerspectiveCamera, Vector3 } from 'three';

import { clamp, damp } from '../utils/math';

export interface OrbitState {
  azimuth: number;
  polar: number;
  distance: number;
}

export class OrbitCamera {
  private camera: PerspectiveCamera;
  private target = new Vector3();
  private state: OrbitState;
  private desired: OrbitState;
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private minDistance: number;
  private maxDistance: number;
  private surfaceDistance: number;

  constructor(camera: PerspectiveCamera, planetRadius: number) {
    this.camera = camera;
    this.minDistance = planetRadius * 1.6;
    this.maxDistance = planetRadius * 7;
    this.surfaceDistance = planetRadius * 1.05;
    this.state = { azimuth: 0.4, polar: 1.2, distance: planetRadius * 3 };
    this.desired = { ...this.state };
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('wheel', this.onWheel, { passive: false });
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('wheel', this.onWheel);
  }

  reconfigure(planetRadius: number): void {
    this.minDistance = planetRadius * 1.6;
    this.maxDistance = planetRadius * 7;
    this.surfaceDistance = planetRadius * 1.05;
    this.desired.distance = clamp(this.desired.distance, this.minDistance, this.maxDistance);
  }

  getApproachDistance(): number {
    return this.surfaceDistance;
  }

  getState(): Readonly<OrbitState> {
    return this.state;
  }

  setDesired(partial: Partial<OrbitState>): void {
    if (partial.azimuth !== undefined) this.desired.azimuth = partial.azimuth;
    if (partial.polar !== undefined) this.desired.polar = clamp(partial.polar, 0.15, Math.PI - 0.15);
    if (partial.distance !== undefined) this.desired.distance = clamp(partial.distance, this.minDistance, this.maxDistance);
  }

  update(delta: number): void {
    this.state.azimuth = damp(this.state.azimuth, this.desired.azimuth, 8, delta);
    this.state.polar = damp(this.state.polar, this.desired.polar, 8, delta);
    this.state.distance = damp(this.state.distance, this.desired.distance, 6, delta);

    const { azimuth, polar, distance } = this.state;
    const sinPolar = Math.sin(polar);
    this.camera.position.set(
      this.target.x + distance * sinPolar * Math.cos(azimuth),
      this.target.y + distance * Math.cos(polar),
      this.target.z + distance * sinPolar * Math.sin(azimuth),
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.target);
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    if (document.pointerLockElement) return;
    const target = event.target as HTMLElement | null;
    if (target && target.closest('[data-ui]')) return;
    this.dragging = true;
    this.lastPointer.x = event.clientX;
    this.lastPointer.y = event.clientY;
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer.x = event.clientX;
    this.lastPointer.y = event.clientY;
    this.desired.azimuth -= dx * 0.005;
    this.desired.polar = clamp(this.desired.polar - dy * 0.005, 0.15, Math.PI - 0.15);
  };

  private onPointerUp = (): void => {
    this.dragging = false;
  };

  private onWheel = (event: WheelEvent): void => {
    if (document.pointerLockElement) return;
    event.preventDefault();
    const zoom = Math.exp(event.deltaY * 0.001);
    this.desired.distance = clamp(this.desired.distance * zoom, this.minDistance, this.maxDistance);
  };
}
