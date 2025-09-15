uniform vec3 grassColor;
uniform vec3 grassTipColor;
uniform float time;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vWindEffect;

void main() {
  // Gradient from base to tip
  float heightGradient = vUv.y;
  
  // Mix grass colors based on height
  vec3 color = mix(grassColor, grassTipColor, heightGradient);
  
  // Add some color variation based on wind effect
  color += vec3(0.1, 0.15, 0.05) * vWindEffect * 0.3;
  
  // Simple lighting calculation
  vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.3));
  float lightIntensity = max(dot(vNormal, lightDirection), 0.0) * 0.8 + 0.2;
  
  color *= lightIntensity;
  
  // Add subtle pulsing effect
  color += vec3(0.05, 0.08, 0.02) * sin(time * 2.0 + vPosition.x * 0.1) * 0.1;
  
  // Alpha based on UV coordinates for natural grass blade shape
  float alpha = 1.0 - abs(vUv.x - 0.5) * 2.0; // Fade edges
  alpha *= (1.0 - vUv.y * 0.1); // Slight fade at top
  
  gl_FragColor = vec4(color, alpha);
}