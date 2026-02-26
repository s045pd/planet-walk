import * as THREE from 'three';

/**
 * 程序化星球纹理生成器
 * 用噪声生成地球/火星/月球/金星/欧罗巴的占位纹理
 */
export class ProceduralTexture {
  private static readonly SIZE = 512;

  /** 生成地球纹理：蓝色海洋+绿色大陆 */
  static earth(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = this.SIZE;
    canvas.height = this.SIZE / 2;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width;
        const ny = y / canvas.height;
        const n = this.fbm(nx * 6, ny * 6, 4);

        let r: number, g: number, b: number;
        if (n < 0.45) {
          // 深海
          r = 20; g = 50; b = 120 + n * 80;
        } else if (n < 0.5) {
          // 浅海
          r = 40; g = 100; b = 180;
        } else if (n < 0.55) {
          // 沙滩
          r = 194; g = 178; b = 128;
        } else if (n < 0.7) {
          // 草地
          const t = (n - 0.55) / 0.15;
          r = 34 + t * 20; g = 120 - t * 40; b = 34;
        } else if (n < 0.85) {
          // 山地
          r = 100; g = 80; b = 60;
        } else {
          // 雪山
          r = 220; g = 220; b = 230;
        }

        ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /** 生成火星纹理：红褐色沙漠+暗色岩石 */
  static mars(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = this.SIZE;
    canvas.height = this.SIZE / 2;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width;
        const ny = y / canvas.height;
        const n = this.fbm(nx * 5, ny * 5, 3);

        const base = 140 + n * 80;
        const r = Math.min(255, base * 1.1) | 0;
        const g = (base * 0.55) | 0;
        const b = (base * 0.35) | 0;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /** 生成月球纹理：灰色表面+暗色环形山 */
  static moon(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = this.SIZE;
    canvas.height = this.SIZE / 2;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width;
        const ny = y / canvas.height;
        const n = this.fbm(nx * 4, ny * 4, 3);
        const crater = this.fbm(nx * 12, ny * 12, 2);

        let v = 120 + n * 60;
        if (crater < 0.35) v *= 0.7; // 环形山暗区
        const c = Math.min(255, v) | 0;

        ctx.fillStyle = `rgb(${c},${c},${(c * 0.95) | 0})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /** 生成金星纹理：橙黄色云带涡旋 */
  static venus(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = this.SIZE;
    canvas.height = this.SIZE / 2;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width;
        const ny = y / canvas.height;
        const swirl = Math.sin((ny * 14 + this.fbm(nx * 8, ny * 8, 3) * 5) * Math.PI);
        const cloud = this.fbm(nx * 7 + swirl * 0.7, ny * 7, 4);
        const warm = this.fbm(nx * 18, ny * 18, 2);
        const v = Math.min(1, Math.max(0, cloud * 0.75 + warm * 0.35));

        const r = 190 + v * 65 + swirl * 8;
        const g = 120 + v * 90;
        const b = 48 + v * 52;

        ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r)) | 0},${Math.min(255, Math.max(0, g)) | 0},${Math.min(255, Math.max(0, b)) | 0})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /** 生成欧罗巴纹理：冰蓝底色+暗色裂纹 */
  static europa(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = this.SIZE;
    canvas.height = this.SIZE / 2;
    const ctx = canvas.getContext('2d')!;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const nx = x / canvas.width;
        const ny = y / canvas.height;
        const ice = this.fbm(nx * 5, ny * 5, 4);
        const grain = this.fbm(nx * 20, ny * 20, 2);
        const ridge = Math.abs(
          Math.sin((nx * 22 + this.fbm(nx * 6, ny * 6, 2) * 3) * Math.PI) *
          Math.cos((ny * 16 + this.fbm(nx * 9, ny * 9, 2) * 2) * Math.PI),
        );
        const crack = ridge > 0.93 || Math.abs(Math.sin((nx + ny * 0.75) * 42)) > 0.992;

        let r = 176 + ice * 45 + grain * 12;
        let g = 202 + ice * 40 + grain * 10;
        let b = 222 + ice * 28 + grain * 8;

        if (crack) {
          r = 96 + grain * 10;
          g = 120 + grain * 12;
          b = 138 + grain * 14;
        }

        ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r)) | 0},${Math.min(255, Math.max(0, g)) | 0},${Math.min(255, Math.max(0, b)) | 0})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /** 简单的值噪声 */
  private static hash(x: number, y: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  /** 平滑噪声插值 */
  private static noise(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    const a = this.hash(ix, iy);
    const b = this.hash(ix + 1, iy);
    const c = this.hash(ix, iy + 1);
    const d = this.hash(ix + 1, iy + 1);

    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  /** 分形布朗运动 */
  private static fbm(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise(x * frequency, y * frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  }
}
