# Timber Stacks — approved asset review

Draft ID: `timber-stacks` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #15, "Forest and rural"

## Purpose and intended placement

A single pile of cut logs, designed to be **placed several times** to build a log yard. Expected
beside the sawmill (#14), along forest tracks, at a loading area, or scattered as cover.

### How "several reusable piles" was read

The idea reads as "several reusable piles of cut logs". This candidate is **one pile module meant
to be repeated by the world generator**, not one model containing several piles.

That reading was chosen because a multi-pile module cannot be scattered, and a log yard is
precisely the thing you build by placing the same pile in a row. A separate candidate for "a
cluster of three piles in one model" would be easy to add later if the owner reads the idea the
other way.

## Dimensions and scale

- Declared `dimensions`: 4.0 × 1.5 × 2.4 m
- Measured: 3.90 × 1.31 × 1.34 m (variant 0), 3.90 × 0.87 × 1.78 m (variant 1),
  3.90 × 0.87 × 2.28 m (variant 2)
- Logs 3.3–3.8 m long and 0.46 m through, stacked 2–3 courses. That is a real log size: long
  enough that a person cannot lift one, which is what makes a pile an obstacle rather than clutter.
- Height 0.87–1.31 m, so **0.4 to 0.6 scout heights** — a pile you could climb onto.
- Variant 2 is 2.28 m deep because of the knocked-off log lying alongside.

## Pivot and front direction

Ground at y = 0, centred on x = 0, z = 0. Logs run along **X**, so the pile presents its
**irregular ends to ±X**. That means the ragged end profile — the point of the asset — faces along
X, and a placement's `rotationY` decides which way that profile looks. A log yard looks best with
its ends all facing the same way, so `rotationY` is worth setting deliberately per row.

## Collider proposal

`center {0, 0.7, 0}`, `size {3.9, 1.4, 1.8}`.

**The idea explicitly asks for a "practical collision footprint", and this is it** — a tight box
around the pile, no dead space and no overhang allowance. This is the rare case in the batch where
a box is simply correct: a log pile is a convex solid obstacle, and the box is within 5 cm of the
real shape on every side.

Variant 2's knocked-off log lies outside this box (the pile is 1.34 m deep, the fallen log reaches
1.61 m) and is therefore **not solid**. One box cannot describe "a neat pile plus a loose log
beside it". Documented rather than hidden.

## Interaction points

| id         | label    | position  |
| ---------- | -------- | --------- |
| `log-pile` | Log Pile | 0, 0, 1.4 |

At the front of the pile, clear of the collider. Reads as a salvage point — logs are one of the
few materials in a survival game that a player would actually want to stop for.

## Materials

| name            | colour    | roughness | metalness | notes                  |
| --------------- | --------- | --------- | --------- | ---------------------- |
| `log-bark`      | `#514437` | 1         | 0         | variant 0, flat shaded |
| `log-bark-worn` | `#594332` | 1         | 0         | variant 1, flat shaded |
| `log-bark-dark` | `#4b4035` | 1         | 0         | variant 2, flat shaded |

**One live material. The smallest palette in the batch**, smaller even than the rooftop tank and
the fire escape at three.

### The cut ends are not a separate material, deliberately

A cylinder has one material, so the **flat end caps are the same colour as the bark**. Real cut
ends are much paler, and that contrast is most of what makes a log pile read as cut timber.

Giving the ends their own material would mean an open-ended bark cylinder plus two `CircleGeometry`
discs per log: **3 meshes per log instead of 1**, taking a 9-log pile from 9 meshes to 27 and from
~180 to ~450 triangles. On the cheapest asset in the batch, that is not a trade worth making
without the owner asking for it.

What saves it partly: with `flatShading`, the end caps catch light differently from the curved
sides, so the ends read as distinct planes even though they are the same colour. It is an
imperfect answer, and it is the obvious first thing to improve if this asset gets attention.

## The irregular ends are the point, and they are explicit numbers

The idea asks for "irregular ends", and that is the whole layout. Each log has its own length and
z offset, written out as literals:

```ts
const LAYOUTS: Record<number, { y: number; z: number; len: number }[]> = { ... }
```

Verified distinct log lengths in variant 0: **3.3, 3.4, 3.5, 3.7, 3.8 m**. That 0.5 m of spread is
what makes the stack ends look cut by hand rather than extruded.

This is deliberately **not** unseeded randomness, which AGENTS forbids. Literals keep it
deterministic _and_ readable — someone can see exactly which log is 3.3 m and reason about the
pile's footprint without running anything. The cost is that a third variant needs six new lines
written by hand.

Courses are staggered by half a diameter (odd courses offset by 0.22) so the logs interlock the
way a real stack does, rather than stacking in a vertical column.

## Chocks

Two 4-sided chocks under the bottom course. They are what stops the pile looking like it is
floating, and they are the reason the lowest log is not sitting directly on the ground.

The chocks were originally centred at y = 0.08 with radius 0.138, which put a 4-gon's vertex
**5.8 cm below grade** — found by measurement, not by eye. They are now centred on their own
radius.

## Variants

| variant | bark      | shape                                                                 |
| ------- | --------- | --------------------------------------------------------------------- |
| 0       | `#514437` | **neat tall stack** — 4 + 2 + 1, three courses                        |
| 1       | `#594332` | **wide low stack** — 4 + 3, two courses, 1.78 m wide                  |
| 2       | `#4b4035` | **top course knocked off** — 3 + 2, with the fallen log on the ground |

The three variants are genuinely different _shapes_, not recolours, which is unusual in this batch
and is the main reason they exist. A generator building a log yard wants a tall stack, a spread
pile, and a collapsed one.

Variants 0 and 2 have 8 meshes, variant 1 has 9.

## Complexity

8–9 meshes, ~176–200 triangles, **1 material**. The cheapest asset in the batch by a wide margin,
and the right answer for something meant to be placed dozens of times in a yard.

Six-sided flat-shaded cylinders: a log at play distance is a faceted cylinder, and 6 sides keeps a
9-log pile under 200 triangles. 8-sided would look marginally rounder for about 70 more triangles.

## What reads well

- **Far:** a rectangular block of horizontal banding. The course offsets give it texture at
  distance that a single box would not.
- **Near:** the ragged ends, the chocks, the bark facets, the fallen log in variant 2.

## Unresolved questions

- **The cut ends are the same colour as the bark.** The single biggest visual compromise in the
  batch, and the first thing to fix if this asset gets attention. Cost is 3× the meshes.
- **The knocked-off log in variant 2 is not solid**, as the single collider cannot describe both
  the pile and a loose log beside it.
- **Variant 2's "knocked off" log is still neatly placed** at a slight angle rather than actually
  rolled away. It reads as "placed" rather than "fell".
- **No sawdust, bark debris, or offcuts** around the base. A flat disc of sawdust under the pile
  would be 1 mesh and would tie it to the ground.
- **No end-stake or banding**, which a commercial log stack would have. Not needed for a rough
  yard, but it would make the pile read as timber rather than as cylinders.
- **The layout literals do not scale.** Six numbers per variant, hand-written. If the owner wants
  more than three shapes, this should move to a small deterministic generator (a fixed-seed LCG
  or a `variant`-derived sequence) rather than growing by hand.
- **No "half pile" state** for a world that has been looted, which is arguably the most likely
  state of a log pile in this game.
- The logs are perfectly horizontal. A real yard has some that have rolled, which is a 2-line
  change and would break up the banding.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node; bounding boxes measured **vertex-accurately** and confirmed inside
  the declared `dimensions`; `minY` 0 after the chock fix.
- Distinct log lengths confirmed by measurement (3.3–3.8 m in variant 0).
- `createVisual` called twice per variant and compared mesh-by-mesh: identical — which is the real
  check for a layout expressed as literals. No unseeded randomness, no animation, no lights.
- Confirmed no two meshes share a material _name_ while using different material _instances_.
- All geometry positions checked for `NaN`.
- Prettier clean. Vite dev server serves the module with no transform errors.
- **Not viewed in a browser or in game.** For an asset this cheap the interesting question is
  whether 9 logs read as a pile or as 9 objects, and that needs a real look at a row of them.

## Licensing

Original work. No external assets, textures, or references used.
