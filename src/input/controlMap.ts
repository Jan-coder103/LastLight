import type { CameraMode } from '../player/PlayerController';

export type AbilitySlot = 1 | 2 | 3;

const topDownAbilityKeys: Readonly<Record<string, AbilitySlot>> = {
  KeyW: 1,
  KeyE: 2,
  KeyR: 3,
};

const thirdPersonAbilityKeys: Readonly<Record<string, AbilitySlot>> = {
  Digit1: 1,
  Digit2: 2,
  Digit3: 3,
};

export function abilityFromKey(code: string, mode: CameraMode): AbilitySlot | undefined {
  const bindings = mode === 'top-down' ? topDownAbilityKeys : thirdPersonAbilityKeys;
  return bindings[code];
}

export function isMovementKey(code: string, mode: CameraMode): boolean {
  if (mode !== 'third-person') return false;
  return [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ].includes(code);
}

export function isDashKey(code: string): boolean {
  return code === 'KeyQ';
}
