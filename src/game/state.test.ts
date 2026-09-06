import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUILDINGS, goldCap, upgradeCost } from "./catalog";
import {
  applyCatchup,
  canPlace,
  computeCap,
  finishUpgrades,
  goldPerSecond,
  starterVillage,
  tickEconomy,
  tryPlace,
  tryStartUpgrade,
} from "./state";

describe("emberkeep economy", () => {
  it("starts with a keep and spendable gold", () => {
    const save = starterVillage();
    assert.equal(save.buildings[0]?.type, "keep");
    assert.ok(
      save.gold >=
        BUILDINGS.crystal.cost + BUILDINGS.vault.cost + BUILDINGS.tower.cost + 85,
    );
  });

  it("places buildings on free grid cells and rejects overlaps", () => {
    const save = starterVillage();
    const crystal = tryPlace(save, "crystal", 0, 0);
    assert.ok(crystal);
    assert.equal(canPlace(save, "vault", 0, 0), false);
    assert.equal(canPlace(save, "vault", 9, 0), true);
    assert.equal(tryPlace(save, "tower", 5, 5), null);
  });

  it("caps gold using keep and vault levels", () => {
    assert.equal(goldCap(1, []), 440);
    assert.equal(goldCap(2, [1]), 860);
    const save = starterVillage();
    assert.equal(computeCap(save), goldCap(1, []));
  });

  it("crystals generate gold and honor the cap", () => {
    const save = starterVillage();
    tryPlace(save, "crystal", 0, 0);
    const rate = goldPerSecond(save);
    assert.ok(rate > 1);
    const before = save.gold;
    tickEconomy(save, 2);
    assert.ok(save.gold > before);
    save.gold = computeCap(save);
    tickEconomy(save, 5);
    assert.equal(save.gold, computeCap(save));
  });

  it("starts a short upgrade timer then levels the building", () => {
    const save = starterVillage();
    save.gold = 9999;
    const now = 1_000_000;
    assert.equal(tryStartUpgrade(save, "keep-home", now), true);
    const keep = save.buildings[0]!;
    assert.ok(keep.upgradeEndsAt && keep.upgradeEndsAt > now);
    assert.equal(keep.level, 1);
    const done = finishUpgrades(save, keep.upgradeEndsAt);
    assert.deepEqual(done, ["keep-home"]);
    assert.equal(keep.level, 2);
    assert.equal(keep.upgradeEndsAt, undefined);
    assert.ok(upgradeCost("keep", 1) > 0);
  });

  it("applies offline catch-up from lastSeen", () => {
    const save = starterVillage();
    tryPlace(save, "crystal", 0, 0);
    save.lastSeen = 0;
    save.gold = 10;
    const { gained, elapsedMs } = applyCatchup(save, 20_000);
    assert.equal(elapsedMs, 20_000);
    assert.ok(gained > 10);
  });
});
