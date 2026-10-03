import { expect, it } from 'vitest';
import {
  Group,
  Mesh,
  MeshStandardMaterial,
  BoxGeometry,
  ShaderLib,
  Vector3,
  type WebGLRenderer,
} from 'three';
import { installPlayerFog, updatePlayerFog } from './playerFog';
it('uses the same scout-centered fog uniforms for regular and instanced world geometry across camera changes', () => {
  const material = new MeshStandardMaterial();
  const root = new Group();
  root.add(new Mesh(new BoxGeometry(), material));
  installPlayerFog(root);
  const shader = {
    uniforms: {},
    vertexShader: ShaderLib.standard.vertexShader,
    fragmentShader: ShaderLib.standard.fragmentShader,
  };
  material.onBeforeCompile(
    shader as Parameters<typeof material.onBeforeCompile>[0],
    {} as WebGLRenderer,
  );
  expect(shader.vertexShader).toContain('instanceMatrix * fieldWorld');
  expect(shader.fragmentShader).toContain('length(vFieldFogPosition.xz - fieldFogCenter.xz)');
  updatePlayerFog(new Vector3(30, 2, -40), true);
  expect((shader.uniforms as Record<string, { value: unknown }>).fieldFogCenter!.value).toEqual(
    new Vector3(30, 2, -40),
  );
  expect((shader.uniforms as Record<string, { value: unknown }>).fieldFogEnabled!.value).toBe(1);
  updatePlayerFog(new Vector3(), false);
  expect((shader.uniforms as Record<string, { value: unknown }>).fieldFogEnabled!.value).toBe(0);
  const callback = material.onBeforeCompile;
  installPlayerFog(root);
  expect(material.onBeforeCompile).toBe(callback);
});
