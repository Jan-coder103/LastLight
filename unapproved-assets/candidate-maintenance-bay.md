# Vehicle Maintenance Bay — candidate review

Draft ID: `candidate-maintenance-bay` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #28, "Military base and checkpoints"

## Purpose and intended placement

An open-sided service shelter with a lift frame, tool cabinet, and spare tyre stack. All three
named features are modelled.

Expected at motor pools, vehicle parks, and maintenance areas — anywhere a truck or jeep would be
worked on. It is the natural companion to the comms truck (#26) and the vehicle checkpoint (#21).

## Dimensions and scale

- Declared `dimensions`: 6.8 × 4.9 × 8.8 m
- Measured: 6.70 × 4.78 × 8.65 m (variants 0/1), 6.70 × 4.78 × 8.65 m (variant 2)
- 6.0 m between the post lines, 8.0 m deep, 4.3 m to the eaves, 4.78 m to the roof crown.
  **2.3 scout heights.**
- 6.0 m of clear width fits a truck with room either side, and 8 m of depth is long enough to
  contain a 7.6 m comms truck (#26) — which is exactly the pairing this asset is sized for.

## Pivot and front direction

Ground at y = 0. **+Z is the drive-in end.** The bay is open at +Z and along both sides, and closed
at -Z where the tool cabinet and tyre stack stand.

That is a correction to an earlier note in this file, which described the bay as open at both
ends. It is not: the back is a solid wall, because that is where the equipment has to go. The
sides being open is what gives it the read of a shelter rather than a shed, and the front being
open is what makes it usable.

## Collider proposal

`center {0, 1.4, -2.1}`, `size {5.4, 2.8, 3.8}` — the back third only.

This follows the transit shelter's precedent: the collider protects the useful space rather than the
model. A box covering the whole 6 × 8 m footprint would make the bay unusable, which defeats the
entire asset. So the collider covers the back third — cabinet, tyre stack, workbench, and the lift
columns at z = 0.4 — and leaves the front two-thirds open to walk or drive into.

**The cost:** the front posts and the roof are not solid, and a player can walk through a post.
The same accepted trade as the transit shelter, the picnic shelter, and the hunting blind.

## Interaction points

| id             | label        | position      |
| -------------- | ------------ | ------------- |
| `tool-cabinet` | Tool Cabinet | -2.1, 0, -3.5 |

At the cabinet against the back wall. Reads as a searchable or lootable point, which is the most
obvious hook on the asset.

## Materials

| name              | colour    | roughness | metalness | notes                     |
| ----------------- | --------- | --------- | --------- | ------------------------- |
| `bay-steel-green` | `#59635b` | 0.85      | 0.25      | variant 0                 |
| `bay-steel-olive` | `#54594d` | 0.85      | 0.25      | variant 1                 |
| `bay-steel-grey`  | `#64675d` | 0.85      | 0.25      | variant 2                 |
| `roof-sheet`      | `#626753` | 0.95      | 0         | flat                      |
| `floor-concrete`  | `#797762` | 1         | 0         | the slab                  |
| `tool-cabinet`    | `#54594d` | 0.8       | 0.2       | cabinet and gas bottles   |
| `spare-tyre`      | `#2b2724` | 1         | 0         | five tyres and the hose   |
| `rust-metal`      | `#8e5142` | 0.9       | 0         | variant 2, the fallen arm |

5 live materials in variants 0/1, 6 in variant 2.

`spare-tyre` is doing two jobs — the tyre stack and the coiled hose — on the reasoning that both
are dark rubber. That is a stretch: a hose is not a tyre. It saves one material and the two objects
are 2 m apart, so it is not misleading, but it is the loosest material reuse in the batch.

## The lift arm height is the state variant

Two-post lift: two columns, two base plates, and two arms each, plus two drive-on plates.

| variant | arm height | state                                                             |
| ------- | ---------- | ----------------------------------------------------------------- |
| 0       | y = 1.25   | **raised**, vehicle up on the lift                                |
| 1       | y = 0.60   | lowered                                                           |
| 2       | y = 0.45   | **collapsed**, arms rotated 0.5 rad and a fallen arm on the floor |

Verified by measurement across all three variants.

**This is the best state axis in the batch**, and it is worth saying why. A lift at three heights
gives three genuinely different silhouettes from one piece of geometry and 0 extra meshes, and each
one implies a different story: raised means a vehicle was being worked on, lowered means it was
finished or abandoned, collapsed means something went wrong. That is the "state over finish" pattern
the silo, wind pump, and hangar door all used, and here it is the cleanest instance because the
state _is_ the mechanism.

## Tyre stack: five tyres, four stacked and one loose

Four tyres in two columns of two against the back wall, plus a fifth lying on its face at an angle
beside them. The fifth is what stops the stack reading as a 2 × 2 grid of objects, for one mesh.

## Tool cabinet: nine meshes for one piece of furniture

Carcass, four drawer fronts, four handle rails. Nine meshes.

That is a lot for a cabinet, and it is the clearest over-spend in this asset. The drawer fronts and
handles are what make it read as a tool cabinet rather than as a box, but four drawers could be two
and it would still read. If this asset needs trimming, the cabinet is where the 5 meshes come from.

## Workbench and hose

A 1.6 m bench on two legs, plus a coiled hose represented as a 0.3 m disc on the floor. Two and one
meshes, and they are what make the bay look _used_ rather than _newly equipped_ — which for a
post-apocalyptic setting is the difference between interesting and sterile.

## Complexity

37 meshes (variants 0/1), 39 in variant 2. ~660–684 triangles. 5–6 materials.

The heaviest prop in the batch after the crashed car, and the second-heaviest overall after the
fire lookout. For a 6 × 8 m shelter that is expensive, and the cabinet's 9 meshes are the obvious
place to look first.

## What reads well

- **Far:** the roof on four corner posts, with the raised lift visible between them. An open frame
  with a vehicle-height gap in it reads as a service bay immediately.
- **Near:** the drawer fronts, the tyre stack, the raised or collapsed arms, the louvres.

## Unresolved questions

- **The cabinet costs 9 meshes** for one object, which is the clearest over-spend in the batch.
- **No vehicle to work on.** A raised lift with nothing on it is a strong read, but a stripped jeep
  or a flatbed chassis sitting on the arms would transform this asset — and idea 26's comms truck
  is already built to the right size to fit.
- **Nothing identifies it as military.** A service bay at a motor pool and a service bay at a
  civilian garage would be identical here. The comms truck and the checkpoint are the only things
  that place it.
- **The lift has no motor housing, no control pendant, and no arm locks.** Two posts, two plates,
  four arms.
- **The roof is a single flat sheet** on a frame with no bracing. A 6 m span on four posts with no
  knee braces is visible as implausible from a low angle.
- **No lighting.** A service bay is where a work light would hang, and the floodlight tower (#29) is
  the asset that would provide it. This bay has no emissive surface at all.
- **Variant 1 is only a different arm height and a different grey.** It is a thin variant even by
  this batch's standards, and variant 0 alone is the interesting state.
- **The hose is the wrong material** and is a single disc rather than a coil.
- **Nothing on the walls** — no tool board, no pegboard, no fire extinguisher, no tyre hanging.
  A flat 6 × 4.3 m back wall is a large blank surface.
- **No oil stains or debris on the slab.** The floor is one clean concrete box, and a service bay
  floor is the single easiest place in the world to sell "this place was worked in".

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Open drive-through confirmed by raycast: a ray down the centreline at y = 3 from the +Z end
  travels 7.85 m and hits only the back wall at z = -3.85, with nothing in between. The bay's
  sides are open by construction (no side wall meshes exist).
- Lift arm heights confirmed by measurement: y = 1.25 / 0.60 / 0.45 across the three variants.
- Light count checked explicitly: zero.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether a raised lift with empty arms reads as "lift" or
  as "floating bars" needs a real look.

## Licensing

Original work. No external assets, textures, or references used.
