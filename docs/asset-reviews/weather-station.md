# Weather Station Hut — approved asset review

Draft ID: `weather-station` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #37, "Port, mountain, and industrial areas"

## Purpose and intended placement

A lone ridge weather station: a small concrete-and-panel hut with a pitched roof, a guyed stepped
instrument mast carrying an anemometer and a wind vane, a louvred Stevenson screen on legs, a rain
gauge, a snow bank and a shoveled path. Intended as a silhouette on a pass, a fire-lookout
clearing, or any isolated high point where a single tall thin mark is wanted.

## Dimensions and scale

- Declared `dimensions`: 8.2 × 8.4 × 6.6 m
- Measured (vertex-accurate): 8.20 × 8.40 × 6.54 m (variants 0/1), 8.37 m tall (variant 2)
- Hut 2.5 m to the eaves, mast 7.4 m to the anemometer cross-arm. **4.0 scout heights.** The mast
  is the asset; the hut is its base.

## Pivot and front direction

Ground at y = 0, hut centred at (0, ·, −0.4). **+Z is the front of the hut** — the side with the
door, the hood and the shoveled path. The mast stands behind and to −X at (−3.0, ·, −2.4) so that
the hut does not hide the instruments from the approach.

## Collider proposal

`center {0, 1.35, −0.4}`, `size {3.6, 2.7, 3.0}` — the hut only.

The mast, its guys, the screen and the bank are all outside the collider. A mast is a thin pole and
should not be an obstacle; the guy anchors are 0.18 m boxes. The same open-underneath trade as the
wind pump and the fire escape, at much less consequence.

## Interaction points

| id               | label                 | position   |
| ---------------- | --------------------- | ---------- |
| `station-door`   | Weather Station Door  | 0, 0, 1.4 |

On the path side of the door, clear of the collider. Reads as an instrument-hut or shelter point.

## Materials

| name                | colour    | roughness | metalness | notes                          |
| ------------------- | --------- | --------- | --------- | ------------------------------ |
| `station-concrete`  | `#aaa18f` | 0.95      | 0         | plinth, door surround, window frame |
| `station-panel`     | `#65766d` | 0.7       | 0.15      | wall block, junction box       |
| `station-roof`      | `#514f49` | 0.85      | 0.2       | roof slopes, band, hood, door  |
| `station-mast`      | `#64675d` | 0.8       | 0.3       | mast, guys, screen, fittings   |
| `station-snow`      | `#b6b3a6` | 1         | 0         | roof load, bank                |
| `station-screen`    | `#8b887d` | 0.85      | 0         | Stevenson screen, anemometer cups |
| `station-hazard`    | `#9b624d` | 0.9       | 0.1       | vane fin only                  |
| `station-glass`     | `#78908b` | 0.25      | 0.1       | the one hut window             |

8 materials for a 7 m prop. The count is justified by the mast, which is genuinely a different
object from the hut; the two could be split if a smaller prop is ever wanted.

The snow was pulled from `#c9c6b8` to `#b6b3a6` after the first preview: at the original value the
bank read as a clean white plinth rather than drifted snow.

## Variants

| variant | roof load | drift | wind vane |
| ------- | --------- | ----- | --------- |
| 0       | none  | shallow | present |
| 1       | **snow on both slopes** | **deep** | present |
| 2       | snow on both slopes | deep | **fin removed**, broken stem |

Variant 2 is a stripped-for-parts state, which is the most useful thing to have on a small
high-ground prop: a bare anemometer mast with a snapped vane reads as abandonment, and it is
visible from a long way off.

## Complexity

49 meshes / 618 triangles (v0), 51 / 642 (v1), 49 / 614 (v2). 8 materials.

## What reads well

- **Far:** the mast with its three guy lines and the small cross-arm on top. The hut is a base for
  the mast rather than a subject, which is the right hierarchy for a 7 m object.
- **Near:** the roof pitch and ridge, the louvred screen on its legs, the door with its hood, the
  rain gauge and the junction box on the mast.

## Rework after the first preview

Two faults were visible in the first preview and are fixed:

- **The guy wires were aimed with two Euler angles at once.** A Three.js cylinder points along +Y,
  and setting `rotation.x` *and* `rotation.z` with the default `XYZ` order does not aim it at a
  target — the stays came out almost horizontal and read as a bar sticking out of the roof. The
  three stays are now placed with `quaternion.setFromUnitVectors`, which is deterministic and gives
  taut wire.
- **The mast passed through the roof.** It stood at (−1.9, −1.9) while the hut spans x −1.6 to 1.6,
  so it emerged from the roof slope rather than beside it. It has moved to (−3.0, −2.4) and the
  hut is clear of it from every side.

## Unresolved questions

- The three guys are untextured 0.02 m cylinders. At close range they will alias badly; at play
  distance they are correct. If the game ever renders thin geometry badly, these are the first
  thing to thicken or drop.
- The Stevenson screen is a louvre suggestion — four angled slats — not a real double-louvred box.
- Snow load is a flat slab on each slope rather than a settled layer. It reads; it will not survive
  a player standing on the roof.
- The power cable run is three short rotated bars rather than a continuous catenary.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the snow bank was re-seated after
  measurement put it 30–55 mm below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  horizontal guys and the mast-through-roof fault were confirmed visible in the first build and
  confirmed gone in this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
