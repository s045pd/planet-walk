import {
  ACESFilmicToneMapping,
  Clock,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import type { Updatable } from './types';

export interface EngineStats {
  fps: number;
  drawCalls: number;
}

const vignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.42 },
    uGrainAmount: { value: 0.035 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uGrainAmount;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5;
      float r = length(d);
      float v = 1.0 - smoothstep(0.28, 0.82, r) * uStrength;
      col.rgb *= v;
      float n = (hash(vUv * 1000.0) - 0.5) * uGrainAmount;
      col.rgb += n;
      gl_FragColor = col;
    }
  `,
};

export class Engine {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly clock = new Clock();
  readonly stats: EngineStats = { fps: 0, drawCalls: 0 };

  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private systems: Updatable[] = [];
  private running = false;
  private frameAccum = 0;
  private frameCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      logarithmicDepthBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.camera = new PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 50_000);
    this.camera.position.set(0, 0, 3000);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(window.innerWidth, window.innerHeight);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new Vector2(window.innerWidth, window.innerHeight),
      0.22, // strength: subtle — post-ACES pipeline means we want gentle lift only
      0.35, // radius
      1.3,  // threshold: bloom fires only on sun disc / specular highlights (linear space)
    );
    this.composer.addPass(this.bloomPass);

    const vignettePass = new ShaderPass(vignetteShader);
    this.composer.addPass(vignettePass);

    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', this.handleResize);
  }

  register(system: Updatable): void {
    this.systems.push(system);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  setBloom(strength: number, threshold: number): void {
    this.bloomPass.strength = strength;
    this.bloomPass.threshold = threshold;
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.composer.dispose();
    this.renderer.dispose();
  }

  private loop = (): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    for (const system of this.systems) system.update(delta);

    this.composer.render(delta);

    this.frameAccum += delta;
    this.frameCount++;
    if (this.frameAccum >= 0.5) {
      this.stats.fps = this.frameCount / this.frameAccum;
      this.stats.drawCalls = this.renderer.info.render.calls;
      this.frameAccum = 0;
      this.frameCount = 0;
    }
  };

  private handleResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloomPass.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };
}
