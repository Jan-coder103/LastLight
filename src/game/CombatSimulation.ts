import { Vector3 } from 'three';
import type { AbilitySlot } from '../input/controlMap';
import { GridNavigator, type NavPoint } from '../navigation/GridNavigator';
import { terrainHeightAt, type WorldData } from '../world/generateWorld';

export interface ZombieState {
  id: string;
  position: Vector3;
  health: number;
  readonly maxHealth: number;
  alive: boolean;
  stunRemaining: number;
  attackCooldown: number;
  repathRemaining: number;
  path: NavPoint[];
  facing: number;
}

const maxPlayerHealth = 100;
const zombieHealth = 100;
const zombieAttackDamage = 8;
const zombieAttackInterval = 1.3;
const weaponDamage = 50;
const weaponCooldown = 0.24;
const dashCooldown = 2;

export class CombatSimulation {
  readonly zombies: ZombieState[] = [];
  readonly maxHealth = maxPlayerHealth;
  health = maxPlayerHealth;
  alive = true;
  fireCooldownRemaining = 0;
  dashCooldownRemaining = 0;
  adrenalineRemaining = 0;
  lastMessage = 'Three hostiles detected. Stay mobile.';
  private world: WorldData;
  private navigator: GridNavigator;
  private surfaceHeight: (x: number, z: number) => number;
  private readonly abilityCooldowns: Record<AbilitySlot, number> = { 1: 0, 2: 0, 3: 0 };

  constructor(world: WorldData, navigator: GridNavigator) {
    this.world = world;
    this.navigator = navigator;
    this.surfaceHeight = (x, z) => terrainHeightAt(world.seed, x, z);
    this.reset();
  }

  setContext(
    world: WorldData,
    navigator: GridNavigator,
    surfaceHeight: (x: number, z: number) => number,
    hostiles: readonly ZombieState[],
  ): void {
    this.world = world;
    this.navigator = navigator;
    this.surfaceHeight = surfaceHeight;
    this.zombies.splice(0, this.zombies.length, ...hostiles);
  }

  reset(initialHostiles = 3): void {
    this.health = maxPlayerHealth;
    this.alive = true;
    this.fireCooldownRemaining = 0;
    this.dashCooldownRemaining = 0;
    this.adrenalineRemaining = 0;
    this.abilityCooldowns[1] = 0;
    this.abilityCooldowns[2] = 0;
    this.abilityCooldowns[3] = 0;
    this.zombies.splice(0, this.zombies.length);
    const offsets = [
      { x: -7, z: -13 },
      { x: 7, z: -13 },
      { x: 1, z: -21 },
    ];
    offsets.slice(0, Math.max(0, initialHostiles)).forEach((offset, index) => {
      const point = this.findSpawn(offset.x, offset.z);
      this.zombies.push({
        id: `hostile-${index + 1}`,
        position: new Vector3(point.x, this.surfaceHeight(point.x, point.z), point.z),
        health: zombieHealth,
        maxHealth: zombieHealth,
        alive: true,
        stunRemaining: 0,
        attackCooldown: 0.4 + index * 0.25,
        repathRemaining: 0,
        path: [],
        facing: 0,
      });
    });
    this.lastMessage =
      initialHostiles > 0
        ? 'Three hostiles detected. Stay mobile.'
        : 'Stay alert. The horde is out there.';
  }

  get livingZombieCount(): number {
    return this.zombies.reduce((count, zombie) => count + Number(zombie.alive), 0);
  }

  get abilityCooldownsRemaining(): Readonly<Record<AbilitySlot, number>> {
    return this.abilityCooldowns;
  }

  canUseAbility(slot: AbilitySlot): boolean {
    return this.alive && this.abilityCooldowns[slot] <= 0;
  }

  startAbilityCooldown(slot: AbilitySlot, seconds: number): boolean {
    if (!this.canUseAbility(slot)) return false;
    this.abilityCooldowns[slot] = seconds;
    return true;
  }

  addReinforcements(count: number, center: Vector3): ZombieState[] {
    const added: ZombieState[] = [];
    for (let index = 0; index < count; index += 1) {
      const angle = ((index + this.zombies.length) * 2.399963) % (Math.PI * 2);
      const distance = 25 + (index % 3) * 3;
      const point = this.findSpawn(
        center.x - this.world.spawn.x + Math.cos(angle) * distance,
        center.z - this.world.spawn.z + Math.sin(angle) * distance,
      );
      const zombie: ZombieState = {
        id: `hostile-${this.zombies.length + 1}`,
        position: new Vector3(point.x, this.surfaceHeight(point.x, point.z), point.z),
        health: zombieHealth,
        maxHealth: zombieHealth,
        alive: true,
        stunRemaining: 0,
        attackCooldown: 0.5,
        repathRemaining: 0,
        path: [],
        facing: 0,
      };
      this.zombies.push(zombie);
      added.push(zombie);
    }
    if (added.length > 0) this.lastMessage = `${added.length} more hostile(s) closing in.`;
    return added;
  }

  damagePlayer(amount: number): boolean {
    if (!this.alive || amount <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.alive = false;
      this.lastMessage = 'You are down. Restart the encounter to try again.';
      return true;
    }
    this.lastMessage = `Hit taken · ${Math.ceil(this.health)} health remaining`;
    return true;
  }

  tryFire(targetId?: string, damage = weaponDamage, cooldown = weaponCooldown): boolean {
    if (!this.alive || this.fireCooldownRemaining > 0) return false;
    this.fireCooldownRemaining = cooldown;
    const target = targetId ? this.zombies.find((zombie) => zombie.id === targetId) : undefined;
    if (target?.alive) {
      target.health = Math.max(0, target.health - damage);
      if (target.health === 0) {
        target.alive = false;
        this.lastMessage = 'Hostile eliminated.';
        if (this.livingZombieCount === 0) this.lastMessage = 'Area clear. Good work.';
      } else {
        this.lastMessage = 'Hostile hit.';
      }
    } else {
      this.lastMessage = 'Shot fired.';
    }
    return true;
  }

  tryDash(): boolean {
    if (!this.alive || this.dashCooldownRemaining > 0) return false;
    this.dashCooldownRemaining = dashCooldown;
    this.lastMessage = 'Dash ready in a moment.';
    return true;
  }

  activateAbility(slot: AbilitySlot, playerPosition?: Vector3): boolean {
    if (!this.canUseAbility(slot)) return false;
    if (slot === 1) {
      if (this.health >= maxPlayerHealth) {
        this.lastMessage = 'Field dressing works when injured.';
        return false;
      }
      this.health = Math.min(maxPlayerHealth, this.health + 35);
      this.abilityCooldowns[1] = 12;
      this.lastMessage = 'Field dressing · +35 health';
      return true;
    }
    if (slot === 2) {
      if (!playerPosition) return false;
      this.abilityCooldowns[2] = 9;
      let affected = 0;
      for (const zombie of this.zombies) {
        if (!zombie.alive || zombie.position.distanceTo(playerPosition) > 9) continue;
        zombie.health = Math.max(0, zombie.health - 40);
        zombie.stunRemaining = Math.max(zombie.stunRemaining, 1.8);
        if (zombie.health === 0) zombie.alive = false;
        affected += 1;
      }
      this.lastMessage =
        affected > 0
          ? `Shock pulse · ${affected} hostile(s) stunned`
          : 'Shock pulse · no hostiles in range';
      return true;
    }
    this.abilityCooldowns[3] = 14;
    this.adrenalineRemaining = 5;
    this.lastMessage = 'Adrenaline · movement speed increased';
    return true;
  }

  damageHostile(id: string, amount: number): boolean {
    const zombie = this.zombies.find((candidate) => candidate.id === id && candidate.alive);
    if (!zombie || amount <= 0) return false;
    zombie.health = Math.max(0, zombie.health - amount);
    if (zombie.health === 0) zombie.alive = false;
    return true;
  }

  applyShotKnockback(id: string, sourceX: number, sourceZ: number, distance = 0.26): boolean {
    const zombie = this.zombies.find((candidate) => candidate.id === id && candidate.alive);
    if (!zombie || !Number.isFinite(sourceX) || !Number.isFinite(sourceZ)) return false;
    const directionX = zombie.position.x - sourceX;
    const directionZ = zombie.position.z - sourceZ;
    const length = Math.hypot(directionX, directionZ);
    if (length < 0.001) return false;
    const scale = Math.min(0.3, Math.max(0, distance)) / length;
    const x = zombie.position.x + directionX * scale;
    const z = zombie.position.z + directionZ * scale;
    if (!this.navigator.isWalkable(x, z)) return false;
    zombie.position.set(x, this.surfaceHeight(x, z), z);
    zombie.path = [];
    zombie.repathRemaining = 0;
    return true;
  }

  damageHostilesInRadius(center: Vector3, radius: number, amount: number): number {
    let affected = 0;
    for (const zombie of this.zombies) {
      if (!zombie.alive || zombie.position.distanceTo(center) > radius) continue;
      this.damageHostile(zombie.id, amount);
      affected += 1;
    }
    return affected;
  }

  tick(deltaSeconds: number, playerPosition: Vector3): void {
    const delta = Math.max(0, Math.min(deltaSeconds, 0.1));
    this.tickCooldowns(delta);
    this.tickHostiles(delta, playerPosition);
  }

  tickCooldowns(deltaSeconds: number): void {
    const delta = Math.max(0, Math.min(deltaSeconds, 0.1));
    this.fireCooldownRemaining = Math.max(0, this.fireCooldownRemaining - delta);
    this.dashCooldownRemaining = Math.max(0, this.dashCooldownRemaining - delta);
    this.adrenalineRemaining = Math.max(0, this.adrenalineRemaining - delta);
    for (const slot of [1, 2, 3] as const)
      this.abilityCooldowns[slot] = Math.max(0, this.abilityCooldowns[slot] - delta);
  }

  tickHostiles(deltaSeconds: number, playerPosition: Vector3): void {
    const delta = Math.max(0, Math.min(deltaSeconds, 0.1));
    if (!this.alive) return;

    for (const zombie of this.zombies) {
      if (!zombie.alive) continue;
      zombie.attackCooldown = Math.max(0, zombie.attackCooldown - delta);
      zombie.stunRemaining = Math.max(0, zombie.stunRemaining - delta);
      if (zombie.stunRemaining > 0) continue;

      const toPlayer = new Vector3(
        playerPosition.x - zombie.position.x,
        0,
        playerPosition.z - zombie.position.z,
      );
      const distance = toPlayer.length();
      if (distance <= 1.65) {
        zombie.path = [];
        if (zombie.attackCooldown === 0) {
          this.damagePlayer(zombieAttackDamage);
          zombie.attackCooldown = zombieAttackInterval;
          if (!this.alive) return;
        }
        continue;
      }

      zombie.repathRemaining -= delta;
      if (zombie.repathRemaining <= 0 || zombie.path.length === 0) {
        zombie.path = this.navigator.findPath(
          zombie.position.x,
          zombie.position.z,
          playerPosition.x,
          playerPosition.z,
        );
        zombie.repathRemaining = 0.7;
      }
      while (zombie.path.length > 0) {
        const waypoint = zombie.path[0];
        if (Math.hypot(waypoint.x - zombie.position.x, waypoint.z - zombie.position.z) > 0.55)
          break;
        zombie.path.shift();
      }
      const waypoint = zombie.path[0];
      if (!waypoint) continue;
      const direction = new Vector3(
        waypoint.x - zombie.position.x,
        0,
        waypoint.z - zombie.position.z,
      );
      const distanceToWaypoint = direction.length();
      if (distanceToWaypoint < 0.001) continue;
      direction.multiplyScalar(1 / distanceToWaypoint);
      const travel = Math.min(distanceToWaypoint, 1.8 * delta);
      zombie.position.x += direction.x * travel;
      zombie.position.z += direction.z * travel;
      zombie.position.y = this.surfaceHeight(zombie.position.x, zombie.position.z);
      zombie.facing = Math.atan2(-direction.x, -direction.z);
    }
  }

  private findSpawn(offsetX: number, offsetZ: number): { x: number; z: number } {
    const targetX = this.world.spawn.x + offsetX;
    const targetZ = this.world.spawn.z + offsetZ;
    if (this.navigator.isWalkable(targetX, targetZ)) return { x: targetX, z: targetZ };
    for (let radius = 1; radius < 8; radius += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const x = targetX + dx * this.navigator.cellSize;
          const z = targetZ + dz * this.navigator.cellSize;
          if (this.navigator.isWalkable(x, z)) return { x, z };
        }
      }
    }
    return { x: targetX, z: targetZ };
  }
}
