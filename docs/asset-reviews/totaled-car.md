# Totaled Crashed Car — asset review

Asset ID: `totaled-car` · Category: `prop` · Status: **Approved by owner**

## Purpose and intended placement

A write-off car that has clearly been hit hard and then left. It is meant to sit at the edge of
a road, in a lay-by, or nose-in against a barrier, where it gives the player a readable "this
place was violent" landmark and a piece of cover. It is a static obstacle, not a vehicle.

## Dimensions and scale

- Declared `dimensions`: 4.30 × 2.29 × 5.70 m (corrected in revision 6; see above)
- Measured model bounds (vertex-accurate, all 3 variants): 3.47 × 2.12 × 5.50 m — the footprint is
  asymmetric about the pivot (the open door reaches x = 2.12, the nose z = 2.73, the boot
  z = -2.77), so the declared x/z cover twice the largest offset per axis.
- Width and height are larger than a closed car because the driver door stands swung open and
  the bonnet is popped up. The roof is still 1.76 m; the extra height is the raised bonnet
  standing to about 1.88 m world, roughly 1.07x the roof after revision 6 re-seated the hinge.
- The roof now sits at 1.76 m, which is 0.84 × the 2.1 m gameplay scout — the same
  roof-to-human ratio a real sedan has against a real 1.8 m adult (1.51 / 1.8 = 0.84). The car
  now reads as car-sized beside the scout rather than as a real-world-scale object dropped next
  to a stylised-scale character.
- Car front is +Z and the length runs along Z, so `dimensions.x` is the narrow axis.

### Revision 1: scaled up (owner feedback)

The first draft was authored at real sedan dimensions (4.70 × 1.87 × 1.51 m), which is correct
in absolute terms but reads small next to the oversized 2.1 m scout. The model is built at
real-world metres inside a child group carrying a single `CAR_SCALE` constant, and `dimensions`,
`collider`, and both interaction-point positions are all **derived** from that same constant, so
the metadata cannot drift away from the geometry.

### Revision 2: scale set from the scout, not a guess (owner feedback: still too small)

The first correction used an estimated 1.1, which was still visibly under. Rather than try
another percentage, the constant is now derived from the reference the `AGENTS.md` scale section
actually defines:

    sedan roof / human height = 1.51 / 1.8 = 0.84
    roof for a 2.1 m scout    = 0.84 * 2.1  = 1.76 m   ->  CAR_SCALE 1.17
    length at the same ratio  = 5.48 m

So `CAR_SCALE = 1.17` puts the model back on the proportions it would have at real-world scale,
instead of uniformly inflating an already-correct sedan. If the scout is ever rescaled, this
constant is the single value to revisit.

### Revision 3: the roof was inverted (owner feedback)

The two-piece roof had its front panel rotated the wrong way. With `rotation.x = -0.16` the
leading edge lifted to y = 1.522 — above the A-pillar top at 1.380 — while the trailing edge
sagged to 1.407, below the 1.495 roof panel behind it. On screen that reads as a pop-up sunroof
at the front and a drooping tail: the exact inverse of the caved roof an impact produces.

The rotation is now `+0.14` with the panel centre lowered to y = 1.40, which drops the leading
edge onto the A-pillar top and raises the trailing edge to meet the rear panel without a step.

**Verified by raycast, not by eye.** Casting straight down along the roof centreline now gives a
monotonically rising top surface:

| z (authored)              | roof top y |
| ------------------------- | ---------- |
| +0.45 (windshield header) | 1.400      |
| +0.15                     | 1.436      |
| -0.20                     | 1.478      |
| -0.60                     | 1.489      |
| -1.10 (tail)              | 1.502      |

The front is pushed down and the rear stays high, which is the intended caved silhouette. Before
the fix this profile was inverted end for end.

### Revision 6: the bonnet hinge floated above the cowl (owner feedback)

The raised bonnet was hinged at (y 1.02, z 0.78) with its slab offset 0.3 m up the hinge arm, so
the panel's rear edge swung to (y 1.24, z 0.56) — 0.32 m above the cowl top (0.92) and hanging
over the windscreen base in mid air. The connection to the car was the complaint, and it was
correct: nothing touched.

The hinge now sits at the cowl itself — (y 0.94, z 0.84), 0.02 above the cowl top at the cowl
line — and the bonnet slab's **rear edge sits on the hinge point**, so the raised panel stays
attached at whatever angle. The opening angle is -0.58 rad and the far tip now lands at
y ≈ 1.61 authored (1.88 m world), slightly lower and calmer than the old 1.82. A **prop rod**
from the cowl to the bonnet underside was added as a child of the hinge (1 mesh), and the crumple
panel moved out to the raised leading edge.

Measured (vertex-accurate): 3.47 × 2.12 × 5.50 m. Declared `dimensions` corrected to
3.68 × 1.96 × 4.87 authored (4.30 × 2.29 × 5.70 world) — the old declared x of 3.50 world clipped
the swung driver door (it reaches x = 2.12 world), a pre-existing error this revision finally
measured properly.

**Previewed in a WebGL render** (headless Chromium, three-quarter view beside the scout): the
bonnet reads as hinged at the cowl with the engine bay visible below it.

## Pivot and front direction

Centred on x = 0, z = 0 with the ground at y = 0. The nose faces local **+Z**. The three
standing wheels touch y ≈ 0; the collapsed rear-left tyre leaves the model floating 1.9 cm, which
is inside the same tolerance the existing examples have.

## Collider proposal

`center {0, 1.15, 0}`, `size {3.45, 2.29, 5.41}`. One box for the whole car, widened to cover
the open door and raised to cover the bonnet, since a player must not be able to walk through
either. The greenhouse
frame is a set of thin pillars, so a box is the right approximation — a player should not be able
to walk between the A- and B-pillars.

## Interaction points

| id            | label       | position       |
| ------------- | ----------- | -------------- |
| `boot`        | Boot        | 0, 0, -2.87    |
| `driver-door` | Driver door | 1.76, 0, -0.12 |

Both are scavenging-flavoured. If the owner only wants one, `driver-door` is the better single
choice because it faces the open greenhouse.

## Materials

| name               | colour    | roughness | metalness |
| ------------------ | --------- | --------- | --------- |
| `paint-faded-red`  | `#8e5142` | 0.93      | 0         |
| `paint-dusty-teal` | `#5c6a66` | 0.93      | 0         |
| `paint-khaki`      | `#7a7458` | 0.93      | 0         |
| `trim-dark`        | `#3a3a35` | 0.92      | 0         |
| `metal`            | `#64675d` | 0.85      | 0.25      |
| `rust`             | `#6b3f30` | 1         | 0         |
| `lamp-housing`     | `#33332e` | 0.97      | 0         |
| `glass-broken`     | `#8a9c95` | 0.32      | 0.06      |
| `interior`         | `#4a4a42` | 1         | 0         |
| `tyre`             | `#2a2a28` | 1         | 0         |
| `tail-light`       | `#8a4438` | 0.55      | 0         |

9 materials are live in any one variant (the three paints are alternatives, not simultaneous).
`glass-broken` is deliberately **opaque** and `DoubleSide` rather than transparent, so the shard
fan needs no depth sorting in a scene that will also have weather effects.

## Variants

Three paint colours only (red / teal / khaki). Geometry is identical across all three, which is
what makes the mesh cacheable. The damage is not randomised per variant — a totaled car should
look totaled, and a player who memorises one wreck should meet the same wreck.

## Requested damage, and where it is

- **Bent hood** — a raised crease panel at the rear of the bonnet, a downward-buckled front
  panel, and a small rotated crumple block at the nose.
- **Broken front glass** — a custom quad-strip pane with a fixed jagged upper edge, so it reads
  as punched-out safety glass still clinging to the frame.
- **Rest of the glass missing** — there is no side, rear, or quarter glass at all. The
  greenhouse is only A/B/C pillars plus a sill rail, so the interior is genuinely visible.
- **One tail light missing** — the left lens (`tail-light`) is present, the right side is only a
  recessed `lamp-housing` block. Asymmetric on purpose.
- Extras that sell "totaled": front-right wheel reduced to a bare hub and brake disc,
  rear-left tyre collapsed and bulged, a front roof panel caved downward by the impact (fixed
  in revision 3 — it had been inverted), one headlight missing, a hanging front bumper, and
  three rust panels instead of a texture.

### Revision 4: more total, with a door open (owner feedback)

Added on request. The car now reads as abandoned rather than merely damaged:

- **Driver door swung wide open**, hinged on a group at the A-pillar base so it rotates from the
  correct edge, with an inner door card and a window frame rail — the last piece of glazing on
  the whole vehicle. This is the strongest single cue: it breaks the body's clean flank and lets
  a player see into the gutted cabin. **Verified by raycast** — firing inward at door height
  passes clean through the flank at z = 0.0 and z = -0.3 (one hit, no panel), while catching the
  door standing 0.7 m proud at z = 0.3 to 0.6. The door is genuinely open, not rotated in place.
- **Bonnet unlatched and popped at the rear**, angled so the far tip reaches y = 1.72 authored
  (2.25 m world). A first attempt at a fully vertical bonnet stood 2.5 m tall and blew the
  footprint out to 3.6 m wide, which was a bigger silhouette change than the request warranted;
  it was brought back to roughly 1.2x the roof height.
- **Rear-left door ajar** by a few degrees, so the car reads as "left in a hurry" rather than
  "one door open".
- **Bent B-pillar** leaning inboard, and a **crushed roof edge** above it, so the cabin has lost
  its upright rectangle and the roofline is no longer square.

### Revision 5: the openings were cosmetic, not real (owner feedback)

The bonnet and door were modelled open, but **the bodywork underneath was still closed**, so both
read as panels standing in front of an intact car. Three separate causes, each found by raycasting
the opening rather than looking at it:

1. **The closed hood was still in place.** `hoodMass`, `hoodCrease`, and `hoodBuckle` spanned
   z 0.78..2.16 — exactly the bonnet's footprint — so a painted, closed hood sat directly under
   the raised bonnet. All three were removed; the raised bonnet is now the only hood.
2. **The tub was a single solid box** (1.8 × 0.62 × 4.36) spanning the whole car, so the engine
   bay and the doorway were backed by it. It is now split into nose, fender flanks, cabin, and
   boot sections with genuine gaps between them, over a full-length floor so the car is not
   see-through underneath.
3. **The +x cabin flank and the beltline lip were continuous**, sealing the doorway at body and
   window height. The +x flank is cut back to two short stubs either side of the opening, and the
   beltline is broken over both the engine bay and the doorway.

The engine bay is now dressed with a dark recess, an engine block, an air box, and a radiator; the
doorway shows a dark interior set inboard plus a sill. **Verified by raycast:** casting down into
the bay first hits `metal` (the engine) at y = 0.97, never paint; casting inward through the
doorway at z = 0.2 passes the open door and then reaches `interior` at x = 0.47 with no painted
bodywork in the opening.

Cost: 74 meshes and ~1196 triangles, up from 55 / 968.

## Complexity

75 meshes, ~1220 triangles, 9 materials (revision 6 added the prop rod). The heaviest of the batch
by a wide margin, and the only one using custom `BufferGeometry` (the windshield shard strip). The
increase from 47 / 860 is the open door and bonnet, the carved engine bay and doorway, the bent
pillar, and the roof dent. Carving real openings is what costs the triangles, and it is what makes
the car read as opened rather than decorated.

**This is now the one to watch.** The open door and raised bonnet roughly triple the collider
footprint in width, and this asset is the most likely of the four to be scattered repeatedly
through a generated city. If the owner wants it cheaper, the order to cut is: the rear door
ajar, the three rust panels, the four hubcaps, then the roof dent.

## Reads at distance

Strong at both ranges. The silhouette is doing the work: long low body, caved roofline, and a
jagged bonnet that catches the key light. The broken-glass shard strip is the one detail that only
pays off up close, and it is cheap enough to keep.

## Unresolved questions

- Should the rear-left collapsed tyre be visible as a gap under the sill, or does it look like a
  modelling error from a low angle? It needs an eyeball in the viewer.
- 74 meshes / ~1196 triangles is heavy for a prop that may be scattered through a generated city,
  and the open door and bonnet make its collider a third wider than a closed car would be. Worth
  a deliberate decision rather than an accident. It is now heavier than the other three
  candidates combined.
- The `rust` panels are separate thin boxes sitting on the body surface. At grazing angles they
  may show a seam.
- `CAR_SCALE` is now derived from the scout's 2.1 m height. If the scout is ever rescaled, this
  is the single value to revisit; the roof-to-scout ratio should stay at 0.84.
- The car is a slightly generous sedan for a real-world metre. If the owner would rather it were
  literally 4.7 m and accept it reading small, set `CAR_SCALE` back to 1.0 — the roof rotation
  fix is independent of the scale and stays correct either way.

## Validation performed

- `tsc --strict` typecheck clean (including `noUnusedLocals` / `noUnusedParameters`).
- All 3 variants built and rendered in headless Chromium with the project's three.js; bounds
  measured **vertex-accurately** (world-space vertices, not transformed AABB corners) and matched
  against the declared `dimensions` and `collider`.
- After each rescale, all geometry was re-confirmed to be parented under the scaled group, so no
  part was left at the old size.
- **The inverted roof was confirmed by raycast**, sampling the top surface down the roof
  centreline; the profile now rises from the windshield header to the tail as intended.
- **Revision 6's bonnet connection confirmed by render** from a three-quarter view beside the
  scout: the raised panel meets the cowl line with the engine bay visible below it.
- `createVisual(1)` called twice and compared mesh-by-mesh: identical, so placement is
  deterministic. No `NaN` positions in any variant.
- **Viewed in WebGL renders** (not yet in the game engine). The collapsed-tyre question below
  still needs a human eye at a low angle.

## Licensing

Original work. No external assets, textures, or references used.
