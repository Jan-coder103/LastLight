# Abandoned Substation — approved asset review

Owner approved for integration on 2026-09-29. This is the abandoned appearance of the approved
Electrical Substation model, exposed as its own placement ID so the seeded world can place it
independently. Its visual is the source model's stripped variant 2, with the take-off tower removed.

See [electrical-substation.md](electrical-substation.md) for dimensions, pivot, collider, interaction
point, materials, complexity, and visual validation. The shared model remains authored in
`src/assets/electricalSubstation.ts`; this wrapper preserves the same placement metadata and always
builds the abandoned variant.
