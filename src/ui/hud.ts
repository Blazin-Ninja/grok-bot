import {
  BUILDINGS,
  PLACEABLE,
  RAID_SLOTS,
  TROOPS,
  upgradeCost,
  upgradeDurationMs,
  type BuildingType,
  type TroopType,
} from "../game/catalog";
import { computeCap, goldPerSecond, type BuildingRec, type SaveData } from "../game/state";

export type HudMode = "village" | "build" | "inspect" | "loadout" | "raid" | "result";

export class Hud {
  root: HTMLElement;
  onBuild: (type: BuildingType) => void = () => {};
  onCancelPlace: () => void = () => {};
  onUpgrade: () => void = () => {};
  onCloseInspect: () => void = () => {};
  onRaidOpen: () => void = () => {};
  onMarch: (loadout: Record<TroopType, number>) => void = () => {};
  onCancelLoadout: () => void = () => {};
  onSelectTroop: (type: TroopType) => void = () => {};
  onResultClose: () => void = () => {};
  onReset: () => void = () => {};

  private goldEl: HTMLElement;
  private rateEl: HTMLElement;
  private sheet: HTMLElement;
  private inspect: HTMLElement;
  private overlay: HTMLElement;
  private raidHud: HTMLElement;
  private keepbar: HTMLElement;
  private toastEl: HTMLElement;
  private hintEl: HTMLElement;
  private loadout: Record<TroopType, number> = { imp: 4, wolf: 4, ogre: 2 };
  selectedTroop: TroopType = "imp";

  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = `
      <div class="topbar">
        <div class="brand">EMBERKEEP</div>
        <div class="chip"><i class="coin"></i><strong id="gold">0</strong><span id="rate">+0/s</span></div>
        <button class="ghost-btn" id="reset" type="button">New village</button>
      </div>
      <div class="keepbar" id="keepbar"><label>Rival keep</label><div class="bar"><i id="keepfill"></i></div></div>
      <div class="hint-float" id="hint"></div>
      <div class="sheet" id="sheet">
        <h2>Raise a building</h2>
        <div class="cards" id="cards"></div>
      </div>
      <div class="inspect" id="inspect"></div>
      <div class="dock" id="dock">
        <button type="button" id="buildBtn"><em>Build</em><small>Crystal · vault · tower</small></button>
        <button type="button" id="raidBtn"><em>Raid</em><small>March on a rival hold</small></button>
      </div>
      <div class="raid-hud" id="raidhud"></div>
      <div class="overlay" id="overlay"></div>
      <div class="toast" id="toast"></div>
    `;
    this.goldEl = root.querySelector("#gold")!;
    this.rateEl = root.querySelector("#rate")!;
    this.sheet = root.querySelector("#sheet")!;
    this.inspect = root.querySelector("#inspect")!;
    this.overlay = root.querySelector("#overlay")!;
    this.raidHud = root.querySelector("#raidhud")!;
    this.keepbar = root.querySelector("#keepbar")!;
    this.toastEl = root.querySelector("#toast")!;
    this.hintEl = root.querySelector("#hint")!;

    root.querySelector("#buildBtn")!.addEventListener("click", () => this.toggleSheet());
    root.querySelector("#raidBtn")!.addEventListener("click", () => this.onRaidOpen());
    root.querySelector("#reset")!.addEventListener("click", () => {
      if (confirm("Found a new village? This clears the local save.")) this.onReset();
    });

    const cards = root.querySelector("#cards")!;
    for (const type of PLACEABLE) {
      const def = BUILDINGS[type];
      const btn = document.createElement("button");
      btn.className = "card";
      btn.dataset.type = type;
      btn.innerHTML = `<em>${def.name}</em><small>${def.blurb}</small><div class="cost">${def.cost}g</div>`;
      btn.addEventListener("click", () => this.onBuild(type));
      cards.appendChild(btn);
    }
  }

  setGold(save: SaveData): void {
    const cap = computeCap(save);
    this.goldEl.textContent = `${Math.floor(save.gold)} / ${cap}`;
    this.rateEl.textContent = `+${goldPerSecond(save).toFixed(1)}/s`;
  }

  setMode(mode: HudMode): void {
    const dock = this.root.querySelector("#dock") as HTMLElement;
    this.sheet.classList.toggle("open", mode === "build");
    this.inspect.classList.toggle("open", mode === "inspect");
    this.overlay.classList.toggle("open", mode === "loadout" || mode === "result");
    this.raidHud.classList.toggle("open", mode === "raid");
    this.keepbar.classList.toggle("open", mode === "raid");
    dock.style.display = mode === "raid" || mode === "loadout" || mode === "result" ? "none" : "flex";
    if (mode !== "build") this.clearCardSelect();
    if (mode === "village") this.hint("");
  }

  markCard(type: BuildingType | null): void {
    this.root.querySelectorAll<HTMLButtonElement>(".card").forEach((el) => {
      el.classList.toggle("selected", el.dataset.type === type);
    });
    this.hint(type ? "Tap a clear plot on the green. Drag to look around." : "");
  }

  showInspect(rec: BuildingRec, gold: number, now = Date.now()): void {
    const def = BUILDINGS[rec.type];
    const cost = upgradeCost(rec.type, rec.level);
    const upgrading = !!(rec.upgradeEndsAt && rec.upgradeEndsAt > now);
    const left = upgrading ? Math.max(0, (rec.upgradeEndsAt! - now) / 1000) : 0;
    this.inspect.innerHTML = `
      <h2>${def.name}</h2>
      <p>Level ${rec.level}${upgrading ? " · raising walls…" : ""} · ${def.blurb}</p>
      ${upgrading ? `<div class="timer"><i id="upbar"></i></div><p class="hint" id="uptxt">${left.toFixed(1)}s remaining</p>` : ""}
      <div class="row">
        <button type="button" id="upBtn" ${upgrading || gold < cost ? "disabled" : ""}>Upgrade · ${cost}g</button>
        <button type="button" class="ghost" id="closeIn">Done</button>
      </div>
    `;
    this.inspect.querySelector("#upBtn")?.addEventListener("click", () => this.onUpgrade());
    this.inspect.querySelector("#closeIn")?.addEventListener("click", () => this.onCloseInspect());
  }

  updateUpgrade(rec: BuildingRec, now = Date.now()): void {
    if (!rec.upgradeEndsAt) return;
    const left = Math.max(0, rec.upgradeEndsAt - now);
    const dur = upgradeDurationMs(rec.level);
    const bar = this.inspect.querySelector("#upbar") as HTMLElement | null;
    const txt = this.inspect.querySelector("#uptxt");
    if (bar) bar.style.width = `${Math.min(100, ((dur - left) / dur) * 100)}%`;
    if (txt) txt.textContent = `${(left / 1000).toFixed(1)}s remaining`;
  }

  openLoadout(): void {
    this.loadout = { imp: 4, wolf: 4, ogre: 2 };
    this.renderLoadout();
  }

  private usedSlots(): number {
    return (
      this.loadout.imp * TROOPS.imp.slots +
      this.loadout.wolf * TROOPS.wolf.slots +
      this.loadout.ogre * TROOPS.ogre.slots
    );
  }

  private renderLoadout(): void {
    const used = this.usedSlots();
    this.overlay.innerHTML = `
      <div class="modal">
        <h2>Rival hold</h2>
        <p>Pick a warband. ${used}/${RAID_SLOTS} slots. Deploy them on the gold field.</p>
        <div class="troops"></div>
        <div class="row">
          <button type="button" id="march">March</button>
          <button type="button" class="ghost" id="cancelMarch">Back</button>
        </div>
      </div>
    `;
    const box = this.overlay.querySelector(".troops")!;
    (["imp", "wolf", "ogre"] as TroopType[]).forEach((type) => {
      const def = TROOPS[type];
      const row = document.createElement("div");
      row.className = "troop";
      row.innerHTML = `<strong>${def.name}</strong><span>${def.slots} slot · ${def.hp} hp</span>
        <div class="stepper">
          <button type="button" data-d="-1">−</button>
          <span>${this.loadout[type]}</span>
          <button type="button" data-d="1">+</button>
        </div>`;
      row.querySelectorAll("button").forEach((b) => {
        b.addEventListener("click", () => {
          const d = Number((b as HTMLButtonElement).dataset.d);
          const next = this.loadout[type] + d;
          if (next < 0) return;
          const trial = { ...this.loadout, [type]: next };
          const slots =
            trial.imp * TROOPS.imp.slots + trial.wolf * TROOPS.wolf.slots + trial.ogre * TROOPS.ogre.slots;
          if (slots > RAID_SLOTS) return;
          this.loadout = trial;
          this.renderLoadout();
        });
      });
      box.appendChild(row);
    });
    this.overlay.querySelector("#march")!.addEventListener("click", () => {
      if (this.usedSlots() <= 0) {
        this.toast("Bring at least one creature.");
        return;
      }
      this.onMarch({ ...this.loadout });
    });
    this.overlay.querySelector("#cancelMarch")!.addEventListener("click", () => this.onCancelLoadout());
  }

  openRaidHud(counts: Record<TroopType, number>): void {
    this.renderRaidHud(counts);
  }

  renderRaidHud(counts: Record<TroopType, number>): void {
    this.raidHud.innerHTML = "";
    (["imp", "wolf", "ogre"] as TroopType[]).forEach((type) => {
      const b = document.createElement("button");
      b.className = this.selectedTroop === type ? "selected" : "";
      b.innerHTML = `<em>${TROOPS[type].name}</em><small>${counts[type]} left</small>`;
      b.addEventListener("click", () => {
        this.selectedTroop = type;
        this.onSelectTroop(type);
        this.renderRaidHud(counts);
      });
      this.raidHud.appendChild(b);
    });
  }

  setKeep(hp: number, max: number): void {
    const fill = this.root.querySelector("#keepfill") as HTMLElement;
    fill.style.width = `${Math.max(0, (hp / max) * 100)}%`;
  }

  showResult(won: boolean, loot: number): void {
    this.overlay.innerHTML = `
      <div class="modal">
        <h2>${won ? "The keep falls" : "The warband breaks"}</h2>
        <p>${won ? "You sack the rival hold." : "Enough gold to limp home."} Loot: <strong>${loot}g</strong></p>
        <div class="row"><button type="button" id="home">Return to village</button></div>
      </div>
    `;
    this.overlay.querySelector("#home")!.addEventListener("click", () => this.onResultClose());
  }

  hint(text: string): void {
    this.hintEl.textContent = text;
    this.hintEl.classList.toggle("open", !!text);
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add("show");
    window.setTimeout(() => this.toastEl.classList.remove("show"), 1600);
  }

  private toggleSheet(): void {
    const open = this.sheet.classList.contains("open");
    if (open) {
      this.onCancelPlace();
    } else {
      this.inspect.classList.remove("open");
      this.sheet.classList.add("open");
    }
  }

  private clearCardSelect(): void {
    this.root.querySelectorAll(".card").forEach((el) => el.classList.remove("selected"));
  }
}
