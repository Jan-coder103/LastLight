# Rock Outcrop — candidate review

Draft ID: `candidate-rock-outcrop` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #55 (added in the post-fifty extension)

## Revision (owner feedback: remove the base plate)

The 3.9 x 3.4 m scree pad is gone - the owner confirmed what the unresolved-questions section
below suspected: placed on real terrain it only read as a base plate. The boulders already seat
themselves on y = 0, so nothing else moved, and the `rock-ground` material is deleted with the
pad (4 materials, 11-12 meshes). Declared `dimensions` are **4.0 x 2.2 x 4.6 m**: variant 2's
toppled boulder measures 4.57 m deep, which the old declared 4.4 m had never covered.


## Purpose and intended placement

A cluster of faceted boulders with a low slab, a scatter of small stones, and three lichen patches.
Intended for terrain variation: beside a road cut, at the foot of a slope, or as cover in scrubland.
It is the first non-built candidate in the set and the one intended to be scattered.

## Dimensions and scale

- Declared `dimensions`: 4.0 × 2.2 × 4.6 m (revised; see the revision section above)
- Measured (vertex-accurate): 3.90 × 2.06 × 3.91 m (v0, v1), 4.23 m deep (v2, toppled boulder)
- Tallest boulder 1.96 m to the lichen, low slab 0.36 m. **0.98 scout heights** — chest height on
  the big rock, so it hides a crouching player and not a standing one.

## Pivot and front direction

Ground at y = 0, cluster centred on x = 0, z = 0. The cluster is irregular with no front, so
`rotationY` is purely a placement convenience. The tall boulder sits at −X and the slab at +Z,
which is enough asymmetry that two instances at different `rotationY` will not read as copies.

## Collider proposal

`center {0, 0.85, 0}`, `size {3.2, 1.7, 2.9}` — the main mass, excluding the loose stones.

A rock is solid, so a box is right. It is 0.2 m narrower than the visual on each side, which means
a player can stand just inside the outline of the boulders. That is a small cheat and the right
one: an exact rock collider would need many boxes and the asset is meant to be scatterable.

The collider is 1.7 m tall while the tallest rock is 1.96 m, so a player can stand on top of the
collider inside the rock. If that matters, the height should be raised.

## Interaction points

**None.** There is no meaningful interaction on a rock. This is deliberate and it is the first
candidate in the set to ship with an empty `interactionPoints` array — the guide asks for a point
only where there is something to do.

## Materials

| name            | colour    | roughness | metalness | notes                       |
| --------------- | --------- | --------- | --------- | --------------------------- |
| `rock-light`    | `#8b887d` | 1         | 0         | tall boulder, slab          |
| `rock-dark`     | `#77796a` | 1         | 0         | two boulders, toppled one   |
| `rock-shade`    | `#6a6b60` | 1         | 0         | small boulders and stones   |
| `rock-lichen`   | `#58624d` | 1         | 0         | three patches               |
| `rock-ground`   | `#797762` | 1         | 0         | the scree pad               |

5 materials, the fewest in the batch. Three greys and a muted green is the whole palette and it is
already in the project's "dusty walls and stone" and "foliage and military greens" rows.

## Variants

| variant | cluster | extra |
| ------- | ------- | ----- |
| 0       | complete | — |
| 1       | **the +X rear boulder removed** | — |
| 2       | **a boulder toppled and rolled clear** of the main mass | toppled rock at −X/−Z |

The three variants do not change the silhouette much, which is honest: a pile of rocks has few
states. Variant 2 is the only one that changes the outline, and it is worth having because a
toppled boulder reads as a rockfall rather than as a placed asset.

## Complexity

12 meshes / 232 triangles (v0), 11 / 212 (v1), 13 / 252 (v2). 5 materials.

**By a wide margin the cheapest asset in the batch**: 232 triangles for 4 m of terrain, using
`IcosahedronGeometry(1, 0)` — 20 faces per boulder. Flat shading on a 20-face solid gives exactly
the faceted rock look the style wants, and it is instanced trivially. If this batch has a
representative candidate for "cheap enough to scatter hundreds of", it is this one.

## What reads well

- **Far:** an irregular cluster of angular masses with one dominant tall face. Non-uniform scale on
  the icosahedra is what stops it reading as a pile of identical balls.
- **Near:** the flat facets, the 20-face silhouette of each boulder, the lichen lumps, and the
  small stones at the toe.

## Geometry note — resting on the ground

Boulders are placed by `position.y = -BOULDER_MIN_Y * scale.y`, the exact centre height that puts an
un-rotated scaled icosahedron's lowest vertex on the ground, and are only ever rotated about Y so
the vertical extent cannot change. The toppled boulder in variant 2 needs a roll about Z, which
does change the extent, so it uses `rolledCentre()`:

```
|sin(roll)| * halfX * scaleX  +  |cos(roll)| * halfY * scaleY
```

The first build used a hand-guessed `y = 0.5` and the rock sank 0.39 m into the ground
(`minY = -0.392`).

## Unresolved questions

- The scree pad is a 3.9 × 3.4 × 0.1 m box in `rock-ground`. On flat ground it reads as a mat and it
  is the one element that will fight with terrain. It is also the only reason the asset has a
  defined footprint at all. A heightfield patch or a decal would be better; neither is available to
  a mesh-only candidate.
- Every boulder is the same icosahedron at a different scale. There are only so many ways to
  non-uniformly scale one 20-face solid, and at 3 m the cluster starts to look like the same rock
  six times. A second base geometry (a 12-sided drum, say) would break it.
- The lichen patches are flattened icosahedra sitting proud on the boulder tops. The first build
  used flat boxes, which read as green plates laid on the rock; the lumps are better but they still
  float a few centimetres above the facet they sit on.
- No variant has a person-sized gap, hollow or cleft, so the collider cannot be wrong in an
  interesting way. A rock with a gap would be a better collider test.
- The slab is a squashed icosahedron, so it has a rounded top and reads as a flat stone rather than
  as a bedding plane.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  sunken toppled boulder and the plate-like lichen were both confirmed in earlier builds and
  confirmed fixed. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used. The geometry is a Three.js
built-in primitive; no external mesh or texture was used.
