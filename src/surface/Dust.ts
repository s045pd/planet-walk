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
    gl_FragColor = vec4(uColor, alpha * 0.28);
  }
`;

export interface DustOptions {
  color: Color;
  count: number;
  radius: number;
}

export class Dust {
  readonly points: Points;
  private geo: BufferGeometry;
  private material: ShaderMaterial;
  private count: number;
  private radius: number;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lives: Float32Array;
  private sizes: Float32Array;
  private origin = new Vector3();
  private windX = 0.2;
  private windZ = 0.05;

  constructor(options: DustOptions) {
    this.count = options.count;
    this.radius = options.radius;

    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.lives = new Float32Array(this.count);
    this.sizes = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) this.spawn(i, true);

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

  setOrigin(v: Vector3): void {
    this.origin.copy(v);
  }

  setWind(intensity: number): void {
    this.windX = 0.1 + intensity * 2.2;
    this.windZ = 0.05 + intensity * 0.6;
  }

  update(delta: number): void {
    for (let i = 0; i < this.count; i++) {
      const ix = i * 3;
      this.positions[ix + 0] += this.velocities[ix + 0] * delta + this.windX * delta;
      this.positions[ix + 1] += this.velocities[ix + 1] * delta;
      this.positions[ix + 2] += this.velocities[ix + 2] * delta + this.windZ * delta;
      this.lives[i] -= delta * 0.15;

      const dx = this.positions[ix + 0] - this.origin.x;
      const dz = this.positions[ix + 2] - this.origin.z;
      if (this.lives[i] <= 0 || dx * dx + dz * dz > this.radius * this.radius) {
        this.spawn(i, false);
      }
    }
    (this.geo.attributes.position as BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aLife as BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }

  private spawn(index: number, initial: boolean): void {
    const ix = index * 3;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * this.radius;
    this.positions[ix + 0] = this.origin.x + Math.cos(angle) * r;
    this.positions[ix + 1] = this.origin.y - 1.2 + Math.random() * 7;
    this.positions[ix + 2] = this.origin.z + Math.sin(angle) * r;
    this.velocities[ix + 0] = (Math.random() - 0.5) * 0.3;
    this.velocities[ix + 1] = (Math.random() - 0.4) * 0.15;
    this.velocities[ix + 2] = (Math.random() - 0.5) * 0.3;
    this.lives[index] = initial ? Math.random() : 0.7 + Math.random() * 0.3;
    this.sizes[index] = 1.5 + Math.random() * 3;
  }
}
