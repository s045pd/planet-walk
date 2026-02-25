varying vec2 vUv;
varying vec3 vNormal;
varying float vHeight;

uniform sampler2D diffuseMap;
uniform vec3 color;

void main() {
  vec4 texColor = texture2D(diffuseMap, vUv);
  
  // Simple directional lighting approximation
  vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
  float diff = max(dot(vNormal, lightDir), 0.0);
  vec3 lighting = vec3(0.2) + vec3(0.8) * diff; // Ambient + Diffuse

  gl_FragColor = vec4(texColor.rgb * color * lighting, texColor.a);
}
