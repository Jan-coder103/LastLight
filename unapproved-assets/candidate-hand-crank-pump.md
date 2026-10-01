# Hand-Crank Water Pump — candidate review

Draft ID: `candidate-hand-crank-pump` · Category: `prop` · Status: **Ready for owner review**
Source idea: `ASSET_IDEAS.txt` #46, "Loot, survival, and interaction props"

## Purpose and intended placement

A cast-iron village hand pump on a stone pad: a fluted column with a bolted collar, a domed head
with a finial, a long bent crank with a wooden grip, a spout with a hanging strap, and a bucket.
Intended at a farmstead, a hamlet, a roadside well, or anywhere the map wants to say "there was
water here once".

## Dimensions and scale

- Declared `dimensions`: 1.2 × 1.7 × 1.3 m
- Measured (vertex-accurate): 1.17 × 1.50 × 1.20 m (variants 0/2), 1.05 m wide (variant 1, no
  bucket)
- Column 1.06 m, finial tip at 1.50 m, crank grip at ~1.12 m. **0.7 scout heights** — the grip is at
  a player's chest, which is exactly where a crank should be.

## Pivot and front direction

Ground at y = 0, pump centred on x = 0, z = 0. **+Z is the front of the pump**, i.e. the side the
crank arm swings out over. The spout points +X, and the bucket hangs off the spout.

## Collider proposal

`center {0, 0.5, 0}`, `size {0.5, 1.0, 0.5}` — the stone pad and the lower column.

1.0 m is below the head. The crank, the dome, the finial, the spout and the bucket are all outside
the collider, which is correct: the crank is a moving part a player will want to reach, and the
spout is at 0.3 m where a player will crouch. The trade is the same one the fire escape and the
wind pump make — a player can clip the crank arm.

## Interaction points

| id           | label                 | position   |
| ------------ | --------------------- | ---------- |
| `pump-crank` | Hand-Crank Water Pump | 0, 0, 0.62 |

Under the crank, clear of the collider. Reads as a water-collection or pumping point.

## Materials

| name             | colour    | roughness | metalness | notes                              |
| ---------------- | --------- | --------- | --------- | ---------------------------------- |
| `pump-iron`      | `#54594d` | 0.8       | 0.3       | column, flutes, dome, spout, offcut |
| `pump-dark-iron` | `#292f2b` | 0.85      | 0.35      | base, collar, bolts, crank, cap    |
| `pump-rust`      | `#9b624d` | 0.95      | 0.15      | bucket, band, weep, dropped flare  |
| `pump-timber`    | `#594332` | 1         | 0         | crank grip, spout strap, handle    |
| `pump-stone`     | `#797762` | 1         | 0         | pad, wire coil                     |
| `pump-pale`      | `#a29b88` | 0.95      | 0         | kerb                               |
| `pump-water`     | `#4a5850` | 0.35      | 0.05      | wet patch, stream, splash, bucket  |

7 materials, all from the muted-metal and dusty-stone rows. There is deliberately **no warm accent
on this prop** — it is the only candidate in the batch with no signal colour, because a cast-iron
pump has nothing painted on it.

## Variants

| variant | crank | bucket | water |
| ------- | ----- | ------ | ----- |
| 0       | level | on the pad | no |
| 1       | level | **removed** | no |
| 2       | **bent, drooping 0.22 rad** | hung on the spout | **running** |

Variant 2 is the useful one: a bent crank plus a bucket hooked on the spout plus a running stream
into the wet patch is the single clearest "this works" state, and it is the only variant that
changes the silhouette at the top.

## Complexity

39 meshes / 992 triangles (v0), 35 / 788 (v1), 42 / 1068 (v2). 7 materials.

992 triangles for a 1.5 m prop is the second-heaviest ratio in the batch, and it comes from the
column: a 10-sided cylinder plus eight flute bars plus a 10-sided collar plus four bolt heads is 14
meshes and 300 triangles to say "cast iron". The flutes are the single most expensive detail on the
asset and they are worth trimming first if the budget is tight.

## What reads well

- **Far:** a slim vertical with a crank arm jutting out at the top and a bucket at the foot. The
  crank silhouette is the whole read and it is unmistakable.
- **Near:** the column flutes and collar bolts, the domed head and finial, the crank elbow and
  wooden grip, the flared spout lip and its hanging strap, and the bucket with its band and handle.

## Geometry note

The crank arm and the bucket handle are chains of cylinders aimed between points with a
`spanTo()` helper that uses `quaternion.setFromUnitVectors`. Two Euler angles on a +Y cylinder with
the default XYZ order would lay the arm flat; see the fuel pump, gate and platform sheets for the
same helper and the same failure.

## Unresolved questions

- The wet patch is a flat rectangle on the pad. On flat ground it reads as a mat — the same problem
  the fuel pump's spill stains have.
- The bucket in variant 2 is hooked on the spout, but nothing holds it: it intersects the spout
  lip. A hook or a wire bail through the lip would fix it for one mesh.
- The flutes are eight square bars standing proud of a 10-sided cylinder, so they read as ribs
  rather than as mouldings. A real village pump is round.
- No pump handle cut-out, no lubrication cup, no bolted flange pattern beyond four bolts. At close
  range the head is a cone with a band.
- The `pump-water` material is 0.35 roughness in four small pieces. It is the only smooth surface
  and it is worth it for the running state.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0 (the kerb and the whole pad stack
  were lifted 60 mm after measurement put them below ground).
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view. Not
  viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
