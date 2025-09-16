uniform vec3 grassColor;
uniform vec3 grassTipColor;
uniform float time;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vWindEffect;

void main() {
  // Create realistic grass coloring
  float heightGradient = vUv.y;
  
  // Base to tip color gradient
  vec3 color = mix(grassColor, grassTipColor, heightGradient);
  
  // Add some variation based on position for natural look
  float variation = sin(vPosition.x * 10.0) * 0.1 + cos(vPosition.z * 8.0) * 0.1;
  color += variation * vec3(0.1, 0.2, 0.05);
  
  // Simple directional lighting
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.3;
  float lightIntensity = ambient + diffuse * 0.7;
  
  // Add subtle wind-based brightness variation
  lightIntensity += vWindEffect * 0.1;
  
  color *= lightIntensity;
  
  // Create natural grass blade alpha (tapered edges)
  float alpha = 1.0 - abs(vUv.x - 0.5) * 2.0;
  alpha = smoothstep(0.0, 1.0, alpha);
  
  // Slight transparency at the tips for softer look
  alpha *= 1.0 - heightGradient * 0.1;
  
  gl_FragColor = vec4(color, alpha);
}