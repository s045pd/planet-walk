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
  void main() {
    vec3 dir = normalize(vPos);
    float h = smoothstep(-0.15, 0.55, dir.y);
    vec3 col = mix(uHorizon, uTop, h);

    // sun disc
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
      },
    });
    this.mesh = new Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1;
  }

  setSunDirection(dir: [number, number, number]): void {
    this.material.uniforms.uSunDir.value = dir;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
