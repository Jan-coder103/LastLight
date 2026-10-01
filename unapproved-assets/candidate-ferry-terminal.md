# Ferry Terminal Shell — candidate review

Draft ID: `candidate-ferry-terminal` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #31, "Port, mountain, and industrial areas"

## Purpose and intended placement

A coastal ferry terminal facade: a concrete base building on a proud quayside plinth, carrying a
shallow monopitch canopy over a covered queue, a ticket window on the front wall, and a small
signage gantry. Expected at the head of a dock road or on a harbour edge map, facing the water.

## Dimensions and scale

- Declared `dimensions`: 10.2 × 6.2 × 8.3 m
- Measured (vertex-accurate): 10.14 × 6.20 × 8.30 m (variants 0/1), 9.68 m wide (variant 2)
- Wall head at 4.2 m, parapet at 4.9 m, canopy fascia at ~3.5 m. **3.0 scout heights** to the top
  of the parapet.

## Pivot and front direction

Ground at y = 0. **+Z is the front** — the quay side, where the door, the ticket window, the queue
and the sign all face. The body sits back at z = −1.6 so the canopy occupies the front half of the
footprint; the asset's z = 0 is the front edge of the canopy, not the centre of the building.

## Collider proposal

`center {0, 2.1, −1.1}`, `size {9.2, 4.2, 5.2}` — the base building only.

The canopy is deliberately **outside** the collider. The player can walk under it, which is the
point of a covered queue, and it is the same open-underneath choice the fire escape and the wind
pump make. The cost is that a player can clip a canopy post; the posts are 0.14 m radius.

## Interaction points

| id              | label               | position    |
| --------------- | ------------------- | ----------- |
| `terminal-door` | Ferry Terminal Door | −1.4, 0, 1.9 |
| `terminal-ticket` | Ticket Window     | 2.6, 0, 2.0 |

Both sit on the front kerb, clear of the collider. The door is an entrance; the ticket window is a
service point.

## Materials

| name               | colour    | roughness | metalness | notes                          |
| ------------------ | --------- | --------- | --------- | ------------------------------ |
| `terminal-concrete`| `#a29b88` | 0.95      | 0         | flat shaded, main wall         |
| `terminal-deck`    | `#8b887d` | 0.95      | 0         | plinth, reveals, lintel, fascia |
| `terminal-roof`    | `#514f49` | 0.85      | 0.15      | roof deck, canopy, awning      |
| `terminal-post`    | `#59635b` | 0.85      | 0.25      | posts, rails, gantry, bollards |
| `terminal-glass`   | `#65766d` | 0.25      | 0.1       | windows and ticket glass       |
| `terminal-trim`    | `#89604c` | 0.9       | 0.1       | door leaf, vane finial         |
| `terminal-sign`    | `#d9b56e` | 0.7       | 0         | route board, the amber signal  |

7 materials. Metalness stays at 0.15–0.25 except the glass; the only smooth surfaces are the two
glass materials. `terminal-sign` is the single warm accent and it is small (2.1 × 0.7 m).

## Variants

| variant | ticket window | signage gantry |
| ------- | ------------- | -------------- |
| 0       | glazed        | present        |
| 1       | **broken out** | present        |
| 2       | glazed        | **removed**    |

Two independent failure states rather than a single "ruined" axis: variant 1 says the window is
gone, variant 2 says the sign has been taken. Both read from the approach.

## Complexity

63 meshes / 892 triangles (v0), 64 / 904 (v1), 54 / 760 (v2). 7 materials.

## What reads well

- **Far:** the parapeted flat roof with a single plant box and a vane finial, over a lit front wall
  under a long canopy. The canopy line is the recognisable part.
- **Near:** the recessed doorway with its cross bar, the ticket awning, the three high windows
  with their lintels, the queue rails, and the two quay bollards.

## Rework after the first preview

The first draft stacked a clerestory block plus two roof caps over the flat roof, and gave the
canopy a flat slab *plus* a separate pitch board. In the preview the whole building read as a layer
cake with two competing roofs. Both were rebuilt: the roof is now one deck, a four-piece parapet
and one plant box; the canopy is one pitched slab with a fascia and two rafters.

## Unresolved questions

- The queue rails are indicative. A real terminal would have retractable belt posts, which is a
  different prop.
- The salt staining is two flat panels on the plinth. It reads at close range and does nothing at
  distance; consider dropping it if the plinth ever needs to be lighter.
- No water plane is included. The terminal assumes the world supplies the dock water.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view, and
  again after the roof rework. The layer-cake fault was confirmed visible in the first build and
  confirmed gone in this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
