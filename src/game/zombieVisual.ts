import { CapsuleGeometry, Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import type { ZombieState } from './CombatSimulation';

export function createZombieVisual(zombie: ZombieState): Group {
  const root = new Group();
  root.name = zombie.id;
  root.userData.zombieId = zombie.id;
  const skin = new MeshStandardMaterial({ color: '#71806a', roughness: 1, flatShading: true });
  const clothes = new MeshStandardMaterial({ color: '#514e3c', roughness: 1, flatShading: true });
  const head = new Mesh(new SphereGeometry(0.31, 8, 6), skin);
  head.position.set(0, 1.72, -0.04);
  head.castShadow = true;
  const torso = new Mesh(new CapsuleGeometry(0.4, 0.72, 3, 7), clothes);
  torso.position.y = 1.02;
  torso.rotation.x = -0.08;
  torso.castShadow = true;
  const leftArm = new Mesh(new CapsuleGeometry(0.12, 0.72, 2, 5), skin);
  leftArm.position.set(-0.44, 1.08, -0.12);
  leftArm.rotation.z = -0.34;
  leftArm.castShadow = true;
  const rightArm = leftArm.clone();
  rightArm.position.x = 0.44;
  rightArm.rotation.z = 0.34;
  const leftLeg = new Mesh(new CapsuleGeometry(0.14, 0.58, 2, 5), clothes);
  leftLeg.position.set(-0.19, 0.35, 0.03);
  leftLeg.castShadow = true;
  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.19;
  const eyes = new Mesh(
    new SphereGeometry(0.075, 6, 4),
    new MeshStandardMaterial({ color: '#d0b35f', emissive: '#38280b', roughness: 0.5 }),
  );
  eyes.position.set(0, 1.76, -0.32);
  const shadow = new Mesh(
    new SphereGeometry(0.54, 10, 6),
    new MeshStandardMaterial({ color: '#20251e', transparent: true, opacity: 0.23, roughness: 1 }),
  );
  shadow.scale.set(1, 0.035, 0.82);
  shadow.position.y = 0.04;
  root.add(head, torso, leftArm, rightArm, leftLeg, rightLeg, eyes, shadow);
  syncZombieVisual(root, zombie);
  return root;
}

export function syncZombieVisual(root: Group, zombie: ZombieState): void {
  root.position.copy(zombie.position);
  root.rotation.y = zombie.facing;
  root.visible = zombie.alive;
  const healthRatio = Math.max(0, Math.min(1, zombie.health / zombie.maxHealth));
  root.scale.setScalar(0.86 + healthRatio * 0.14);
  for (const child of root.children) {
    if (!(child instanceof Mesh)) continue;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial && material.color.getHexString() === '514e3c') {
        material.color.set(healthRatio < 0.5 ? '#70413b' : '#514e3c');
      }
    }
  }
}
