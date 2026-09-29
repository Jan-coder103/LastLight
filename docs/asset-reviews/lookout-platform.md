# Makeshift Lookout Platform — approved asset review

Draft ID: `lookout-platform` · Category: `prop` · Status: **Owner approved for integration on 2026-09-29**
Source idea: `ASSET_IDEAS.txt` #47, "Loot, survival, and interaction props"

## Purpose and intended placement

A scavenged timber platform: a deck of mismatched boards on four doubled posts with two diagonal
braces, a partial railing that stops short of the open front, and a leaning ladder. Intended beside
a road, on a spoil heap, against a building, or anywhere a player might have climbed up to see
something.

## Dimensions and scale

- Declared `dimensions`: 4.1 × 3.1 × 3.3 m
- Measured (vertex-accurate): 4.02 × 3.06 × 3.30 m (variants 0/1), 3.07 m tall (variant 2, the
  offcut on the deck)
- Deck 2.6 × 2.2 m at 2.15 m, railing head at 3.01 m. **1.5 scout heights to the rail, 1.0 to the
  deck.**

## Pivot and front direction

Ground at y = 0. **+Z is the open front edge** — the side with no railing, i.e. the view side. The
ladder and the leaning braces are on +X, so a placement that puts the platform against a building
or a rock wants that side turned away.

The platform is symmetric about x = 0 but the ladder, the diagonal braces and the tin are not, so the
two ends of the platform are distinguishable.

## Collider proposal

`center {0, 1.1, 0}`, `size {2.6, 2.2, 2.2}` — the post volume and the deck.

The collider is a solid block from the ground to deck level, which is right: the posts and braces
are the only things a player collides with, and the deck is solid. The **railing and the ladder are
outside it**, so a player can step through the rails and can clip the ladder stiles. A railing that
stops movement is a cage; a railing that stops movement at chest height only is what this asset
wants.

The cost is that a player can stand "inside" the railing volume while the mesh is visibly there.
That is the same trade the fire escape makes and it is the right one for a climbable prop.

## Interaction points

| id             | label           | position   |
| -------------- | --------------- | ---------- |
| `lookout-deck` | Lookout Deck    | 0, 0, 1.6  |

In front of the platform, on the ground, at the foot of the open edge. Clear of the collider.

## Materials

| name                    | colour    | roughness | metalness | notes                            |
| ----------------------- | --------- | --------- | --------- | -------------------------------- |
| `platform-timber`       | `#594332` | 1         | 0         | posts, battens, bearers, rails   |
| `platform-pale-timber`  | `#655744` | 1         | 0         | rails, rungs, loose board        |
| `platform-dark-timber`  | `#4b4035` | 1         | 0         | braces, joists, offcut           |
| `platform-steel`        | `#54594d` | 0.85      | 0.3       | tin, wire coil, offcut ring      |
| `platform-nail`         | `#64675d` | 0.8       | 0.35      | nail heads                       |
| `platform-foot`         | `#797762` | 1         | 0         | brace foot pads                  |
| `platform-signal`       | `#d9b56e` | 0.75      | 0.05      | one painted marker on a rail     |

7 materials, three of which are timber at three different values. That is deliberate and it is the
whole trick of the prop: **every board is a different one of the three timbers**, so the deck reads
as scavenged from three different sources without any texture work.

## Variants

| variant | deck | railing |
| ------- | ---- | ------- |
| 0       | intact | complete on three sides |
| 1       | **one board missing**, a loose board laid across the gap | complete |
| 2       | one board missing, loose board | **+X side rail torn off**, one stub and the offcut on the deck |

Variant 1's missing deck board is the useful one: it is a hole a player can see through and climb
past, and it is the difference between "a platform" and "a platform with a hole in it". Variant 2
adds a rail failure on top of it.

## Complexity

59 meshes / 848 triangles (v0), 57 / 824 (v1), 58 / 828 (v2). 7 materials.

The count is 16 post boards, 3 bearers, 3 joists, 7 deck boards with 2 nail heads each, 6 railing
posts, 3 rail runs, 2 ladder stiles, 6 rungs and 4 deck props. The nail heads (14 meshes, 112
triangles) are the cheapest thing to cut and the only cut that costs nothing at distance.

## What reads well

- **Far:** the open-fronted deck with its rail lines stopping short on three sides. The gap in the
  railing is the read; it says "you can climb up and look out" from any distance.
- **Near:** the three-tone deck boards, the nail heads, the doubled posts, the two diagonal braces
  and their foot pads, the ladder stiles and rungs, and the tin and coil left on the boards.

## Geometry note

The diagonal braces, the rail runs, the ladder stiles and the ladder rungs are all cylinders placed
by `spanTo()`, which aims a +Y cylinder at a target with a quaternion. The two diagonal braces are
the part that has to be right: a brace that is not actually touching its post and its ground makes
the whole platform read as a floating deck, which is the failure this asset is most at risk of.

## Unresolved questions

- **The braces only go to two of the four corners.** That is deliberate — four braces would be a
  built structure and two is a platform somebody put up in a hurry — but it means the platform is
  structurally lopsided and a player who looks underneath will notice.
- The ladder leans from the +X side but its foot is 0.68 m out from the platform edge, which is a
  long reach for a 2.15 m ladder. It is at the limit of believable.
- The railing is only 0.9 m above the deck, which is hip height, not chest. A real lookout rail is
  1.1 m. The shorter rail keeps the silhouette open; the safety is questionable.
- Boards, posts, rails and rungs are all axis-aligned boxes and cylinders. The prop has no lean and
  no sag anywhere except the ladder and the variant-2 offcut, and a truly scavenged structure would
  have at least one board out of true.
- Nothing anchors the posts to the ground except the two brace foot pads. Three of the four posts
  simply stop at y = 0.

## Validation performed

- `tsc --strict` typecheck clean, including `noUnusedLocals` and `noUnusedParameters`.
- All 3 variants built in Node with the project's three.js; vertex-accurate bounds measured and
  confirmed inside the declared `dimensions`; `minY` exactly 0.
- `createVisual` called twice per variant and compared mesh-for-mesh and triangle-for-triangle:
  identical. No unseeded randomness, no animation, no lights, no `NaN` transforms.
- **Previewed in headless Chromium with software WebGL** at the default three-quarter view, which is
  also the view that shows the underside and therefore the braces. Not viewed in the game engine.

## Licensing

Original work. No external assets, textures, or references used.
