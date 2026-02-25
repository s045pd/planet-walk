varying vec2 vUv;
varying vec3 vNormal;
varying float vHeight;

uniform sampler2D heightMap;
uniform float heightScale;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Sample height from texture (using R channel)
  float height = texture2D(heightMap, uv).r;
  vHeight = height;

  // Displace vertex along normal
  vec3 newPosition = position + normal * height * heightScale;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
