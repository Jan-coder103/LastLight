# Radar Dish — approved asset review

Draft ID: `radar-dish` · Category: `landmark` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #25, "Military base and checkpoints"

## Revision (owner feedback: the dish is separated from the tower and not centred)

Right again, and this time it was the mount. The bowl assembly was authored entirely behind the
head origin - its back hub sat 3.46 m behind the pedestal axis - so the dish hovered beside the
tower top touching nothing, with its whole mass hanging off to one side. The fix:

- The bowl group is shifted along +Z by exactly the hub offset (`DISH_R + 0.06`), so the back
  hub lands ON the head origin, directly over the bearing collar. The head tilts about that same
  point, so the dish stays centred over the pedestal in all three variant attitudes.
- A rear mount now connects the pair: a post up from the collar, an arm to the hub, and a
  counterweight on the back - the classic az-el silhouette, and the balance the head lacked.
- The access ladder and the equipment cabinet moved to the -Z side: with the dish mounted, its
  rim sweeps the entire +Z side at every tilt, and the rear is the only zone clear at all three
  attitudes. A rear ladder is also what a real pedestal has.
- Declared `dimensions`: **7.2 x 9.5 x 6.6 m** (measured 5.68 x 9.12 x 4.57 m v0; 7.09 x 9.37 x
  6.48 m v1 - the steep rolled tilt is the widest; 6.52 x 9.41 x 3.82 m v2). The visual centre
  sits about +1 m in +Z of the pivot, which matters when a placement centres its bounds box.
  The pedestal-only collider is unchanged.


## Purpose and intended placement

A large faceted dish on a pedestal that reads as able to turn. The idea's own framing is
"a distant landmark", so the design priority is the silhouette against the sky, not the
mechanism. Expected on base perimeter corners, on ridges above a base, and as a horizon marker.

## Rework (owner request: "the dish is wrong")

The owner was right, and it was the asset's central fault: **the bowl faced backwards.** The
spherical cap was tilted so its convex side faced up and toward +Z, which made the whole head
read as an umbrella — a dome with ribs sticking out of its rim and the feed horn hidden on the
far side. Three compounding causes:

1. The cap's concave axis pointed down-and-back after the head tilt, so from every gameplay
   camera the player saw the outside of the shell.
2. The feed horn sat at +Y in cap space — on the convex side of the bowl, opposite where a feed
   belongs.
3. The dish material was single-sided, so even a correctly aimed bowl would have shown
   see-through when looked into: the concave inner surface was backface-culled.

The rework rebuilds the head around the correct axis:

- The cap, rim, ribs, and feed are authored **in cap space** inside a bowl group, then the bowl
  group is rotated −90° about X so **the opening faces +Z** before any tilt. The head tilt then
  aims the opening up-and-forward exactly as a working dish would sit.
- **Dish materials are `DoubleSide`**, so looking into the bowl shows the faceted inner surface.
- The **feed horn and tripod moved to the concave side**, standing just proud of the rim plane
  on the bowl axis, aimed back at the cap vertex — the classic dish read.
- **Five back ribs** are now computed between two points on the sphere offset +0.16 outward from
  the cap's centre, so they sit **on the outside of the shell** instead of inside it (the old
  constant-angle ribs were buried in the bowl).
- The pedestal was raised (5.2 m column, hub at 5.95 m) so the correctly-aimed dish keeps its
  landmark height, and a **waveguide run** now connects the equipment cabinet to the head —
  previously nothing connected the dish to anything.
- The **ladder's rung spacing is fixed** (0.75 m → 0.41 m; the old spacing was flagged in the
  previous sheet as obviously wrong at close range).

Orientation was verified numerically, not by eye: transforming the concave axis by the bowl and
head quaternions gives (0, 0.52, 0.85) at variant 0's tilt — up and toward +Z, as intended — and
a raycast along that axis from beyond the rim meets the feed assembly before the dish surface.

## Dimensions and scale

- Declared `dimensions`: 7.2 × 9.2 × 7.0 m (re-measured; the old declared 8.0 m height was
  exceeded by the old model itself — measured 8.9–9.3 m)
- Measured (vertex-accurate): 5.68 × 7.31 × 5.19 m (v0), 5.60 × 6.16 × 5.44 m (v1),
  5.59 × 8.34 × 5.43 m (v2 — the near-horizontal parked tilt is the tallest)
- Dish diameter 5.5 m, hub at 5.95 m. **3.5 scout heights** at the rim top.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the direction the bowl opening faces**, raised
by the variant tilt. A placement's `rotationY` aims the face, which is the meaningful control.

## Collider proposal

`center {0, 2.6, 0}`, `size {2.3, 5.2, 2.3}` — the pad edge and pedestal only.

**The dish is more than 5 m overhead and the player can walk underneath it.** Same judgement as
the wind pump, for the same reason. The equipment cabinet at the foot is outside the box and not
solid — a smaller version of the accepted thin-geometry cost elsewhere.

## Interaction points

| id               | label      | position  |
| ---------------- | ---------- | --------- |
| `radar-pedestal` | Radar Dish | 0, 0, 2.2 |

At the base of the pedestal, clear of the collider. A salvage or control point.

## Materials

| name               | colour    | roughness | metalness | notes                       |
| ------------------ | --------- | --------- | --------- | --------------------------- |
| `dish-panel-grey`  | `#8b887d` | 0.85      | 0.15      | variant 0, flat, DoubleSide |
| `dish-panel-rust`  | `#9b624d` | 0.9       | 0.15      | variant 1, flat, DoubleSide |
| `dish-panel-green` | `#65766d` | 0.8       | 0.15      | variant 2, flat, DoubleSide |
| `frame-steel`      | `#64675d` | 0.82      | 0.25      | rim, ribs, struts, ladder   |
| `concrete-base`    | `#797762` | 1         | 0         | pad and pedestal            |
| `feed-dark`        | `#444943` | 0.7       | 0.2       | feed arm and horn           |

4 live materials per variant. `DoubleSide` on the dish panels is the one deliberate exception to
single-sided fabric/metal surfaces elsewhere, and it is what makes a one-surface bowl readable
from inside.

## The dish is a 12 × 4 spherical cap

`SphereGeometry(3.4, 12, 4, 0, 2π, 0, 0.95)` — one segment finer around than the old dish, still
deliberately faceted with flat shading. The rim ring at the cap edge (radius 2.77 m) stops the
cap reading as a dome; the five back ribs and the rear hub disc give the convex side structure.

## Variants — the tilt is still the axis

| variant | dish            | opening tilt (X) | roll (Z) |
| ------- | --------------- | ---------------- | -------- |
| 0       | grey `#8b887d`  | 0.55 rad up      | 0.0      |
| 1       | rust `#9b624d`  | 0.90 rad up      | 0.35     |
| 2       | green `#65766d` | **0.15 rad — parked, near horizontal** | -0.20 |

Variant 2 remains the characterful state: a dish left parked says something about what happened
here. Now that the bowl faces the right way, the three attitudes also read distinctly from the
default camera instead of all showing the back of a dome.

## Complexity

30 meshes, ~318 triangles, 4 materials in all three variants. Up from 20 / 386-equivalent
because of the rim, five computed ribs, rear hub, waveguide, and the fixed ladder (9 rungs).
Still cheap for a 6 m landmark.

## What reads well

- **Far:** a 5.5 m faceted bowl held up to the sky on a tapered pedestal — the silhouette the
  idea asks for.
- **Near:** the feed horn on its tripod, the rim ring, the ribs on the back, the waveguide run,
  the ladder and cabinet.

## Unresolved questions

- **The dish does not turn and never will from `createVisual`** — same limitation as the wind
  pump, mitigated by the bearing collar reading as a pivot.
- The ribs are straight chords offset outside the shell, not curved followers of the cap; at
  this scale the gap is not visible.
- No counterweight arm behind the hub. A real dish of this size has one; it would cost 2 meshes
  if the owner wants the back balanced.
- Nothing suggests abandonment beyond variant 2's parked tilt — no overgrowth or loose cabling.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` 0.
- **Orientation verified by quaternion arithmetic and raycast**, not by eye: concave axis
  (0, 0.52, 0.85) at variant 0; a ray along the opening axis meets the feed assembly first.
- Per-variant tilt confirmed: 0.55 / 0.90 / 0.15 rad, roll 0.0 / 0.35 / -0.20.
- `createVisual` called twice per variant and compared mesh-for-mesh and
  triangle-for-triangle: identical. No unseeded randomness, no animation, no lights, no `NaN`.
- **Previewed in the staging viewer** (`viewer.html`) in headless Chromium with software WebGL,
  from the default three-quarter view, head-on, and pure side views, for all three variants.
  The umbrella read was confirmed in the old build and confirmed gone in this one; the bowl now
  shows its facets and feed from the gameplay side. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
