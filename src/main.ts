import "./style.css";
import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";
import { BUILDINGS, worldToCell, type BuildingType } from "./game/catalog";
import {
  applyCatchup,
  canPlace,
  computeCap,
  inBounds,
  loadSave,
  persistSave,
  resetSave,
  tickEconomy,
  tryPlace,
  tryStartUpgrade,
  type BuildingRec,
  type SaveData,
} from "./game/state";
import { OrbitRig } from "./render/camera";
import { RaidWorld } from "./render/raid";
import { createArtKit } from "./render/textures";
import { VillageWorld } from "./render/village";
import { Hud, type HudMode } from "./ui/hud";

const canvas = document.querySelector<HTMLCanvasElement>("#view")!;
const hudRoot = document.querySelector<HTMLElement>("#hud")!;

const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

const kit = createArtKit();
const village = new VillageWorld(kit);
const rig = new OrbitRig(window.innerWidth / window.innerHeight);
rig.setBounds(8.5);
rig.focus(0, 0.6, 17);

const hud = new Hud(hudRoot);
let save: SaveData = loadSave();
const catchup = applyCatchup(save);
village.sync(save);
hud.setGold(save);
if (catchup.elapsedMs > 8000 && catchup.gained > 1) {
  hud.toast(`The crystals worked while you were gone. +${Math.floor(catchup.gained)}g`);
}

let mode: HudMode = "village";
let placing: BuildingType | null = null;
let selected: BuildingRec | null = null;
let raid: RaidWorld | null = null;
let dragging = false;
let moved = 0;
let pointers = new Map<number, { x: number; y: number }>();
let pinch = 0;

function setMode(next: HudMode): void {
  mode = next;
  hud.setMode(next);
  if (next !== "build") {
    placing = null;
    village.setPlaceMode(null);
    hud.markCard(null);
  }
}

function persist(): void {
  persistSave(save);
}

hud.onBuild = (type) => {
  if (save.gold < BUILDINGS[type].cost) {
    hud.toast("Not enough gold.");
    return;
  }
  placing = type;
  mode = "build";
  hud.setMode("build");
  village.setPlaceMode(type);
  hud.markCard(type);
};

hud.onCancelPlace = () => {
  setMode("village");
};

hud.onUpgrade = () => {
  if (!selected) return;
  if (!tryStartUpgrade(save, selected.id)) {
    hud.toast("Need more gold, or it is already rising.");
    return;
  }
  selected = save.buildings.find((b) => b.id === selected?.id) ?? selected;
  hud.showInspect(selected, save.gold);
  village.sync(save);
  hud.setGold(save);
  persist();
};

hud.onCloseInspect = () => {
  selected = null;
  setMode("village");
};

hud.onRaidOpen = () => {
  selected = null;
  placing = null;
  village.setPlaceMode(null);
  mode = "loadout";
  hud.setMode("loadout");
  hud.openLoadout();
};

hud.onCancelLoadout = () => setMode("village");

hud.onMarch = (loadout) => {
  raid = new RaidWorld(kit, loadout);
  mode = "raid";
  hud.setMode("raid");
  hud.openRaidHud(raid.leftover);
  hud.hint("Tap the gold field to send creatures in.");
  rig.focus(0, 2.2, 18);
};

hud.onSelectTroop = (type) => {
  hud.selectedTroop = type;
};

hud.onResultClose = () => {
  raid = null;
  setMode("village");
  village.sync(save);
  hud.setGold(save);
  rig.focus(0, 0.6, 17);
  persist();
};

hud.onReset = () => {
  save = resetSave();
  village.sync(save);
  selected = null;
  setMode("village");
  hud.setGold(save);
};

function ndcFrom(x: number, y: number): Vector2 {
  return new Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
}

function onTap(x: number, y: number): void {
  const ndc = ndcFrom(x, y);
  if (mode === "raid" && raid) {
    const p = raid.pickGround(rig.camera, ndc);
    if (!p) return;
    if (!raid.tryDeploy(hud.selectedTroop, p)) {
      if (!raid.inDeploy(p)) hud.toast("Deploy on the gold field.");
      else hud.toast("None of that creature left.");
      return;
    }
    hud.renderRaidHud(raid.leftover);
    return;
  }

  if (placing) {
    const p = village.pickGround(rig.camera, ndc);
    if (!p) return;
    const cell = worldToCell(p.x, p.z);
    const size = BUILDINGS[placing].size;
    if (!canPlace(save, placing, cell.gx, cell.gz) || !inBounds(cell.gx, cell.gz, size)) {
      hud.toast("That plot is taken.");
      return;
    }
    const rec = tryPlace(save, placing, cell.gx, cell.gz);
    if (!rec) {
      hud.toast("Cannot raise that here.");
      return;
    }
    village.sync(save);
    hud.setGold(save);
    persist();
    hud.toast(`${BUILDINGS[rec.type].name} raised.`);
    setMode("village");
    return;
  }

  if (mode === "village" || mode === "inspect" || mode === "build") {
    const id = village.pickBuilding(rig.camera, ndc);
    if (!id) {
      if (mode === "inspect") {
        selected = null;
        setMode("village");
      }
      return;
    }
    selected = save.buildings.find((b) => b.id === id) ?? null;
    if (!selected) return;
    mode = "inspect";
    hud.setMode("inspect");
    hud.showInspect(selected, save.gold);
  }
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  dragging = false;
  moved = 0;
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = Math.hypot(a.x - b.x, a.y - b.y);
  }
});

canvas.addEventListener("pointermove", (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const dx = e.clientX - prev.x;
  const dy = e.clientY - prev.y;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinch) rig.zoom((pinch - d) * 0.35);
    pinch = d;
    dragging = true;
    return;
  }

  moved += Math.abs(dx) + Math.abs(dy);
  if (moved > 10) {
    dragging = true;
    rig.pan(dx, dy);
  }

  if (placing && pointers.size === 1) {
    const p = village.pickGround(rig.camera, ndcFrom(e.clientX, e.clientY));
    if (p) {
      const cell = worldToCell(p.x, p.z);
      village.hoverPlace(save, cell.gx, cell.gz);
    }
  }
});

canvas.addEventListener("pointerup", (e) => {
  const wasDrag = dragging;
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = 0;
  if (!wasDrag && pointers.size === 0) onTap(e.clientX, e.clientY);
});

canvas.addEventListener("pointercancel", (e) => {
  pointers.delete(e.pointerId);
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    rig.zoom(e.deltaY);
  },
  { passive: false },
);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  rig.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener("visibilitychange", () => {
  if (document.hidden) persist();
  else {
    const extra = applyCatchup(save);
    hud.setGold(save);
    if (extra.gained > 2) hud.toast(`Catch-up +${Math.floor(extra.gained)}g`);
  }
});

window.addEventListener("beforeunload", () => persist());

let last = performance.now();
let saveAcc = 0;
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (mode !== "raid" && mode !== "loadout" && mode !== "result") {
    tickEconomy(save, dt);
    hud.setGold(save);
    if (selected) {
      const live = save.buildings.find((b) => b.id === selected?.id);
      if (live) {
        selected = live;
        if (live.upgradeEndsAt) hud.updateUpgrade(live);
        else if (mode === "inspect") hud.showInspect(live, save.gold);
      }
    }
    village.sync(save);
    village.tick(now / 1000);
    saveAcc += dt;
    if (saveAcc > 1.2) {
      persist();
      saveAcc = 0;
    }
  }

  if (raid && mode === "raid") {
    raid.tick(dt);
    const k = raid.keepHp();
    hud.setKeep(k.hp, k.max);
    if (raid.done) {
      const loot = raid.done.loot;
      save.gold = Math.min(computeCap(save), save.gold + loot);
      persist();
      mode = "result";
      hud.setMode("result");
      hud.showResult(raid.done.won, loot);
    }
  }

  rig.tick(dt);
  const scene = raid && (mode === "raid" || mode === "result") ? raid.scene : village.scene;
  renderer.render(scene, rig.camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
