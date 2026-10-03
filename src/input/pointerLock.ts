export type PointerLockMode = 'third-person' | 'top-down' | 'first-person';

export function canRequestPointerLock(
  mode: PointerLockMode,
  isSceneTarget: boolean,
  isHudTarget: boolean,
): boolean {
  return mode !== 'top-down' && isSceneTarget && !isHudTarget;
}
