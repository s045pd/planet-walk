const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const GRAD3: ReadonlyArray<readonly [number, number, number]> = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];

/** Simplex noise generator for procedural terrain. */
export class SimplexNoise {
  private readonly perm: Uint8Array;
  private readonly permMod12: Uint8Array;

  constructor(seed = 0) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);

    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    let s = Math.floor(seed);
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = Math.abs(s) % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise2D(xin: number, yin: number): number {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;

    const x0 = xin - (i - t);
    const y0 = yin - (j - t);

    let i1: 0 | 1;
    let j1: 0 | 1;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0;
    let n1 = 0;
    let n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      const gi0 = this.permMod12[ii + this.perm[jj]];
      const grad0 = GRAD3[gi0];
      n0 = t0 * t0 * (grad0[0] * x0 + grad0[1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
      const grad1 = GRAD3[gi1];
      n1 = t1 * t1 * (grad1[0] * x1 + grad1[1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
      const grad2 = GRAD3[gi2];
      n2 = t2 * t2 * (grad2[0] * x2 + grad2[1] * y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  fbm(
    x: number,
    y: number,
    octaves = 6,
    lacunarity = 2,
    persistence = 0.5,
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return maxValue === 0 ? 0 : value / maxValue;
  }

  ridgeNoise(
    x: number,
    y: number,
    octaves = 4,
    lacunarity = 2,
    persistence = 0.5,
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      let n = this.noise2D(x * frequency, y * frequency);
      n = 1 - Math.abs(n);
      n *= n;

      value += amplitude * n;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return maxValue === 0 ? 0 : value / maxValue;
  }
}
