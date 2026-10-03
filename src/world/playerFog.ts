import { Material, Object3D, Vector3 } from 'three';
const center = { value: new Vector3() };
const enabled = { value: 0 };
/** World-space horizontal fog distance stays centered on the scout in every camera view. */
export function updatePlayerFog(position: Vector3, active: boolean): void {
  center.value.copy(position);
  enabled.value = Number(active);
}
export function installPlayerFog(root: Object3D): void {
  root.traverse((object) => {
    const materials = (object as Object3D & { material?: Material | Material[] }).material;
    for (const material of Array.isArray(materials) ? materials : materials ? [materials] : []) {
      if (material.userData.playerFog) continue;
      material.userData.playerFog = true;
      const original = material.onBeforeCompile;
      const key = material.customProgramCacheKey.bind(material);
      material.onBeforeCompile = (shader, renderer) => {
        original.call(material, shader, renderer);
        shader.uniforms.fieldFogCenter = center;
        shader.uniforms.fieldFogEnabled = enabled;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <fog_pars_vertex>',
          '#include <fog_pars_vertex>\nvarying vec3 vFieldFogPosition;',
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <fog_vertex>',
          `#include <fog_vertex>
          vec4 fieldWorld = vec4(transformed, 1.0);
          #ifdef USE_BATCHING
            fieldWorld = batchingMatrix * fieldWorld;
          #endif
          #ifdef USE_INSTANCING
            fieldWorld = instanceMatrix * fieldWorld;
          #endif
          vFieldFogPosition = (modelMatrix * fieldWorld).xyz;`,
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <fog_pars_fragment>',
          '#include <fog_pars_fragment>\nvarying vec3 vFieldFogPosition;\nuniform vec3 fieldFogCenter;\nuniform float fieldFogEnabled;',
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <fog_fragment>',
          `#ifdef USE_FOG
          float fieldFogDepth = mix(vFogDepth, length(vFieldFogPosition.xz - fieldFogCenter.xz), fieldFogEnabled);
          #ifdef FOG_EXP2
            float fogFactor = 1.0 - exp(-fogDensity * fogDensity * fieldFogDepth * fieldFogDepth);
          #else
            float fogFactor = smoothstep(fogNear, fogFar, fieldFogDepth);
          #endif
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
        #endif`,
        );
      };
      const priorKey = key();
      material.customProgramCacheKey = () => `${priorKey}:player-fog-v1`;
      material.needsUpdate = true;
    }
  });
}
