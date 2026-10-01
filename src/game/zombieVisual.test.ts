import { BoxGeometry, Color, Group, InstancedMesh, Mesh, MeshStandardMaterial } from 'three';
import { describe, expect, it } from 'vitest';
import { setZombieHitFlash, ZombieCrowdVisual } from './zombieVisual';

describe('zombie hit flash', () => {
  it('isolates an individual model flash and restores its shared material', () => {
    const root = new Group();
    const original = new MeshStandardMaterial({ color: '#64725d' });
    root.add(new Mesh(new BoxGeometry(), original));
    const mesh = root.children[0] as Mesh;
    setZombieHitFlash(root, true);
    expect(mesh.material).not.toBe(original);
    expect((mesh.material as MeshStandardMaterial).emissiveIntensity).toBeGreaterThan(0);
    setZombieHitFlash(root, false);
    expect(mesh.material).toBe(original);
  });

  it('flashes and restores one instanced horde agent without adding draw calls', () => {
    const crowd = new ZombieCrowdVisual(1, 'Flash test crowd');
    crowd.setAgent(0, 0, 0, 0, 0, 1, 0);
    crowd.consumeDirtyUpdates(() => undefined);
    expect(crowd.parts).toHaveLength(2);
    expect(crowd.parts[0]).toBeInstanceOf(InstancedMesh);
    const color = new Color();
    crowd.flashAgent(0);
    crowd.parts[0]!.getColorAt(0, color);
    expect(color.getHex()).toBe(new Color('#ffd7bd').getHex());
    crowd.updateHitFlashes(0.2);
    crowd.parts[0]!.getColorAt(0, color);
    expect(color.getHex()).toBe(0xffffff);
    crowd.parts.forEach((mesh) => mesh.dispose());
  });
});
