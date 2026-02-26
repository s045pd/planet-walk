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
  private milkyWay!: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
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
          gl_FragColor = vec4(color, 1.0);
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

      // 大部分星星很小(1-1.5px)，少数亮星稍大(2-3px)
      const isBright = Math.random() < 0.08;
      sizes[i] = isBright ? THREE.MathUtils.randFloat(2.0, 3.0) : THREE.MathUtils.randFloat(0.8, 1.5);

      // 星星颜色：白色为主，少量偏暖(橙)或偏冷(蓝白)
      const colorRoll = Math.random();
      if (colorRoll < 0.7) {
        // 白色
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0;
      } else if (colorRoll < 0.85) {
        // 暖白/淡黄
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.92; colors[i * 3 + 2] = 0.8;
      } else {
        // 冷白/淡蓝白
        colors[i * 3] = 0.85; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0;
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
          if (d > 0.5) discard;
          float sharp = smoothstep(0.5, 0.15, d);
          gl_FragColor = vec4(vColor * sharp, sharp * visibility);
        }
      `,
    });

    this.stars = new THREE.Points(geometry, material);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -90;
    this.scene.add(this.stars);

    // 银河带：密集的微小星点形成带状结构
    const milkyCount = Math.max(3000, Math.floor(STAR_COUNT * 0.6));
    const milkyPositions = new Float32Array(milkyCount * 3);
    const milkySizes = new Float32Array(milkyCount);
    const milkyColors = new Float32Array(milkyCount * 3);
    const bandDirection = new THREE.Vector3();
    const bandTiltAxis = new THREE.Vector3(1, 0.22, 0.15).normalize();
    const bandTilt = new THREE.Quaternion().setFromAxisAngle(
      bandTiltAxis,
      THREE.MathUtils.degToRad(38),
    );
    for (let i = 0; i < milkyCount; i++) {
      const r = starRadius * THREE.MathUtils.randFloat(0.92, 0.99);
      const theta = Math.random() * Math.PI * 2;
      const bandOffset = THREE.MathUtils.randFloatSpread(0.18);
      const c = Math.cos(bandOffset);

      bandDirection
        .set(Math.cos(theta) * c, Math.sin(bandOffset), Math.sin(theta) * c)
        .applyQuaternion(bandTilt);

      milkyPositions[i * 3] = bandDirection.x * r;
      milkyPositions[i * 3 + 1] = bandDirection.y * r;
      milkyPositions[i * 3 + 2] = bandDirection.z * r;
      milkySizes[i] = THREE.MathUtils.randFloat(0.5, 1.2);
      // 银河偏淡蓝白
      const b = THREE.MathUtils.randFloat(0.6, 1.0);
      milkyColors[i * 3] = b * 0.85;
      milkyColors[i * 3 + 1] = b * 0.9;
      milkyColors[i * 3 + 2] = b;
    }

    const milkyGeometry = new THREE.BufferGeometry();
    milkyGeometry.setAttribute('position', new THREE.BufferAttribute(milkyPositions, 3));
    milkyGeometry.setAttribute('size', new THREE.BufferAttribute(milkySizes, 1));
    milkyGeometry.setAttribute('starColor', new THREE.BufferAttribute(milkyColors, 3));

    const milkyMaterial = new THREE.ShaderMaterial({
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
          if (d > 0.5) discard;
          float sharp = smoothstep(0.5, 0.2, d);
          gl_FragColor = vec4(vColor * sharp, sharp * visibility * 0.7);
        }
      `,
    });

    this.milkyWay = new THREE.Points(milkyGeometry, milkyMaterial);
    this.milkyWay.frustumCulled = false;
    this.milkyWay.renderOrder = -80;
    this.scene.add(this.milkyWay);
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
    this.milkyWay.geometry.dispose();
    this.milkyWay.material.dispose();
  }
}
