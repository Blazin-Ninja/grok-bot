export const SAVE_KEY = "emberkeep-save-v1";
export const GRID = 14;
export const CELL = 1.18;
export const RAID_SLOTS = 12;
export const OFFLINE_CAP_MS = 3 * 60 * 60 * 1000;
export const UPGRADE_MS = 9000;

export type BuildingType = "keep" | "crystal" | "vault" | "tower";
export type TroopType = "imp" | "wolf" | "ogre";
export type Palette = "village" | "enemy";

export interface BuildingDef {
  type: BuildingType;
  name: string;
  size: number;
  cost: number;
  placeable: boolean;
  blurb: string;
}

export interface TroopDef {
  type: TroopType;
  name: string;
  slots: number;
  hp: number;
  dps: number;
  speed: number;
  range: number;
}

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  keep: {
    type: "keep",
    name: "Stone Keep",
    size: 3,
    cost: 0,
    placeable: false,
    blurb: "Heart of the village. Upgrade to swell the hoard cap.",
  },
  crystal: {
    type: "crystal",
    name: "Mana Crystal",
    size: 2,
    cost: 70,
    placeable: true,
    blurb: "A living vein. Drips gold while the page is open.",
  },
  vault: {
    type: "vault",
    name: "Dragon Vault",
    size: 2,
    cost: 90,
    placeable: true,
    blurb: "Iron-bound stone. Raises how much gold you can hold.",
  },
  tower: {
    type: "tower",
    name: "Warding Tower",
    size: 2,
    cost: 110,
    placeable: true,
    blurb: "Arcane watchfire. Looks the part on your walls.",
  },
};

export const TROOPS: Record<TroopType, TroopDef> = {
  imp: {
    type: "imp",
    name: "Imp",
    slots: 1,
    hp: 44,
    dps: 10,
    speed: 2.35,
    range: 0.48,
  },
  wolf: {
    type: "wolf",
    name: "Worg",
    slots: 1,
    hp: 80,
    dps: 14,
    speed: 2.95,
    range: 0.52,
  },
  ogre: {
    type: "ogre",
    name: "Ogre",
    slots: 2,
    hp: 210,
    dps: 26,
    speed: 1.32,
    range: 0.78,
  },
};

export const PLACEABLE: BuildingType[] = ["crystal", "vault", "tower"];

export function upgradeCost(type: BuildingType, level: number): number {
  const base = type === "keep" ? 180 : 85;
  return Math.round(base * level * 1.15);
}

export function upgradeDurationMs(level: number): number {
  return UPGRADE_MS + (level - 1) * 2500;
}

export function crystalRate(level: number): number {
  return 1.15 * level;
}

export function keepTrickle(level: number): number {
  return 0.12 * level;
}

export function goldCap(keepLevel: number, vaultLevels: number[]): number {
  const vaults = vaultLevels.reduce((sum, level) => sum + 260 * level, 0);
  return 280 + keepLevel * 160 + vaults;
}

export function cellToWorld(gx: number, gz: number, size: number): { x: number; z: number } {
  const origin = -((GRID * CELL) / 2);
  return {
    x: origin + (gx + size / 2) * CELL,
    z: origin + (gz + size / 2) * CELL,
  };
}

export function worldToCell(x: number, z: number): { gx: number; gz: number } {
  const origin = -((GRID * CELL) / 2);
  return {
    gx: Math.floor((x - origin) / CELL),
    gz: Math.floor((z - origin) / CELL),
  };
}
