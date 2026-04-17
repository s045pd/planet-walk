import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aLife;
  varying float vLife;
  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (28.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying float vLife;
  uniform vec3 uColor;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, r) * vLife;
    gl_FragColor = vec4(uColor, alpha * 0.55);
  }
`;

export interface WalkDustOptions {
  color: Color;
  capacity: number;
}

export class WalkDust {
  readonly points: Points;
  private geo: BufferGeometry;
  private material: ShaderMaterial;
  private capacity: number;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lives: Float32Array;
  private sizes: Float32Array;
  private cursor = 0;
  private origin = new Vector3();
  private emitting = false;
  private emitAccum = 0;
  private emitRate = 32;
  private sprintBoost = 1;

  constructor(options: WalkDustOptions) {
    this.capacity = options.capacity;
    this.positions = new Float32Array(this.capacity * 3);
    this.velocities = new Float32Array(this.capacity * 3);
    this.lives = new Float32Array(this.capacity);
    this.sizes = new Float32Array(this.capacity);
    for (let i = 0; i < this.capacity; i++) this.lives[i] = 0;

    this.geo = new BufferGeometry();
    this.geo.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geo.setAttribute('aLife', new BufferAttribute(this.lives, 1));
    this.geo.setAttribute('aSize', new BufferAttribute(this.sizes, 1));

    this.material = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: { value: options.color.clone() },
      },
    });

    this.points = new Points(this.geo, this.material);
    this.points.frustumCulled = false;
  }

  setEmitter(position: Vector3, emitting: boolean, sprinting: boolean): void {
    this.origin.copy(position);
    this.emitting = emitting;
    this.sprintBoost = sprinting ? 1.8 : 1;
  }

  update(delta: number): void {
    for (let i = 0; i < this.capacity; i++) {
      if (this.lives[i] <= 0) continue;
      const ix = i * 3;
      this.positions[ix + 0] += this.velocities[ix + 0] * delta;
      this.positions[ix + 1] += this.velocities[ix + 1] * delta;
      this.positions[ix + 2] += this.velocities[ix + 2] * delta;
      this.velocities[ix + 1] -= 4 * delta; // gravity tug
      this.lives[i] -= delta * 1.4;
      if (this.lives[i] < 0) this.lives[i] = 0;
    }

    if (this.emitting) {
      this.emitAccum += delta * this.emitRate * this.sprintBoost;
      while (this.emitAccum >= 1) {
        this.emitAccum -= 1;
        this.spawn();
      }
    } else {
      this.emitAccum = 0;
    }

    (this.geo.attributes.position as BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aLife as BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aSize as BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }

  private spawn(): void {
    const idx = this.cursor;
    this.cursor = (this.cursor + 1) % this.capacity;
    const ix = idx * 3;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.5;
    this.positions[ix + 0] = this.origin.x + Math.cos(angle) * r;
    this.positions[ix + 1] = this.origin.y - 1.5 + Math.random() * 0.3;
    this.positions[ix + 2] = this.origin.z + Math.sin(angle) * r;
    const vang = Math.random() * Math.PI * 2;
    const vr = 0.8 + Math.random() * 1.2;
    this.velocities[ix + 0] = Math.cos(vang) * vr;
    this.velocities[ix + 1] = 1.2 + Math.random() * 1.8;
    this.velocities[ix + 2] = Math.sin(vang) * vr;
    this.lives[idx] = 0.8 + Math.random() * 0.4;
    this.sizes[idx] = 2.5 + Math.random() * 2.5;
  }
}
