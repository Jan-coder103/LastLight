# Flooded Road Marker — candidate review

Draft ID: `candidate-flooded-road-marker` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #34, "Port, mountain, and industrial areas"

## Purpose and intended placement

A storm-damage road sign: a leaning timber depth post with painted staff graduations, a guy stay,
a torn-out guardrail fragment, a silted ditch line with standing water, driftwood and a faded
hazard cone. Intended on a low-lying road or a causeway where the map is meant to read as
flood-prone, and as a small silhouette cue beside a causeway.

## Dimensions and scale

- Declared `dimensions`: 4.7 × 3.0 × 1.7 m
- Measured (vertex-accurate): 4.63 × 2.95 × 1.63 m (variants 0/2), 4.59 × 1.58 (variant 1)
- Post 2.8 m above its pad. **1.4 scout heights.**

## Pivot and front direction

Ground at y = 0, origin at the middle of the ditch line. **+Z is the direction the road runs**, so
a placement lines the marker up with the carriageway. The guardrail fragment stands to +X, across
the road; the cone sits on the road side at −X.

The asset is deliberately *not* centred on its own bounds (x −1.58 to 3.05, z −0.40 to 1.23) —
the post is the subject, and it should sit where the placement puts it.

## Collider proposal

`center {0.6, 0.55, 0}`, `size {3.0, 1.1, 0.5}` — the post's concrete pad and the guardrail line
only, and only up to 1.1 m.

A depth post is a sign, not an obstacle. The collider is deliberately shorter than the model so a
player brushes past the leaning post rather than being stopped by it. The upper post, the stay and
the rail are all outside the collider; a player can pass through the rail line, which is
consistent with a rail that has already been torn out.

## Interaction points

| id           | label            | position   |
| ------------ | ---------------- | ---------- |
| `flood-post` | Flood Depth Post | −0.6, 0, 1.3 |

On the road side of the post, clear of the collider. Reads as a depth-reading or inspection point.

## Materials

| name              | colour    | roughness | metalness | notes                              |
| ----------------- | --------- | --------- | --------- | ---------------------------------- |
| `marker-timber`   | `#594332` | 1         | 0         | post, driftwood                    |
| `marker-faded-timber` | `#655744` | 1     | 0         | graduation bands, cap, kick pieces |
| `marker-steel`    | `#64675d` | 0.85      | 0.25      | stay, rail, posts, foot plates     |
| `marker-paint`    | `#c5ad70` | 0.85      | 0         | every third graduation, reflector  |
| `marker-rust`     | `#8a5645` | 0.9       | 0.15      | bolt plate, hazard cone            |
| `marker-silt`     | `#5b5645` | 1         | 0         | pad, anchor, silt patch            |
| `marker-water`    | `#4a5850` | 0.35      | 0.05      | standing water                     |

7 materials for a 4.6 m prop — more than it needs. `marker-silt` and `marker-faded-timber` are
close enough in value that merging them would cost nothing visually and drop a material.

## Variants

| variant | post lean | guardrail fragment |
| ------- | --------- | ------------------ |
| 0       | 0.17 rad  | two posts + rail    |
| 1       | 0.17 rad  | **one post**, no rail |
| 2       | **0.36 rad** | two posts + rail  |

Variant 2's doubled lean is the one that reads from a distance: a post at 0.36 rad looks like it is
about to go over, which is exactly the information a flood marker should carry.

## Complexity

25 meshes / 302 triangles (v0 and v2), 23 / 278 (v1). 7 materials.

The graduations are 8–9 thin bands up the post, which is the bulk of the mesh count. They are worth
it: the striped staff is the whole read of the asset.

## What reads well

- **Far:** a leaning striped post with a light cap. Unmistakable, and it survives being 40 m away.
- **Near:** the graduations, the cross stay and its anchor, the bent rail with its bolt plate, and
  the water in the ditch line.

## Unresolved questions

- The silt patch and the water are still flat rectangles. They were narrowed after the first
  preview, which helped, but on a perfectly flat map plane a rectangle of water will read as a mat.
  A future map with any ground undulation would hide the edges.
- The cone is a single primitive and reads as slightly out of place with the rest of the asset; it
  is the one element borrowed wholesale from a traffic-prop vocabulary.
- No sign text. At play distance a mark is enough, but a close third-person player will want to
  know what the post measures.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the leaning rail post and the
  driftwood were both re-seated after measurement put them below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. The
  flat-mat problem on the silt and water was seen and the pieces narrowed. Not viewed in the game
  engine.

## Licensing

Original work. No external assets, textures, or references used.
