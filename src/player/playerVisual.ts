import {
  BoxGeometry,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';

/** Shared scout model used by gameplay and the unapproved asset preview. */
export function createPlayerVisual(): Group {
  const player = new Group();
  const jacket = new MeshStandardMaterial({ color: '#bd7946', roughness: 0.9, flatShading: true });
  const gear = new MeshStandardMaterial({ color: '#3d4940', roughness: 1, flatShading: true });
  const skin = new MeshStandardMaterial({ color: '#c59b76', roughness: 1 });
  const metal = new MeshStandardMaterial({ color: '#292d2a', roughness: 0.68, metalness: 0.28 });
  const capsule = new Mesh(new CapsuleGeometry(0.47, 0.9, 3, 7), jacket);
  capsule.position.y = 0.93;
  capsule.castShadow = true;
  capsule.receiveShadow = true;
  player.add(capsule);

  const head = new Mesh(new SphereGeometry(0.31, 8, 6), skin);
  head.position.set(0, 1.78, -0.04);
  head.castShadow = true;
  player.add(head);

  const backpack = new Mesh(new BoxGeometry(0.64, 0.73, 0.34), gear);
  backpack.position.set(0, 1.03, 0.48);
  backpack.castShadow = true;
  player.add(backpack);

  const rifle = new Group();
  const stock = new Mesh(new BoxGeometry(0.14, 0.16, 0.4), gear);
  stock.position.z = 0.08;
  const barrel = new Mesh(new BoxGeometry(0.1, 0.1, 0.72), metal);
  barrel.position.z = -0.38;
  const grip = new Mesh(new BoxGeometry(0.1, 0.2, 0.13), gear);
  grip.position.set(0, -0.14, -0.03);
  rifle.add(stock, barrel, grip);
  rifle.position.set(0.43, 1.23, -0.23);
  rifle.rotation.x = -0.08;
  rifle.traverse((object) => {
    if (object instanceof Mesh) object.castShadow = true;
  });
  player.add(rifle);

  const nose = new Mesh(
    new SphereGeometry(0.12, 7, 5),
    new MeshStandardMaterial({ color: '#e5bd64', roughness: 0.7, emissive: '#4c3513' }),
  );
  nose.position.set(0, 1.7, -0.34);
  player.add(nose);

  const shadow = new Mesh(
    new SphereGeometry(0.66, 12, 6),
    new MeshStandardMaterial({ color: '#20251e', transparent: true, opacity: 0.23, roughness: 1 }),
  );
  shadow.scale.set(1, 0.035, 0.82);
  shadow.position.y = 0.045;
  shadow.receiveShadow = true;
  player.add(shadow);

  player.name = 'Player scout';
  return player;
}
