# Roadside Picnic Shelter — candidate review

Draft ID: `candidate-picnic-shelter` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #17, "Forest and rural"

## Purpose and intended placement

A timber shelter with a roof, a picnic table, and scattered debris, for a rural rest stop. Expected
at the end of a forest track, beside a lay-by, or at a trailhead — anywhere a player might stop and
sit.

It is the smallest habitable asset in the batch: the player is meant to stand in it and use the
table, which drives the collider decision below.

## Dimensions and scale

- Declared `dimensions`: 4.6 × 3.3 × 5.1 m
- Measured: 4.50 × 3.17 × 5.02 m, identical across variants 0/1; the same in variant 2
- 3.8 m of post spacing, 2.45 m to the beams, 2.95 m to the roof — **1.4 scout heights**. A picnic
  shelter should be low enough to feel sheltered rather than roomy.
- **The 5.0 m depth is mostly debris**, not structure. The shelter itself is 3.0 m plus roof
  overhang; the fallen planks reach to z = 2.65.
- The table top at 0.76 m is a real picnic-table height, and the benches at 0.46 m.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. **+Z is the open front**, where the roof is lowest and
where the debris is scattered. The shelter is open on all four sides, so unlike the ranger cabin
there is no real facing — `rotationY` mostly decides which way the table's benches face.

## Collider proposal

`center {0, 0.45, 0}`, `size {2.9, 0.9, 1.2}` — **the picnic table only.**

This is the third asset in the batch where the collider deliberately protects the usable space
rather than the model:

- The transit shelter (#09) collides its back panel so the player can stand inside.
- The hunting blind (#13) collides its base and deck so the hut stays free.
- Here the shelter is open on all four sides, so there is nothing to collide but the furniture.

**The cost is the posts.** A player will walk through a 0.16 m post. Accepted deliberately: a
player clipping a corner post is a much smaller lie than a picnic shelter they cannot stand in, and
it is the same reasoning the transit shelter review sheet sets out.

Verified: a ray straight down through the middle of the shelter hits the roof, two purlins, and
then the **table top at y = 0.82** — so the table is solid and the space around it is not. Rays at
(0, 1.3), (±1.6, 0) hit only roof and purlins, confirming the standing and sitting space is open.

## Interaction points

| id             | label        | position  |
| -------------- | ------------ | --------- |
| `picnic-table` | Picnic Table | 0, 0, 0.5 |

In front of the table, clear of the collider. Reads as a rest or eat interaction, which is the
entire point of the asset.

## Materials

| name                  | colour    | roughness | metalness | notes                |
| --------------------- | --------- | --------- | --------- | -------------------- |
| `shelter-timber`      | `#655744` | 1         | 0         | variant 0            |
| `shelter-timber-worn` | `#8b887d` | 1         | 0         | variant 1            |
| `shelter-timber-dark` | `#514437` | 1         | 0         | variant 2            |
| `roof-sheet`          | `#626753` | 0.95      | 0         | flat, corrugated     |
| `debris-timber`       | `#4b4035` | 1         | 0         | the scattered planks |

3 live materials per variant. `#8b887d` is a **grey-brown timber**, not a painted grey, and it is
the one variant here that reads as sun-bleached rather than dark — which is a different weathering
story from the other two.

## Variants

| variant | timber           | state                 |
| ------- | ---------------- | --------------------- |
| 0       | `#655744`        | intact                |
| 1       | `#8b887d` (worn) | intact                |
| 2       | `#514437`        | **one bench missing** |

Variant 2 is the only structural variation and it is a single change: both bench braces are
omitted, so the +Z bench has nothing under it. That drops the asset from 27 meshes to 25.

Worth being honest about: **variant 1 differs from variant 0 only in colour.** For a scattered
roadside prop, having one fully distinct state out of three is thin. A collapsed roof or a missing
half of the table would be the obvious addition.

## The debris is named in the idea, so it is modelled

Four fallen planks, each with its own length, position, yaw, and — for one of them — a slight tilt:

| plank | size       | position   | yaw  | tilt |
| ----- | ---------- | ---------- | ---- | ---- |
| 1     | 1.4 × 0.3  | 1.2, 1.9   | 0.5  | 0    |
| 2     | 0.9 × 0.28 | -1.5, 2.0  | -0.3 | 0.06 |
| 3     | 1.1 × 0.26 | 0.3, -2.1  | 1.1  | 0    |
| 4     | 0.5 × 0.24 | -1.9, -1.4 | 0.2  | 0    |

They are what make the shelter read as **abandoned** rather than as a maintained rest stop, and
they are most of why the asset's z extent is 5.0 m rather than 3.5 m.

## Shed roof, no gable

A single near-flat sheet with a 0.12 rad fall, higher at the back. A gable would have needed a
fourth copy of the triangular-prism helper; the row house review sheet has flagged three copies as
the point where copying stops being defensible, and the barn shell (#19) took that third copy. This
one avoids the need instead.

## Six posts, not four

The four corners plus two mid-span. A 3.8 m timber span needs them, and they are 6 meshes of
0.16 m section. The beams and three purlins on top make the roof read as supported rather than
floating.

## Complexity

27 meshes, ~324 triangles, 3 live materials. Light for a structure the player can stand in, and
cheap because the posts are the only thin geometry.

## What reads well

- **Far:** the low roof and the two end beams. A small horizontal bar in the middle of a field
  reads as "something built here" from a long way off.
- **Near:** the picnic table with its benches, the debris planks, the gaps between the purlins.

## Unresolved questions

- **The posts are not solid.** Already discussed; accepted, but it is the third asset making this
  trade and the owner may want a rule rather than three separate judgements.
- **Nothing says "roadside".** There is no road edge, no gravel apron, no signpost, no kerb. A
  shelter standing alone in a field could be anything. One leaning signpost would name the asset
  from 30 m and costs 2 meshes.
- **The table has no A-frame angle.** The legs are two vertical boards per end rather than splayed
  A-frames, so it reads as a bench-and-table rather than a picnic table at a glance.
- **The benches have no seat slats** — each is one 0.32 m plank. Three slats per bench would be 4
  more meshes and would read better.
- **Only one of three variants differs structurally**, as noted.
- **The roof is a single clean sheet** in all variants. A hole, a lifted corner, or a missing purlin
  would sell "abandoned" far better than the debris does.
- The debris planks are all the same 0.09 m thickness. Real fallen timber varies, and 4 different
  thicknesses is free.
- No litter that is not timber — no bin, no bottle, no sign of people having been there and left.
- Nothing identifies it as _picnic_ rather than a market stall frame: no umbrella, no grill, no
  fire ring.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0 after the table-leg fix.
- Standing space confirmed clear and the table confirmed solid by downward raycast at four
  positions, as quoted above.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** Whether a table-only collider feels right in play is a
  judgement call that needs the real thing running.

## Licensing

Original work. No external assets, textures, or references used.
