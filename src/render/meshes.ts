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
  geo:
    | BoxGeometry
    | CylinderGeometry
    | ConeGeometry
    | SphereGeometry
    | PlaneGeometry
    | OctahedronGeometry
    | IcosahedronGeometry
    | CircleGeometry,
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

function glowWin(color: string, intensity = 1.15): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.28,
    metalness: 0.05,
  });
}

function windowPane(
  parent: Group,
  kit: ArtKit,
  x: number,
  y: number,
  z: number,
  glow: string,
  facingZ = true,
): void {
  const wood = mat(kit, "wood", { roughness: 0.9 });
  if (facingZ) {
    parent.add(mesh(new BoxGeometry(0.28, 0.34, 0.05), wood, x, y, z));
    parent.add(mesh(new BoxGeometry(0.2, 0.24, 0.04), glowWin(glow), x, y, z + 0.02));
  } else {
    parent.add(mesh(new BoxGeometry(0.05, 0.34, 0.28), wood, x, y, z));
    parent.add(mesh(new BoxGeometry(0.04, 0.24, 0.2), glowWin(glow), x + 0.02, y, z));
  }
}

function crenelRow(parent: Group, material: Material, width: number, y: number, z: number, alongX: boolean): void {
  const count = 5;
  const step = width / count;
  for (let i = 0; i < count; i++) {
    if (i % 2 === 1) continue;
    const c = mesh(new BoxGeometry(alongX ? step * 0.72 : 0.16, 0.2, alongX ? 0.16 : step * 0.72), material);
    if (alongX) c.position.set(-width / 2 + step * (i + 0.5), y, z);
    else c.position.set(z, y, -width / 2 + step * (i + 0.5));
    parent.add(c);
  }
}

function banner(kit: ArtKit, palette: Palette, height: number): Group {
  const g = new Group();
  g.userData.kind = "banner";
  const pole = mesh(new CylinderGeometry(0.035, 0.04, height, 8), mat(kit, "wood", { roughness: 0.9 }));
  pole.position.y = height / 2;
  g.add(pole);
  const cloth = mesh(
    new PlaneGeometry(0.46, 0.58),
    mat(kit, palette === "village" ? "banner" : "enemyBanner", { side: DoubleSide, roughness: 0.62 }),
    0.24,
    height - 0.4,
    0,
  );
  cloth.receiveShadow = false;
  g.add(cloth);
  return g;
}

export function createKeep(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const village = palette === "village";
  const stone = mat(kit, village ? "mossStone" : "enemyStone", { roughness: 0.84 });
  const wood = mat(kit, "wood");
  const roof = mat(kit, village ? "roof" : "darkRoof", { roughness: 0.68 });
  const iron = mat(kit, "iron", { metalness: 0.55, roughness: 0.45 });
  const plaster = mat(kit, village ? "plaster" : "enemyStone", { roughness: 0.82 });
  const glow = village ? "#ffc878" : "#ff7a62";

  g.add(mesh(new BoxGeometry(3.55, 0.22, 3.55), stone, 0, 0.11, 0));
  g.add(mesh(new BoxGeometry(3.15, 0.16, 3.15), stone, 0, 0.28, 0));
  g.add(mesh(new BoxGeometry(2.62, 1.55, 2.62), plaster, 0, 1.12, 0));
  g.add(mesh(new BoxGeometry(2.72, 0.16, 2.72), wood, 0, 1.92, 0));
  g.add(mesh(new BoxGeometry(2.12, 0.95, 2.12), stone, 0, 2.48, 0));

  const hip = mesh(new ConeGeometry(1.78, 0.92, 4), roof, 0, 3.22, 0);
  hip.rotation.y = Math.PI / 4;
  g.add(hip);
  g.add(mesh(new BoxGeometry(0.22, 0.18, 1.7), roof, 0, 3.58, 0));

  const corners: [number, number][] = [
    [-1.18, -1.18],
    [1.18, -1.18],
    [-1.18, 1.18],
    [1.18, 1.18],
  ];
  for (const [x, z] of corners) {
    g.add(mesh(new CylinderGeometry(0.4, 0.44, 2.42, 10), stone, x, 1.28, z));
    g.add(mesh(new CylinderGeometry(0.46, 0.46, 0.1, 10), wood, x, 2.5, z));
    const cap = mesh(new ConeGeometry(0.54, 0.52, 8), roof, x, 2.82, z);
    g.add(cap);
  }

  crenelRow(g, stone, 2.12, 3.02, -1.06, true);
  crenelRow(g, stone, 2.12, 3.02, 1.06, true);

  g.add(mesh(new BoxGeometry(0.72, 1.02, 0.1), wood, 0, 0.72, 1.34));
  g.add(mesh(new BoxGeometry(0.78, 0.12, 0.12), iron, 0, 1.22, 1.36));
  g.add(mesh(new BoxGeometry(0.1, 0.7, 0.12), iron, 0, 0.7, 1.36));
  g.add(mesh(new BoxGeometry(1.05, 0.16, 0.72), stone, 0, 0.2, 1.62));
  g.add(mesh(new BoxGeometry(0.78, 0.1, 0.55), stone, 0, 0.1, 1.95));

  windowPane(g, kit, -0.72, 1.42, 1.32, glow);
  windowPane(g, kit, 0.72, 1.42, 1.32, glow);
  windowPane(g, kit, 0, 2.38, 1.07, glow);
  windowPane(g, kit, -1.32, 1.42, 0.35, glow, false);
  windowPane(g, kit, 1.32, 1.42, 0.35, glow, false);

  const left = banner(kit, palette, 1.65);
  left.position.set(-1.62, 1.85, 0.15);
  const right = banner(kit, palette, 1.65);
  right.position.set(1.62, 1.85, 0.15);
  g.add(left, right);

  g.add(mesh(new CylinderGeometry(0.14, 0.16, 0.55, 8), stone, 0.55, 3.55, -0.15));
  g.add(mesh(new BoxGeometry(0.08, 0.22, 0.08), stone, 0.55, 3.9, -0.15));

  g.userData.kind = "keep";
  return g;
}

export function createCrystal(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const village = palette === "village";
  const stone = mat(kit, village ? "stone" : "enemyStone");
  const wood = mat(kit, "wood");
  g.add(mesh(new CylinderGeometry(0.95, 1.05, 0.22, 8), stone, 0, 0.11, 0));
  g.add(mesh(new CylinderGeometry(0.82, 0.88, 0.18, 8), stone, 0, 0.28, 0));
  g.add(mesh(new CylinderGeometry(0.7, 0.7, 0.1, 8), mat(kit, "rune", { emissive: "#3ad8ff", emissiveIntensity: 0.55 }), 0, 0.4, 0));
  g.add(mesh(new BoxGeometry(0.12, 0.42, 0.12), wood, -0.72, 0.38, -0.55));
  g.add(mesh(new BoxGeometry(0.12, 0.42, 0.12), wood, 0.72, 0.38, -0.55));

  const gem = new MeshStandardMaterial({
    color: village ? "#7cf6ff" : "#d27cff",
    emissive: village ? "#2ad8ff" : "#b14cff",
    emissiveIntensity: 1.15,
    roughness: 0.12,
    metalness: 0.28,
    transparent: true,
    opacity: 0.92,
  });
  const core = mesh(new OctahedronGeometry(0.64, 0), gem, 0, 1.22, 0);
  core.scale.set(0.78, 1.28, 0.78);
  core.userData.sx = 0.78;
  core.userData.sy = 1.28;
  core.userData.sz = 0.78;
  g.add(core);
  const s1 = mesh(new OctahedronGeometry(0.28, 0), gem, 0.5, 0.78, 0.18);
  s1.rotation.z = 0.4;
  s1.userData.sx = 1;
  s1.userData.sy = 1;
  s1.userData.sz = 1;
  const s2 = mesh(new OctahedronGeometry(0.22, 0), gem, -0.44, 0.68, -0.22);
  s2.rotation.z = -0.5;
  s2.userData.sx = 1;
  s2.userData.sy = 1;
  s2.userData.sz = 1;
  g.add(s1, s2);
  g.userData.kind = "crystal";
  g.userData.pulse = [core, s1, s2];
  return g;
}

export function createVault(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const village = palette === "village";
  const stone = mat(kit, village ? "stone" : "enemyStone");
  const wood = mat(kit, "wood");
  const roof = mat(kit, village ? "roof" : "darkRoof");
  const iron = mat(kit, "iron", { metalness: 0.6, roughness: 0.4 });
  const plaster = mat(kit, village ? "plaster" : "enemyStone");
  const gold = new MeshStandardMaterial({
    color: "#f0d050",
    emissive: "#b88620",
    emissiveIntensity: 0.28,
    metalness: 0.72,
    roughness: 0.26,
  });

  g.add(mesh(new BoxGeometry(2.28, 0.18, 2.02), stone, 0, 0.09, 0));
  g.add(mesh(new BoxGeometry(2.02, 1.22, 1.72), plaster, 0, 0.78, 0));
  g.add(mesh(new BoxGeometry(2.12, 0.12, 1.82), wood, 0, 1.4, 0));
  const lid = mesh(new BoxGeometry(2.18, 0.16, 1.86), roof, 0, 1.54, 0);
  g.add(lid);
  g.add(mesh(new BoxGeometry(2.22, 0.18, 0.24), roof, 0, 1.72, 0));
  g.add(mesh(new BoxGeometry(0.12, 1.1, 1.72), wood, -1.02, 0.78, 0));
  g.add(mesh(new BoxGeometry(0.12, 1.1, 1.72), wood, 1.02, 0.78, 0));

  g.add(mesh(new BoxGeometry(0.58, 0.88, 0.08), wood, 0, 0.62, 0.88));
  g.add(mesh(new BoxGeometry(0.66, 0.1, 0.1), iron, 0, 0.98, 0.9));
  g.add(mesh(new BoxGeometry(0.1, 0.72, 0.1), iron, 0, 0.6, 0.9));

  const pile = mesh(new IcosahedronGeometry(0.3, 0), gold, 0.78, 0.36, 0.74);
  pile.scale.set(1.15, 0.72, 1);
  const pile2 = mesh(new IcosahedronGeometry(0.2, 0), gold, 0.98, 0.26, 0.52);
  const pile3 = mesh(new IcosahedronGeometry(0.14, 0), gold, 0.62, 0.22, 0.9);
  g.add(pile, pile2, pile3);
  g.add(mesh(new BoxGeometry(0.24, 0.58, 0.24), stone, -1.0, 0.52, -0.74));
  g.add(mesh(new BoxGeometry(0.24, 0.58, 0.24), stone, 1.0, 0.52, -0.74));
  windowPane(g, kit, -0.55, 0.95, 0.87, village ? "#ffe08a" : "#ff8866");
  windowPane(g, kit, 0.55, 0.95, 0.87, village ? "#ffe08a" : "#ff8866");
  g.userData.kind = "vault";
  return g;
}

export function createTower(kit: ArtKit, palette: Palette): Group {
  const g = new Group();
  const village = palette === "village";
  const stone = mat(kit, village ? "mossStone" : "enemyStone");
  const wood = mat(kit, "wood");
  const roof = mat(kit, village ? "roof" : "darkRoof");
  const glow = village ? "#7cf0ff" : "#ff7a55";

  g.add(mesh(new CylinderGeometry(0.82, 0.92, 0.2, 10), stone, 0, 0.1, 0));
  g.add(mesh(new CylinderGeometry(0.54, 0.68, 2.05, 10), stone, 0, 1.18, 0));
  g.add(mesh(new CylinderGeometry(0.78, 0.78, 0.14, 10), wood, 0, 2.18, 0));
  g.add(mesh(new CylinderGeometry(0.64, 0.64, 0.58, 10), stone, 0, 2.52, 0));

  for (let i = 0; i < 8; i++) {
    if (i % 2 === 1) continue;
    const a = (i / 8) * Math.PI * 2;
    g.add(mesh(new BoxGeometry(0.2, 0.22, 0.14), stone, Math.cos(a) * 0.6, 2.9, Math.sin(a) * 0.6));
  }
  g.add(mesh(new ConeGeometry(0.48, 0.52, 10), roof, 0, 3.12, 0));

  const orb = mesh(
    new SphereGeometry(0.17, 12, 10),
    new MeshStandardMaterial({
      color: glow,
      emissive: glow,
      emissiveIntensity: 1.7,
      roughness: 0.14,
    }),
    0,
    3.48,
    0,
  );
  orb.userData.sx = 1;
  orb.userData.sy = 1;
  orb.userData.sz = 1;
  g.add(orb);

  g.add(mesh(new BoxGeometry(0.16, 0.28, 0.06), glowWin(village ? "#ffe08a" : "#ff8866"), 0, 1.35, 0.56));
  g.add(mesh(new BoxGeometry(0.16, 0.22, 0.06), glowWin(village ? "#ffe08a" : "#ff8866"), 0, 1.85, 0.52));

  const flag = banner(kit, palette, 1.05);
  flag.position.set(0.58, 2.22, 0);
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
  const trunkH = 0.72 + seed * 0.32;
  g.add(mesh(new CylinderGeometry(0.07 + seed * 0.03, 0.12 + seed * 0.05, trunkH, 7), mat(kit, "wood", { roughness: 0.95 }), 0, trunkH / 2, 0));
  const leaf = new MeshStandardMaterial({
    map: kit.leaf,
    color: new Color().setHSL(0.28 + seed * 0.05, 0.62, 0.38 + seed * 0.1),
    roughness: 0.88,
  });
  const y0 = trunkH + 0.15;
  const r = 0.48 + seed * 0.22;
  g.add(mesh(new SphereGeometry(r, 9, 7), leaf, 0, y0, 0));
  g.add(mesh(new SphereGeometry(r * 0.72, 8, 6), leaf, 0.22, y0 + 0.22, 0.08));
  g.add(mesh(new SphereGeometry(r * 0.62, 8, 6), leaf, -0.18, y0 + 0.28, -0.1));
  if (seed > 0.45) {
    g.add(mesh(new SphereGeometry(r * 0.5, 7, 6), leaf, 0.05, y0 + 0.48, 0.04));
  }
  return g;
}

export function createPine(kit: ArtKit, seed: number): Group {
  const g = new Group();
  g.add(mesh(new CylinderGeometry(0.07, 0.11, 0.55 + seed * 0.15, 6), mat(kit, "wood"), 0, 0.32, 0));
  const leaf = new MeshStandardMaterial({
    color: new Color().setHSL(0.32 + seed * 0.04, 0.5, 0.3 + seed * 0.08),
    roughness: 0.86,
  });
  const h = 0.82 + seed * 0.28;
  g.add(mesh(new ConeGeometry(0.52 + seed * 0.12, h, 8), leaf, 0, 0.92, 0));
  g.add(mesh(new ConeGeometry(0.4, h * 0.68, 8), leaf, 0, 1.32, 0));
  g.add(mesh(new ConeGeometry(0.26, h * 0.48, 8), leaf, 0, 1.62, 0));
  return g;
}

export function createBush(kit: ArtKit, seed: number): Group {
  const g = new Group();
  const leaf = new MeshStandardMaterial({
    map: kit.leaf,
    color: new Color().setHSL(0.3 + seed * 0.06, 0.58, 0.36 + seed * 0.1),
    roughness: 0.9,
  });
  const r = 0.22 + seed * 0.12;
  g.add(mesh(new SphereGeometry(r, 8, 6), leaf, 0, r * 0.7, 0));
  g.add(mesh(new SphereGeometry(r * 0.7, 7, 6), leaf, 0.14, r * 0.55, 0.06));
  g.add(mesh(new SphereGeometry(r * 0.62, 7, 6), leaf, -0.12, r * 0.5, -0.05));
  return g;
}

export function createFlower(_kit: ArtKit, seed: number): Group {
  const g = new Group();
  const stem = new MeshStandardMaterial({ color: "#3a8a32", roughness: 0.9 });
  const petal = new MeshStandardMaterial({
    color: new Color().setHSL(seed * 0.12 + (seed > 0.55 ? 0.9 : 0.12), 0.72, 0.58),
    roughness: 0.55,
    emissive: "#221100",
    emissiveIntensity: 0.05,
  });
  g.add(mesh(new CylinderGeometry(0.012, 0.016, 0.22, 5), stem, 0, 0.11, 0));
  g.add(mesh(new SphereGeometry(0.055, 6, 5), petal, 0, 0.24, 0));
  return g;
}

export function createPathStone(kit: ArtKit): Mesh {
  const m = mesh(
    new BoxGeometry(0.28, 0.05, 0.2),
    mat(kit, "stone", { roughness: 0.95, color: "#d8c8a8" }),
  );
  m.position.y = 0.03;
  return m;
}

export function createRock(kit: ArtKit, seed: number): Mesh {
  const m = mesh(
    new IcosahedronGeometry(0.26 + seed * 0.2, 0),
    mat(kit, "stone", { flatShading: true, roughness: 0.95 }),
  );
  m.scale.set(1 + seed * 0.4, 0.52 + seed * 0.38, 0.8 + seed * 0.3);
  m.rotation.set(seed * 1.2, seed * 2.1, seed * 0.4);
  return m;
}

export function createShadow(): Mesh {
  const m = new Mesh(
    new CircleGeometry(0.42, 16),
    new MeshStandardMaterial({ color: "#000000", transparent: true, opacity: 0.22, roughness: 1 }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.018;
  m.receiveShadow = false;
  m.castShadow = false;
  return m;
}

export function createImp(): Group {
  const g = new Group();
  const skin = new MeshStandardMaterial({ color: "#e06038", roughness: 0.62 });
  const dark = new MeshStandardMaterial({ color: "#3a1810", roughness: 0.8 });
  const eye = glowWin("#ffe56a", 2.2);
  const wing = new MeshStandardMaterial({ color: "#8a2a28", roughness: 0.7, side: DoubleSide });
  g.add(mesh(new SphereGeometry(0.2, 9, 7), skin, 0, 0.42, 0.02));
  g.add(mesh(new SphereGeometry(0.155, 9, 7), skin, 0, 0.66, 0.06));
  g.add(mesh(new ConeGeometry(0.055, 0.16, 6), dark, -0.09, 0.8, 0.02));
  g.add(mesh(new ConeGeometry(0.055, 0.16, 6), dark, 0.09, 0.8, 0.02));
  g.add(mesh(new SphereGeometry(0.028, 6, 5), eye, -0.05, 0.68, 0.18));
  g.add(mesh(new SphereGeometry(0.028, 6, 5), eye, 0.05, 0.68, 0.18));
  g.add(mesh(new BoxGeometry(0.09, 0.2, 0.09), skin, -0.18, 0.38, 0.06));
  g.add(mesh(new BoxGeometry(0.09, 0.2, 0.09), skin, 0.18, 0.38, 0.06));
  g.add(mesh(new BoxGeometry(0.08, 0.16, 0.08), skin, -0.08, 0.18, 0.04));
  g.add(mesh(new BoxGeometry(0.08, 0.16, 0.08), skin, 0.08, 0.18, 0.04));
  const tail = mesh(new CylinderGeometry(0.025, 0.04, 0.28, 5), dark, 0.02, 0.32, -0.2);
  tail.rotation.x = 0.9;
  g.add(tail);
  g.add(mesh(new ConeGeometry(0.05, 0.1, 5), dark, 0.02, 0.22, -0.34));
  const wL = mesh(new PlaneGeometry(0.22, 0.16), wing, -0.2, 0.5, -0.04);
  wL.rotation.y = 0.6;
  const wR = mesh(new PlaneGeometry(0.22, 0.16), wing, 0.2, 0.5, -0.04);
  wR.rotation.y = -0.6;
  g.add(wL, wR);
  const shadow = createShadow();
  shadow.scale.setScalar(0.62);
  g.add(shadow);
  g.userData.bob = 0.42;
  return g;
}

export function createWolf(): Group {
  const g = new Group();
  const fur = new MeshStandardMaterial({ color: "#6a5a4a", roughness: 0.84 });
  const mane = new MeshStandardMaterial({ color: "#3a322c", roughness: 0.8 });
  const dark = new MeshStandardMaterial({ color: "#2a2420", roughness: 0.78 });
  const eye = glowWin("#ffcc66", 1.6);
  g.add(mesh(new BoxGeometry(0.28, 0.24, 0.62), fur, 0, 0.4, 0));
  g.add(mesh(new BoxGeometry(0.22, 0.2, 0.28), mane, 0, 0.48, 0.38));
  g.add(mesh(new BoxGeometry(0.16, 0.12, 0.2), fur, 0, 0.4, 0.58));
  const earL = mesh(new ConeGeometry(0.055, 0.12, 5), dark, -0.06, 0.64, 0.4);
  const earR = mesh(new ConeGeometry(0.055, 0.12, 5), dark, 0.06, 0.64, 0.4);
  g.add(earL, earR);
  g.add(mesh(new SphereGeometry(0.022, 6, 5), eye, -0.05, 0.46, 0.68));
  g.add(mesh(new SphereGeometry(0.022, 6, 5), eye, 0.05, 0.46, 0.68));
  const tail = mesh(new CylinderGeometry(0.03, 0.055, 0.32, 5), fur, 0, 0.46, -0.4);
  tail.rotation.x = 0.7;
  g.add(tail);
  for (const [x, z] of [
    [-0.1, 0.2],
    [0.1, 0.2],
    [-0.1, -0.18],
    [0.1, -0.18],
  ]) {
    g.add(mesh(new BoxGeometry(0.07, 0.26, 0.08), dark, x, 0.16, z));
  }
  const shadow = createShadow();
  shadow.scale.setScalar(0.85);
  g.add(shadow);
  g.userData.bob = 0.4;
  return g;
}

export function createOgre(): Group {
  const g = new Group();
  const skin = new MeshStandardMaterial({ color: "#7a9a3a", roughness: 0.72 });
  const cloth = new MeshStandardMaterial({ color: "#6a4024", roughness: 0.9 });
  const wood = new MeshStandardMaterial({ color: "#4a2e18", roughness: 0.85 });
  const tusk = new MeshStandardMaterial({ color: "#f0e0c0", roughness: 0.45 });
  g.add(mesh(new SphereGeometry(0.4, 9, 7), skin, 0, 0.72, 0.02));
  g.add(mesh(new SphereGeometry(0.24, 8, 7), skin, 0, 1.14, 0.08));
  g.add(mesh(new BoxGeometry(0.52, 0.26, 0.34), cloth, 0, 0.52, 0.02));
  g.add(mesh(new BoxGeometry(0.14, 0.34, 0.14), skin, -0.18, 0.24, 0.06));
  g.add(mesh(new BoxGeometry(0.14, 0.34, 0.14), skin, 0.18, 0.24, 0.06));
  g.add(mesh(new BoxGeometry(0.16, 0.38, 0.16), skin, -0.42, 0.78, 0.1));
  g.add(mesh(new BoxGeometry(0.16, 0.38, 0.16), skin, 0.42, 0.78, 0.1));
  g.add(mesh(new ConeGeometry(0.035, 0.1, 5), tusk, -0.07, 1.02, 0.28));
  g.add(mesh(new ConeGeometry(0.035, 0.1, 5), tusk, 0.07, 1.02, 0.28));
  g.add(mesh(new BoxGeometry(0.1, 0.1, 0.72), wood, 0.5, 0.88, 0.22));
  g.add(mesh(new SphereGeometry(0.13, 7, 6), wood, 0.5, 0.88, 0.6));
  const shadow = createShadow();
  shadow.scale.setScalar(1.2);
  g.add(shadow);
  g.userData.bob = 0.72;
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
