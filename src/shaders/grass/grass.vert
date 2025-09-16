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
  
  // Get instance position for wind variation
  vec3 instancePosition = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
  
  // Create realistic wind animation
  float windTime = time * 2.0;
  float windPhase = instancePosition.x * 0.1 + instancePosition.z * 0.1;
  
  // Multiple wind wave layers for natural movement
  float windWave1 = sin(windTime + windPhase) * 0.5;
  float windWave2 = sin(windTime * 1.7 + windPhase * 1.3) * 0.3;
  float windWave3 = sin(windTime * 0.8 + windPhase * 0.7) * 0.2;
  
  float windEffect = (windWave1 + windWave2 + windWave3) * windStrength;
  vWindEffect = windEffect;
  
  // Apply wind displacement - only affect upper parts of grass (based on UV.y)
  float heightFactor = uv.y; // 0 at base, 1 at tip
  float windInfluence = heightFactor * heightFactor; // Quadratic for more natural bending
  
  vec3 windOffset = vec3(
    windDirection.x * windEffect * windInfluence,
    0.0,
    windDirection.y * windEffect * windInfluence
  );
  
  // Transform position with wind offset
  vec3 animatedPosition = position + windOffset;
  vec4 worldPosition = instanceMatrix * vec4(animatedPosition, 1.0);
  
  vPosition = worldPosition.xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
}