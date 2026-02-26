import * as THREE from 'three';
import type { EngineConfig, IDisposable } from './types';

/** Three.js WebGL 渲染器封装 */
export class Engine implements IDisposable {
  readonly renderer: THREE.WebGLRenderer;

  constructor(config: EngineConfig) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      antialias: config.antialias,
      logarithmicDepthBuffer: config.logarithmicDepthBuffer,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(config.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  }

  resize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
