import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import type { AuthoredAsset } from './assetTypes';

// Owner-approved authored asset, registered in the live catalog.
// Industrial water treatment landmark. Local +Z is the front of the service platform, i.e. the side
// a player approaches. Two circular clarifier basins with low walls and still water, a taller
// aeration tank with a walkway, a pipe gallery running between them, and a small pump house. The
// basins are open, so the collider is the tank walls and the pump house rather than a slab over
// the whole footprint.
const concreteMaterial = new MeshStandardMaterial({
  color: '#aaa18f',
  roughness: 0.95,
  flatShading: true,
});
concreteMaterial.name = 'plant-concrete';

const wallMaterial = new MeshStandardMaterial({
  color: '#8b887d',
  roughness: 0.95,
  flatShading: true,
});
wallMaterial.name = 'plant-wall';

const waterMaterial = new MeshStandardMaterial({
  color: '#4a5a52',
  roughness: 0.35,
  metalness: 0.05,
});
waterMaterial.name = 'plant-water';

const sludgeMaterial = new MeshStandardMaterial({
  color: '#5b5645',
  roughness: 1,
  flatShading: true,
});
sludgeMaterial.name = 'plant-sludge';

const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.3,
  flatShading: true,
});
steelMaterial.name = 'plant-steel';

const paintMaterial = new MeshStandardMaterial({
  color: '#9b624d',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
paintMaterial.name = 'plant-paint';

const roofMaterial = new MeshStandardMaterial({
  color: '#514f49',
  roughness: 0.85,
  metalness: 0.2,
  flatShading: true,
});
roofMaterial.name = 'plant-roof';

const hazardMaterial = new MeshStandardMaterial({
  color: '#d9b56e',
  roughness: 0.75,
  metalness: 0.05,
  flatShading: true,
});
hazardMaterial.name = 'plant-hazard';

const BASIN_R = 4.1;
const BASIN_R2 = 3.4;
const BASIN_X = -6.0;
const BASIN_Z0 = -3.7;
const BASIN_Z1 = 3.7;

function addBasin(
  group: Group,
  cx: number,
  cz: number,
  r: number,
  wallH: number,
  segments: number,
  drained: boolean,
): void {
  // Circular basin: floor disc, a faceted ring wall, a coping band, and a still water surface.
  // Twelve segments is enough to read as round and cheap enough to repeat.
  const floor = new Mesh(new CylinderGeometry(r, r, 0.3, segments), wallMaterial);
  floor.position.set(cx, 0.15, cz);
  floor.receiveShadow = true;
  group.add(floor);
  const wall = new Mesh(new CylinderGeometry(r, r * 1.02, wallH, segments, 1, true), wallMaterial);
  wall.position.set(cx, wallH / 2, cz);
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);
  const coping = new Mesh(new TorusGeometry(r + 0.05, 0.12, 5, segments), concreteMaterial);
  coping.rotation.x = Math.PI / 2;
  coping.position.set(cx, wallH, cz);
  coping.castShadow = true;
  group.add(coping);
  if (drained) {
    // Drained basin: exposed sludge floor, a raked scraper bridge parked across, and a wet stain.
    const sludge = new Mesh(
      new CylinderGeometry(r - 0.35, r - 0.35, 0.1, segments),
      sludgeMaterial,
    );
    sludge.position.set(cx, 0.3, cz);
    sludge.receiveShadow = true;
    group.add(sludge);
    const bridge = new Mesh(new BoxGeometry(r * 2, 0.16, 0.6), steelMaterial);
    bridge.position.set(cx, wallH * 0.62, cz);
    bridge.rotation.y = 0.4;
    bridge.castShadow = true;
    group.add(bridge);
    const rakePost = new Mesh(new BoxGeometry(0.16, 0.7, 0.16), steelMaterial);
    rakePost.position.set(
      cx + Math.cos(0.4) * r * 0.7,
      wallH * 0.62 - 0.4,
      cz - Math.sin(0.4) * r * 0.7,
    );
    rakePost.castShadow = true;
    group.add(rakePost);
  } else {
    const water = new Mesh(new CylinderGeometry(r - 0.2, r - 0.2, 0.06, segments), waterMaterial);
    water.position.set(cx, wallH * 0.72, cz);
    water.receiveShadow = true;
    group.add(water);
    // Central stilling well: a short open drum standing in the water.
    const well = new Mesh(new CylinderGeometry(0.9, 0.9, wallH * 0.5, 8, 1, true), steelMaterial);
    well.position.set(cx, wallH * 0.72 + wallH * 0.25, cz);
    group.add(well);
    const wellRing = new Mesh(new TorusGeometry(0.9, 0.07, 4, 8), steelMaterial);
    wellRing.rotation.x = Math.PI / 2;
    wellRing.position.set(cx, wallH * 0.97, cz);
    group.add(wellRing);
    // Radial access bridge from the rim to the well, with a handrail.
    const walkway = new Mesh(new BoxGeometry(r - 0.8, 0.1, 0.7), steelMaterial);
    walkway.position.set(cx + (r - 0.8) / 2, wallH * 0.97, cz);
    walkway.castShadow = true;
    group.add(walkway);
    for (let i = 0; i < 4; i++) {
      const post = new Mesh(new BoxGeometry(0.06, 0.7, 0.06), steelMaterial);
      post.position.set(cx + 0.4 + i * ((r - 1.0) / 3), wallH * 0.97 + 0.35, cz + 0.32);
      group.add(post);
    }
    const handrail = new Mesh(new BoxGeometry(r - 0.9, 0.06, 0.06), steelMaterial);
    handrail.position.set(cx + (r - 0.8) / 2, wallH * 0.97 + 0.7, cz + 0.32);
    group.add(handrail);
  }
}

function addHandrail(
  group: Group,
  x: number,
  z: number,
  length: number,
  y: number,
  alongX: boolean,
): void {
  const count = Math.max(2, Math.round(length / 1.4));
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const post = new Mesh(new BoxGeometry(0.07, 1.0, 0.07), steelMaterial);
    post.position.set(
      alongX ? x - length / 2 + t * length : x,
      y + 0.5,
      alongX ? z : z - length / 2 + t * length,
    );
    post.castShadow = true;
    group.add(post);
  }
  for (const oy of [0.55, 1.0]) {
    const rail = new Mesh(
      new BoxGeometry(alongX ? length : 0.06, 0.06, alongX ? 0.06 : length),
      steelMaterial,
    );
    rail.position.set(x, y + oy, z);
    rail.castShadow = true;
    group.add(rail);
  }
}

export const waterTreatmentTanks: AuthoredAsset = {
  schemaVersion: 1,
  id: 'water-treatment-tanks',
  name: 'Water Treatment Tanks',
  category: 'landmark',
  dimensions: { x: 23.7, y: 5.0, z: 15.3 },
  collider: {
    center: { x: -4.0, y: 1.5, z: 0.0 },
    size: { x: 9.0, y: 3.0, z: 12.0 },
  },
  interactionPoints: [
    { id: 'plant-platform', label: 'Service Platform', position: { x: 2.4, y: 0, z: 6.8 } },
  ],
  createVisual(variant = 0) {
    const plant = new Group();
    const drained = variant !== 0;
    const noPumpHouse = variant === 2;

    // Site slab and a bund kerb, so the basins sit on something rather than on nothing.
    const slab = new Mesh(new BoxGeometry(21.0, 0.3, 14.0), concreteMaterial);
    slab.position.set(-2.0, 0.15, -0.6);
    slab.receiveShadow = true;
    plant.add(slab);
    for (const sx of [-1, 1]) {
      const kerbX = new Mesh(new BoxGeometry(0.5, 0.6, 14.0), wallMaterial);
      kerbX.position.set(-2.0 + sx * 10.5, 0.45, -0.6);
      kerbX.castShadow = true;
      kerbX.receiveShadow = true;
      plant.add(kerbX);
    }
    const kerbZ = new Mesh(new BoxGeometry(21.0, 0.6, 0.5), wallMaterial);
    kerbZ.position.set(-2.0, 0.45, -7.1);
    kerbZ.receiveShadow = true;
    plant.add(kerbZ);

    // Two clarifier basins, one drained so the pair does not read as duplicates.
    addBasin(plant, BASIN_X, BASIN_Z0, BASIN_R, 2.6, 12, drained);
    addBasin(plant, BASIN_X, BASIN_Z1, BASIN_R2, 2.2, 12, false);

    // Aeration tank: a taller rectangular basin with a stepped top and a handrailed deck. Its
    // height is what gives the group a second silhouette tier beside the round basins.
    const aeration = new Mesh(new BoxGeometry(5.4, 3.6, 6.4), wallMaterial);
    aeration.position.set(5.0, 1.8, -1.4);
    aeration.castShadow = true;
    aeration.receiveShadow = true;
    plant.add(aeration);
    const aerDeck = new Mesh(new BoxGeometry(6.0, 0.24, 7.0), concreteMaterial);
    aerDeck.position.set(5.0, 3.72, -1.4);
    aerDeck.castShadow = true;
    aerDeck.receiveShadow = true;
    plant.add(aerDeck);
    addHandrail(plant, 5.0, -1.4, 6.8, 3.84, true);
    addHandrail(plant, 5.0, -4.8, 5.8, 3.84, false);
    addHandrail(plant, 5.0, 2.0, 5.8, 3.84, false);
    // Access stair up to the deck: five treads and two stringers.
    for (let i = 0; i < 5; i++) {
      const tread = new Mesh(new BoxGeometry(1.4, 0.12, 0.34), steelMaterial);
      tread.position.set(5.0, 0.6 + i * 0.62, 4.0 - i * 0.32);
      tread.castShadow = true;
      plant.add(tread);
    }
    for (const sx of [-1, 1]) {
      const stringer = new Mesh(new BoxGeometry(0.1, 0.4, 2.4), steelMaterial);
      stringer.position.set(5.0 + sx * 0.7, 2.1, 3.2);
      stringer.rotation.x = 0.72;
      plant.add(stringer);
    }
    // Diffuser grid suggested by two low walls inside the tank, plus an air header pipe.
    for (let i = 0; i < 3; i++) {
      const grid = new Mesh(new BoxGeometry(4.6, 0.4, 0.2), steelMaterial);
      grid.position.set(5.0, 3.5, -3.4 + i * 1.8);
      plant.add(grid);
    }
    const header = new Mesh(new CylinderGeometry(0.16, 0.16, 6.6, 8), steelMaterial);
    header.rotation.x = Math.PI / 2;
    header.position.set(7.4, 4.2, -1.4);
    header.castShadow = true;
    plant.add(header);
    for (let i = 0; i < 4; i++) {
      const riser = new Mesh(new CylinderGeometry(0.1, 0.1, 0.7, 6), steelMaterial);
      riser.position.set(7.4, 3.95, -4.0 + i * 1.7);
      riser.rotation.z = 0.5;
      plant.add(riser);
    }
    const blower = new Mesh(new BoxGeometry(1.2, 1.0, 1.2), paintMaterial);
    blower.position.set(7.9, 4.5, -4.9);
    blower.castShadow = true;
    plant.add(blower);

    // Pipe gallery: three runs side by side in the gap between the basins and the aeration tank,
    // running in Z. An earlier draft ran them in X and the pipes passed straight through a basin
    // wall; running them in the 4 m gap keeps every pipe on its own saddles in open air.
    for (let i = 0; i < 3; i++) {
      const x = -0.85 + i * 0.85;
      const y = 1.15;
      const pipe = new Mesh(new CylinderGeometry(0.2, 0.2, 7.4, 8), steelMaterial);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, y, -0.6);
      pipe.castShadow = true;
      plant.add(pipe);
      const flange = new Mesh(new CylinderGeometry(0.3, 0.3, 0.14, 8), steelMaterial);
      flange.rotation.x = Math.PI / 2;
      flange.position.set(x, y, -0.6);
      plant.add(flange);
      for (const sz of [-1, 1]) {
        const saddle = new Mesh(new BoxGeometry(0.5, y - 0.35, 0.3), concreteMaterial);
        saddle.position.set(x, (y - 0.35) / 2 + 0.3, -0.6 + sz * 2.8);
        saddle.receiveShadow = true;
        plant.add(saddle);
      }
    }
    // Riser taking the middle run up to the aeration deck, with a short elbow into the tank.
    const riser = new Mesh(new CylinderGeometry(0.2, 0.2, 3.2, 8), steelMaterial);
    riser.position.set(0, 2.7, 2.6);
    riser.castShadow = true;
    plant.add(riser);
    const elbow = new Mesh(new CylinderGeometry(0.2, 0.2, 2.2, 8), steelMaterial);
    elbow.rotation.z = Math.PI / 2;
    elbow.position.set(1.1, 4.3, 2.6);
    elbow.castShadow = true;
    plant.add(elbow);
    const drop = new Mesh(new CylinderGeometry(0.2, 0.2, 1.0, 8), steelMaterial);
    drop.position.set(2.2, 4.3, 2.6);
    plant.add(drop);

    // Service platform on the front kerb: a grating deck on legs with a valve stand, which is the
    // thing the interaction point sits on.
    const platformDeck = new Mesh(new BoxGeometry(4.6, 0.16, 2.4), steelMaterial);
    platformDeck.position.set(2.4, 1.3, 5.2);
    platformDeck.castShadow = true;
    platformDeck.receiveShadow = true;
    plant.add(platformDeck);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new Mesh(new BoxGeometry(0.14, 1.22, 0.14), steelMaterial);
        leg.position.set(2.4 + sx * 2.1, 0.76, 5.2 + sz * 1.0);
        leg.castShadow = true;
        plant.add(leg);
      }
    }
    addHandrail(plant, 2.4, 6.3, 4.4, 1.38, true);
    addHandrail(plant, 0.2, 5.2, 2.2, 1.38, false);
    addHandrail(plant, 4.6, 5.2, 2.2, 1.38, false);
    const valveStand = new Mesh(new CylinderGeometry(0.14, 0.18, 1.0, 7), steelMaterial);
    valveStand.position.set(2.4, 1.88, 5.2);
    valveStand.castShadow = true;
    plant.add(valveStand);
    const valveWheel = new Mesh(new TorusGeometry(0.34, 0.06, 5, 10), paintMaterial);
    valveWheel.position.set(2.4, 2.42, 5.2);
    valveWheel.rotation.x = Math.PI / 2;
    plant.add(valveWheel);
    // Access ladder to the platform.
    for (let i = 0; i < 4; i++) {
      const rung = new Mesh(new BoxGeometry(0.5, 0.05, 0.05), steelMaterial);
      rung.position.set(2.4, 0.4 + i * 0.28, 6.3);
      plant.add(rung);
    }
    for (const sx of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(0.05, 1.2, 0.05), steelMaterial);
      rail.position.set(2.4 + sx * 0.25, 0.75, 6.3);
      plant.add(rail);
    }

    // Pump house at the back: a small shed with a flat roof, a roller door, and a vent stack.
    if (!noPumpHouse) {
      const house = new Mesh(new BoxGeometry(4.4, 3.0, 3.4), concreteMaterial);
      house.position.set(8.4, 1.5, 3.4);
      house.castShadow = true;
      house.receiveShadow = true;
      plant.add(house);
      const houseRoof = new Mesh(new BoxGeometry(5.0, 0.24, 4.0), roofMaterial);
      houseRoof.position.set(8.4, 3.12, 3.4);
      houseRoof.castShadow = true;
      plant.add(houseRoof);
      const roller = new Mesh(new BoxGeometry(2.2, 2.2, 0.12), roofMaterial);
      roller.position.set(8.4, 1.1, 1.74);
      roller.castShadow = true;
      plant.add(roller);
      for (let i = 0; i < 4; i++) {
        const slat = new Mesh(new BoxGeometry(2.2, 0.08, 0.16), steelMaterial);
        slat.position.set(8.4, 0.4 + i * 0.5, 1.7);
        plant.add(slat);
      }
      const vent = new Mesh(new CylinderGeometry(0.3, 0.34, 1.2, 8), steelMaterial);
      vent.position.set(9.9, 3.7, 4.4);
      vent.castShadow = true;
      plant.add(vent);
      const ventCap = new Mesh(new ConeGeometry(0.5, 0.4, 8), roofMaterial);
      ventCap.position.set(9.9, 4.4, 4.4);
      ventCap.castShadow = true;
      plant.add(ventCap);
    }

    // Small site details: an amber hazard board on the platform rail, a sludge truck wheel-mark
    // scuff of spilled aggregate, and a standpipe.
    const board = new Mesh(new BoxGeometry(0.8, 0.5, 0.05), hazardMaterial);
    board.position.set(2.4, 2.0, 6.28);
    board.rotation.y = Math.PI;
    plant.add(board);
    const spill = new Mesh(new BoxGeometry(2.6, 0.08, 1.6), sludgeMaterial);
    spill.position.set(0.4, 0.36, 6.2);
    spill.receiveShadow = true;
    plant.add(spill);
    const standpipe = new Mesh(new CylinderGeometry(0.16, 0.18, 1.6, 7), steelMaterial);
    standpipe.position.set(-9.6, 0.8, 3.4);
    standpipe.castShadow = true;
    plant.add(standpipe);
    const standpipeCap = new Mesh(new CylinderGeometry(0.24, 0.16, 0.2, 7), paintMaterial);
    standpipeCap.position.set(-9.6, 1.7, 3.4);
    standpipeCap.castShadow = true;
    plant.add(standpipeCap);

    plant.userData.assetId = 'candidate-water-treatment-tanks';
    return plant;
  },
};
