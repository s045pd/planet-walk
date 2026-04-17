import {
  BackSide,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
} from 'three';

const skyVert = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const skyFrag = /* glsl */ `
  precision highp float;
  varying vec3 vPos;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunSize;
  uniform float uStarVisibility;
  // hash for starfield
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  void main() {
    vec3 dir = normalize(vPos);
    float h = smoothstep(-0.15, 0.55, dir.y);
    vec3 col = mix(uHorizon, uTop, h);

    // stars (visible at night and on airless bodies)
    if (uStarVisibility > 0.01 && dir.y > 0.0) {
      vec2 uv = dir.xz * 8.0 + dir.y * 2.0;
      float cell = hash(floor(uv * 30.0));
      float star = smoothstep(0.995, 1.0, cell);
      col += vec3(star) * uStarVisibility * (0.5 + 0.5 * hash(floor(uv * 14.0)));
    }

    // sun disc + glow
    vec3 sd = normalize(uSunDir);
    float sdot = max(dot(dir, sd), 0.0);
    float sun = smoothstep(0.998 - uSunSize, 0.998, sdot);
    float glow = pow(max(sdot, 0.0), 48.0) * 0.6;
    col = mix(col, uSunColor, sun);
    col += uSunColor * glow * 0.45;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export interface SkyOptions {
  top: Color;
  horizon: Color;
  sunColor: Color;
  sunDir: [number, number, number];
  radius: number;
}

export interface SkyPhase {
  top: Color;
  horizon: Color;
  sunDir: [number, number, number];
  sunColor: Color;
  sunSize: number;
  starVisibility: number;
}

export class Sky {
  readonly mesh: Mesh;
  private material: ShaderMaterial;

  constructor(options: SkyOptions) {
    const geo = new SphereGeometry(options.radius, 48, 24);
    this.material = new ShaderMaterial({
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      side: BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: options.top.clone() },
        uHorizon: { value: options.horizon.clone() },
        uSunColor: { value: options.sunColor.clone() },
        uSunDir: { value: options.sunDir },
        uSunSize: { value: 0.0025 },
        uStarVisibility: { value: 0 },
      },
    });
    this.mesh = new Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }

  setPhase(phase: SkyPhase): void {
    const u = this.material.uniforms;
    (u.uTop.value as Color).copy(phase.top);
    (u.uHorizon.value as Color).copy(phase.horizon);
    (u.uSunColor.value as Color).copy(phase.sunColor);
    u.uSunDir.value = phase.sunDir;
    u.uSunSize.value = phase.sunSize;
    u.uStarVisibility.value = phase.starVisibility;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
