# Coastal Lighthouse — asset review

Asset ID: `coastal-lighthouse` · Category: `landmark` · Status: **Approved by owner**
Source idea: `ASSET_IDEAS.txt` #54 (added in the post-fifty extension)

## Purpose and intended placement

A tapered stone tower with banded courses, a single door, two window slits, a corbelled gallery
with a post-and-ring railing, an eight-sided lantern room and a conical roof. Intended as a
coastal or shore-district landmark — the tallest thing in the batch after the water tower, and
meant to be seen from a long way off.

## Dimensions and scale

- Declared `dimensions`: 5.4 × 14.8 × 5.4 m
- Measured (vertex-accurate): 5.30 × 14.68 × 5.30 m in all three variants
- Tower 2.15 m radius at the base tapering to 1.3 m, gallery deck at 11.5 m, finial tip at 14.68 m.
  **7.0 scout heights.** For comparison the existing water tower is 16 m, so this sits just under
  it and reads as a different kind of vertical.

## Pivot and front direction

Ground at y = 0, tower centred on x = 0, z = 0. **+Z is the front**: the door is at +Z, and the two
window slits are also on +Z, above the door. The tower is rotationally symmetric apart from those
three openings, so `rotationY` mostly decides which face the door shows.

## Collider proposal

`center {0, 5.5, 0}`, `size {3.9, 11.0, 3.9}` — a solid block for the tower shaft only.

3.9 m is a touch under the 4.3 m base diameter, so a player can stand close enough to the wall to
read the door. The gallery, the railing, the lantern room and the roof are all outside the
collider and non-solid, which is correct: the deck is 11.5 m up and a player will never reach it,
and blocking it would be pointless. The lantern room could be a climbable ledge in principle; it
is 11 m up, so it is not.

## Interaction points

| id                | label           | position  |
| ----------------- | --------------- | --------- |
| `lighthouse-door` | Lighthouse Door | 0, 0, 2.3 |

Directly in front of the door, clear of the collider.

## Materials

| name               | colour    | roughness | metalness | notes                              |
| ------------------ | --------- | --------- | --------- | ---------------------------------- |
| `lighthouse-stone` | `#a29b88` | 1         | 0         | base, tower, shoulder              |
| `lighthouse-band`  | `#8b887d` | 1         | 0         | two course bands, plinth, cap      |
| `lighthouse-roof`  | `#514f49` | 0.95      | 0         | lantern roof cone                  |
| `lighthouse-metal` | `#54594d` | 0.8       | 0.3       | railing, posts, sill, bars, finial |
| `lighthouse-glass` | `#78908b` | 0.3       | 0.1       | lantern glazing, fallen pane       |
| `lighthouse-door`  | `#4b4035` | 1         | 0         | door and window slits              |
| `lighthouse-rust`  | `#9b624d` | 1         | 0.1       | door handle                        |
| `lighthouse-light` | `#d9b56e` | 0.5       | —         | lit lamp, emissive 0.9             |

8 materials. `lighthouse-light` is the only emissive material in the batch and the only saturated
point on the asset, which is what a working light should be.

## Variants

| variant | lantern                     | railing                             | lamp                            |
| ------- | --------------------------- | ----------------------------------- | ------------------------------- |
| 0       | glazed                      | complete                            | **lit**                         |
| 1       | **glazing gone**, bars only | complete                            | none, a fallen pane on the base |
| 2       | glazed                      | **two posts and the top rail gone** | dark lamp body                  |

Variant 1 is the strongest read: an empty lantern room on a shore is a better story than a dark
one, and it changes the top of the silhouette. Variant 2 is the "someone cut it up" state.

## Complexity

38 meshes / 1224 triangles (v0), 37 / 1188 (v1), 37 / 1032 (v2). 8 materials.

The count is honest for the shape: a 12-sided shaft (1 mesh, 24 triangles) is cheap, the gallery
railing is 12 posts plus 2 rings (14), the lantern is 8 bars plus a glass cylinder (9), and the
courses and plinth are 6. The 1224 triangles are mostly the 4-segment torus railing rings, which
are 96 triangles each for something that reads as a wire.

## What reads well

- **Far:** the taper, the two bands, the gallery ring and the dark cone. From any distance this is
  the most identifiable silhouette in the candidate set — it needs no detail at all to be named.
- **Near:** the faceted stone courses, the corbelled gallery underside, the railing posts, the
  eight-sided lantern with its vertical bars, the door with its handle, and the two slits.

## Geometry note — flat faces of an N-gon

The door and the window slits are positioned at `radius * cos(pi / 12)`, the distance from the axis
to a flat face of a 12-gon, not at the circumscribing radius. The first build placed them at the
radius, so both the door and the upper slit stood 0.13–0.17 m proud of the wall like shelves. The
same `cos(pi/N)` correction appears in the water reservoir's gauge and is worth reusing.

## Unresolved questions

- The tower is a smooth truncated cone. A stone lighthouse is built of curved courses, and flat
  shading on a 12-sided cone gives large flat facets that read more as a concrete cooling tower
  than as masonry at close range. More sides would help, at a triangle cost.
- There is no door frame, no step, and no threshold — the door slab sits directly on the plinth.
- The two window slits are unglazed dark rectangles, identical to the door material. A slit is
  narrow and tall and the door is not; they read as three identical dark panels.
- The gallery railing has 12 posts and 2 rings, but no kick rail at the deck, so the deck edge and
  the lowest rail are 0.6 m apart with a gap a player could step through.
- The lantern glazing is a smooth 8-sided cylinder with no astragals beyond the 8 vertical bars.
  Real lantern rooms have diagonal glazing bars.
- The lamp is a plain emissive cylinder with no lens, no drum, and no burner detail.
- The plinth is a single 0.42 m band at the base and the ground around it is bare. A lighthouse
  normally has a rock apron or a base court; that would also solve the prop's flat-footprint
  problem when placed on a slope.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the fallen pane in variant 1 was
  raised to `y = 0.52` after measurement put its corner below grade).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  proud door and slit were confirmed in the first build and confirmed recessed. Not viewed in the
  game engine.

## Licensing

Original work. No external assets, textures, or references used.
