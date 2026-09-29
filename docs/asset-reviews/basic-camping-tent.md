# Basic Camping Tent — asset review

Asset ID: `basic-camping-tent` · Category: `prop` · Status: **Approved by owner**

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

## Revision: sized for the scout, not for a catalogue (owner feedback: "way too small")

The A-frame was authored full-size and then shrunk by `TENT_SCALE = 0.72`, which put the ridge at
**1.24 m** — waist height beside the 2.1 m gameplay scout, a tent a scout could wear as a hat.
The scale factor is gone and the shell is authored directly at final size:

- **3.5 m wide, 2.05 m ridge, 3.5 m deep** — a roomy two-person canvas ridge tent whose peak
  comes to the scout's head. The door opening grew with it (0.84 × 1.25 m), as did the vent
  triangle, the guy-line anchors (now seated on the panel surface at `widthAt(1.15)` rather than
  floating 0.35 m off the fabric), and the peg field.
- Measured (vertex-accurate): **4.11 × 2.11 × 4.89 m** including pegs and the open flap.
  Declared `dimensions`: 4.3 × 2.15 × 5.3. Collider `center {0, 1.0, 0}`, `size {3.4, 2.0, 3.4}`
  over the fly; pegs, guys, and flap stay outside it. The `tent-door` point moved out to
  z = 1.95.
- Mesh count 21 and materials 6 live, unchanged — only the numbers and the guy anchors moved.

**Previewed in WebGL renders** (headless Chromium, three-quarter view beside the scout): the
ridge reads at scout height and the tent reads as shelter rather than as equipment.

## Dimensions and scale

- Declared `dimensions`: 4.3 × 2.15 × 5.3 m
- Measured (vertex-accurate): 4.11 × 2.11 × 4.89 m
- The shell is authored directly at final size: 3.5 m long, 3.5 m wide, 2.05 m ridge. On the
  2.1 m scout the ridge sits at head height — see the revision above for what it replaced.
- The extra declared depth covers the **open door flap** and the front pegs, which extend the
  footprint asymmetrically toward +Z (flap tip z = 2.49, back pegs z = -2.46). The pivot itself
  stays centred; the flap is fabric and is outside the collider.

## Pivot and front direction

Centred on x = 0, z = 0 with the ground at y = 0. **+Z is the front**: the door opening, flap,
and zip strips are on the +Z gable, and the `tent-door` interaction point sits there.

## Collider proposal

`center {0, 1.0, 0}`, `size {3.4, 2.0, 3.4}`. A single box over the fly footprint — the player
cannot walk into a tent. The flap, guy lines, and pegs are outside the collider, which is
correct: staked fabric should not block movement.

## Interaction points

| id          | label | position   |
| ----------- | ----- | ---------- |
| `tent-door` | Tent  | 0, 0, 1.95 |

## Materials

| name          | colour    | roughness | metalness | notes                       |
| ------------- | --------- | --------- | --------- | --------------------------- |
| `fly-olive`   | `#58624d` | 0.95      | 0         | variant 0, `DoubleSide`     |
| `fly-rust`    | `#8e5142` | 0.95      | 0         | variant 1, `DoubleSide`     |
| `fly-slate`   | `#65766d` | 0.95      | 0         | variant 2, `DoubleSide`     |
| `groundsheet` | `#3f443c` | 1         | 0         |                             |
| `zip-trim`    | `#2f332d` | 0.95      | 0         | zips, vent, interior shadow |
| `metal`       | `#54594d` | 0.86      | 0.24      | guy lines                   |
| `peg`         | `#64675d` | 0.9       | 0         |                             |

7 declared, 6 live per variant (one fly colour). The fly and the gables share one material
instance per variant, so an editor override recolours the whole tent at once.

## Variants

Three fly colours only — olive, faded rust, slate. Geometry is identical across all three, and
now the gables follow the fly colour, which the old fixed dark end-wall could not do.

## Complexity

21 meshes, ~189 triangles, 6 live materials. Same mesh count as the previous revision — the size
change moved numbers, not meshes.

## Reads at distance

The triangle silhouette is unchanged from the angled top-down camera. Head-on, the tent has
a legible front (opening + flap) and a legible back (clean triangle + vent), and at the new size
both survive at the third-person distances.

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
- All 3 variants built and rendered in headless Chromium with the project's three.js;
  vertex-accurate bounds measured (world-space vertices) and matched to `dimensions` /
  `collider`; `minY` exactly 0.
- **Guy-line anchors verified against the panel surface** after the resize: each anchor sits
  within 0.02 m of the fly fabric at its height (the old anchors floated 0.35 m off it).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` positions.
- **Previewed in WebGL renders** (headless Chromium, three-quarter view with the gameplay scout
  at reference distance): the resized tent reads at scout height, with the flap open and the peg
  field seated. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
