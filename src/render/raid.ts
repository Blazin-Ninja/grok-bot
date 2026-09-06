import {
  AmbientLight,
  Color,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { BUILDINGS, TROOPS, cellToWorld, type TroopType } from "../game/catalog";
import { createBuilding, createFireball, createTroop } from "./meshes";
import { createDeployField, createPlateau, createProps, createSky } from "./terrain";
import type { ArtKit } from "./textures";

interface CombatBuilding {
  id: string;
  type: "keep" | "crystal" | "tower";
  hp: number;
  max: number;
  mesh: Group;
  range: number;
  cooldown: number;
  alive: boolean;
}

interface CombatUnit {
  id: string;
  type: TroopType;
  hp: number;
  max: number;
  mesh: Group;
  cooldown: number;
  alive: boolean;
}

interface Bolt {
  mesh: ReturnType<typeof createFireball>;
  from: Vector3;
  to: Vector3;
  age: number;
  life: number;
}

export interface RaidResult {
  won: boolean;
  loot: number;
  keepDown: boolean;
}

export class RaidWorld {
  readonly scene = new Scene();
  readonly root = new Group();
  private kit: ArtKit;
  private buildings: CombatBuilding[] = [];
  private units: CombatUnit[] = [];
  private bolts: Bolt[] = [];
  private ground = new Plane(new Vector3(0, 1, 0), 0);
  private ray = new Raycaster();
  private hit = new Vector3();
  private time = 0;
  leftover: Record<TroopType, number>;
  done: RaidResult | null = null;
  deployed = 0;

  constructor(kit: ArtKit, leftover: Record<TroopType, number>) {
    this.kit = kit;
    this.leftover = { ...leftover };
    this.scene.background = new Color("#1a1020");
    this.scene.fog = new FogExp2("#3a2430", 0.024);
    this.scene.add(createSky());
    this.scene.add(this.root);
    this.root.add(createPlateau(kit, true));
    this.root.add(createProps(kit, true));
    this.root.add(createDeployField());

    const hemi = new HemisphereLight("#9a80ff", "#3a2218", 0.7);
    const sun = new DirectionalLight("#ff9a6a", 1.65);
    sun.position.set(8, 15, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    this.scene.add(hemi, sun, new AmbientLight("#2a1824", 0.28));

    this.spawnEnemy("keep", 5, 3, 520);
    this.spawnEnemy("tower", 1, 2, 230);
    this.spawnEnemy("tower", 10, 2, 230);
    this.spawnEnemy("crystal", 8, 8, 130);
    this.spawnEnemy("crystal", 2, 8, 130);
  }

  private spawnEnemy(type: "keep" | "crystal" | "tower", gx: number, gz: number, hp: number): void {
    const mesh = createBuilding(type, this.kit, "enemy");
    const { x, z } = cellToWorld(gx, gz, BUILDINGS[type].size);
    mesh.position.set(x, 0, z);
    this.root.add(mesh);
    this.buildings.push({
      id: `${type}-${gx}-${gz}`,
      type,
      hp,
      max: hp,
      mesh,
      range: type === "tower" ? 4.6 : 0,
      cooldown: 0,
      alive: true,
    });
  }

  pickGround(camera: PerspectiveCamera, ndc: Vector2): Vector3 | null {
    this.ray.setFromCamera(ndc, camera);
    if (this.ray.ray.intersectPlane(this.ground, this.hit)) return this.hit.clone();
    return null;
  }

  inDeploy(p: Vector3): boolean {
    return p.z > 4.2 && Math.abs(p.x) < 7.2;
  }

  tryDeploy(type: TroopType, p: Vector3): boolean {
    if (this.done) return false;
    if (this.leftover[type] <= 0) return false;
    if (!this.inDeploy(p)) return false;
    this.leftover[type] -= 1;
    this.deployed += 1;
    const mesh = createTroop(type);
    mesh.position.set(p.x, 0, p.z);
    this.root.add(mesh);
    const def = TROOPS[type];
    this.units.push({
      id: `${type}-${this.units.length}`,
      type,
      hp: def.hp,
      max: def.hp,
      mesh,
      cooldown: 0,
      alive: true,
    });
    return true;
  }

  tick(dt: number): void {
    if (this.done) return;
    this.time += dt;

    for (const u of this.units) {
      if (!u.alive) continue;
      const target = this.nearestBuilding(u.mesh.position);
      if (!target) continue;
      const def = TROOPS[u.type];
      const dx = target.mesh.position.x - u.mesh.position.x;
      const dz = target.mesh.position.z - u.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > def.range + 0.85) {
        const n = Math.max(0.001, dist);
        u.mesh.position.x += (dx / n) * def.speed * dt;
        u.mesh.position.z += (dz / n) * def.speed * dt;
        u.mesh.rotation.y = Math.atan2(dx, dz);
        const bob = 0.02 + Math.abs(Math.sin(this.time * 8 + u.mesh.position.x)) * 0.04;
        u.mesh.position.y = bob;
      } else {
        u.cooldown -= dt;
        if (u.cooldown <= 0) {
          target.hp -= def.dps * 0.45;
          u.cooldown = 0.45;
          this.spawnBolt(u.mesh.position, target.mesh.position, false);
          if (target.hp <= 0) this.killBuilding(target);
        }
      }
    }

    for (const b of this.buildings) {
      if (!b.alive || b.range <= 0) continue;
      b.cooldown -= dt;
      const u = this.nearestUnit(b.mesh.position, b.range);
      if (!u || b.cooldown > 0) continue;
      u.hp -= 16;
      b.cooldown = 0.85;
      this.spawnBolt(b.mesh.position.clone().add(new Vector3(0, 2.8, 0)), u.mesh.position, true);
      if (u.hp <= 0) this.killUnit(u);
    }

    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.age += dt;
      const k = Math.min(1, bolt.age / bolt.life);
      bolt.mesh.position.lerpVectors(bolt.from, bolt.to, k);
      bolt.mesh.position.y += Math.sin(k * Math.PI) * 0.6;
      if (k >= 1) {
        this.root.remove(bolt.mesh);
        this.bolts.splice(i, 1);
      }
    }

    this.evaluate();
  }

  keepHp(): { hp: number; max: number } {
    const keep = this.buildings.find((b) => b.type === "keep");
    return { hp: Math.max(0, keep?.hp ?? 0), max: keep?.max ?? 1 };
  }

  livingUnits(): number {
    return this.units.filter((u) => u.alive).length;
  }

  remainingTroops(): number {
    return this.leftover.imp + this.leftover.wolf + this.leftover.ogre;
  }

  private nearestBuilding(from: Vector3): CombatBuilding | null {
    let best: CombatBuilding | null = null;
    let bestD = Infinity;
    for (const b of this.buildings) {
      if (!b.alive) continue;
      const d = from.distanceTo(b.mesh.position);
      if (d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  private nearestUnit(from: Vector3, range: number): CombatUnit | null {
    let best: CombatUnit | null = null;
    let bestD = Infinity;
    for (const u of this.units) {
      if (!u.alive) continue;
      const d = from.distanceTo(u.mesh.position);
      if (d <= range && d < bestD) {
        best = u;
        bestD = d;
      }
    }
    return best;
  }

  private spawnBolt(from: Vector3, to: Vector3, enemy: boolean): void {
    const mesh = createFireball(enemy);
    mesh.position.copy(from);
    this.root.add(mesh);
    this.bolts.push({
      mesh,
      from: from.clone(),
      to: to.clone().setY(0.5),
      age: 0,
      life: 0.28,
    });
  }

  private killBuilding(b: CombatBuilding): void {
    b.alive = false;
    b.hp = 0;
    b.mesh.visible = false;
  }

  private killUnit(u: CombatUnit): void {
    u.alive = false;
    u.hp = 0;
    u.mesh.visible = false;
  }

  private evaluate(): void {
    const keep = this.buildings.find((b) => b.type === "keep");
    if (keep && !keep.alive) {
      this.finish(true);
      return;
    }
    const troopsLeft = this.remainingTroops();
    if (this.deployed > 0 && this.livingUnits() === 0 && troopsLeft === 0) {
      this.finish(false);
    }
    if (this.time > 90) this.finish(!!keep && keep.hp < keep.max * 0.15);
  }

  private finish(won: boolean): void {
    if (this.done) return;
    const keep = this.buildings.find((b) => b.type === "keep");
    const destroyed = this.buildings.filter((b) => !b.alive).length;
    const keepDown = !!keep && !keep.alive;
    const loot = won
      ? 150 + destroyed * 22
      : Math.round(18 + destroyed * 12 + (1 - (keep?.hp ?? 0) / (keep?.max ?? 1)) * 40);
    this.done = { won, loot, keepDown };
  }
}
