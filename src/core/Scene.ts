import * as THREE from 'three';
import type { IDisposable } from './types';
import { EARTH_RADIUS, STAR_COUNT } from '../utils/constants';
import { Planet } from '../planet/Planet';

/** 场景管理：星球实体 + 星空粒子背景 */
export class SceneManager implements IDisposable {
  readonly scene: THREE.Scene;

  private readonly planet: Planet;
  private stars!: THREE.Points;

  constructor(planet: Planet) {
    this.planet = planet;
    this.scene = new THREE.Scene();
    this.addPlanet();
    this.createStars();
    this.createLights();
  }

  private addPlanet(): void {
    this.scene.add(this.planet.root);
  }

  private createStars(): void {
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = EARTH_RADIUS * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 2);
    directional.position.set(EARTH_RADIUS * 5, EARTH_RADIUS * 3, EARTH_RADIUS * 4);
    this.scene.add(directional);
  }

  dispose(): void {
    this.planet.dispose();
    this.stars.geometry.dispose();
    (this.stars.material as THREE.Material).dispose();
  }
}
