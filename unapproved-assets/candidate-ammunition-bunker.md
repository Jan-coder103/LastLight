# Ammunition Bunker — candidate review

Draft ID: `candidate-ammunition-bunker` · Category: `building` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #27, "Military base and checkpoints"

## Purpose and intended placement

A compact earth-covered storage magazine with a heavy door and warning placards. Expected at
ammunition dumps, in fortified corners, and half-swallowed by whatever has grown over the site.

## Rework (owner request: "somewhat broken")

The first draft buried its own front door. The berm was a hexagonal frustum whose +Z corner
vertex reached 4.3 m from centre at the base, while the concrete face sat at z = 3.5 — so below
about 1.4 m the mound surface stood **in front of** the face and swallowed the bottom of the
door. What the viewer actually showed was a concrete wall standing in front of a mound with
visible daylight gaps at the sides, plus a symmetric hexagon that read as set geometry from
above.

The rework builds the structure the way real magazines are built, and the berm problem
disappears because the face is no longer fighting the mound:

- A **concrete chamber** (4.4 × 2.6 × 6.0 m) sits at the core with its door face **flush at
  z = +2.5**.
- **Two earth wedges** rise against the chamber's side walls (toes at ±3.9 m), and a **rear
  wedge** slopes away from the back wall down to z = −5.2 — built as triangular prisms, the same
  low-poly language as the burned trees.
- An **earth ridge covers the roof**, carrying a **steeper turf cap** inset 0.1 m from the
  ridge's front and back edges, so from the top-down camera the roof reads as grass over earth.
  The turf's base corners land exactly on the earth ridge's base corners, so nothing floats and
  the earth apex cannot poke through.
- **Grass tufts** dot the side berms; the **vent now punches through the roof turf** where it
  belongs instead of floating on a frustum.
- The heavy door assembly (leaf, hinges, spoked wheel, proud frame), warning placards, and
  retaining kerbs are carried over onto the flush face. The closed door remains correct for an
  ammunition store and keeps this the one candidate with no collider-versus-opening conflict.
- The dark `placard-text` material was renamed **`door-shadow`** (the previous sheet flagged the
  name as wrong for the door-recess use).

A rotation-sign bug found and fixed during the rework: the rear prism initially mapped to
z ∈ [0, 1.7] — entirely inside the chamber — until the rotation direction was corrected so the
wedge actually rises from the back wall.

## Dimensions and scale

- Declared `dimensions`: 7.8 × 3.5 × 8.8 m
- Measured (vertex-accurate): 7.80 × 3.42 × 8.75 m, identical across all three variants
- The mound is 7.8 m across at the toes and 3.42 m at the turf apex. **1.6 scout heights** — a
  buried structure should be a mound, not a building. The concrete face (2.6 m) is the only
  architecture that breaks the skyline.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the front**: the concrete face, door,
placards, and approach kerbs are all on the +Z side.

## Collider proposal

`center {0, 1.7, -0.5}`, `size {7.4, 3.4, 8.0}`.

Sized to the berm rather than the face, as before: a buried structure is a solid lump and a box
is right. The box is an over-estimate at the wedge toes' corners, which is the correct direction
for an obstacle to err in.

## Interaction points

| id            | label       | position  |
| ------------- | ----------- | --------- |
| `bunker-door` | Bunker Door | 0, 0, 3.7 |

In front of the door, just outside the collider's front face (z = 3.5). The first draft's point
at z = 4.4 no longer matches the shorter footprint.

## Materials

| name                   | colour    | roughness | metalness | notes                            |
| ---------------------- | --------- | --------- | --------- | -------------------------------- |
| `bunker-concrete`      | `#8b887d` | 1         | 0         | variant 0, chamber, frame, kerbs |
| `bunker-concrete-dark` | `#797762` | 1         | 0         | variant 1                        |
| `bunker-concrete-pale` | `#a29b88` | 1         | 0         | variant 2                        |
| `berm-earth`           | `#514437` | 1         | 0         | wedges and roof ridge            |
| `berm-turf`            | `#58624d` | 1         | 0         | flat shaded, roof cap and tufts  |
| `blast-door`           | `#54594d` | 0.8       | 0.25      | leaf, hinges, wheel, vent        |
| `placard-warning`      | `#c5ad70` | 0.9       | 0         | the two placards                 |
| `door-shadow`          | `#2b2724` | 0.95      | 0         | door recess and placard text     |

6 live materials per variant. `blast-door` remains a broad name (six painted-steel objects), as
noted in the previous sheet — still defensible, still worth knowing for editor overrides. The
amber `#c5ad70` is still the only warm colour, on functional warning placards.

## Variants

| variant | concrete  | placards | meshes |
| ------- | --------- | -------- | ------ |
| 0       | `#8b887d` | both     | 34     |
| 1       | `#797762` | **one**  | 30     |
| 2       | `#a29b88` | both     | 34     |

Unchanged axis: variant 1's missing placard is a removal, not a colour, and variants 0/2 remain
identical geometry. With the rework the concrete tint now affects the chamber and kerbs (visible
surfaces) rather than a face floating on a mound.

## Complexity

30–34 meshes, ~285–317 triangles, 6 materials. The berms are 3 prisms (8 triangles each), the
chamber is 1 box, so the mound itself costs almost nothing.

## What reads well

- **Far:** a long earth mound with a green ridge and a small concrete portal in one end — the
  magazine silhouette the idea describes, and a shape the batch has nothing else like.
- **Near:** the blast door's wheel and spokes, the placards, the kerbs flanking the approach,
  the vent through the turf.

## Unresolved questions

- **No blast damage, no collapse, no exposed interior.** Still the least interesting of the
  three states a ammunition bunker can be in (emptied, blown open, left). Variant axes that
  show damage would need owner direction first.
- The face is still clean concrete — no weathering run-off below the door frame, the single most
  characteristic mark on a bunker entrance.
- The rear wedge meets the side wedges in a plain seam; from directly above the outline is now
  rectangular rather than hexagonal, which reads more built but still regular.
- Stencilled placard text remains three bars; a triangle hazard glyph would be 1 mesh if wanted.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- **Face-versus-berm intersection eliminated by construction**: the concrete face plane
  (z = 2.5) stands clear of every earth surface; the closest earth (wedge inner edges) is
  flush with the chamber walls, never in front of the face. Confirmed in head-on renders.
- Placard count confirmed: 2 in variant 0, **1 in variant 1**.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` positions.
- **Previewed in the staging viewer** (`viewer.html`) in headless Chromium with software WebGL:
  head-on, three-quarter, and rear views, variants 0 and 1. The wall-in-front-of-a-mound read of
  the old build was confirmed head-on, and the flush portal read of the rework confirmed from
  all three angles. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
