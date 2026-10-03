import { createRandom } from '../core/seededRandom';
import type { CacheSite } from './loot';
export const residentRoles: Record<string, { name: string; role: string; contribution: string }> = {
  'mara-medic': {
    name: 'Mara',
    role: 'Medic',
    contribution: 'Adds a safe medical supply on recruitment',
  },
  'eli-mechanic': {
    name: 'Eli',
    role: 'Mechanic',
    contribution: 'Adds a safe gear kit on recruitment',
  },
  'noor-scout': {
    name: 'Noor',
    role: 'Scout',
    contribution: 'Adds 25 banked credits on recruitment',
  },
};
export interface MissionEvent {
  id: string;
  kind: 'alarm' | 'survivor';
  site: CacheSite;
  resident?: string;
}
export function seededMissionEvents(
  seed: string,
  sites: CacheSite[],
  recruited: readonly string[] = [],
): MissionEvent[] {
  const random = createRandom(`${seed}:phase18-events`);
  const shuffled = [...sites].sort((a, b) => a.id.localeCompare(b.id));
  // Seeded Fisher–Yates selection uses only validated reachable cache approaches.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  if (!shuffled.length) return [];
  const events: MissionEvent[] = [{ id: 'alarm-station', kind: 'alarm', site: shuffled[0]! }];
  const available = Object.keys(residentRoles).filter((id) => !recruited.includes(id));
  if (shuffled[1] && random() < 0.7 && available.length) {
    const resident = available[Math.floor(random() * available.length)]!;
    events.push({ id: `survivor-${resident}`, kind: 'survivor', site: shuffled[1], resident });
  }
  return events;
}
