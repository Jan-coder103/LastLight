# Wooden Power Pylon — approved asset review

Draft ID: `power-pylon` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #52 (added in the post-fifty extension)

## Purpose and intended placement

A timber distribution pylon: four tapered legs in an X-braced lattice, two cross-arms carrying
seven pin insulators, a ground junction box, and severed cables hanging or lying in the grass.
Intended along roads and at the edges of industrial or settlement areas, as a vertical marker that
says "there was power here once".

## Dimensions and scale

- Declared `dimensions`: 4.1 × 9.9 × 2.7 m
- Measured (vertex-accurate): 4.00 × 9.74 × 1.50 m (v0, v1), 2.60 m deep (v2, cable on the ground)
- Top cross-arm at 8.0 m, peak at 9.74 m, leg spread 3.1 m at the base. **4.6 scout heights.** A 9.7 m
  timber pole carrying two cross-arms is a realistic small distribution pylon.

## Pivot and front direction

Ground at y = 0, pylon centred on x = 0, z = 0. The structure is a square-section tower, so there
is no single front; **+Z is the face carrying the junction box** and the side the hanging cables
fall toward. The two cross-arms run along X, so `rotationY` of 90° turns the pylon to show the arms
end-on.

## Collider proposal

`center {0, 4.7, 0}`, `size {1.1, 9.4, 1.1}` — a slim column up the middle.

Deliberately much narrower than the 4.0 m visual footprint. A pylon is an open lattice: a player
must be able to walk between the legs and stand under the arms. The cost is that a player can walk
straight through all four legs and the bracing, because one box cannot represent four separate
members. This is the same deliberate under-blocking the water tower and the fire escape make.

## Interaction points

| id            | label                | position   |
| ------------- | -------------------- | ---------- |
| `pylon-base`  | Pylon Junction Box   | 0.5, 0, 0.9 |

Beside the junction box at the foot of the pylon, clear of the collider. Reads as a cable-joint or
salvage point.

## Materials

| name                 | colour    | roughness | metalness | notes                            |
| -------------------- | --------- | --------- | --------- | -------------------------------- |
| `pylon-timber`       | `#514437` | 1         | 0         | four legs, cross-arms, peak       |
| `pylon-timber-pale`  | `#655744` | 1         | 0         | horizontal ties, lattice braces  |
| `pylon-steel`        | `#54594d` | 0.85      | 0.3       | insulator caps, peak, junction lid |
| `pylon-insulator`    | `#78908b` | 0.45      | 0.05      | seven insulator stacks           |
| `pylon-cable`        | `#292f2b` | 0.9       | 0         | dangling and fallen cables       |
| `pylon-ground`       | `#797762` | 1         | 0         | two base blocks                  |

6 materials, the leanest palette in the batch. Two timbers and a dark cable is the whole read.

## Variants

| variant | top cross-arm | structure | cables |
| ------- | ------------- | --------- | ------ |
| 0       | level | intact | **two hanging**, cut and curled |
| 1       | **one end dropped 0.55 rad** | intact | one long hanging cable |
| 2       | level | **one lattice bay collapsed**, brace snapped | **both on the ground** |

Variant 1's dropped arm end is the one that reads at distance — a sagging arm is a silhouette
change you can see from a road. Variant 2 is the stripped state.

## Complexity

67 meshes / 1324 triangles (v0), 64 / 1256 (v1), 58 / 1128 (v2). 6 materials.

The count is dominated by bracing: 4 tie levels × 4 diagonal braces = 16, plus 4 legs, plus
7 insulators × 2 meshes = 14, plus 8 cable segments. The lattice is the asset, so the bracing is
not trimmable, but the insulator caps (7 meshes) could be dropped for one more material saved.

## What reads well

- **Far:** the tapered X-braced tower with two horizontal arms and the bright insulator dots. The
  taper plus the arms is a completely unambiguous pylon silhouette from any angle.
- **Near:** the pin insulators on their brackets, the galvanised caps, the jointed lattice, the
  base blocks, the junction box, and the cut cable hanging in a slack curve.

## Rework after the first preview

- **Every diagonal member was in the wrong place.** The `spanTo` helper computed its midpoint with
  `addScaledVector(dir, 0.5)` *after* `dir.normalize()`, so each member was offset by half a unit
  vector rather than half its length. The bracing collapsed into a solid wedge beside the pylon and
  the measured height came out 13.6 m against a declared 9.4 m. The midpoint now uses
  `copy(from).add(to).multiplyScalar(0.5)`.
- The base blocks were centred at `y = 0.06` with 0.24 m thickness, so they sat half below grade
  (`minY = -0.06`).

## Geometry note

Four legs and all 20 lattice members are cylinders placed by `spanTo()`, which aims a +Y cylinder at
a target with `quaternion.setFromUnitVectors`. A cylinder's axis is +Y, so setting `rotation.x` and
`rotation.z` together with the default XYZ Euler order does not aim it at a target.

## Unresolved questions

- The pylon carries no conductors between arms. A live pylon has three wires; the cut hanging
  cables say the wires came down, which is the story, but a stub of wire on the far arm would make
  that explicit.
- The insulators are 7-segment cylinders. Real pin insulators are a stack of 2–4 sheds; at this
  size a single cone reads correctly and a stack would be invisible.
- The legs converge to 0.42 m half-width at the top, which leaves almost no room for the top
  cross-arm upright. A real pylon has a single mast above the arm.
- The base blocks are two flat slabs. A pylon is set in concrete, so this is right, but they read
  as paving stones.
- The junction box is 0.44 × 0.6 × 0.3 with a lid plate and a small pale face. There is no conduit
  running from it into the ground.
- Variant 2's collapsed brace is a single short stub that does not reach the opposite leg, so the
  bay reads as missing rather than as collapsed.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the tapered legs start at
  `y = 0.02` so their end caps, tilted 7.5° off vertical, clear the ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  bracing collapse was confirmed in the first build and confirmed fixed. Not viewed in the game
  engine.

## Licensing

Original work. No external assets, textures, or references used.
