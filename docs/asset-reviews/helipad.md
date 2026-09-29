# Helipad — asset review

Asset ID: `helipad` · Category: `prop` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #57 (added in the post-fifty extension)

## Purpose and intended placement

A concrete pad with a kerb, a faded H, a worn touchdown ring, a windsock on a post, and an
equipment box with three status lamps. Intended on a military base, a hospital roof approach, or
an industrial site, as a large flat landmark that also gives the player somewhere to stand.

## Dimensions and scale

- Declared `dimensions`: 9.5 × 3.1 × 9.1 m
- Measured (vertex-accurate): 9.43 × 3.02 × 9.00 m (v0), 9.00 × 2.86 × 9.00 m (v1, no windsock)
- Pad 9 × 9 m at 0.36 m, windsock sock at 2.16–3.02 m. **The pad is 4.3 × 4.3 scout footprints
  across; the post is 1.4 scout heights.** A 9 m pad is smaller than a real helipad (typically
  15–20 m) but it is the smallest that still reads as a landing surface rather than as a slab.

## Pivot and front direction

Ground at y = 0, pad centred on x = 0, z = 0. The pad is square and the H is aligned to it, so
there are two natural orientations 90° apart. The windsock is at +X/+Z and the equipment box at
−X/+Z, both on the +Z side, so **+Z is the serviced side** and is the face that wants to be toward
whatever the pad is serving.

## Collider proposal

`center {0, 0.18, 0}`, `size {9, 0.36, 9}` — the pad slab, 0.36 m thick.

A player walks on top of the pad, which is the point. The kerb (0.2 m proud of the slab) and the
windsock post are outside the collider and non-solid, so a player can step over the kerb and clip
the post. The windsock itself is at 2.16 m and clearly non-solid, which is correct.

## Interaction points

| id                  | label                 | position     |
| ------------------- | --------------------- | ------------ |
| `helipad-equipment` | Helipad Equipment Box | −3.3, 0, 3.5 |

Beside the equipment box on the pad's front-left, clear of the collider. Reads as a lighting or
communications control point.

## Materials

| name                   | colour    | roughness | metalness | notes                       |
| ---------------------- | --------- | --------- | --------- | --------------------------- |
| `helipad-pad`          | `#a29b88` | 1         | 0         | the slab                    |
| `helipad-kerb`         | `#8b887d` | 1         | 0         | four kerb runs, lifted slab |
| `helipad-marking`      | `#b5a06b` | 0.95      | 0         | the H                       |
| `helipad-marking-worn` | `#9a8f6d` | 1         | 0         | touchdown ring, worn marks  |
| `helipad-metal`        | `#54594d` | 0.85      | 0.3       | windsock post, box lid      |
| `helipad-fabric`       | `#9b624d` | 1         | 0         | the sock                    |
| `helipad-dark`         | `#292f2b` | 0.9       | 0.2       | equipment box, two lamps    |
| `helipad-signal`       | `#d9b56e` | 0.75      | 0         | box indicator, one lamp     |

8 materials. Two marking values is the point of the asset: the H is a marking, the ring is a
worn marking, and they need to be distinguishable.

## Variants

| variant | H                                      | kerb                         | windsock      | extra                            |
| ------- | -------------------------------------- | ---------------------------- | ------------- | -------------------------------- |
| 0       | complete                               | all four sides               | **fitted**    | a tarp scrap on the deck         |
| 1       | **worn down**, crossbar partly missing | all four                     | **post only** | —                                |
| 2       | complete                               | **+X/+Z corner run missing** | fitted        | a lifted kerb slab, a worn scuff |

Variant 1 is the useful one: a faded H with the crossbar gone and no sock is the "out of service"
state and it is the only variant that changes the pad's read. Variant 2 shows a pad that has been
damaged rather than merely abandoned.

## Complexity

19 meshes / 420 triangles (v0), 18 / 412 (v1), 21 / 444 (v2). 8 materials.

Very cheap for a 9 m asset, because a helipad is four flat shapes. The only geometry that is not a
box is the 4-segment torus touchdown ring (160 triangles for what reads as a painted circle) and
the 8-sided sock cone.

## What reads well

- **Far:** the H and the ring on a pale square. It is a ground-plane graphic, and it is the only
  asset in the batch after the rally marker that is designed to be read from above. From the
  angled top-down camera this is the best-reading candidate in the set.
- **Near:** the kerb, the sock, the three lamps, the box, and the worn ring.

## Rework after the first preview

- **The equipment box was under the windsock.** Both were at roughly (3.5, 3.4), so in the render
  the box sat directly beneath the post and the post appeared to grow out of it. The box moved to
  (−3.3, 3.5) and the windsock stayed at (3.6, 3.3), putting the two services on opposite corners
  of the same face.
- The H was `#c5ad70` and was the brightest thing in the batch by a wide margin — a 4.4 × 0.75 m
  pair of bars in near-full-strength yellow. It is now `#b5a06b`, and the touchdown ring stays at
  the worn value, so the sock and the box lamps are the brightest points.

## Unresolved questions

- **The marking is a 0.02 m box laid on the slab.** It will z-fight on any terrain that is not
  exactly flat and at exactly y = 0.36. This is the same class of risk as the rally marker's
  painted ring, and it is the one thing on this asset that cannot be validated outside the engine.
  A decal, a texture, or vertex-coloured slab would be the right answer and none is available.
- The touchdown ring is a 4-segment torus, so it is a square with rounded corners in section and
  visibly faceted in plan. At this scale it reads as a painted line, which is acceptable, but a
  ring built from segments would sit flatter.
- The H has no directional arrow and no pad number, which are the two markings a real pad carries
  and the two that would let a player orient on it.
- The windsock is a single 8-sided cone. A sock that has lost its shape would hang; this one is
  stiff, and it points down and to the side at a fixed 0.35 rad.
- The three lamps on the equipment box are 0.1 m cylinders and one is amber while two are dark. At
  anything past 2 m they are three studs on a box.
- The pad is 0.36 m thick with a square edge and no ramp, so it is a step up from the ground
  everywhere. Real pads are flush with their surface.
- The scuff in variant 2 is a 1.0 × 0.3 m marking-coloured rectangle, which is a flat rectangle on
  the ground and has the same problem the fuel pump's spill stains have.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  windsock/box collision and the over-bright H were both confirmed in the first build and confirmed
  fixed. Not viewed in the game engine, and the marking's behaviour on real terrain is untested.

## Licensing

Original work. No external assets, textures, or references used.
