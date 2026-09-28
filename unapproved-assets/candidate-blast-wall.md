# Blast Wall Segment — candidate review

Draft ID: `candidate-blast-wall` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #22, "Military base and checkpoints"

## Purpose and intended placement

**A modular kit piece, not a building.** One 3.0 m concrete segment, designed to be tiled along X
at 3.0 m centres to form a base perimeter or protect a supply area.

This is the same kind of asset as the apartment block entrance (#03): its value is in repetition,
and its geometry is deliberately predictable so placement can rely on it. Six to ten meshes, no
interaction points, and a collider that is exactly the panel.

## The chamfered cap is the feature

A blast wall's cap is chamfered, and that is not decoration — it deflects blast upward rather than
catching it square. Modelling it is what separates this from a garden wall.

The cap is one box, 0.34 m deep and 0.65 m wide, rotated **0.3 rad (17°)** about X and sitting
slightly forward of the panel face. Verified by measurement. One mesh carries the whole idea.

## Dimensions and scale

- Declared `dimensions`: 3.3 × 3.0 × 0.9 m
- Measured: 3.16 × 2.96 × 0.88 m (variants 0/1), identical in variant 2
- 3.0 m long, 2.8 m to the cap crown, 0.45 m thick. **1.4 scout heights** — you can see over it,
  which is correct for a supply-area wall.
- The 3.16 m length includes the plinth, which is 0.08 m proud each end.
- The 0.88 m depth is the tilted cap, not the 0.45 m panel. The cap is the deepest part.

## Tiling contract

**The segment tiles at 3.0 m centres along X.** That number is the panel's authored length, and it
is what the placement system should use. Placing at any other pitch gives either a gap or an
overlap, and the buttress ribs would interpenetrate.

The plinth is 3.16 m wide rather than 3.0, so tiled segments have a 0.16 m overlap in the plinth
band. That is deliberate — a continuous footing under a run of segments is what a real precast
perimeter has — but it does mean the plinths will z-fight slightly if placed at exactly 3.0 m.
Placing at 3.05 m centres avoids it, at the cost of a 5 cm gap. Worth deciding.

## Pivot and front direction

Ground at y = 0, panel centred on x = 0, thickness in Z. **-Z is the outward face** (the side
under attack, carrying the chamfer and the stencil) and **+Z is the inward face** (carrying the
two buttress ribs).

This is the third kind of pivot departure in the batch, but the mildest: the origin is at the
centre of the panel's plan area, so a bounding-box centring placement is correct. The ribs only
make the model asymmetric in Z, and only by 0.26 m.

## Collider proposal

`center {0, 1.48, 0}`, `size {3.0, 2.96, 0.6}`.

**This is one of only two assets in 29 where a single box is simply the right answer** — the other
being the bus, which is a solid convex vehicle. A blast wall is a flat solid slab, so a box is an
accurate collision volume with no compromise: it does not block space the player should be able to
use, and it does not leave the player able to walk through solid concrete.

Measured to match the visual: 2.96 m tall, against a panel that is 2.8 m plus a cap reaching 2.96 m.

The cap overhangs the collider in Z by about 0.09 m, which is correct — a 17° chamfer at head
height should not stop a body.

## Interaction points

None. It is a wall.

This is the third candidate with an empty list, alongside the parking ramp and the collapsed
bridge. All three are obstacles or landmarks rather than things you do, and inventing a point on
each would be padding.

## Materials

| name                  | colour    | roughness | metalness | notes          |
| --------------------- | --------- | --------- | --------- | -------------- |
| `blast-concrete`      | `#8b887d` | 1         | 0         | variant 0      |
| `blast-concrete-worn` | `#797762` | 1         | 0         | variant 1      |
| `blast-concrete-pale` | `#a29b88` | 1         | 0         | variant 2      |
| `blast-cap`           | `#a29b88` | 1         | 0         | the chamfer    |
| `marking-olive`       | `#58624d` | 0.95      | 0         | stencil band   |
| `rebar-rust`          | `#8e5142` | 0.85      | 0.2       | variant 2 only |

3 live materials in variants 0/1, 4 in variant 2.

`blast-cap` and `blast-concrete-pale` are **the same hex** (`#a29b88`). That is deliberate: the cap
is a different precast casting and a slightly different batch of concrete, but keeping one stable
name for it means the future editor can address the cap independently. Documented because two names
on one hex looks like a mistake.

## Variants

| variant | concrete  | state                                        |
| ------- | --------- | -------------------------------------------- |
| 0       | `#8b887d` | intact                                       |
| 1       | `#797762` | intact, darker                               |
| 2       | `#a29b88` | **top corner spalled, 3 rebar bars exposed** |

Variant 2 is the only structural change and it is a good one: a chunk off the top corner with three
rusted bars. For a perimeter wall, a segment that has been shot or smashed is a far more useful
state than a third shade of grey, and it is the batch's "removal tells a story" pattern again — the
silo's missing ladder, the wind pump's missing vane.

It costs 4 meshes and 48 triangles, which is 8 of the asset's 10.

## Buttress ribs

Two 0.34 × 2.3 × 0.26 m ribs on the inward face, at x = ±0.75. One mesh each.

These are the reason the wall is not a bare slab. The idea says the segments "form a base
perimeter", and a perimeter's inner face is what a player standing inside the base looks at all
day. A plain 3 × 0.45 m box would read as a fence panel; the ribs read as a structure.

They also create a tiling hazard, since adjacent segments' ribs would overlap at 3.0 m pitch if
they were closer to the ends. At ±0.75 with 0.34 m width they clear, which is why those two numbers
are what they are.

## Complexity

**6 meshes and ~72 triangles in variants 0/1.** 10 meshes and ~120 in variant 2.

That is the cheapest asset in the batch by a factor of three — the timber stacks are next at 8
meshes and 176 triangles. It is also the right answer: a modular wall is the asset most likely to
be placed in dozens, and at 6 meshes a 20-segment perimeter costs 120 meshes total.

## What reads well

- **Far:** the horizontal chamfer catching light along the top of a run of segments. A run of
  eight of these with the cap catching a low sun will read as a blast wall from a long way off.
- **Near:** the Jersey-like cap angle, the stencil band, the buttress ribs, and in variant 2 the
  spalled corner with rebar.

## Unresolved questions

- **The tiling pitch is unspecified by the placement system.** 3.0 m is the natural pitch but
  nothing enforces it, and the plinth overlap noted above means the exact number matters.
- **No corner or end piece.** A perimeter needs to turn corners, and a run of straight segments
  mitred by hand will look wrong at 90°. A corner variant would be the natural companion asset.
- **No gate opening or vehicle gap variant.** A supply-area wall is mostly there to have a gap in
  it. A 6 m opening variant would be far more useful than a third concrete tone.
- **The plinth overlap will z-fight** at exactly 3.0 m pitch. Needs a decision.
- **The stencil band is a plain olive rectangle** with no symbol, unit marking, or panel number.
  It reads as "painted" and nothing more.
- **Only 0.08 m of proud plinth and a single 17° chamfer.** Real blast walls often have a thicker
  footing, a drainage gap at the base, and tie-rod covers.
- **The variant axis is mostly colour.** Two of the three variants are just a different grey, and
  this is the asset that most obviously wants a real state instead — a collapsed segment, or one
  with a vehicle-sized hole in it.
- Nothing ties it to the checkpoint (#21) or the pillbox (#23). A base made of these three would be
  a coherent set, and that is a placement concern rather than a modelling one.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0.
- Cap chamfer confirmed by measurement at 0.3 rad (17°), and the panel length confirmed at 3.0 m
  for the tiling pitch.
- Rebar count confirmed: 3 bars in variant 2, 0 in variants 0/1.
- `createVisual` called twice per variant and compared mesh-by-mesh: identical. No unseeded
  randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game, and never seen tiled.** A single segment says nothing about
  whether a run of eight reads correctly, which is the entire purpose of this asset.

## Licensing

Original work. No external assets, textures, or references used.
