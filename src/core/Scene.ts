import * as THREE from 'three';
import type { IDisposable } from './types';
import { EARTH_RADIUS, STAR_COUNT } from '../utils/constants';
import { Planet } from '../planet/Planet';

/** 场景管理：星球实体 + 星空粒子背景 */
export class SceneManager implements IDisposable {
  readonly scene: THREE.Scene;

  private planet: Planet;
  private skybox!: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private stars!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private sunTarget!: THREE.Object3D;

  constructor(planet: Planet) {
    this.planet = planet;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.createSkybox();
    this.addPlanet();
    this.createStars();
    this.createLights();
  }

  get planetName(): string {
    return this.planet.config.name;
  }

  get planetRadius(): number {
    return this.planet.config.radius;
  }

  get skyboxMaterial(): THREE.ShaderMaterial {
    return this.skybox.material;
  }

  get starsMaterial(): THREE.ShaderMaterial {
    return this.stars.material;
  }

  get sunlight(): THREE.DirectionalLight {
    return this.sunLight;
  }

  get ambient(): THREE.AmbientLight {
    return this.ambientLight;
  }

  replacePlanet(planet: Planet): void {
    this.scene.remove(this.planet.root);
    this.planet.dispose();
    this.planet = planet;
    this.addPlanet();
  }

  private addPlanet(): void {
    this.scene.add(this.planet.root);
  }

  private createSkybox(): void {
    const geometry = new THREE.SphereGeometry(EARTH_RADIUS * 120, 32, 32);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x000000) },
        bottomColor: { value: new THREE.Color(0x000000) },
        brightness: { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;

        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float brightness;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y * 0.5 + 0.5;
          vec3 color = mix(bottomColor, topColor, smoothstep(0.0, 1.0, h)) * brightness;
          float alpha = clamp(brightness, 0.0, 1.0);
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    this.skybox = new THREE.Mesh(geometry, material);
    this.skybox.renderOrder = -100;
    this.scene.add(this.skybox);
  }

  private createStars(): void {
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const colors = new Float32Array(STAR_COUNT * 3);
    const starRadius = EARTH_RADIUS * 55;
    const visibilityUniform = { value: 1.0 };

    // 真实星空：大量暗星 + 少数亮星，颜色偏暖白/冷白
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

      positions[i * 3] = starRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = starRadius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = starRadius * Math.cos(phi);

      // 1-2px 的锐利点星，不做光晕
      const isBright = Math.random() < 0.15;
      sizes[i] = isBright ? THREE.MathUtils.randFloat(1.4, 2.0) : THREE.MathUtils.randFloat(1.0, 1.4);

      // 星星颜色：白色为主，少量偏暖(橙)或偏冷(蓝白)
      const colorRoll = Math.random();
      if (colorRoll < 0.82) {
        // 白色
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
      } else if (colorRoll < 0.92) {
        // 暖白/淡黄
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.86;
      } else {
        // 冷白/淡蓝白
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.94; colors[i * 3 + 2] = 1.0;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('starColor', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      uniforms: {
        visibility: visibilityUniform,
      },
      vertexShader: `
        attribute float size;
        attribute vec3 starColor;
        varying vec3 vColor;

        void main() {
          vColor = starColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float visibility;
        varying vec3 vColor;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.48) discard;
          gl_FragColor = vec4(vColor, visibility);
        }
      `,
    });

    this.stars = new THREE.Points(geometry, material);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -90;
    this.scene.add(this.stars);
  }

  private createLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x25303f, 0.35);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff6dd, 2.2);
    this.sunLight.position
      .set(EARTH_RADIUS * 28, EARTH_RADIUS * 10, EARTH_RADIUS * 22)
      .normalize()
      .multiplyScalar(EARTH_RADIUS * 60);

    this.sunTarget = new THREE.Object3D();
    this.sunTarget.position.set(0, 0, 0);
    this.sunLight.target = this.sunTarget;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunTarget);
  }

  dispose(): void {
    this.planet.dispose();
    this.skybox.geometry.dispose();
    this.skybox.material.dispose();
    this.stars.geometry.dispose();
    this.stars.material.dispose();
  }
}
