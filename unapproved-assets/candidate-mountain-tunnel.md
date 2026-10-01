# Mountain Road Tunnel — candidate review

Draft ID: `candidate-mountain-tunnel` · Category: `landmark` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #35, "Port, mountain, and industrial areas"

## Purpose and intended placement

A tunnel mouth cut into a hillside: an arch-banded headwall with splayed wing walls, a dark open
bore, a hazard band over the crown, a partly blocked lane of fallen slab and scree, and a rock
ridge the portal is cut into. Intended on a mountain road where a map needs a hard boundary, or
as a shelter entrance.

## Dimensions and scale

- Declared `dimensions`: 19.8 × 12.1 × 11.1 m
- Measured (vertex-accurate): 19.78 × 11.44 × 10.86 m (variant 0), 12.04 m tall (variant 2)
- Bore 5.9 m across, springing at 3.15 m, headwall cap at 8.6 m. **4.0 scout heights** to the cap,
  5.8 for the buried variant.

## Pivot and front direction

Ground at y = 0. **+Z is the direction the road runs through the portal**, so a placement points
+Z down the bore. The headwall face is at z ≈ +0.9; the model is not centred on its bounds in Z
(−6.96 to +4.09) because the hillside sits behind the face and should sit behind it in the world.

## Collider proposal

`center {0, 3.6, −1.6}`, `size {15.0, 7.2, 3.2}` — the headwall block only.

The bore is **open and walkable**. A player can enter the tube, which is why the asset is a
shelter rather than a wall, and why the collider stops at the mouth. The rock ridge, the wing
walls and the kerbs sit outside it. The cost is a player clipping the arch ring at the mouth.

## Interaction points

| id             | label        | position   |
| -------------- | ------------ | ---------- |
| `tunnel-mouth` | Tunnel Mouth | 0, 0, 2.2 |

On the road, just outside the collider. Reads as a shelter or checkpoint point.

## Materials

| name                | colour    | roughness | metalness | notes                            |
| ------------------- | --------- | --------- | --------- | -------------------------------- |
| `tunnel-concrete`   | `#8b887d` | 0.95      | 0         | piers, arch ring, wing walls     |
| `tunnel-soot`       | `#514f49` | 0.95      | 0         | upper pier tier, crown, kerbs    |
| `tunnel-rock`       | `#6f6e60` | 1         | 0         | ridge, apron, breach debris      |
| `tunnel-scree`      | `#797762` | 1         | 0         | scree wedge, talus, chunks       |
| `tunnel-bore`       | `#22261f` | 1         | 0         | the bore interior                |
| `tunnel-hazard`     | `#9b624d` | 0.9       | 0.1       | crown band and two marker lamps  |
| `tunnel-rail`       | `#64675d` | 0.85      | 0.25      | toppled delineator post          |

7 materials. The rock was pulled from the palette's `#77796a` to `#6f6e60`: the original value put
the ridge in the same family as the foliage greens, and the hillside read as a hedge.

## Variants

| variant | shoulder | crown |
| ------- | -------- | ----- |
| 0       | intact   | clean |
| 1       | **spalled**: fresh scar, talus fan, fallen slab | clean |
| 2       | spalled  | **buried**: scree cap and drift over the crown |

Variant 1 is a slope failure, variant 2 is the same failure plus snow load on the crown. They stack
because they are different events, and variant 2 is the only variant that changes the asset's
height (11.4 → 12.0 m).

## Ground handling

Fallen debris is placed at a nominal height and then `settle()`d: the mesh is measured with its own
rotation applied and its Y set so the lowest corner sits at the ground line. Without this, a rotated
slab pushed its corner 0.41 m below the terrain. This is deterministic and costs six lines.

## Complexity

46 meshes / 572 triangles (v0), 49 / 608 (v1), 51 / 632 (v2). 7 materials.

## What reads well

- **Far:** the arch band and the dark bore against a stepped headwall, under a rock ridge. The arch
  ring is the part that makes it a tunnel rather than a hole in a wall.
- **Near:** the voussoir blocks, the splayed wing walls with their parapet stubs, the three
  wall cracks, the blocked lane, and the kerbs.

## Rework after the first preview

The first build was two faults:

- **The opening did not read as a tunnel.** The headwall was one slab with five loose blocks
  scattered around the bore at inconsistent radii, which looked like debris rather than an arch. The
  headwall is now built as two pier tiers per side plus a full-width crown, and the arch is a ring
  of seven voussoir blocks at a single radius.
- **The rock shoulders were two floating boxes** with a gap between them and a visible vertical
  face at the front. They are now two overlapping masses sharing a face at x = 0, plus a low apron,
  so the headwall meets one continuous hillside.

## Unresolved questions

- The bore is 7 m of dark tube with a floor and no far end. On an open map the player will see the
  tube interior from behind; if this is ever visible from the reverse side it will look like a
  capped pipe. A second portal, or an expectation that the world supplies a hill, would fix it.
- Rock is still three boxes at 5.9 m each. It reads acceptably from the road but it will not
  survive a player walking up onto the ridge.
- Lane blockage is asymmetric by design (clear on the +X side) but the clear side is narrower than
  a player capsule once the kerbs are counted.
- No guardrail or signage approach to the portal.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 after the `settle` pass.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view, variants
  0 and 2. The broken arch and the floating shoulders were confirmed visible in the first build and
  confirmed gone in this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
