export type PointerLockMode = 'third-person' | 'top-down';

export function canRequestPointerLock(
  mode: PointerLockMode,
  isSceneTarget: boolean,
  isHudTarget: boolean,
): boolean {
  return mode === 'third-person' && isSceneTarget && !isHudTarget;
}
