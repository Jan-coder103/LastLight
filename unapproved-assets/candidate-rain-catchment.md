# Camp Rain Catchment — candidate review

Draft ID: `candidate-rain-catchment` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #60 (added in the post-fifty extension)

## Purpose and intended placement

A camp water rig: a four-post timber frame carrying a tarp funnel, a spout and a bent downpipe into
a drum, with a fire ring alongside. Intended beside a camp, at a road stop, or anywhere a survivor
has set up to catch water. It is the smallest "inhabited" candidate in the set and the clearest
statement that people were here.

## Dimensions and scale

- Declared `dimensions`: 3.3 × 2.8 × 4.2 m
- Measured (vertex-accurate): 3.11 × 2.59 × 3.69 m (v0), 2.54 m wide (v1, frame only), 2.68 m
  (v2, missing tarp face)
- Frame 2.3 m square with the top rail at 2.04 m, funnel apex at 2.54 m, drum 0.88 m, fire ring
  1.44 m across. **1.2 scout heights to the rail.** A 2.3 m frame is chest height to work under,
  which is the point — a player can stand under the funnel.

## Pivot and front direction

Ground at y = 0, frame centred on x = 0, z = 0. The frame is square and the funnel is symmetric, so
the only asymmetry is the drum and fire ring, both at +Z. **+Z is the camp side** — the drum, the
tap and the fire ring are the things a player walks to, and the interaction point is there.

## Collider proposal

`center {0, 0.42, 0.9}`, `size {1.7, 0.84, 1.7}` — the drum and the fire ring only.

The frame posts, the rails, the funnel and the downpipe are all non-solid. This is the deliberate
centrepiece of the design: a player can walk right into the space under the tarp, which is the
whole reason a rain catchment is interesting to stand in. The cost is a player clipping four
0.11 m posts and a 0.065 m pipe.

## Interaction points

| id                | label          | position   |
| ----------------- | -------------- | ---------- |
| `catchment-drum`  | Catchment Drum | 0, 0, 1.0  |

At the drum, inside the collider but reachable from the front. Reads as a water-collection point.

## Materials

| name                | colour    | roughness | metalness | notes                            |
| ------------------- | --------- | --------- | --------- | -------------------------------- |
| `catchment-tarp`    | `#74765c` | 1         | 0         | funnel faces, torn flap, scrap   |
| `catchment-timber`  | `#514437` | 1         | 0         | posts, rails, foot blocks        |
| `catchment-drum`    | `#54594d` | 0.9       | 0.25      | the drum                         |
| `catchment-rust`    | `#9b624d` | 1         | 0.15      | spout, drum bands, drum lid      |
| `catchment-pipe`    | `#59635b` | 0.9       | 0.25      | downpipe                         |
| `catchment-stone`   | `#8b887d` | 1         | 0         | nine fire-ring stones            |
| `catchment-ash`     | `#797762` | 1         | 0         | the fire pit floor               |
| `catchment-char`    | `#303832` | 1         | 0         | two charred logs                 |
| `catchment-signal`  | `#d9b56e` | 0.8       | 0         | drum tap, drum label             |

9 materials, joint-most in the batch. The fire ring needs three (stone, ash, char) and the rig
needs six, and neither set can be dropped without losing a read.

## Variants

| variant | tarp | drum | extra |
| ------- | ---- | ---- | ----- |
| 0       | **complete** | upright, tapped | a folded tarp scrap on the ground |
| 1       | **gone**, frame only | upright, tapped | — |
| 2       | **one face torn away**, flap hanging | **on its side** | — |

Variant 1 is the "someone took the tarp" state and it is the cleanest read of the frame on its own.
Variant 2 is the only variant that changes the drum's orientation, which is why it changes the
silhouette — a drum on its side next to a torn funnel is a rig that failed.

## Complexity

40 meshes / 796 triangles (v0), 34 / 724 (v1), 34 / 604 (v2). 9 materials.

40 meshes is high for a 2.6 m prop. It is 4 posts + 4 foot blocks + 4 rails + 4 funnel faces +
1 apex cap + 1 spout + 3 pipe segments + 1 drum + 3 bands + 1 lid + 1 tap + 1 label + 9 stones +
1 ash + 2 logs = 39. The nine fire-ring stones are 180 triangles for what reads as a ring of
pebbles, and the foot blocks (4 meshes) exist only to stop the posts looking like they were pushed
into the dirt.

## What reads well

- **Far:** the funnel on four legs with the drum beneath it and the stone ring beside it. The
  inverted-pyramid silhouette is unique in the batch and says "camp" immediately.
- **Near:** the four funnel faces meeting at the spout, the bent downpipe, the drum with its three
  rusted bands and the tap, the stone ring, the ash, and the two charred logs.

## Rework after the first preview — the funnel was broken twice

- **The funnel was a rotated cone.** A 4-sided `ConeGeometry` with `rotation.set(PI, PI/4, 0)`
  rendered as a thin blade shooting off past the frame and a flat plate in mid-air. Rotating a cone
  about Y does nothing to its axis, and an open-ended 4-gon cone does not behave like a funnel.
- **The funnel is now four explicit plates**, each a box rotated about a *single* axis: two pitched
  in X for the ±Z faces, two pitched in Z for the ±X faces, sized `2.6 × 0.04 × 1.37` and
  positioned at the midpoint of each slope. Four predictable boxes beat one clever primitive.
- **The spout floated.** It was at `RIDGE_Y − 0.2`, which is 0.6 m below the funnel's apex and
  hanging in the middle of the frame with nothing to attach to. It is now at `RIDGE_Y + 0.38`,
  directly under the apex cap, and the downpipe starts there.

## Geometry note

Everything that is not a box or a stone is placed by `spanTo()`. The first build in this batch had
`spanTo` compute its midpoint as `addScaledVector(dir, 0.5)` *after* `dir.normalize()`, which
offsets each member by half a unit vector instead of half its length — that bug put the pylon's
bracing in a solid wedge beside the tower and is called out in that sheet. All seven affected files
now use `copy(from).add(to).multiplyScalar(0.5)`.

## Unresolved questions

- **The funnel does not drain to the spout geometrically.** Four flat plates pitched to a single
  apex point is right, but each plate is `2.6 m` wide, so the four plates overlap heavily at the
  corners and their edges stand proud of each other. In the render this reads as a slightly
  crumpled tarp, which is arguably correct for a lashed canvas, but it is not a clean surface.
- The tarp has no grommets, lashings or ties to the frame. The funnel's edge overhangs the top rail
  by 0.15 m and floats free of it.
- The downpipe enters the drum through its top, which is not how a gravity feed from a 2.5 m funnel
  works — it would need a float valve and an overflow. The tap on the drum's side is correct and
  the fill is not.
- The drum is on the ground rather than on a stand, so it is a collection vessel and not a
  pressure vessel. The name "catchment" and the tap imply stored water, which a ground drum can
  hold, so this is consistent.
- The fire ring is 1.44 m across and only 0.03 m deep, and the nine stones are 0.13–0.19 m. At any
  distance past 4 m the ring is a flat disc of pebbles. A ring of stones that actually stands
  0.2 m proud would read much better.
- The two charred logs cross at odd angles and both are partly outside the ash disc, so they look
  dropped rather than burnt down.
- The frame has no diagonal bracing. Four posts and four rails with nothing holding the corners
  square is the one structural thing a camp rig cannot do.
- The frame's foot blocks (0.24 × 0.1 × 0.24 m) are the only thing at the posts' feet and they read
  as small pavers.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  blade funnel and the floating spout were both confirmed in the first build and confirmed fixed.
  Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
