uniform float time;
uniform float windStrength;
uniform vec2 windDirection;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vWindEffect;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // Get instance position
  vec3 instancePosition = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  
  // Calculate wind effect based on position and time
  float windTime = time + instancePosition.x * 0.1 + instancePosition.z * 0.1;
  float windWave1 = sin(windTime * 2.0) * 0.5 + 0.5;
  float windWave2 = sin(windTime * 3.7 + instancePosition.x * 0.02) * 0.5 + 0.5;
  float windWave3 = cos(windTime * 1.3 + instancePosition.z * 0.03) * 0.5 + 0.5;
  
  // Combine wind waves
  float windEffect = (windWave1 + windWave2 * 0.7 + windWave3 * 0.5) / 2.2;
  vWindEffect = windEffect;
  
  // Apply wind displacement based on vertex height (grass tips move more)
  vec3 windOffset = vec3(
    windDirection.x * windEffect * windStrength * uv.y * 0.8,
    0.0,
    windDirection.y * windEffect * windStrength * uv.y * 0.8
  );
  
  // Calculate final position
  vec3 worldPosition = (instanceMatrix * vec4(position + windOffset, 1.0)).xyz;
  vPosition = worldPosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
}