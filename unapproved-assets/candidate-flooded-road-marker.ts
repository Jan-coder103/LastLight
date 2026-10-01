import { BoxGeometry, ConeGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import type { AuthoredAsset } from './assetTypes';

// Draft candidate. Not registered in the live catalog.
// Flood depth marker for a low-lying or storm-damaged road. Local +Z is the direction the road
// runs, so a placement lines the marker up with the carriageway. The asset is a leaning timber
// depth post with painted staff graduations, a short guardrail fragment torn from the verge, and
// a silted ground patch. Small by design: it is a sign that the map floods, not an obstacle.
const timberMaterial = new MeshStandardMaterial({
  color: '#594332',
  roughness: 1,
  flatShading: true,
});
timberMaterial.name = 'marker-timber';

const fadedTimberMaterial = new MeshStandardMaterial({
  color: '#655744',
  roughness: 1,
  flatShading: true,
});
fadedTimberMaterial.name = 'marker-faded-timber';

const steelMaterial = new MeshStandardMaterial({
  color: '#64675d',
  roughness: 0.85,
  metalness: 0.25,
  flatShading: true,
});
steelMaterial.name = 'marker-steel';

const paintMaterial = new MeshStandardMaterial({
  color: '#c5ad70',
  roughness: 0.85,
  metalness: 0,
  flatShading: true,
});
paintMaterial.name = 'marker-paint';

const rustMaterial = new MeshStandardMaterial({
  color: '#8a5645',
  roughness: 0.9,
  metalness: 0.15,
  flatShading: true,
});
rustMaterial.name = 'marker-rust';

const siltMaterial = new MeshStandardMaterial({
  color: '#5b5645',
  roughness: 1,
  flatShading: true,
});
siltMaterial.name = 'marker-silt';

const waterMaterial = new MeshStandardMaterial({
  color: '#4a5850',
  roughness: 0.35,
  metalness: 0.05,
});
waterMaterial.name = 'marker-water';

const POST_H = 2.6;
const LEAN = 0.17;

function addGraduations(group: Group, lean: number): void {
  // Painted staff bands. Alternating light and dark blocks up the leaning face, the topmost one
  // kept as the small amber signal the palette allows.
  let y = 0.35;
  let index = 0;
  while (y < POST_H - 0.2) {
    const band = new Mesh(
      new BoxGeometry(0.16, 0.2, 0.06),
      index % 3 === 2 ? paintMaterial : fadedTimberMaterial,
    );
    band.position.set(Math.sin(lean) * y, y, 0.14 * Math.cos(lean));
    band.rotation.z = -lean;
    group.add(band);
    y += 0.28;
    index += 1;
  }
}

export const candidateFloodedRoadMarker: AuthoredAsset = {
  schemaVersion: 1,
  id: 'candidate-flooded-road-marker',
  name: 'Flooded Road Marker',
  category: 'prop',
  dimensions: { x: 4.7, y: 3.0, z: 1.7 },
  collider: { center: { x: 0.6, y: 0.55, z: 0 }, size: { x: 3.0, y: 1.1, z: 0.5 } },
  interactionPoints: [
    { id: 'flood-post', label: 'Flood Depth Post', position: { x: -0.6, y: 0, z: 1.3 } },
  ],
  createVisual(variant = 0) {
    const marker = new Group();
    const lean = variant === 2 ? LEAN * 2.1 : LEAN;
    const railCount = variant === 1 ? 1 : 2;

    // Leaning depth post on a small concrete pad. The pad is what stops the post reading as
    // floating, and it is the only part of the asset with a collider that matters.
    const pad = new Mesh(new BoxGeometry(0.7, 0.24, 0.7), siltMaterial);
    pad.position.set(0, 0.12, 0);
    pad.castShadow = true;
    pad.receiveShadow = true;
    marker.add(pad);

    const post = new Mesh(new BoxGeometry(0.18, POST_H, 0.18), timberMaterial);
    post.position.set(Math.sin(lean) * (POST_H / 2), 0.2 + POST_H / 2, 0);
    post.rotation.z = -lean;
    post.castShadow = true;
    marker.add(post);
    addGraduations(marker, lean);

    // Cap plate on the post top with a single amber reflector: the one warm accent, and the only
    // thing that catches light at distance.
    const cap = new Mesh(new BoxGeometry(0.26, 0.1, 0.26), fadedTimberMaterial);
    cap.position.set(Math.sin(lean) * POST_H, 0.2 + POST_H + 0.03, 0);
    cap.rotation.z = -lean;
    cap.castShadow = true;
    marker.add(cap);
    const reflector = new Mesh(new BoxGeometry(0.1, 0.12, 0.05), paintMaterial);
    reflector.position.set(Math.sin(lean) * POST_H, 0.2 + POST_H + 0.09, 0.13);
    marker.add(reflector);

    // Two guy wires implied by a single angled stay on the downhill side, which is what keeps the
    // lean plausible.
    const stay = new Mesh(new BoxGeometry(0.05, 2.1, 0.05), steelMaterial);
    stay.position.set(0.6, 0.9, 0);
    stay.rotation.z = 0.62;
    marker.add(stay);
    const anchor = new Mesh(new BoxGeometry(0.24, 0.16, 0.24), siltMaterial);
    anchor.position.set(1.35, 0.08, 0);
    marker.add(anchor);

    // Guardrail fragment torn out of the verge: post, a bent rail length, and a bolt plate. It
    // stands to the +X side, across the road direction.
    for (let i = 0; i < railCount; i++) {
      const x = 0.9 + i * 1.6;
      const postH = 1.0 - i * 0.12;
      const railPost = new Mesh(new BoxGeometry(0.14, postH + 0.2, 0.14), steelMaterial);
      railPost.position.set(x, (postH + 0.2) / 2 + 0.01, -0.15 - i * 0.1);
      railPost.rotation.z = i * 0.14;
      railPost.castShadow = true;
      marker.add(railPost);
      const foot = new Mesh(new BoxGeometry(0.3, 0.12, 0.3), steelMaterial);
      foot.position.set(x, 0.06, -0.15 - i * 0.1);
      marker.add(foot);
    }
    const rail = new Mesh(new BoxGeometry(railCount > 1 ? 2.6 : 1.5, 0.22, 0.06), steelMaterial);
    rail.position.set(railCount > 1 ? 1.75 : 1.6, 0.86, -0.2);
    rail.rotation.z = -0.12;
    rail.castShadow = true;
    marker.add(rail);
    const plate = new Mesh(new BoxGeometry(0.3, 0.26, 0.05), rustMaterial);
    plate.position.set(2.85, 0.72, -0.24);
    plate.rotation.set(0, 0.2, -0.12);
    marker.add(plate);

    // Silt patch and standing water in the ditch line: two flat quads that say "this floods"
    // without needing a flood plane in the asset.
    const silt = new Mesh(new BoxGeometry(3.4, 0.06, 0.8), siltMaterial);
    silt.position.set(0.4, 0.03, 0.5);
    silt.receiveShadow = true;
    marker.add(silt);
    const pool = new Mesh(new BoxGeometry(2.2, 0.04, 0.42), waterMaterial);
    pool.position.set(0.5, 0.06, 0.55);
    marker.add(pool);
    const driftwood = new Mesh(new BoxGeometry(1.1, 0.1, 0.12), fadedTimberMaterial);
    driftwood.position.set(1.5, 0.11, 0.2);
    driftwood.rotation.set(0, 0.5, 0.1);
    driftwood.castShadow = true;
    marker.add(driftwood);

    // A small hazard cone left on the road side, faded. Cone geometry is a single mesh and adds
    // the roadside read the idea asks for.
    const cone = new Mesh(new ConeGeometry(0.24, 0.62, 7), rustMaterial);
    cone.position.set(-1.3, 0.31, 0.95);
    cone.castShadow = true;
    marker.add(cone);
    const coneBase = new Mesh(new BoxGeometry(0.44, 0.05, 0.44), rustMaterial);
    coneBase.position.set(-1.3, 0.03, 0.95);
    coneBase.rotation.y = 0.3;
    marker.add(coneBase);

    marker.userData.assetId = 'candidate-flooded-road-marker';
    return marker;
  },
};
