# Fire Bin — asset review

Asset ID: `fire-bin` · Category: `prop` · Status: **Approved by owner**

## Purpose and intended placement

The improvised drum fire that a camp or a roadside stop is cooked and warmed at. It is a small
social anchor: something a player can crouch beside. Intended for camps, alley mouths, road
verges, and the edge of settlements.

## Smoke animation: not possible in the asset file

The request was to animate smoke inside the asset module. **That is not possible under the current
authored-asset contract, so it has been left out rather than faked.**

The reason is structural, not stylistic:

- `AuthoredAsset.createVisual(variant?)` returns a plain `Group` (`src/assets/assetTypes.ts`).
  There is no update, tick, or per-frame callback in the contract.
- `src/world/buildWorld.ts:126-129` calls `createVisual` once per asset/variant pair, caches the
  result as a prototype, and then `prototype.clone(true)` for every placement. Nothing in the
  world loop ever visits those clones to advance time.
- `AGENTS.md` additionally requires `createVisual` to stay deterministic and animation-free.

So any in-file animation would either not run at all, or would need an unseeded timer and a
mutation loop that the cloning path would multiply across every instance in the world.

What the project already does instead is drive effects from runtime code: see the explosion
smoke and `particleBursts` in `src/main.ts:3004-3043`, and the helicopter's separately-returned
`mainRotor` / `tailRotor` groups in `src/assets/helicopter.ts`. Fire flicker and smoke for this
prop should follow that pattern — either an extra returned handle like the helicopter uses, or a
runtime effect keyed off the `fire-pit` interaction point.

**What is in the file instead:** a _static_ flame and ember bed, so the bin still reads as a lit
fire in a still frame and in the viewer. The `flame` and `ember` materials carry modest emissive
values so the fire catches light. If the owner would rather the prop were a cold, burnt-out bin and
all fire were purely runtime, deleting the `flame` and `ember` meshes is a clean, self-contained
change.

## Dimensions and scale

- Declared `dimensions`: 0.82 × 1.18 × 0.64 m
- Measured model bounds: 0.82 × 1.11 × 0.64 m
- A 200-litre drum is genuinely waist-to-chest high on a 2.1 m scout, so 0.9 m to the rim is
  right. The declared height includes the flame plume.
- Deliberately small and near-square in plan so it clusters well with tents and fences.

## Pivot and front direction

Centred on x = 0, z = 0, ground at y = 0. A drum has no meaningful front, so **+Z is only used to
place the `fire-pit` interaction point** on the approach side. The stones and the leaning stick
are asymmetric, which gives the otherwise rotationally-symmetric drum a readable "up".

## Collider proposal

`center {0, 0.47, 0}`, `size {0.62, 0.94, 0.62}`. The drum is solid; the flame, ash, and stones
above the rim are **not** part of it, so a player can stand right against the fire without being
blocked by the visible plume. A cylinder approximated by a box slightly over-blocks at the corners,
which is acceptable and is the existing convention.

## Interaction points

| id         | label | position   |
| ---------- | ----- | ---------- |
| `fire-pit` | Fire  | 0, 0, 0.78 |

Deliberately outside the collider so the prompt appears where a player can actually stand.

## Materials

| name              | colour    | roughness | metalness |
| ----------------- | --------- | --------- | --------- |
| `drum-rust-red`   | `#8e5142` | 0.95      | 0         |
| `drum-olive`      | `#687454` | 0.95      | 0         |
| `drum-dusty-teal` | `#5c6a66` | 0.95      | 0         |
| `drum-liner`      | `#37332e` | 1         | 0         |
| `soot`            | `#2b2b28` | 1         | 0         |
| `charred-timber`  | `#514437` | 1         | 0         |
| `ember`           | `#c25a24` | 0.85      | 0         |
| `flame`           | `#d9a24e` | 0.7       | 0         |
| `metal`           | `#54594d` | 0.86      | 0.22      |

`ember` and `flame` are the only emissive surfaces in the asset set, and both are kept restrained
(`emissiveIntensity` 0.75 / 0.85) per the AGENTS guidance on reserving hot colour for signals.
7 materials are live per variant.

### Revision: closed the interior (owner feedback)

The first draft left the drum as a bare open-ended cylinder, so from several angles you could see
straight through the bin and out the far side — it read as an empty shell rather than a vessel.

The fix is a separate `drum-liner` mesh: an inset open cylinder plus a floor disc, in a
fire-blackened colour distinct from the outer paint. It is a genuinely separate surface rather than
a `side` flag on the existing shell, so the outer paint still catches the key light while the
inside stays dark and sooted. `soot` was also given `DoubleSide` so the ash bed and stones are not
see-through from below.

**Verified by raycast**, not by eye: rays fired from outside toward the centre, from the opposite
side, and on a low diagonal all now report three hits with `drum-liner` among the materials, where
previously they passed clean through.

## Variants

| variant | drum colour | fire                                     |
| ------- | ----------- | ---------------------------------------- |
| 0       | rusted red  | grate on the rim, small flame through it |
| 1       | olive       | same, grate ring slightly askew          |
| 2       | dusty teal  | **no grate — a bigger open flame**       |

Variant 2 is the only structural difference. The missing grate is what makes the fire read as
bigger rather than just recoloured, and it costs nothing extra.

## Complexity

19–22 meshes, ~448–494 triangles, 7 materials. Cheap. The drum shell is an open-ended cylinder
(`openEnded: true`) so the ash bed and flame stay visible from the angled top-down camera without
needing a second inner surface — the `drum-liner` is the only cost of the see-through fix, at one
extra cylinder and one disc. No transparent materials and no custom geometry.

## Reads at distance

Reads well from far: the silhouette is a drum with a bright plume, and the plume is the one warm
accent in the set, so it pulls the eye exactly as a real fire would. The crossed timbers and grate
only matter up close.

## Unresolved questions

- **The static flame is the main thing to decide.** Is a frozen plume acceptable, or should the
  candidate ship with a cold bin and runtime-only fire?
- The emissive is a fixed value, so in a dark scene the fire will look equally bright everywhere.
  Any day/night response has to come from the runtime.
- No real light on this prop, unlike the street light candidate. A flickering warm `PointLight`
  here would be a natural follow-up, but it was left out so the two candidates can be judged
  separately on the cost of real lights in the world.

## Validation performed

- `tsc --strict` typecheck clean.
- All 3 variants built in Node; bounding boxes measured and matched to `dimensions` / `collider`.
  An earlier draft had the leaning stones 3 cm below the ground plane; they were raised and the
  measurement now reads `minY = -0.000`.
- The see-through bug was confirmed fixed with raycasts from three directions, not by eye.
- `createVisual(1)` called twice and compared mesh-by-mesh: identical.
- Prettier clean. Vite dev server serves the module with no transform errors.
- Not previewed in the browser viewer and not seen in game.

## Licensing

Original work. No external assets, textures, or references used.
