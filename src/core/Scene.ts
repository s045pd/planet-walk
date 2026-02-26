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
    this.scene.background = new THREE.Color(0x050916);
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
        topColor: { value: new THREE.Color(0x0b1230) },
        bottomColor: { value: new THREE.Color(0x050916) },
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
    const starSizeMultiplier = 3.0;
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const brightness = new Float32Array(STAR_COUNT);
    const minRadius = EARTH_RADIUS * 45;
    const maxRadius = EARTH_RADIUS * 65;
    const visibilityUniform = { value: 1.0 };

    for (let i = 0; i < STAR_COUNT; i++) {
      const r = THREE.MathUtils.lerp(minRadius, maxRadius, Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = THREE.MathUtils.randFloat(3.0, 8.8);
      brightness[i] = THREE.MathUtils.randFloat(0.9, 1.7);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      uniforms: {
        visibility: visibilityUniform,
        sizeMultiplier: { value: starSizeMultiplier },
        brightnessBoost: { value: 1.45 },
      },
      vertexShader: `
        attribute float size;
        attribute float brightness;
        uniform float sizeMultiplier;
        varying float vBrightness;

        void main() {
          vBrightness = brightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mvPosition.xyz);
          gl_PointSize = max(2.0, size * sizeMultiplier * (300.0 / max(dist * 0.004, 1.0)));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float visibility;
        uniform float brightnessBoost;
        varying float vBrightness;

        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.05, d);
          float glow = core * vBrightness * brightnessBoost;
          float alpha = clamp(glow * visibility, 0.0, 1.0);
          vec3 color = vec3(0.92, 0.95, 1.0) * glow;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    this.stars = new THREE.Points(geometry, material);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = -90;
    this.scene.add(this.stars);

    const milkyCount = Math.max(2200, Math.floor(STAR_COUNT * 0.5));
    const milkyPositions = new Float32Array(milkyCount * 3);
    const milkySizes = new Float32Array(milkyCount);
    const milkyBrightness = new Float32Array(milkyCount);
    const bandDirection = new THREE.Vector3();
    const bandTiltAxis = new THREE.Vector3(1, 0.22, 0.15).normalize();
    const bandTilt = new THREE.Quaternion().setFromAxisAngle(
      bandTiltAxis,
      THREE.MathUtils.degToRad(38),
    );
    for (let i = 0; i < milkyCount; i++) {
      const r = THREE.MathUtils.lerp(minRadius * 0.92, maxRadius * 0.98, Math.random());
      const theta = Math.random() * Math.PI * 2;
      const bandOffset = THREE.MathUtils.randFloatSpread(0.16);
      const c = Math.cos(bandOffset);

      bandDirection
        .set(Math.cos(theta) * c, Math.sin(bandOffset), Math.sin(theta) * c)
        .applyQuaternion(bandTilt);

      milkyPositions[i * 3] = bandDirection.x * r;
      milkyPositions[i * 3 + 1] = bandDirection.y * r;
      milkyPositions[i * 3 + 2] = bandDirection.z * r;
      milkySizes[i] = THREE.MathUtils.randFloat(2.4, 6.8);
      milkyBrightness[i] = THREE.MathUtils.randFloat(0.25, 0.65);
    }

    const milkyGeometry = new THREE.BufferGeometry();
    milkyGeometry.setAttribute('position', new THREE.BufferAttribute(milkyPositions, 3));
    milkyGeometry.setAttribute('size', new THREE.BufferAttribute(milkySizes, 1));
    milkyGeometry.setAttribute('brightness', new THREE.BufferAttribute(milkyBrightness, 1));

    const milkyMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      uniforms: {
        visibility: visibilityUniform,
        sizeMultiplier: { value: starSizeMultiplier },
        brightnessBoost: { value: 0.6 },
      },
      vertexShader: `
        attribute float size;
        attribute float brightness;
        uniform float sizeMultiplier;
        varying float vBrightness;

        void main() {
          vBrightness = brightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mvPosition.xyz);
          gl_PointSize = max(1.2, size * sizeMultiplier * (280.0 / max(dist * 0.004, 1.0)));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float visibility;
        uniform float brightnessBoost;
        varying float vBrightness;

        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float core = smoothstep(0.5, 0.05, d) * 0.6;
          float glow = core * vBrightness * brightnessBoost;
          float alpha = clamp(glow * visibility * 0.78, 0.0, 1.0);
          vec3 color = mix(vec3(0.46, 0.56, 0.86), vec3(0.85, 0.88, 1.0), vBrightness) * glow;
          gl_FragColor = vec4(color, alpha);
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
