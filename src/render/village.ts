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
import { BUILDINGS, cellToWorld, type BuildingType } from "../game/catalog";
import { occupies, type SaveData } from "../game/state";
import { createBuilding } from "./meshes";
import { createGridOverlay, createGhostTile, createPlateau, createProps, createSky } from "./terrain";
import type { ArtKit } from "./textures";

export class VillageWorld {
  readonly scene = new Scene();
  readonly root = new Group();
  private kit: ArtKit;
  private buildings = new Map<string, Group>();
  private grid: Group;
  private ghost: ReturnType<typeof createGhostTile>;
  private ground = new Plane(new Vector3(0, 1, 0), 0);
  private ray = new Raycaster();
  private hit = new Vector3();
  private placeType: BuildingType | null = null;

  constructor(kit: ArtKit) {
    this.kit = kit;
    this.scene.background = new Color("#e07a4a");
    this.scene.fog = new FogExp2("#c47a58", 0.012);
    this.scene.add(createSky());
    this.scene.add(this.root);
    this.root.add(createPlateau(kit, false));
    this.root.add(createProps(kit, false));
    this.grid = createGridOverlay();
    this.root.add(this.grid);
    this.ghost = createGhostTile(2);
    this.root.add(this.ghost);

    const hemi = new HemisphereLight("#8aa4ff", "#4a2e18", 0.72);
    const sun = new DirectionalLight("#ffc078", 1.85);
    sun.position.set(10, 16, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    this.scene.add(hemi, sun, new AmbientLight("#2a2030", 0.25));
  }

  sync(save: SaveData): void {
    const seen = new Set<string>();
    for (const rec of save.buildings) {
      seen.add(rec.id);
      let g = this.buildings.get(rec.id);
      if (!g) {
        g = createBuilding(rec.type, this.kit, "village");
        g.userData.id = rec.id;
        this.buildings.set(rec.id, g);
        this.root.add(g);
      }
      const { x, z } = cellToWorld(rec.gx, rec.gz, BUILDINGS[rec.type].size);
      g.position.set(x, 0, z);
      const upgrading = !!(rec.upgradeEndsAt && rec.upgradeEndsAt > Date.now());
      g.scale.setScalar(upgrading ? 0.92 : 1);
    }
    for (const [id, g] of this.buildings) {
      if (!seen.has(id)) {
        this.root.remove(g);
        this.buildings.delete(id);
      }
    }
  }

  setPlaceMode(type: BuildingType | null): void {
    this.placeType = type;
    this.grid.visible = !!type;
    this.ghost.visible = false;
  }

  pickGround(camera: PerspectiveCamera, ndc: Vector2): Vector3 | null {
    this.ray.setFromCamera(ndc, camera);
    if (this.ray.ray.intersectPlane(this.ground, this.hit)) {
      return this.hit.clone();
    }
    return null;
  }

  pickBuilding(camera: PerspectiveCamera, ndc: Vector2): string | null {
    this.ray.setFromCamera(ndc, camera);
    const meshes = [...this.buildings.values()];
    const hits = this.ray.intersectObjects(meshes, true);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !obj.userData.id) obj = obj.parent!;
    return (obj?.userData.id as string) ?? null;
  }

  hoverPlace(save: SaveData, gx: number, gz: number): boolean {
    if (!this.placeType) {
      this.ghost.visible = false;
      return false;
    }
    const size = BUILDINGS[this.placeType].size;
    const { x, z } = cellToWorld(gx, gz, size);
    this.ghost.scale.set(size / 2, 1, size / 2);
    this.ghost.position.set(x, 0.04, z);
    this.ghost.visible = true;
    const valid = save.buildings.every((b) => {
      for (let ix = gx; ix < gx + size; ix++) {
        for (let iz = gz; iz < gz + size; iz++) {
          if (occupies(b, ix, iz)) return false;
        }
      }
      return true;
    });
    const mat = this.ghost.material as unknown as { color: Color };
    mat.color.set(valid ? "#6dff88" : "#ff5a5a");
    return valid;
  }

  tick(t: number): void {
    for (const g of this.buildings.values()) {
      const pulse = g.userData.pulse as Group[] | undefined;
      if (pulse) {
        const s = 1 + Math.sin(t * 2.4) * 0.045;
        for (const p of pulse) p.scale.set(p.userData.sx ?? 1, (p.userData.sy ?? 1) * s, p.userData.sz ?? 1);
      }
      const banners = g.children.filter((c) => c.children.length > 1 && c.userData.kind !== "keep");
      for (const b of banners) b.rotation.y = Math.sin(t * 1.6 + g.position.x) * 0.08;
    }
  }
}
