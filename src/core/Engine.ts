import {
  ACESFilmicToneMapping,
  Clock,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';

import type { Updatable } from './types';

export interface EngineStats {
  fps: number;
  drawCalls: number;
}

export class Engine {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly clock = new Clock();
  readonly stats: EngineStats = { fps: 0, drawCalls: 0 };

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

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }

  private loop = (): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    for (const system of this.systems) system.update(delta);

    this.renderer.render(this.scene, this.camera);

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
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };
}
