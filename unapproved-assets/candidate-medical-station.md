# Field Medical Station — candidate review

Draft ID: `candidate-medical-station` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #30, "Military base and checkpoints"

## Purpose and intended placement

A field medical station built from a shipping container with a canvas awning over the entrance.
The idea offers "a canvas shelter **or** container"; this is the container, with a canvas awning
added so the shelter reading is present too.

Expected at forward operating bases, aid stations, and quarantine points. It pairs naturally with
the comms truck (#26) and the maintenance bay (#28) as part of a base cluster.

## "Clear entrance" is a real void — and the collider seals it

The idea asks for **a clear entrance**, and the front wall is built around a 1.0 × 2.05 m doorway
exactly as the ranger cabin, sawmill, barn, and pillbox doors were. The door is hinged open at
-1.75 rad, standing against the front face.

Verified by raycast from the street: the ray at the doorway reaches `interior-dark` at **z = -2.85**,
**5.9 m into the container**, while the front wall to the right of the door stops at z = 3.03.

**And the collider covers that doorway.** This is the **sixth and most pointed instance** of the
batch's standing problem, because "clear entrance" is the one phrase in 30 ideas that explicitly
promises a player can walk in:

| candidate           | opening                           | depth     |
| ------------------- | --------------------------------- | --------- |
| ranger cabin        | 1.1 × 2.1 m doorway               | 3.2 m     |
| sawmill             | 5 × 4.2 m loading bay             | 9.4 m     |
| barn shell          | 1.3 m sliding door gap            | 8.7 m     |
| pillbox post        | 1.2 m doorway + 12 cm slit        | 2.5 m     |
| hangar shell        | 14 × 7 m sliding door             | 17.8 m    |
| **medical station** | **1.0 × 2.05 m "clear entrance"** | **5.9 m** |

The ammunition bunker (#27), by contrast, has a heavy door that is _correctly closed_ and so has no
conflict at all. That comparison is the useful one: the contract can express a shut door perfectly
well. It is only **open** doors that a single box cannot represent.

## Dimensions and scale

- Declared `dimensions`: 3.4 × 3.4 × 7.8 m
- Measured: 3.16 × 3.26 × 7.65 m (variants 0/1), 3.27 × 3.26 × 7.67 m (variant 2)
- 2.44 m wide, 6.06 m long, 2.9 m tall — a **20 ft high-cube container** at real dimensions.
  **1.5 scout heights.**
- The 7.65 m length is the container plus the awning and its poles reaching 1.2 m past the door
  end.
- Real container dimensions were used deliberately: if a world generator is also going to place
  idea 32's cargo container stacks, this and those should agree.

## Corrugation is six ribs, not modelled

Three vertical ribs per side wall, 0.08 m proud, plus four corner castings. Seven meshes for the
entire "this is a shipping container" read.

Real trapezoidal corrugation would be dozens of meshes for something invisible at any distance this
asset will be viewed from. The ribs give the vertical rhythm that says container; the castings give
the corner detail that says ISO box. That is the whole job.

## The awning satisfies "canvas shelter" without a tent

A 2.4 × 1.5 m canvas sheet at 0.22 rad over the entrance, on two poles. Three meshes, plus a fourth
in variant 2.

The idea offers a choice between two forms, and taking the container for the body and the canvas
only for the entrance gets both readings in three meshes. It also gives the flat container end a
reason to have a slope and two verticals in front of it, which stops the 2.44 × 2.9 m end wall
reading as a blank rectangle.

## "Restrained medical markings" taken literally

A cross made of **two thin bars** in `medical-marking` (`#8e5142`, the palette's muted rust), plus
a small pale plate over the door. Three meshes.

The word "restrained" is doing real work in the brief. A bright red cross would be the single most
saturated thing in the entire 34-candidate set and would break the palette. The muted rust reads as
"medical" at distance while sitting inside the established value range — the same reasoning as the
ambulance's flank stripes, applied here at a quarter of its size.

Text on the plate is bars, or nothing: this runtime builds geometry, not textures.

## Materials

| name                    | colour    | roughness | metalness | notes                                 |
| ----------------------- | --------- | --------- | --------- | ------------------------------------- |
| `container-shell-green` | `#65766d` | 0.9       | 0         | variant 0                             |
| `container-shell-pale`  | `#78908b` | 0.9       | 0         | variant 1                             |
| `container-shell-grey`  | `#8b887d` | 0.9       | 0         | variant 2                             |
| `container-frame`       | `#54594d` | 0.85      | 0.2       | floor, castings, door, poles, bottles |
| `awning-canvas`         | `#a29b88` | 1         | 0         | flat, awning and sign plate           |
| `medical-marking`       | `#8e5142` | 0.95      | 0         | the cross                             |
| `interior-dark`         | `#2b2724` | 1         | 0         | floor and the far panel               |

5 live materials in variants 0/2, 4 in variant 1 (no cross).

The three shell colours are all from the palette's glass row, which is a legitimate reading — a
painted steel container does read closer to tinted glass than to masonry at distance. `#65766d` is
also the project standard glass swatch, so variant 0 is a single hex appearing in six other
candidates.

## The gas bottles are what name it medical

Two bottles strapped to the -X flank, 0.28 × 1.2 × 0.28 m. Two meshes.

A green container with a faded cross could be anything with a cross on it. The bottles are what
make it specifically medical, and they are the cheapest possible way to say so. They were added
last and they are the detail that most improves the read.

## Variants

| variant | shell           | state                      |
| ------- | --------------- | -------------------------- |
| 0       | green `#65766d` | cross and awning intact    |
| 1       | pale `#78908b`  | **cross removed**          |
| 2       | grey `#8b887d`  | **awning torn, flap down** |

Both state variants are removals, which is the batch's pattern:

- **Variant 1 loses the cross entirely.** A medical station with its markings gone is a specific
  and slightly disturbing state — a facility that no longer wants to be identified as one. It costs
  2 meshes and a whole material.
- **Variant 2's awning has come down**, with the flap propped at an angle on one pole. A drooping
  awning over an entrance is visible from much further than the 2 m tear actually is.

Neither state is a recolour, and both are more interesting than a third green.

## Complexity

27–30 meshes, ~324–360 triangles, 4–5 materials. Cheap for a 6 m building, and the cheapest
building in the batch apart from the blast wall kit piece.

## What reads well

- **Far:** a container silhouette with a pale awning sloping off one end and a small dark doorway
  under it. The awning is the identifying feature at distance, not the cross.
- **Near:** the corner castings, the corrugation ribs, the cross, the gas bottles, the open door.

## Unresolved questions

- **The collider seals the "clear entrance"** — the batch's most pointed instance, and the phrase
  in the brief most directly contradicted by the delivered asset.
- **No interior.** 5.9 m of depth behind a dark panel, and nothing in it: no cot, no supplies, no
  light. A single cot and a crate would transform the read through the doorway.
- **The awning poles stand in front of the front wall** at x = -0.6 and 1.4, which the raycast
  caught when testing the wall's solidity. It is correct for an awning but it does mean the entrance
  is flanked rather than clear, and the left pole partly masks the wall beside the door.
- **The cross is on the front face at x = -0.55**, which is the narrow strip between the door's
  left edge and the container's left corner — 0.67 m of wall. The cross is 0.62 m wide, so it very
  nearly fills that strip. It is tight, and on a wider doorway it would not fit.
- **No steps or ramp** to the doorway. The base is 0.24 m and the floor is at 0.3 m, so the entrance
  is 0.3 m above grade with nothing to climb.
- **No power, no cable, no generator.** A field medical station needs power and this has none, which
  is where the floodlight tower (#29) or a cable run to the comms truck would belong.
- **No signage beyond the blank plate.** A red cross on the roof, visible from the air, would be
  2 more meshes and would be the strongest possible read at distance.
- **Variants 0 and 2 differ only in the awning**, and only by 1 mesh beyond the flap. Variant 1 is
  the interesting one.
- **The bottles are plain boxes** with no valve, regulator, or strap. At 0.28 m they are readable as
  cylinders only because of where they are.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Doorway confirmed as a real 5.9 m void by raycast, and the front wall to the right of the door
  confirmed solid at z = 3.03. (The left-hand wall test was obscured by an awning pole, which is
  noted above rather than hidden.)
- Variant mesh and material counts confirmed: 29/5 in variants 0/2, **27/4 in variant 1** with the
  cross removed.
- Light count checked explicitly: zero.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether the awning is the feature that identifies this
  asset at distance, or whether it needs something else, needs a real look.

## Licensing

Original work. No external assets, textures, or references used.
