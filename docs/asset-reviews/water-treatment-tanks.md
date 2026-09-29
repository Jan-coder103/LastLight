# Water Treatment Tanks — approved asset review

Draft ID: `water-treatment-tanks` · Category: `landmark` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #39, "Port, mountain, and industrial areas"

## Purpose and intended placement

A small industrial treatment plant: two circular clarifier basins, one of them drained for
maintenance, a taller rectangular aeration tank with a handrailed deck and access stair, a pipe
gallery in the gap between them, a service platform with a valve stand, and a pump house. Intended
at the edge of a settlement or a map boundary, as the town's water works.

## Dimensions and scale

- Declared `dimensions`: 23.7 × 5.0 × 15.3 m
- Measured (vertex-accurate): 23.65 × 5.00 × 15.24 m (variants 0/1), 21.50 m wide (variant 2)
- Basin walls 2.6 m and 2.2 m, aeration tank 3.6 m with a deck at 3.96 m. **2.5 scout heights.**
  The plant is wide and low: a horizontal landmark, not a tower.

## Pivot and front direction

Ground at y = 0, origin at the centre of the site slab. **+Z is the front of the service platform**
— the quay-side kerb where the platform, the valve stand and the ladder are. The pump house is at
the back right; the basins are to the left.

## Collider proposal

`center {−4.0, 1.5, 0.0}`, `size {9.0, 3.0, 12.0}` — the two basin shells only.

The basins are open, so a collider over the whole footprint would be wrong: a clarifier you can
stand inside during draining is the interesting case. The aeration tank is solid and 3.6 m tall, so
it *is* covered by the same box (it sits inside the collider's x range at x 2.3–7.7 — see the note
below). **This is a known rough edge:** the collider does not separate the basins from the
aeration tank, so the deck and handrail at 3.96 m are outside it and can be clipped. A future
revision would split it into two boxes.

## Interaction points

| id                 | label            | position   |
| ------------------ | ---------------- | ---------- |
| `plant-platform`   | Service Platform | 2.4, 0, 6.8 |

In front of the platform ladder, clear of the collider. Reads as a valve or sampling point.

## Materials

| name             | colour    | roughness | metalness | notes                            |
| ---------------- | --------- | --------- | --------- | -------------------------------- |
| `plant-concrete` | `#aaa18f` | 0.95      | 0         | slab, kerbs, coping, stair treads |
| `plant-wall`     | `#8b887d` | 0.95      | 0         | basin shells, tank body          |
| `plant-water`    | `#4a5a52` | 0.35      | 0.05      | basin surfaces                   |
| `plant-sludge`   | `#5b5645` | 1         | 0         | drained floor, spill             |
| `plant-steel`    | `#64675d` | 0.85      | 0.3       | rails, pipes, grating, platform  |
| `plant-paint`    | `#9b624d` | 0.9       | 0.15      | valve wheel, standpipe cap       |
| `plant-roof`     | `#514f49` | 0.85      | 0.2       | pump house roof and vent cap      |
| `plant-hazard`   | `#d9b56e` | 0.75      | 0.05      | the platform warning board       |

8 materials. `plant-water` at 0.35 roughness is the only smooth surface and is confined to two
discs, which is what makes the basins read as liquid rather than as concrete.

## Variants

| variant | basin 1 | pump house |
| ------- | ------- | ---------- |
| 0       | flooded, bridge and stilling well in place | present |
| 1       | **drained**: sludge floor, parked scraper bridge | present |
| 2       | drained | **removed** |

Variant 1 is the interesting one: a drained basin with its scraper bridge parked across is a
maintenance state that a player can be standing in, and it changes the read of the whole plant from
"abandoned" to "stopped". Variant 2 removes the pump house, which is the only warm mass on the site.

## Complexity

125 meshes / 2404 triangles (v0), 119 / 2276 (v1), 110 / 2144 (v2). 8 materials.

## What reads well

- **Far:** two pale discs of open water and a taller rectangular tank beside them, on a wide low
  pad. The silhouette is a pair of circles and a box, which is exactly what a treatment plant
  looks like from a ridge and is not something any other candidate in the set produces.
- **Near:** the coping bands, the stilling well and radial bridge, the handrail runs on the
  aeration deck, the stair treads, the pipe gallery flanges and saddles, and the valve stand on the
  platform.

## Rework after the first preview

Two real faults were visible in the first preview and are fixed:

- **The two basins interpenetrated.** Radii 5.0 m and 4.1 m at 5.6 m centres put their walls
  through each other, so the site read as one lumpy basin instead of two. They are now 4.1 m and
  3.4 m at 7.4 m centres, which clears with margin.
- **The pipe gallery ran through a basin.** Three pipes in X at z −3.2 to 0.8 passed straight
  through the west basin wall. They now run in Z through the 4 m gap between the basins and the
  aeration tank, on their own saddles, and the service platform moved to the front kerb to clear
  them.

## Unresolved questions

- The collider merges the basins and the aeration tank, as noted above. Splitting it is a small
  change but it should be done before this is placed anywhere a player will use the deck.
- Basin walls are open cylinders with no inner face treatment; from the drained variant a player
  standing inside sees the back faces. The 12-segment shell is double-sided by default in the
  renderer, so it will read, but the normals will be wrong for any lighting that depends on them.
- The diffuser grid inside the aeration tank is three low walls. It is invisible in every practical
  view, and could be dropped for 3 meshes.
- No overflow weir, no launder channel, no scraper drive. A drained basin in particular would
  normally show a peripheral trough.
- The site slab is 21 × 14 m but the basins sit at x −10.1 to −1.9 and the aeration at 2.3 to 7.7,
  so there is a wide empty apron on the −X side that the standpipe and spill are trying to fill.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view, both
  before and after the rework. The interpenetrating basins and the pipe-through-basin fault were
  both confirmed visible in the first build and confirmed gone in this one. Not viewed in the game
  engine.

## Licensing

Original work. No external assets, textures, or references used.
