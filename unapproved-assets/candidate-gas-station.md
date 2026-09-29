# Abandoned Gas Station — candidate review

Draft ID: `candidate-gas-station` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #36, "Rural roadside", revised from owner feedback on
`candidate-fuel-pump`

## Revision — this candidate replaces candidate-fuel-pump

The owner reviewed the lone fuel pump and asked for it to become a whole abandoned small gas
station, Route 66 style: two pumps in front and a small store. That is a different asset with a
different footprint, silhouette, and role, so the fuel-pump slug would have been a lie — per the
staging guide the revision is clearly named instead. `candidate-fuel-pump.ts/.md` were removed and
this module takes the dispenser design forward nearly unchanged: the boot, banded column, canted
price head, dial glass, side nozzle boots, and drooping hose of the old pump are now built twice
by `addDispenser()` and set on a shared island.

## Purpose and intended placement

An abandoned roadside station on a rural highway: a small flat-roofed store with a roadward
parapet and boarded windows, a canopy over a two-dispenser island, a tall price sign, and a thin
concrete forecourt. Intended beside rural roads, at crossroads, and as the anchor of a small
ruin cluster. The forecourt is the gameplay space: open, walkable, searchable ground under the
canopy, between the pumps, and up to the boarded windows.

## Dimensions and scale

- Declared `dimensions`: 13.9 × 6.5 × 14.9 m
- Store 10 × 3.6 × 4.6 m with the parapet to 4.45 m; canopy slab underside at 3.8 m; price sign
  board at 5.5 m with the lamp to 6.4 m. **Canopy clearance 3.5 scout heights**; the store is
  half the height of a city shell and reads as the small building it is.
- The dispenser heads sit at 2.2 m — chest height on the scout, the right height to read as
  machines a person used.

## Pivot and front direction

Ground at y = 0, origin centred on the pump island (x = 0, z = 1.6 runs through it). **+Z is the
forecourt and the road**: store front, canopy fascia, price panels, and sign all face +Z or the
roadward side. A placement's `rotationY` points the pumps at the passing road.

## Collider proposal

`center {0, 1.8, -4.6}`, `size {10.2, 3.6, 4.8}` — the store mass only.

The forecourt is deliberately non-solid. The canopy is columns plus an overhead slab the player
must be able to stand under; the dispensers and bollards are waist-high props worth walking to.
One box cannot say "solid store, open forecourt", so the box covers the store and nothing else.
Same standing limitation as the checkpoint and the cabin: dispensers and bollards are walk-through
until multiple colliders exist.

## Interaction points

| id            | label       | position     |
| ------------- | ----------- | ------------ |
| `store-door`  | Store Door  | 3.6, 0, -1.6 |
| `fuel-nozzle` | Fuel Nozzle | 1.35, 0, 2.5 |

The door is on the forecourt side in front of its step; the nozzle sits at the right-hand
dispenser where its dropped hose lies on the apron. No interior is modelled — the door is a
closed panel in a real frame, matching the row house decision.

## Materials

| name                  | colour    | roughness | metalness | notes                                |
| --------------------- | --------- | --------- | --------- | ------------------------------------ |
| `station-concrete`    | `#a29b88` | 0.95      | 0         | forecourt apron, island, door step   |
| `station-wall`        | `#aaa18f` | 1         | 0         | store walls and parapet, flat        |
| `station-trim`        | `#a29b88` | 0.95      | 0         | door frame, pump bands, number strips |
| `station-band`        | `#8e5142` | 0.9       | 0.1       | faded painted band on the parapet    |
| `station-roof`        | `#514f49` | 0.95      | 0         | store roof and canopy slab, flat     |
| `station-steel`       | `#64675d` | 0.85      | 0.3       | columns, pump boots, bollards, sign pole, door |
| `station-pump-body`   | `#8e5142` | 0.9       | 0.15      | dispenser columns and heads          |
| `station-pump-trim`   | `#a29b88` | 0.95      | 0         | dispenser bands, caps, digits        |
| `station-rust`        | `#9b624d` | 0.95      | 0.15      | fascia stripe, sign board, drums, torn flap |
| `station-glass`       | `#526e70` | 0.3       | 0.1       | shop pane, shard, dial glass         |
| `station-rubber`      | `#292f2b` | 0.95      | 0         | hoses                                |
| `station-signal`      | `#d9b56e` | 0.75      | 0.05      | price panels, sign numbers, lamp, bollard bands |
| `station-board`       | `#655744` | 1         | 0         | window boarding, crate               |

13 materials. The warm signal colour is confined to small functional panels — price numbers, the
sign lamp, bollard bands — which is the sanctioned use. All colours are from the established
palette rows.

## Variants

| variant | state | canopy | sign |
| ------- | ----- | ------ | ---- |
| 0       | abandoned, whole | intact, level | board up, lamp on top |
| 1       | storm-worn | intact but sagging, torn fascia flap | board tilted 0.12 rad |
| 2       | stripped | **collapsed: stump columns, slab on the apron** | **board down, leaning on the pole** |

Variant 2 keeps the dispensers and bollards but drops the canopy, which changes the silhouette
from "station" to "wrecked station" and gives placement a real second read. Price heads are
stripped in variant 2 (no signal panels).

## Complexity

About 80 meshes / roughly 1,400 triangles, 13 materials. Mid-weight: comparable to the
substation's fence-and-plant budget, spread over a much larger footprint. The repeated parts are
the two dispensers (about 15 meshes each) and four bollards (3 each). If trimming is ever needed,
the bollard bands and the dial assemblies are the first to go and are invisible at 20 m.

## What reads well

- **Far:** the parapet-and-canopy skyline with the tall price sign — the classic roadside
  silhouette; variant 2's stump-and-slab version reads clearly as a collapsed canopy.
- **Near:** the boarded windows and band on the store, the canted price heads, the drooping
  hoses, the drums and crate.

## Unresolved questions

- The store interior is not modelled and the door is closed; the collider seals it anyway.
- The pumps are walk-through (single-box limitation above).
- The canopy slab in variant 1 sags by rotation alone; a visibly torn edge would need geometry
  the slab budget does not carry.
- The apron is one flat slab; real forecourts crack. If terrain z-fighting shows up where the
  apron meets graded ground, the apron is the piece to drop, not the island.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` 0.
- `createVisual` called twice per variant and compared mesh-for-mesh: identical. No unseeded
  randomness, no animation, no lights, no `NaN` transforms.
- Previewed in the staging viewer beside the 2.1 m scout at near and far distances, all three
  variants.

## Licensing

Original work. No external assets, textures, or references used.
