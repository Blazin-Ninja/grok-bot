import {
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  type Material,
} from "three";
import type { Palette, TroopType } from "../game/catalog";
import type { ArtKit } from "./textures";

function mat(
  kit: ArtKit,
  map: keyof ArtKit | null,
  opts: ConstructorParameters<typeof MeshStandardMaterial>[0] = {},
): MeshStandardMaterial {
  return new MeshStandardMaterial({
    roughness: 0.78,
    metalness: 0.04,
    ...opts,
    ...(map ? { map: kit[map] as MeshStandardMaterial["map"] } : {}),
  });
}

function mesh(
  geo: BoxGeometry | CylinderGeometry | ConeGeometry | SphereGeometry | PlaneGeometry | OctahedronGeometry | IcosahedronGeometry | CircleGeometry,
  material: Material,
  x = 0,
  y = 0,
  z = 0,
): Mesh {
  const m = new Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function crenelRow(parent: Group, material: Material, width: number, y: number, z: number, alongX: boolean): void {
  const count = 5;
  const step = width / count;
  for (let i = 0; i < count; i++) {
    if (i % 2 === 1) continue;
    const c = mesh(new BoxGeometry(alongX ? step * 0.7 : 0.16, 0.22, alongX ? 0.16 : step * 0.7), material);
    if (alongX) c.position.set(-width / 2 + step * (i + 0.5), y, z);
    else c.position.set(z, y, -width / 2 + step * (i + 0.5));
    parent.add(c);
  }
}

function banner(kit: ArtKit, palette: Palette, height: number): Group {
  const g = new Group();
  const pole = mesh(new CylinderGeometry(0.035, 0.04, height, 6), mat(kit, "wood", { roughness: 0.9 }));
  pole.position.y = height / 2;
  g.add(pole);
  const cloth = mesh(
    new PlaneGeometry(0.42, 0.55),
    mat(kit, palette === "village" ? "banner" : "enemyBanner", { side: DoubleSide, roughness: 0.65 }),
    0.22,
    height - 0.38,
    0,
  );
  cloth.receiveShadow = false;
  g.add(cloth);
  return g;
}

export function createKeep(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const stone = mat(kit, palette === "village" ? "mossStone" : "enemyStone", { roughness: 0.86 });
  const wood = mat(kit, "wood");
  const roof = mat(kit, palette === "village" ? "roof" : "darkRoof", { roughness: 0.7 });
  const iron = mat(kit, "iron", { metalness: 0.55, roughness: 0.45 });

  g.add(mesh(new BoxGeometry(3.3, 0.28, 3.3), stone, 0, 0.14, 0));
  g.add(mesh(new BoxGeometry(2.55, 1.85, 2.55), stone, 0, 1.15, 0));
  g.add(mesh(new BoxGeometry(2.05, 0.95, 2.05), stone, 0, 2.45, 0));

  const hip = mesh(new ConeGeometry(1.72, 0.95, 4), roof, 0, 3.2, 0);
  hip.rotation.y = Math.PI / 4;
  g.add(hip);

  const corners: [number, number][] = [
    [-1.15, -1.15],
    [1.15, -1.15],
    [-1.15, 1.15],
    [1.15, 1.15],
  ];
  for (const [x, z] of corners) {
    g.add(mesh(new CylinderGeometry(0.38, 0.42, 2.35, 8), stone, x, 1.25, z));
    const cap = mesh(new ConeGeometry(0.5, 0.55, 4), roof, x, 2.68, z);
    cap.rotation.y = Math.PI / 4;
    g.add(cap);
  }

  crenelRow(g, stone, 2.05, 2.98, -1.02, true);
  crenelRow(g, stone, 2.05, 2.98, 1.02, true);

  const door = mesh(new BoxGeometry(0.55, 0.85, 0.08), wood, 0, 0.62, 1.3);
  g.add(door);
  g.add(mesh(new BoxGeometry(0.62, 0.12, 0.1), iron, 0, 1.08, 1.31));
  g.add(mesh(new BoxGeometry(0.95, 0.18, 0.7), stone, 0, 0.22, 1.55));
  g.add(mesh(new BoxGeometry(0.7, 0.12, 0.55), stone, 0, 0.12, 1.85));

  const glow = mat(kit, null, {
    color: palette === "village" ? "#ffb060" : "#ff6a55",
    emissive: palette === "village" ? "#ff8a30" : "#ff3a2a",
    emissiveIntensity: 1.8,
    roughness: 0.3,
  });
  g.add(mesh(new BoxGeometry(0.18, 0.28, 0.06), glow, -0.7, 1.55, 1.29));
  g.add(mesh(new BoxGeometry(0.18, 0.28, 0.06), glow, 0.7, 1.55, 1.29));
  g.add(mesh(new BoxGeometry(0.14, 0.22, 0.06), glow, 0, 2.35, 1.04));

  const left = banner(kit, palette, 1.7);
  left.position.set(-1.55, 1.7, 0.2);
  const right = banner(kit, palette, 1.7);
  right.position.set(1.55, 1.7, 0.2);
  g.add(left, right);

  const lamp = new PointLight(palette === "village" ? "#ffb070" : "#ff7058", 1.4, 6, 2);
  lamp.position.set(0, 1.6, 1.6);
  g.add(lamp);
  g.userData.kind = "keep";
  return g;
}

export function createCrystal(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const stone = mat(kit, palette === "village" ? "stone" : "enemyStone");
  g.add(mesh(new CylinderGeometry(0.85, 0.95, 0.28, 6), stone, 0, 0.14, 0));
  g.add(mesh(new CylinderGeometry(0.72, 0.72, 0.12, 6), mat(kit, "rune", { emissive: "#3ad8ff", emissiveIntensity: 0.45 }), 0, 0.3, 0));

  const gem = new MeshStandardMaterial({
    color: palette === "village" ? "#7cf6ff" : "#d27cff",
    emissive: palette === "village" ? "#2ad8ff" : "#b14cff",
    emissiveIntensity: 1.35,
    roughness: 0.12,
    metalness: 0.28,
    transparent: true,
    opacity: 0.92,
  });
  const core = mesh(new OctahedronGeometry(0.62, 0), gem, 0, 1.15, 0);
  core.scale.set(0.75, 1.25, 0.75);
  g.add(core);
  const s1 = mesh(new OctahedronGeometry(0.28, 0), gem, 0.48, 0.72, 0.18);
  s1.rotation.z = 0.4;
  const s2 = mesh(new OctahedronGeometry(0.22, 0), gem, -0.42, 0.62, -0.22);
  s2.rotation.z = -0.5;
  g.add(s1, s2);

  const light = new PointLight(palette === "village" ? "#66f0ff" : "#d080ff", 2.2, 7, 2);
  light.position.set(0, 1.3, 0);
  g.add(light);
  g.userData.kind = "crystal";
  g.userData.pulse = [core, s1, s2];
  return g;
}

export function createVault(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const stone = mat(kit, palette === "village" ? "stone" : "enemyStone");
  const wood = mat(kit, "wood");
  const roof = mat(kit, palette === "village" ? "roof" : "darkRoof");
  const iron = mat(kit, "iron", { metalness: 0.6, roughness: 0.4 });
  const gold = new MeshStandardMaterial({
    color: "#e6c34a",
    emissive: "#a67a18",
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.28,
  });

  g.add(mesh(new BoxGeometry(2.15, 0.2, 1.9), stone, 0, 0.1, 0));
  g.add(mesh(new BoxGeometry(1.95, 1.25, 1.65), stone, 0, 0.82, 0));
  const lid = mesh(new BoxGeometry(2.05, 0.18, 1.75), roof, 0, 1.52, 0);
  g.add(lid);
  const ridge = mesh(new BoxGeometry(2.1, 0.16, 0.22), roof, 0, 1.68, 0);
  g.add(ridge);

  g.add(mesh(new BoxGeometry(0.55, 0.85, 0.08), wood, 0, 0.62, 0.84));
  g.add(mesh(new BoxGeometry(0.62, 0.08, 0.1), iron, 0, 0.95, 0.86));
  g.add(mesh(new BoxGeometry(0.08, 0.7, 0.1), iron, 0, 0.6, 0.86));

  const pile = mesh(new IcosahedronGeometry(0.28, 0), gold, 0.72, 0.38, 0.7);
  pile.scale.set(1.1, 0.7, 1);
  const pile2 = mesh(new IcosahedronGeometry(0.18, 0), gold, 0.92, 0.28, 0.52);
  g.add(pile, pile2);
  g.add(mesh(new BoxGeometry(0.22, 0.55, 0.22), stone, -0.95, 0.55, -0.72));
  g.add(mesh(new BoxGeometry(0.22, 0.55, 0.22), stone, 0.95, 0.55, -0.72));
  g.userData.kind = "vault";
  return g;
}

export function createTower(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const stone = mat(kit, palette === "village" ? "mossStone" : "enemyStone");
  const wood = mat(kit, "wood");
  const roof = mat(kit, palette === "village" ? "roof" : "darkRoof");

  g.add(mesh(new CylinderGeometry(0.72, 0.82, 0.22, 8), stone, 0, 0.11, 0));
  g.add(mesh(new CylinderGeometry(0.52, 0.64, 2.15, 8), stone, 0, 1.2, 0));
  g.add(mesh(new CylinderGeometry(0.7, 0.7, 0.16, 8), wood, 0, 2.15, 0));
  g.add(mesh(new CylinderGeometry(0.62, 0.62, 0.55, 8), stone, 0, 2.48, 0));

  for (let i = 0; i < 8; i++) {
    if (i % 2 === 1) continue;
    const a = (i / 8) * Math.PI * 2;
    g.add(mesh(new BoxGeometry(0.2, 0.22, 0.14), stone, Math.cos(a) * 0.58, 2.85, Math.sin(a) * 0.58));
  }
  const cap = mesh(new ConeGeometry(0.42, 0.5, 8), roof, 0, 3.05, 0);
  g.add(cap);

  const orbCol = palette === "village" ? "#7cf0ff" : "#ff6a4a";
  const orb = mesh(
    new SphereGeometry(0.16, 10, 8),
    new MeshStandardMaterial({
      color: orbCol,
      emissive: orbCol,
      emissiveIntensity: 2,
      roughness: 0.15,
    }),
    0,
    3.38,
    0,
  );
  g.add(orb);
  const light = new PointLight(orbCol, 1.3, 5, 2);
  light.position.set(0, 3.3, 0);
  g.add(light);

  const flag = banner(kit, palette, 1.1);
  flag.position.set(0.55, 2.2, 0);
  g.add(flag);
  g.userData.kind = "tower";
  g.userData.pulse = [orb];
  return g;
}

export function createBuilding(type: "keep" | "crystal" | "vault" | "tower", kit: ArtKit, palette: Palette): Group {
  if (type === "keep") return createKeep(kit, palette);
  if (type === "crystal") return createCrystal(kit, palette);
  if (type === "vault") return createVault(kit, palette);
  return createTower(kit, palette);
}

export function createTree(kit: ArtKit, seed: number): Group {
  const g = new Group();
  const trunk = mesh(
    new CylinderGeometry(0.08 + seed * 0.04, 0.12 + seed * 0.05, 0.7 + seed * 0.25, 6),
    mat(kit, "wood", { roughness: 0.95 }),
    0,
    0.4,
    0,
  );
  g.add(trunk);
  const leaf = new MeshStandardMaterial({
    color: new Color().setHSL(0.28 + seed * 0.06, 0.45, 0.28 + seed * 0.08),
    roughness: 0.86,
  });
  const h = 0.85 + seed * 0.35;
  g.add(mesh(new ConeGeometry(0.55 + seed * 0.15, h, 7), leaf, 0, 0.95 + seed * 0.1, 0));
  g.add(mesh(new ConeGeometry(0.42 + seed * 0.1, h * 0.7, 7), leaf, 0, 1.35 + seed * 0.15, 0));
  g.add(mesh(new ConeGeometry(0.28, h * 0.5, 7), leaf, 0, 1.65 + seed * 0.18, 0));
  return g;
}

export function createRock(kit: ArtKit, seed: number): Mesh {
  const m = mesh(
    new IcosahedronGeometry(0.28 + seed * 0.2, 0),
    mat(kit, "stone", { flatShading: true, roughness: 0.95 }),
  );
  m.scale.set(1 + seed * 0.4, 0.55 + seed * 0.4, 0.8 + seed * 0.3);
  m.rotation.set(seed * 1.2, seed * 2.1, seed * 0.4);
  return m;
}

export function createShadow(): Mesh {
  const m = new Mesh(
    new CircleGeometry(0.42, 16),
    new MeshStandardMaterial({ color: "#000000", transparent: true, opacity: 0.28, roughness: 1 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  m.receiveShadow = false;
  m.castShadow = false;
  return m;
}

export function createImp(): Group {
  const g = new Group();
  const skin = new MeshStandardMaterial({ color: "#c45a3a", roughness: 0.7 });
  const dark = new MeshStandardMaterial({ color: "#4a2218", roughness: 0.8 });
  g.add(mesh(new SphereGeometry(0.16, 8, 6), skin, 0, 0.38, 0));
  g.add(mesh(new SphereGeometry(0.12, 8, 6), skin, 0, 0.58, 0.02));
  g.add(mesh(new ConeGeometry(0.05, 0.14, 5), dark, -0.08, 0.7, 0));
  g.add(mesh(new ConeGeometry(0.05, 0.14, 5), dark, 0.08, 0.7, 0));
  g.add(mesh(new BoxGeometry(0.08, 0.16, 0.08), skin, -0.14, 0.36, 0.04));
  g.add(mesh(new BoxGeometry(0.08, 0.16, 0.08), skin, 0.14, 0.36, 0.04));
  const shadow = createShadow();
  shadow.scale.setScalar(0.55);
  g.add(shadow);
  g.userData.bob = 0.38;
  return g;
}

export function createWolf(): Group {
  const g = new Group();
  const fur = new MeshStandardMaterial({ color: "#6b7280", roughness: 0.85 });
  const dark = new MeshStandardMaterial({ color: "#2f3338", roughness: 0.8 });
  g.add(mesh(new BoxGeometry(0.22, 0.2, 0.48), fur, 0, 0.32, 0));
  g.add(mesh(new BoxGeometry(0.16, 0.16, 0.2), fur, 0, 0.38, 0.3));
  const earL = mesh(new ConeGeometry(0.05, 0.1, 4), dark, -0.05, 0.52, 0.32);
  const earR = mesh(new ConeGeometry(0.05, 0.1, 4), dark, 0.05, 0.52, 0.32);
  g.add(earL, earR);
  g.add(mesh(new BoxGeometry(0.05, 0.05, 0.22), fur, 0, 0.34, -0.3));
  for (const [x, z] of [
    [-0.08, 0.14],
    [0.08, 0.14],
    [-0.08, -0.14],
    [0.08, -0.14],
  ]) {
    g.add(mesh(new BoxGeometry(0.06, 0.2, 0.06), dark, x, 0.14, z));
  }
  const shadow = createShadow();
  shadow.scale.setScalar(0.7);
  g.add(shadow);
  g.userData.bob = 0.32;
  return g;
}

export function createOgre(): Group {
  const g = new Group();
  const skin = new MeshStandardMaterial({ color: "#6a8a3a", roughness: 0.75 });
  const cloth = new MeshStandardMaterial({ color: "#5a3a22", roughness: 0.9 });
  const wood = new MeshStandardMaterial({ color: "#4a2e18", roughness: 0.85 });
  g.add(mesh(new SphereGeometry(0.32, 8, 6), skin, 0, 0.62, 0));
  g.add(mesh(new SphereGeometry(0.2, 8, 6), skin, 0, 0.98, 0.04));
  g.add(mesh(new BoxGeometry(0.42, 0.22, 0.28), cloth, 0, 0.48, 0));
  g.add(mesh(new BoxGeometry(0.12, 0.28, 0.12), skin, -0.16, 0.22, 0.04));
  g.add(mesh(new BoxGeometry(0.12, 0.28, 0.12), skin, 0.16, 0.22, 0.04));
  g.add(mesh(new BoxGeometry(0.08, 0.08, 0.55), wood, 0.38, 0.72, 0.18));
  g.add(mesh(new SphereGeometry(0.1, 6, 5), wood, 0.38, 0.72, 0.48));
  const shadow = createShadow();
  shadow.scale.setScalar(1.05);
  g.add(shadow);
  g.userData.bob = 0.62;
  return g;
}

export function createTroop(type: TroopType): Group {
  if (type === "imp") return createImp();
  if (type === "wolf") return createWolf();
  return createOgre();
}

export function createFireball(enemy: boolean): Mesh {
  const color = enemy ? "#ff6a3a" : "#ffe08a";
  const m = new Mesh(
    new SphereGeometry(0.1, 8, 6),
    new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.4, roughness: 0.2 }),
  );
  m.castShadow = false;
  return m;
}
