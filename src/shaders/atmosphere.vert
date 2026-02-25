// Atmosphere vertex shader — positions vertices for the atmosphere shell
// and passes world-space data to the fragment shader for scattering calculation.

uniform vec3 sunDirection;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vSunDir;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vSunDir = normalize(sunDirection);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
