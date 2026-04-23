import type { Vector3 } from 'three';

export type Mode = 'orbit' | 'surface';

export interface FlightPhase {
  id: string;
  label: string;
  state: 'done' | 'active' | 'pending';
}

export interface Telemetry {
  worldId: string;
  worldName: string;
  lat: number;
  lon: number;
  altitude: number;
  velocity: number;
  gravity: number;
  heading: number;
  pitch: number;
  roll: number;
  sol: number;
  localTime: string;
  mode: Mode;
  fps: number;
  drawCalls: number;
  memoryMB: number;
}

export interface Updatable {
  update(delta: number): void;
}

export interface PlayerPose {
  position: Vector3;
  forward: Vector3;
  up: Vector3;
  velocity: Vector3;
}
