// Atmosphere fragment shader — Rayleigh + Mie scattering
// Based on Sean O'Neil's GPU Gems 2 atmospheric scattering model.

precision highp float;

// Planet / atmosphere geometry
uniform float planetRadius;
uniform float atmosphereRadius;
uniform vec3 planetCenter;

// Scattering coefficients
uniform vec3 rayleighCoeff;   // wavelength-dependent Rayleigh scattering
uniform float mieCoeff;       // Mie scattering coefficient
uniform float rayleighScale;  // Rayleigh scale height
uniform float mieScale;       // Mie scale height
uniform float mieDirection;   // Mie preferred scattering direction (g)
uniform float intensity;      // Sun intensity multiplier

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vSunDir;

const int NUM_SAMPLES = 8;
const int NUM_LIGHT_SAMPLES = 4;
const float PI = 3.14159265359;

// Ray-sphere intersection: returns (near, far) distances, or (-1,-1) on miss
vec2 raySphereIntersect(vec3 origin, vec3 dir, vec3 center, float radius) {
  vec3 oc = origin - center;
  float b = dot(oc, dir);
  float c = dot(oc, oc) - radius * radius;
  float disc = b * b - c;
  if (disc < 0.0) return vec2(-1.0);
  float sq = sqrt(disc);
  return vec2(-b - sq, -b + sq);
}

// Optical depth along a ray segment using numerical integration
float opticalDepth(vec3 origin, vec3 dir, float len, float scaleH) {
  float stepSize = len / float(NUM_LIGHT_SAMPLES);
  float depth = 0.0;
  for (int i = 0; i < NUM_LIGHT_SAMPLES; i++) {
    float t = (float(i) + 0.5) * stepSize;
    vec3 pos = origin + dir * t;
    float altitude = length(pos - planetCenter) - planetRadius;
    depth += exp(-altitude / scaleH) * stepSize;
  }
  return depth;
}

void main() {
  vec3 rayOrigin = cameraPosition;
  vec3 rayDir = normalize(vWorldPosition - cameraPosition);

  // Intersect view ray with atmosphere sphere
  vec2 atmoHit = raySphereIntersect(rayOrigin, rayDir, planetCenter, atmosphereRadius);
  if (atmoHit.y < 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // Clip near to 0 (camera may be inside atmosphere)
  float tNear = max(atmoHit.x, 0.0);

  // Check if ray hits the planet — if so, stop at planet surface
  vec2 planetHit = raySphereIntersect(rayOrigin, rayDir, planetCenter, planetRadius);
  float tFar = atmoHit.y;
  if (planetHit.x > 0.0) {
    tFar = min(tFar, planetHit.x);
  }

  float pathLength = tFar - tNear;
  if (pathLength <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float stepSize = pathLength / float(NUM_SAMPLES);

  // Accumulate in-scattering
  vec3 rayleighSum = vec3(0.0);
  vec3 mieSum = vec3(0.0);
  float totalRayleighDepth = 0.0;
  float totalMieDepth = 0.0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    float t = tNear + (float(i) + 0.5) * stepSize;
    vec3 samplePos = rayOrigin + rayDir * t;
    float altitude = length(samplePos - planetCenter) - planetRadius;

    // Local density at this sample
    float rayleighDensity = exp(-altitude / rayleighScale) * stepSize;
    float mieDensity = exp(-altitude / mieScale) * stepSize;

    totalRayleighDepth += rayleighDensity;
    totalMieDepth += mieDensity;

    // Optical depth from sample point toward the sun
    vec2 sunHit = raySphereIntersect(samplePos, vSunDir, planetCenter, atmosphereRadius);
    float sunPathLen = sunHit.y;

    float sunRayleighDepth = opticalDepth(samplePos, vSunDir, sunPathLen, rayleighScale);
    float sunMieDepth = opticalDepth(samplePos, vSunDir, sunPathLen, mieScale);

    // Total optical depth: camera→sample + sample→sun
    vec3 tau = rayleighCoeff * (totalRayleighDepth + sunRayleighDepth)
             + mieCoeff * (totalMieDepth + sunMieDepth);
    vec3 attenuation = exp(-tau);

    rayleighSum += rayleighDensity * attenuation;
    mieSum += mieDensity * attenuation;
  }

  // Phase functions
  float cosTheta = dot(rayDir, vSunDir);
  float cos2 = cosTheta * cosTheta;

  // Rayleigh phase: (3 / 16π) * (1 + cos²θ)
  float rayleighPhase = 3.0 / (16.0 * PI) * (1.0 + cos2);

  // Mie phase (Henyey-Greenstein): avoids strong forward peak blowout
  float g = mieDirection;
  float g2 = g * g;
  float miePhase = 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + cos2))
                 / (pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5) * (2.0 + g2));

  vec3 color = intensity * (rayleighSum * rayleighCoeff * rayleighPhase
             + mieSum * mieCoeff * miePhase);

  // Tone-map to prevent HDR blowout
  color = 1.0 - exp(-color);

  // Alpha based on scattering strength — transparent where no scattering
  float alpha = clamp(length(color) * 2.0, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
