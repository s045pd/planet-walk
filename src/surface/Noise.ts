const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

const grad3: ReadonlyArray<readonly [number, number]> = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
];

export class SimplexNoise {
  private perm = new Uint8Array(512);
  private permMod8 = new Uint8Array(512);

  constructor(seed = 0) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = (seed | 0) || 1;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod8[i] = this.perm[i] & 7;
    }
  }

  noise2D(xin: number, yin: number): number {
    const { perm, permMod8 } = this;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;

    const accum = (gi: number, x: number, y: number): number => {
      let t0 = 0.5 - x * x - y * y;
      if (t0 < 0) return 0;
      t0 *= t0;
      const g = grad3[gi];
      return t0 * t0 * (g[0] * x + g[1] * y);
    };

    const n0 = accum(permMod8[ii + perm[jj]], x0, y0);
    const n1 = accum(permMod8[ii + i1 + perm[jj + j1]], x1, y1);
    const n2 = accum(permMod8[ii + 1 + perm[jj + 1]], x2, y2);
    return 70 * (n0 + n1 + n2);
  }

  fbm(x: number, y: number, octaves = 5, lacunarity = 2, persistence = 0.5): number {
    let value = 0;
    let amp = 1;
    let freq = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      value += amp * this.noise2D(x * freq, y * freq);
      max += amp;
      amp *= persistence;
      freq *= lacunarity;
    }
    return value / max;
  }

  ridge(x: number, y: number, octaves = 4, lacunarity = 2, persistence = 0.5): number {
    let value = 0;
    let amp = 1;
    let freq = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      let n = this.noise2D(x * freq, y * freq);
      n = 1 - Math.abs(n);
      n *= n;
      value += amp * n;
      max += amp;
      amp *= persistence;
      freq *= lacunarity;
    }
    return value / max;
  }
}
