# Portable Generator — approved asset review

Draft ID: `portable-generator` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #45, "Loot, survival, and interaction props"

## Purpose and intended placement

A skid-frame generator set: an engine block with a recoil housing, a cylindrical alternator, a
tubular exhaust with a muffler and a rain cap, a canted control panel with two dials and a lever, a
saddle fuel tank under the deck, and a folded carry handle. Intended outside a building — a camp, a
site hut, a workshop — as both a landmark and a plausible power source.

## Dimensions and scale

- Declared `dimensions`: 2.3 × 1.2 × 1.5 m (bounds include the jerry can and the coiled lead)
- Measured (vertex-accurate): 2.26 × 1.20 × 1.48 m (variants 0/2), 1.04 m wide (variant 1, no
  ground clutter)
- Skid 1.45 × 0.92 m, exhaust rain cap at 1.02 m, handle grip at 0.94 m. **0.6 scout heights.**

## Pivot and front direction

Ground at y = 0. **+Z is the panel end**, i.e. the end a player faces to read the dials and pull the
lever. The engine and its recoil housing are on the −X side and the exhaust points +Z, so the two
ends are not the same shape — which is what stops the asset reading as a symmetric box.

## Collider proposal

`center {0, 0.42, 0}`, `size {1.45, 0.84, 0.92}` — the skid frame and the deck.

0.84 m is knee height, so it is shorter than the machine. A player can step over the skid and stand
against the engine, which is what makes a portable set something a player interacts with rather than
something they walk around. The cost is a player clipping the alternator, the exhaust and the tank,
all of which are outside the collider.

## Interaction points

| id          | label                       | position   |
| ----------- | --------------------------- | ---------- |
| `gen-panel` | Generator Control Panel     | 0, 0, 0.78 |

In front of the panel, clear of the collider. Reads as a start/stop or refuelling point.

## Materials

| name            | colour    | roughness | metalness | notes                            |
| --------------- | --------- | --------- | --------- | -------------------------------- |
| `gen-frame`     | `#54594d` | 0.85      | 0.3       | skid, deck, handle, tap, filler  |
| `gen-engine`    | `#59635b` | 0.8       | 0.25      | block, cover, alternator, mount  |
| `gen-panel`     | `#9b624d` | 0.9       | 0.15      | control panel, tank, jerry can   |
| `gen-dark`      | `#292f2b` | 0.9       | 0.2       | sump, exhaust, motors, plug, grip |
| `gen-rust`      | `#8e5142` | 0.95      | 0.15      | muffler, lever knob              |
| `gen-signal`    | `#d9b56e` | 0.75      | 0.05      | two dial needles, tap handle     |
| `gen-glass`     | `#78908b` | 0.25      | 0.1       | two dial glasses                 |
| `gen-cable`     | `#292f2b` | 0.95      | 0         | output cable, wiring, coiled lead |

8 materials. `gen-glass` and `gen-signal` are two dials' worth of surface each, which is the right
proportion: the panel's job is to be the brightest small thing on the prop.

## Variants

| variant | control panel | start lever | ground clutter |
| ------- | ------------- | ----------- | -------------- |
| 0       | complete, lever **up** | run position | jerry can + lead |
| 1       | complete, lever **down** | stop position | **removed** |
| 2       | **torn off**: mount face and loose wiring | hanging | jerry can + lead |

The lever position is the difference between variant 0 and 1 and it costs one mesh — a small lever
moving 0.14 m is a surprisingly large amount of information on a prop this size. Variant 2 is the
stripped state and is the only one that changes the silhouette.

## Complexity

61 meshes / 1328 triangles (v0), 57 / 1180 (v1), 53 / 1052 (v2). 8 materials.

61 meshes is high for a 1.45 m prop. The count is the price of the panel (2 dials × 3 parts, lever,
rocker, tap, handle), the exhaust run (7 parts) and the fuel tank (5 parts). If trimming is needed
the alternator fins (5) and the valve-cover studs (3) go first: neither is visible from outside the
frame.

## What reads well

- **Far:** the skid rectangle with a dark mass on it and a thin exhaust rising and bending back.
  The exhaust silhouette is the part that separates this from a toolbox.
- **Near:** the recoil housing, the alternator fins, the muffler and rain cap, the two dials with
  their bezels and amber needles, the fuel filler and sight glass, and the carry handle with its
  grip.

## Unresolved questions

- The engine is a stepped box with a cover on top. It reads as an engine at 3 m and as a stack of
  boxes at 0.4 m. A real four-cylinder would have four visible rocker covers.
- The output cable is a short cylinder ending in a plug lying on the ground, with no consumer.
  That is a deliberate "somebody unplugged it" read, but a cable with nowhere to go is also just a
  loose stick.
- The tank is strapped under the deck on the +Z half, which means it is only visible from the front
  and from above. That is correct for a saddle tank and it means two thirds of the prop's detail is
  hidden in the most common camera angle.
- No fuel line between the tank and the engine. It is the one connection a player would look for.
- The carry handle is a single loop across the −Z end; a real set has two, one at each end.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. Not
  viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
