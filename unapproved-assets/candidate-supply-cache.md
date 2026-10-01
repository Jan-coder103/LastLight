# Handmade Supply Cache — candidate review

Draft ID: `candidate-supply-cache` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #41, "Loot, survival, and interaction props"

## Purpose and intended placement

A scavenger's crate: a slatted timber box on a pallet, with corner irons, a rope lashing over the
lid, a mismatched patch board on the front, and a coiled rope beside it. Intended as a lootable
supply point in a cache, safehouse, or roadside drop. Small enough to read as a crate at waist
height and distinct enough to be a *cache* rather than a generic box.

## Dimensions and scale

- Declared `dimensions`: 2.1 × 1.2 × 1.4 m (bounds include the rope coil and the ground clutter)
- Measured (vertex-accurate): 2.06 × 1.13 × 1.31 m (variants 0/2), 1.56 m wide (variant 1, no
  clutter)
- The crate itself is 1.05 m square and 0.88 m to the top of the lid ridge. **0.5 scout heights.**

## Pivot and front direction

Ground at y = 0, crate centred on x = 0, z = 0. **+Z is the front**: the door-side face with the
patch board and the stencilled bars. The rope coil sits on the +X side and the ground clutter on
−X, so the crate is deliberately not symmetric about its own front.

## Collider proposal

`center {0, 0.45, 0}`, `size {1.12, 0.9, 1.12}` — the crate and its pallet only.

The rope coil, the tarp, the marker cairn and the patch board are all outside the collider, which
is correct: a player should be able to stand against the crate without the coil stopping them.
0.9 m is a touch under the real crate height so a player can step onto the pallet without a hard
stop.

## Interaction points

| id           | label         | position   |
| ------------ | ------------- | ---------- |
| `cache-lid` | Supply Cache  | 0, 0, 0.85 |

On the +Z face, clear of the collider. Reads as a search or open point.

## Materials

| name                    | colour    | roughness | metalness | notes                            |
| ----------------------- | --------- | --------- | --------- | -------------------------------- |
| `cache-timber`          | `#594332` | 1         | 0         | slats, stiles, ridge caps        |
| `cache-pale-timber`     | `#655744` | 1         | 0         | pallet, battens, patch, cap      |
| `cache-strap`           | `#54594d` | 0.85      | 0.3       | corner irons, lashing, staples   |
| `cache-rope`            | `#7d7358` | 1         | 0         | coil, tail, folded tarp          |
| `cache-rust`            | `#9b624d` | 0.9       | 0.15      | lashing buckle only              |
| `cache-signal`          | `#d9b56e` | 0.75      | 0.05      | three stencil bars on the front  |

6 materials, and this is the smallest palette in the batch. The prop is 90% timber, and the two
accents (buckle, stencil) are each under 0.02 m³ of surface.

## Variants

| variant | lashing | lid | ground clutter |
| ------- | ------- | --- | -------------- |
| 0       | present | closed | tarp + cairn |
| 1       | **removed** | closed | **removed** |
| 2       | present | **lifted 0.55 rad on a hinge** | tarp + cairn |

Variant 2 is the one that matters: the lid on a pivot is the difference between "box" and "someone
packed this and came back". Variant 1 is the crate alone, which is what a placement wants when the
surroundings are already busy.

## Complexity

46 meshes / 730 triangles (v0), 49 / 772 (v1), 53 / 814 (v2). 6 materials.

Mesh count is high for the size because of the slats: three courses on four faces is twelve
meshes, plus four stiles and eight corner irons. The courses are what stop the crate reading as a
plain box, and they are worth it at 0.9 m from a third-person camera.

## What reads well

- **Far:** the raised ridge lid and the lashing strap over it, against the paler slats. A crate
  with a ridge on top is distinguishable from a crate without one at 30 m.
- **Near:** the slat courses with their shadow lines, the corner irons, the patch board and its two
  staples, the stencilled bars, and the rope coil.

## Unresolved questions

- The lid pivot in variant 2 leans on the back rim; there is no prop holding it, so it reads as
  balanced rather than as propped. A stick or a crate edge under the lid would fix it for one mesh.
- The stencilled bars are three plain strips, not letters or a marking. At close range a player
  will want to know what is in it; a texture or a simple glyph is a question for the owner, not
  for this draft.
- Rope is a torus. A coil of real rope is a helix, and at very close range two concentric tori
  read as a ring and a ring.
- The marker cairn is three cones. It is there to fill the −X corner and it is the weakest element
  on the prop.

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
