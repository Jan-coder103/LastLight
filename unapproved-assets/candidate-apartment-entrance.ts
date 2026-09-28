import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Reusable ground-floor facade module for an apartment block. Local +Z is the street, y = 0 is
// pavement, and the back is deliberately flat at z = -0.55 so the module can butt against a
// building mass. This is a facade, not a standalone building.
const facadeMaterials = [
  new MeshStandardMaterial({ color: '#a29b88', roughness: 1 }),
  new MeshStandardMaterial({ color: '#8b887d', roughness: 1 }),
  new MeshStandardMaterial({ color: '#aaa18f', roughness: 1 }),
];
facadeMaterials[0]!.name = 'facade-buff';
facadeMaterials[1]!.name = 'facade-grey';
facadeMaterials[2]!.name = 'facade-pale';

const doorMaterials = [
  new MeshStandardMaterial({ color: '#4b4035', roughness: 1 }),
  new MeshStandardMaterial({ color: '#514437', roughness: 1 }),
  new MeshStandardMaterial({ color: '#54594d', roughness: 1 }),
];
doorMaterials[0]!.name = 'door-timber';
doorMaterials[1]!.name = 'door-timber-dark';
doorMaterials[2]!.name = 'door-painted-green';

const canopyMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.95,
  flatShading: true,
});
canopyMaterial.name = 'canopy-dark';

const revealMaterial = new MeshStandardMaterial({ color: '#2e2a25', roughness: 1 });
revealMaterial.name = 'reveal-dark';

const boxMetalMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.75,
  metalness: 0.25,
});
boxMetalMaterial.name = 'mailbox-metal';

const mailboxDoorMaterial = new MeshStandardMaterial({
  color: '#54594d',
  roughness: 0.7,
  metalness: 0.2,
});
mailboxDoorMaterial.name = 'mailbox-door';

const pipeMaterial = new MeshStandardMaterial({
  color: '#59635b',
  roughness: 0.8,
  metalness: 0.25,
});
pipeMaterial.name = 'pipe-metal';

const boardMaterial = new MeshStandardMaterial({ color: '#655744', roughness: 1 });
boardMaterial.name = 'timber-board';

const sconceMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.4,
  emissive: '#7d6128',
  emissiveIntensity: 0.55,
});
sconceMaterial.name = 'sconce-amber';

const WIDTH = 7.6;
const HEIGHT = 4.8;
const OPENING_W = 1.7;
const OPENING_H = 2.5;
const FRONT_D = 0.7;

export const candidateApartmentEntrance: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-apartment-entrance',
  name: 'Apartment Block Entrance',
  category: 'building',
  dimensions: { x: 7.7, y: 4.9, z: 2.4 },
  collider: { center: { x: 0, y: 2.4, z: 0.4 }, size: { x: 7.7, y: 4.8, z: 1.9 } },
  interactionPoints: [
    { id: 'main-entrance', label: 'Main Entrance', position: { x: 0, y: 0, z: 1.05 } },
  ],
  createVisual(variant = 0) {
    const module = new Group();
    const facadeMaterial = facadeMaterials[variant % facadeMaterials.length]!;
    const doorMaterial = doorMaterials[variant % doorMaterials.length]!;
    // Centre of the front layer: spans z -0.15..0.55, putting the facade face at 0.55.
    const frontZ = 0.2;
    const pierW = (WIDTH - OPENING_W) / 2;

    // Back slab plus three front segments. The front is built AROUND the opening rather than
    // carrying a door stuck onto a solid wall, so the doorway is a real void with the door set
    // 0.6 m back inside it.
    const back = new Mesh(new BoxGeometry(WIDTH, HEIGHT, 0.4), facadeMaterial);
    back.position.set(0, HEIGHT / 2, -0.35);
    back.receiveShadow = true;
    module.add(back);

    for (const side of [-1, 1]) {
      const pier = new Mesh(new BoxGeometry(pierW, HEIGHT, FRONT_D), facadeMaterial);
      pier.position.set(side * (OPENING_W / 2 + pierW / 2), HEIGHT / 2, frontZ);
      pier.castShadow = true;
      pier.receiveShadow = true;
      module.add(pier);
    }

    const lintel = new Mesh(
      new BoxGeometry(OPENING_W, HEIGHT - OPENING_H, FRONT_D),
      facadeMaterial,
    );
    lintel.position.set(0, OPENING_H + (HEIGHT - OPENING_H) / 2, frontZ);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    module.add(lintel);

    // Door at the back of the alcove, plus a dark shadow band under the lintel so the recess
    // reads as depth rather than as a hole cut in paper.
    const door = new Mesh(new BoxGeometry(1.5, 2.32, 0.09), doorMaterial);
    door.position.set(0, 1.16, -0.1);
    door.castShadow = true;
    module.add(door);
    const alcoveShadow = new Mesh(new BoxGeometry(OPENING_W - 0.04, 0.07, 0.4), revealMaterial);
    alcoveShadow.position.set(0, OPENING_H - 0.04, 0.3);
    module.add(alcoveShadow);

    // Canopy over the entrance, on two brackets.
    const canopy = new Mesh(new BoxGeometry(2.6, 0.18, 1.5), canopyMaterial);
    canopy.position.set(0, 2.95, 1.05);
    canopy.castShadow = true;
    module.add(canopy);
    for (const side of [-1, 1]) {
      const bracket = new Mesh(new BoxGeometry(0.1, 0.1, 1.3), canopyMaterial);
      bracket.position.set(side * 1.05, 2.72, 0.9);
      bracket.rotation.x = -0.42;
      module.add(bracket);
    }

    // Two shallow steps up into the alcove.
    const stepLower = new Mesh(new BoxGeometry(2.1, 0.12, 0.62), facadeMaterial);
    stepLower.position.set(0, 0.06, 0.86);
    stepLower.receiveShadow = true;
    module.add(stepLower);
    const stepUpper = new Mesh(new BoxGeometry(1.9, 0.12, 0.5), facadeMaterial);
    stepUpper.position.set(0, 0.18, 0.4);
    stepUpper.receiveShadow = true;
    module.add(stepUpper);

    // Mailbox bank, the feature that makes the module read as an entrance rather than a wall.
    const bank = new Mesh(new BoxGeometry(0.94, 0.68, 0.1), boxMetalMaterial);
    bank.position.set(1.72, 1.45, 0.6);
    bank.castShadow = true;
    module.add(bank);
    for (const col of [-0.22, 0.22]) {
      for (const row of [-0.21, 0, 0.21]) {
        const door = new Mesh(new BoxGeometry(0.4, 0.18, 0.05), mailboxDoorMaterial);
        door.position.set(1.72 + col, 1.45 + row, 0.67);
        module.add(door);
      }
    }

    // Small amber sconce in the alcove: the one warm accent, kept small and dim.
    const sconce = new Mesh(new BoxGeometry(0.16, 0.24, 0.16), sconceMaterial);
    sconce.position.set(0, 2.3, 0.34);
    module.add(sconce);

    const numberPlate = new Mesh(new BoxGeometry(0.34, 0.22, 0.04), boxMetalMaterial);
    numberPlate.position.set(-1.2, 2.05, 0.57);
    module.add(numberPlate);

    // Downpipes at both outer edges, framing the module when it is tiled into a block.
    for (const side of [-1, 1]) {
      const pipe = new Mesh(new BoxGeometry(0.14, HEIGHT, 0.12), pipeMaterial);
      pipe.position.set(side * (WIDTH / 2 - 0.18), HEIGHT / 2, 0.6);
      pipe.castShadow = true;
      module.add(pipe);
    }

    // Ground-floor windows either side, boarded like the rest of the block.
    for (const side of [-1, 1]) {
      const x = side * 2.35;
      const backing = new Mesh(new BoxGeometry(1.3, 1.7, 0.06), revealMaterial);
      backing.position.set(x, 2.3, 0.57);
      module.add(backing);
      for (const sign of [-1, 1]) {
        const board = new Mesh(new BoxGeometry(1.5, 0.18, 0.05), boardMaterial);
        board.position.set(x, 2.3 + sign * 0.28, 0.64);
        board.rotation.z = sign * 0.55;
        board.castShadow = true;
        module.add(board);
      }
    }

    module.userData.assetId = 'candidate-apartment-entrance';
    return module;
  },
};
