# Rooftop Water Tank — approved asset review

Draft ID: `rooftop-water-tank` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #04, "City and suburbs"

## Purpose and intended placement

A low-poly metal tank on a braced support frame, intended to sit **on top of a city shell roof** so
suburbs and low-rise blocks get a silhouette breaking their roofline. The idea's own wording is
"silhouette above city roofs", which is the design brief: this is a shape to be seen against the
sky, not a thing to walk up to.

## Deliberate pivot exception: y = 0 is the roof, not the street

**This asset is the one in the batch that does not stand on the ground.** `y = 0` is the roof deck
it sits on, so it can be placed straight onto a building's roof surface with no Y offset math in
the placement code.

AGENTS allows this ("unless its footprint calls for a different documented pivot"), and this is
the case that calls for it. The trade-off is real and should be an explicit decision:

- **For:** placement is trivial, and a ground-based asset would need every placement to know the
  roof height and subtract it.
- **Against:** anything that assumes all props have their base at y = 0 — an automatic ground
  snap, a shadow-catcher plane, a "drop to terrain" helper — will put this tank at street level
  or half-buried. The world generator must special-case it.

## Dimensions and scale

- Declared `dimensions`: 2.7 × 5.6 × 3.3 m
- Measured: 2.60 × 5.54 × 3.27 m, identical across all three variants
- 5.5 m tall, so **2.6 scout heights**. The 2.1 m scout standing next to it is a useful check even
  though it is not really a ground prop here — the frame is 2.6 m, roughly a believable service
  frame height, and the tank body 2.1 m.
- Deliberately **much smaller than the existing water tower** (11 × 16 × 11 m). This is a
  single-building rooftop tank; the water tower is a district landmark. Two very different reads
  and they should not be confusable.
- The z extent (3.27 m) is the outlet spout overhanging the deck, not the tank.

## Pivot and front direction

Base centred on x = 0, z = 0, with the roof deck at y = 0. There is no facing direction, so +Z is
only "the side the outlet is on". The tank is rotationally symmetric apart from the outlet, so
`rotationY` is almost free.

## Collider proposal

`center {0, 3.79, 0}`, `size {2.6, 2.2, 2.6}` — **the tank only.**

The frame below is open and a player can walk under it, so filling the whole footprint would
block a space the asset visibly leaves free. This follows the AGENTS guidance about not filling
the footprint of something you can walk beneath.

**This deliberately diverges from the existing `waterTower`**, whose collider
(`center {0, 6.7, 0}`, `size {3.8, 13.4, 3.8}`) spans its entire frame height including the open
legs. The two assets are inconsistent. This candidate is the more correct of the two, but the
inconsistency is worth an owner decision rather than a quiet divergence.

## Interaction points

| id            | label       | position  |
| ------------- | ----------- | --------- |
| `tank-outlet` | Tank Outlet | 0, 0, 1.7 |

On the roof deck just outside the frame, at the outlet pipe. Reads as a water-collection or
scavenge point.

## Materials

| name             | colour    | roughness | metalness | notes                            |
| ---------------- | --------- | --------- | --------- | -------------------------------- |
| `frame-steel`    | `#64675d` | 0.82      | 0.25      | legs, braces, deck, hoops, pipes |
| `tank-rusted`    | `#8e5142` | 0.9       | 0         | variant 0, flat                  |
| `tank-olive`     | `#58624d` | 0.9       | 0         | variant 1, flat                  |
| `tank-weathered` | `#64675d` | 0.9       | 0         | variant 2, flat                  |
| `trim-dark`      | `#444943` | 0.9       | 0         | hatch, valve                     |

2 live materials per variant. **The smallest palette in the batch**, which suits a silhouette
asset: a rooftop tank seen from the street should read as one shape, not as a parts list.

Note that variant 2 (`tank-weathered #64675d`) and `frame-steel` are the same hex. That is
deliberate — a galvanised tank on a galvanised frame — but it means the frame disappears into the
tank in variant 2 when seen flat. The 9-sided drum's facets still separate them by shading.

## Variants

| variant | tank                |
| ------- | ------------------- |
| 0       | rusted `#8e5142`    |
| 1       | olive `#58624d`     |
| 2       | weathered `#64675d` |

Tank colour only. Geometry is identical in all three, so the tank's footprint is predictable for
roof placement. Following the fire bin precedent, the three tones are picked to sit inside the
established palette rather than to be the most photorealistic steel.

## Faceting is the point

The drum, hoops, and cone are **9-sided cylinders with flat shading**, not smooth. From the
angled top-down camera a smooth cylinder would read as a featureless grey lozenge; the 9 facets
catch light differently and give it a readable curve at low polygon cost. Same reasoning as the
`waterTower` example, and the reason 21 meshes still cost 420 triangles.

## No ladder, on purpose

The tank has no access ladder. Rungs are thin enough to disappear at play distance, and the cost
is real: a two-rail ladder with four rungs is five more meshes on a 21-mesh asset, for something
nobody will see. **Idea 18 (farm grain silo) explicitly calls for a ladder**, so that is the
candidate that should carry one, where the silo is bigger and closer to the player.

## Complexity

21 meshes, ~420 triangles, 2 live materials. Triangle count is the highest of the new five for a
low mesh count, entirely because of the three 9-sided cylinders. If that matters, dropping to
7-sided would save roughly 90 triangles with little visual loss.

## What reads well

- **Far:** the drum-plus-frame silhouette against the sky, and the cone cap. This is the read the
  idea is for.
- **Near:** the two hoop bands, the splayed legs, the outlet pipe and valve.
- The 0.05 rad leg splay is small but stops the frame reading as four loose posts.

## Unresolved questions

- **The roof-deck pivot is the main decision here.** See the pivot section. It is convenient and
  it is a trap for generic placement code, and the owner should confirm which way to go.
- **Collider inconsistency with `waterTank`.** This candidate collides only the tank; the existing
  water tower collides its whole frame. One of them should change.
- **No ladder**, as above. Also no overflow pipe, no float valve, no signage.
- The tank has no `tank-full` or damage state. A rusted variant implies neglect, but there is no
  variant for "holed and falling". Idea 04 is the only idea in the list that mentions silhouette
  above roofs, so if rooftop clutter is going to be a thing, this asset is the one to extend.
- 2.6 m of frame height under a 2.1 m tank means a person could plausibly stand under it. The
  collider allows that. Whether the player can actually get onto a roof is a separate question.
- Nothing in the model says the tank is fed by anything. On a bare roof the outlet and pipework
  end in mid-air. A feed pipe running down the building side would tie it in, at the cost of
  geometry that only reads when the player is on the roof.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured (2.60 × 5.54 × 3.27) and confirmed inside
  the declared `dimensions`; `minY` 0 (leg positions were nudged 0.01 m so the tilted tapered
  cylinders do not clip below the deck).
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and never seen against a city shell roof**, which is the
  one view that matters for this asset.

## Licensing

Original work. No external assets, textures, or references used.
