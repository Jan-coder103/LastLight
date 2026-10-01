# Explosive Barrel

## Runtime review

The Phase 16 barrel is a gameplay prop built from low-poly Three.js primitives. Its urban placement is seeded and included in the approved runtime catalog. The gameplay model has a rusty red, olive, or dusty gray shell variant, dark metal hoops, and a small red fuse indicator.

| Detail   | Form                                    | Fuse indicator                |
| -------- | --------------------------------------- | ----------------------------- |
| Detailed | 12-sided drum, two hoops, lid           | Per-instance red emissive cap |
| Low      | 7-sided drum, two simplified hoops, lid | Per-instance red emissive cap |
| Very low | 5-sided drum and one band               | Per-instance red emissive cap |

The world builder places the models on the shared 0/58/120 m LOD path with 12% hysteresis and clones the indicator material per placement. A shot triggers one two-second fuse; its two red flashes occur at 0.22–0.46 s and 1.18–1.42 s. Detonation uses the shared seven-metre artillery blast, damage, scorch, particles, accessibility behavior, and impact shake. The shell remains visible after detonation because its world collider remains in the navigation data.

## Scale and placement

- Footprint: 0.76 × 0.76 m; height: 1.08 m.
- Collider: 0.70 × 0.70 × 0.98 m centered 0.49 m above the ground.
- Eligible region: Urban. One is included on each generated full map; additional dressing remains seed-weighted.
- No interaction points; aim and shoot the visible barrel mesh to arm it.

The fuse and blast radius have automated coverage. Owner playtest remains part of Phase 16 acceptance.
