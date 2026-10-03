export function chooseAssistedTarget<T>(
  direct: T | undefined,
  candidates: { target: T; distanceSquared: number }[],
  radius: number,
  visible: (target: T) => boolean,
): T | undefined {
  if (direct && visible(direct)) return direct;
  return candidates
    .filter((c) => c.distanceSquared <= radius * radius)
    .sort((a, b) => a.distanceSquared - b.distanceSquared)
    .find((c) => visible(c.target))?.target;
}
export function extractionArrowVisible(
  elapsed: number,
  active: boolean,
  outdoors: boolean,
): boolean {
  return active && outdoors && elapsed >= 60;
}
