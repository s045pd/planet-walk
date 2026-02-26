import * as THREE from 'three';
import type { IDisposable } from '../core/types';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export type PhotoFilterType = 'normal' | 'vintage' | 'sci-fi' | 'bw';

export interface FilterManagerConfig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
}

const FilterShader = {
  uniforms: {
    tDiffuse: { value: null },
    uMode: { value: 0 },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uMode;
    uniform float uTime;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    vec3 applyVintage(vec3 color, vec2 uv) {
      vec3 sepia;
      sepia.r = dot(color, vec3(0.393, 0.769, 0.189));
      sepia.g = dot(color, vec3(0.349, 0.686, 0.168));
      sepia.b = dot(color, vec3(0.272, 0.534, 0.131));

      float dist = distance(uv, vec2(0.5));
      float vignette = smoothstep(0.82, 0.25, dist);
      float grain = (random(uv * 850.0 + vec2(uTime * 13.0)) - 0.5) * 0.08;

      return clamp(sepia * vignette + grain, 0.0, 1.0);
    }

    vec3 applyScifi(vec3 color, vec2 uv) {
      float scan = sin((uv.y + uTime * 0.55) * 980.0) * 0.05;
      float pulse = 0.92 + 0.08 * sin(uTime * 2.2);
      float noise = (random(uv * 420.0 + vec2(uTime * 31.0)) - 0.5) * 0.05;

      vec3 shifted;
      shifted.r = color.r * 0.45;
      shifted.g = color.g * 1.12;
      shifted.b = min(1.0, color.b * 1.35 + color.g * 0.25);

      shifted += vec3(0.0, 0.08, 0.14);
      shifted *= pulse;
      shifted += scan + noise;

      return clamp(shifted, 0.0, 1.0);
    }

    vec3 applyBW(vec3 color) {
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      return vec3(luma);
    }

    void main() {
      vec4 source = texture2D(tDiffuse, vUv);
      vec3 color = source.rgb;

      if (uMode < 0.5) {
        gl_FragColor = source;
        return;
      }

      if (uMode < 1.5) {
        color = applyVintage(color, vUv);
      } else if (uMode < 2.5) {
        color = applyScifi(color, vUv);
      } else {
        color = applyBW(color);
      }

      gl_FragColor = vec4(color, source.a);
    }
  `,
};

/** 照片模式后处理滤镜管理 */
export class FilterManager implements IDisposable {
  private readonly composer: EffectComposer;
  private readonly filterPass: ShaderPass;
  private currentFilter: PhotoFilterType = 'normal';

  constructor(config: FilterManagerConfig) {
    this.composer = new EffectComposer(config.renderer);
    this.composer.addPass(new RenderPass(config.scene, config.camera));

    this.filterPass = new ShaderPass(FilterShader);
    this.composer.addPass(this.filterPass);
  }

  get filter(): PhotoFilterType {
    return this.currentFilter;
  }

  setFilter(filter: PhotoFilterType): void {
    this.currentFilter = filter;

    if (filter === 'normal') {
      this.filterPass.uniforms.uMode.value = 0;
      return;
    }
    if (filter === 'vintage') {
      this.filterPass.uniforms.uMode.value = 1;
      return;
    }
    if (filter === 'sci-fi') {
      this.filterPass.uniforms.uMode.value = 2;
      return;
    }
    this.filterPass.uniforms.uMode.value = 3;
  }

  update(delta: number): void {
    this.filterPass.uniforms.uTime.value += Math.max(0, delta);
  }

  render(delta: number): void {
    this.composer.render(delta);
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
  }

  dispose(): void {
    // EffectComposer 没有统一dispose接口，主要资源由renderer管理。
  }
}
