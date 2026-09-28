# Basic Camping Tent — candidate review

Draft ID: `candidate-tent` · Category: `prop` · Status: **Ready for owner review**

## Purpose and intended placement

A plain two-person ridge tent. It is the "someone lives here" marker for a camp, so it is meant to
appear in clusters with fire bins, fences, and the camp buildings, and to read as shelter when
seen from the angled top-down camera.

## Rework (owner request: "stuff front and back")

The A-frame shell itself was sound; both ends were not. The previous gables were a shortcut —
two sloped posts with a rectangular infill panel floating behind them — and the doorway was a
dark panel plus a protruding lintel bar and a "rolled bundle" bar that stuck out past the fabric
like a shelf. From any oblique angle the front read as scaffolding and the back as a dark
picture frame.

The ends are now real geometry:

- **Real triangular gables**, built as `BufferGeometry` triangles cut from the same A-frame
  profile as the roof, in the fly material — so each variant's gable colour matches its roof,
  and the old `end-wall` material is gone entirely (5 live materials, down from 6).
- **Front gable carries a true door opening**: a rectangle cut out of the triangle (two fabric
  quads flanking it, one triangle above it), with a dark interior panel recessed inside the tent
  so the opening reads as depth into shadow.
- **A door flap on a hinge group**, swung open 1.05 rad and laid back against the fabric — the
  "lived in" cue replaces the old protruding bundle bar.
- **Zip strips** run flush up both sides of the opening, no longer floating proud.
- **Back gable is solid** with a small dark vent triangle near the apex, set just proud of the
  fabric.

The A-frame construction is unchanged from the previous revision: two sloped panels whose length
and angle are computed from the triangle (`sqrt(halfWidth² + ridge²)` and `atan2(ridge,
halfWidth)`), a ridge cap, groundsheet, and four guy lines to pegs. The panel rotation sign
convention that took two attempts last time is asserted in a code comment and still holds:
`rotation.z = side * panelAngle` with magnitude `PI/2 - alpha`.

## Dimensions and scale

- Declared `dimensions`: 2.4 × 1.37 × 2.7 m
- Measured: 2.16 × 1.28 × 2.61 m
- The tent is authored full-size (2.9 m long, 2.9 m wide, 1.72 m ridge) and reduced by a single
  `TENT_SCALE = 0.72`. On the 2.1 m scout the 1.28 m ridge sits at chest height.
- The extra declared depth (was 2.3) covers the **open door flap**, which extends the footprint
  about 0.15 m past the back wall's symmetric bound toward +Z. The pivot itself stays centred;
  the flap is fabric and is outside the collider.

`TENT_SCALE` is the only size knob; `dimensions`, `collider`, and the interaction point all
derive from it.

## Pivot and front direction

Centred on x = 0, z = 0 with the ground at y = 0. **+Z is the front**: the door opening, flap,
and zip strips are on the +Z gable, and the `tent-door` interaction point sits there.

## Collider proposal

`center {0, 0.65, 0}`, `size {2.09, 1.3, 2.3}`. A single box over the fly footprint — the player
cannot walk into a tent. The flap, guy lines, and pegs are outside the collider, which is
correct: staked fabric should not block movement.

## Interaction points

| id          | label | position   |
| ----------- | ----- | ---------- |
| `tent-door` | Tent  | 0, 0, 1.33 |

## Materials

| name          | colour    | roughness | metalness | notes                        |
| ------------- | --------- | --------- | --------- | ---------------------------- |
| `fly-olive`   | `#58624d` | 0.95      | 0         | variant 0, `DoubleSide`      |
| `fly-rust`    | `#8e5142` | 0.95      | 0         | variant 1, `DoubleSide`      |
| `fly-slate`   | `#65766d` | 0.95      | 0         | variant 2, `DoubleSide`      |
| `groundsheet` | `#3f443c` | 1         | 0         |                              |
| `zip-trim`    | `#2f332d` | 0.95      | 0         | zips, vent, interior shadow  |
| `metal`       | `#54594d` | 0.86      | 0.24      | guy lines                    |
| `peg`         | `#64675d` | 0.9       | 0         |                              |

7 declared, 6 live per variant (one fly colour). The fly and the gables share one material
instance per variant, so an editor override recolours the whole tent at once.

## Variants

Three fly colours only — olive, faded rust, slate. Geometry is identical across all three, and
now the gables follow the fly colour, which the old fixed dark end-wall could not do.

## Complexity

21 meshes, ~128 triangles, 6 live materials. Cheaper than the previous revision (23 / 184) while
gaining real gables: the custom triangles replace a dozen boxes.

## Reads at distance

The triangle silhouette is unchanged from the angled top-down camera. Head-on, the tent now has
a legible front (opening + flap) and a legible back (clean triangle + vent) instead of two ends
that read as construction frames.

## Unresolved questions

- The door flap is a flat plane in the fly fabric with no tie-back strap; at very close range a
  small strap or loop would sell the "tied open" read for 1 mesh.
- The interior is a dark recess panel, not a modelled interior — at very close range through the
  opening you see a flat dark panel and the groundsheet.
- The gable triangles are single-sided quads with `DoubleSide`, so from inside the tent (which
  the player cannot enter) the fabric would show correctly anyway.
- Guy lines are 35 mm boxes and still disappear at long range, per the AGENTS guidance.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  matched to `dimensions` / `collider`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` positions.
- **Previewed in the staging viewer** (`viewer.html`) in headless Chromium with software WebGL,
  from a head-on front view and a head-on back view at scout-scale reference distance. The old
  shelf-bar/picture-frame ends were confirmed visible in the old build and confirmed gone in
  this one. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
