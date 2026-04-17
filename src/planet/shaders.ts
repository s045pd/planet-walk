export const planetVert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vPos = position;
    vNormal = normal;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const planetFrag = /* glsl */ `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  uniform vec3 uBaseLow;
  uniform vec3 uBaseMid;
  uniform vec3 uBaseHigh;
  uniform vec3 uPolar;
  uniform vec3 uSunDir;
  uniform float uRoughness;
  uniform float uCratering;
  uniform float uBanding;
  uniform float uTime;

  // hash & noise (IQ)
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 p = normalize(vPos);

    // terrain fbm — mixes base tones across roughness bands
    float terrain = fbm(p * 2.5);
    float detail = fbm(p * 8.0 + terrain);
    float combined = mix(terrain, detail, uRoughness);

    // horizontal banding (jupiter-like if uBanding high)
    float bands = sin(p.y * 9.0 + fbm(p * 1.5) * 2.0) * 0.5 + 0.5;
    float bandMix = mix(1.0, bands, uBanding);

    vec3 col = mix(uBaseLow, uBaseMid, smoothstep(0.25, 0.55, combined * bandMix));
    col = mix(col, uBaseHigh, smoothstep(0.55, 0.85, combined * bandMix));

    // impact craters (moon / mercury)
    if (uCratering > 0.01) {
      float crater = fbm(p * 14.0);
      float rings = smoothstep(0.72, 0.78, crater) - smoothstep(0.78, 0.82, crater);
      col -= rings * 0.18 * uCratering;
      col += smoothstep(0.82, 0.92, crater) * 0.15 * uCratering;
    }

    // polar caps
    float polar = smoothstep(0.78, 0.94, abs(p.y));
    col = mix(col, uPolar, polar);

    // lambert + rim
    float lambert = max(dot(n, normalize(uSunDir)), 0.0);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
    col *= 0.15 + 0.95 * lambert;
    col += rim * 0.08 * uBaseHigh;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const atmosphereVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFrag = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPos;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunDir;
  void main() {
    float fresnel = pow(1.0 - abs(vNormal.z), 3.0);
    float sun = max(dot(normalize(vPos), normalize(uSunDir)), 0.0);
    vec3 col = uColor * fresnel * (0.4 + 0.6 * sun) * uIntensity;
    gl_FragColor = vec4(col, fresnel);
  }
`;

export const starfieldVert = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  void main() {
    vBrightness = aBrightness;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
    gl_Position = projectionMatrix * mv;
  }
`;

export const starfieldFrag = /* glsl */ `
  precision highp float;
  varying float vBrightness;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, r);
    gl_FragColor = vec4(vec3(glow * vBrightness), glow);
  }
`;
