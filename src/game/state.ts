import {
  BUILDINGS,
  CELL,
  GRID,
  OFFLINE_CAP_MS,
  PLACEABLE,
  SAVE_KEY,
  crystalRate,
  goldCap,
  keepTrickle,
  upgradeCost,
  upgradeDurationMs,
  type BuildingType,
} from "./catalog";

export interface BuildingRec {
  id: string;
  type: BuildingType;
  gx: number;
  gz: number;
  level: number;
  upgradeEndsAt?: number;
}

export interface SaveData {
  version: 1;
  gold: number;
  lastSeen: number;
  buildings: BuildingRec[];
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function starterVillage(): SaveData {
  return {
    version: 1,
    gold: 430,
    lastSeen: Date.now(),
    buildings: [
      {
        id: "keep-home",
        type: "keep",
        gx: 5,
        gz: 5,
        level: 1,
      },
    ],
  };
}

export function occupies(
  building: Pick<BuildingRec, "gx" | "gz" | "type">,
  gx: number,
  gz: number,
): boolean {
  const size = BUILDINGS[building.type].size;
  return gx >= building.gx && gx < building.gx + size && gz >= building.gz && gz < building.gz + size;
}

export function inBounds(gx: number, gz: number, size: number): boolean {
  return gx >= 0 && gz >= 0 && gx + size <= GRID && gz + size <= GRID;
}

export function canPlace(save: SaveData, type: BuildingType, gx: number, gz: number): boolean {
  const def = BUILDINGS[type];
  if (!def.placeable) return false;
  if (!inBounds(gx, gz, def.size)) return false;
  for (let x = gx; x < gx + def.size; x++) {
    for (let z = gz; z < gz + def.size; z++) {
      if (save.buildings.some((b) => occupies(b, x, z))) return false;
    }
  }
  return true;
}

export function computeCap(save: SaveData): number {
  const keep = save.buildings.find((b) => b.type === "keep");
  const vaults = save.buildings.filter((b) => b.type === "vault").map((b) => b.level);
  return goldCap(keep?.level ?? 1, vaults);
}

export function goldPerSecond(save: SaveData): number {
  let rate = 0;
  for (const b of save.buildings) {
    if (b.upgradeEndsAt && b.upgradeEndsAt > Date.now()) continue;
    if (b.type === "crystal") rate += crystalRate(b.level);
    if (b.type === "keep") rate += keepTrickle(b.level);
  }
  return rate;
}

export function applyCatchup(save: SaveData, now = Date.now()): { gained: number; elapsedMs: number } {
  const elapsedMs = Math.max(0, Math.min(OFFLINE_CAP_MS, now - save.lastSeen));
  finishUpgrades(save, now);
  const rate = goldPerSecond(save);
  const gained = (rate * elapsedMs) / 1000;
  const cap = computeCap(save);
  const before = save.gold;
  save.gold = Math.min(cap, save.gold + gained);
  save.lastSeen = now;
  return { gained: save.gold - before, elapsedMs };
}

export function finishUpgrades(save: SaveData, now = Date.now()): string[] {
  const done: string[] = [];
  for (const b of save.buildings) {
    if (b.upgradeEndsAt && b.upgradeEndsAt <= now) {
      b.level += 1;
      delete b.upgradeEndsAt;
      done.push(b.id);
    }
  }
  return done;
}

export function tickEconomy(save: SaveData, dt: number, now = Date.now()): void {
  finishUpgrades(save, now);
  const cap = computeCap(save);
  save.gold = Math.min(cap, save.gold + goldPerSecond(save) * dt);
  save.lastSeen = now;
}

export function tryPlace(save: SaveData, type: BuildingType, gx: number, gz: number): BuildingRec | null {
  const def = BUILDINGS[type];
  if (!PLACEABLE.includes(type)) return null;
  if (save.gold < def.cost) return null;
  if (!canPlace(save, type, gx, gz)) return null;
  save.gold -= def.cost;
  const rec: BuildingRec = {
    id: newId(type),
    type,
    gx,
    gz,
    level: 1,
  };
  save.buildings.push(rec);
  return rec;
}

export function tryStartUpgrade(save: SaveData, id: string, now = Date.now()): boolean {
  const b = save.buildings.find((x) => x.id === id);
  if (!b) return false;
  if (b.upgradeEndsAt && b.upgradeEndsAt > now) return false;
  const cost = upgradeCost(b.type, b.level);
  if (save.gold < cost) return false;
  save.gold -= cost;
  b.upgradeEndsAt = now + upgradeDurationMs(b.level);
  return true;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return starterVillage();
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.buildings)) {
      return starterVillage();
    }
    if (!parsed.buildings.some((b) => b.type === "keep")) {
      return starterVillage();
    }
    applyCatchup(parsed);
    return parsed;
  } catch {
    return starterVillage();
  }
}

export function persistSave(save: SaveData): void {
  save.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function resetSave(): SaveData {
  const fresh = starterVillage();
  persistSave(fresh);
  return fresh;
}

export function plateauHalf(): number {
  return (GRID * CELL) / 2 + 1.35;
}
