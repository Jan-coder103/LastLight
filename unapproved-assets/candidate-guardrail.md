# Road Guardrail Run — candidate review

Draft ID: `candidate-guardrail` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #56 (added in the post-fifty extension)

## Purpose and intended placement

Three bays of W-beam guardrail on three posts: a web plus two rolled lips per bay to give the rail
its profile, amber reflectors, and one of three end treatments. Intended as a roadside edge that can
be repeated along a road, or as the remains of one.

## Dimensions and scale

- Declared `dimensions`: 5.9 × 1.0 × 1.2 m
- Measured (vertex-accurate): 5.88 × 0.98 × 0.97 m (v0), 5.53 m long (v1), 5.28 m (v2)
- Rail top at 0.96 m, post pitch 1.6 m, three posts. **0.46 scout heights** — a guardrail is waist
  height on a person and this is exactly that.

## Pivot and front direction

Ground at y = 0, run centred on x = 0, z = 0, extending along X. **+Z is the road side** — the
beam's face and the reflectors are on +Z, and the posts sit just behind on −Z. A placement wants the
traffic side facing the carriageway, so `rotationY` is the whole orientation decision.

## Collider proposal

`center {0, 0.48, 0}`, `size {4.6, 0.96, 0.36}` — a full-height block along the rail.

A guardrail's whole job is to stop something, so this is the one candidate in the batch where a
solid player-sized collider is unambiguously correct. 0.96 m is exactly the rail top. The collider
is 1.3 m shorter than the visual at each end, so the downturned terminal and the debris at the
broken end are walk-through — which is right, because that is where the rail has failed.

## Interaction points

**None.** A guardrail has nothing to interact with. Like the rock outcrop, this ships with an empty
`interactionPoints` array on purpose.

## Materials

| name                 | colour    | roughness | metalness | notes                            |
| -------------------- | --------- | --------- | --------- | -------------------------------- |
| `guardrail-beam`     | `#64675d` | 0.85      | 0.25      | galvanised W-beam web and lips   |
| `guardrail-post`     | `#54594d` | 0.9       | 0.3       | three posts, web and flange      |
| `guardrail-rust`     | `#9b624d` | 1         | 0.15      | broken bay, terminal, debris     |
| `guardrail-dark`     | `#292f2b` | 0.9       | 0.2       | reflectors, fallen beam offcut   |
| `guardrail-reflector` | `#d9b56e` | 0.7      | 0         | three reflectors                 |
| `guardrail-ground`   | `#797762` | 1         | 0         | the verge strip                  |

6 materials. The amber is on three reflectors totalling about 0.06 m², which is the correct
proportion for a signal colour.

## Variants

| variant | structure | end treatment |
| ------- | --------- | ------------- |
| 0       | intact, three posts | **downturned terminal**, 0.85 rad |
| 1       | intact, three posts | **torn open**: a bay peeled up and a length lying in the verge |
| 2       | **middle post missing**, right bay rusted | a short bent stub, the post toppled at the base |

Variant 0's downturned terminal is the correct, undamaged end and is what makes the run read as
manufactured rather than as debris. Variant 1 is the only variant with real silhouette change.

## Complexity

27 meshes / 328 triangles (v0), 25 / 304 (v1), 21 / 256 (v2). 6 materials.

The W-beam profile is what costs: 4 boxes per bay instead of 1, so 12 meshes for 3 bays. That is
deliberate — a single box reads as a flat plank, and the two rolled lips are the whole reason a
guardrail is recognisable at distance.

## What reads well

- **Far:** the horizontal rail line with its two bright reflector dots and the dark post rhythm.
  Instanced along a road at any angle, it reads immediately as a road edge.
- **Near:** the W-beam profile, the post web and flange, the reflector plates tilted forward, the
  rust bloom on the broken bay, and the verge.

## Geometry note

The one diagonal member (the fallen cable and the torn beam offcut) is placed with `spanTo()`,
which aims a +Y cylinder at a target via a quaternion. Everything else is axis-aligned boxes, which
is correct for a guardrail: it is a manufactured object and it should look aligned.

## Rework after the first preview

The three pieces of debris were 0.3 × 0.04 × 0.22 m near-black plates lying on the verge. At the
preview distance they read as flat black mats on the ground, not as broken rail. They are now
0.32 × 0.1 × 0.2 in `guardrail-rust`, thick enough to catch the light and rusty rather than black.

## Unresolved questions

- The asset is 5.9 m long and cannot tile seamlessly. A run is built from 1.6 m post pitches, so a
  4 × repeat would give a 22 m run with a duplicated end treatment on every seam. Repeatable road
  furniture wants either a much shorter module or an explicit "middle of run" variant.
- The middle post in variant 2 is removed but the beam above it is not sagging, so the span reads
  as unsupported rather than as failed.
- The posts are simple I-shaped boxes with no blockout, no bolt plate and no ground splice. A real
  post is a deep-corrugated W section, which is a different profile from the rail and is a visible
  detail.
- The reflectors are amber on all three posts. A real run alternates white and amber, and the
  white ones would be the brighter points.
- The verge strip is a 4.9 × 0.7 × 0.1 m box. On a road edge it will be a visible flat rectangle,
  and its 0.1 m thickness means it floats on any terrain that is not perfectly flat.
- The rusty bay in variant 2 uses `guardrail-rust` for the whole bay, so a rust-coloured 1.6 m
  section reads as a different material rather than as corrosion.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the debris was raised to `y = 0.07`
  after its 0.1 rad tilt put a corner below grade).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  black-mat debris was confirmed in the first build and confirmed fixed. Not viewed in the game
  engine.

## Licensing

Original work. No external assets, textures, or references used.
