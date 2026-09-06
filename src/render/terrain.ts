import {
  AmbientLight,
  BackSide,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  FogExp2,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { CELL, GRID, deployBounds, gridHalf, meadowHalf, wallHalf } from "../game/catalog";
import { createBush, createFlower, createPathStone, createPine, createRock, createTree } from "./meshes";
import type { ArtKit } from "./textures";

export function createSky(): Mesh {
  const mat = new ShaderMaterial({
    uniforms: {
      top: { value: new Color("#4aa4e0") },
      mid: { value: new Color("#9ad4f2") },
      bot: { value: new Color("#f3e6b8") },
      sunDir: { value: new Vector3(0.42, 0.82, 0.38).normalize() },
    },
    vertexShader: `
      varying vec3 vP;
      void main() {
        vP = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vP;
      uniform vec3 top;
      uniform vec3 mid;
      uniform vec3 bot;
      uniform vec3 sunDir;
      void main() {
        float h = vP.y;
        vec3 c = mix(bot, mid, smoothstep(-0.08, 0.18, h));
        c = mix(c, top, smoothstep(0.12, 0.72, h));
        float sun = pow(max(0.0, dot(normalize(vP), sunDir)), 48.0);
        c += vec3(1.0, 0.92, 0.7) * sun * 0.85;
        float haze = pow(1.0 - abs(h), 3.0) * 0.08;
        c += vec3(1.0, 0.95, 0.8) * haze;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new Mesh(new SphereGeometry(90, 32, 20), mat);
  sky.frustumCulled = false;
  return sky;
}

export function addDaylight(scene: Scene, enemy: boolean): void {
  scene.background = new Color(enemy ? "#8ec8e4" : "#7ec8ee");
  scene.fog = new FogExp2(enemy ? "#d0e8cc" : "#d4eef8", 0.0045);
  const hemi = new HemisphereLight(enemy ? "#ffe8c4" : "#fff6dc", enemy ? "#7a8c48" : "#5aa040", 1.15);
  const sun = new DirectionalLight("#fff3d0", 2.05);
  sun.position.set(16, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 70;
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.bias = -0.0008;
  scene.add(hemi, sun, new AmbientLight(enemy ? "#c8d4a8" : "#d0e8c4", 0.48));
}

function heightNoise(x: number, z: number, enemy: boolean): number {
  const n =
    Math.sin(x * 0.55 + (enemy ? 1.3 : 0.2)) * Math.cos(z * 0.48) * 0.5 +
    Math.sin(x * 1.1 + z * 0.7) * 0.28 +
    Math.sin(x * 2.3 - z * 1.6) * 0.12;
  return n;
}

export function createPlateau(kit: ArtKit, enemy: boolean): Group {
  const g = new Group();
  const field = meadowHalf() * 2 + 1.2;
  const inner = wallHalf() * 2 + 0.4;

  const grassGeo = new PlaneGeometry(field, field, 40, 40);
  const pos = grassGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const d = Math.max(Math.abs(x), Math.abs(y));
    const innerFlat = d < wallHalf() - 0.4 ? 0.018 : 0.09;
    pos.setZ(i, heightNoise(x, y, enemy) * innerFlat);
  }
  grassGeo.computeVertexNormals();
  const grass = new Mesh(
    grassGeo,
    new MeshStandardMaterial({
      map: enemy ? kit.enemyGrass : kit.grass,
      roughness: 0.94,
      color: enemy ? "#e8f0a0" : "#c8f070",
    }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  g.add(grass);

  const earth = new Mesh(
    new BoxGeometry(field + 0.15, 1.35, field + 0.15),
    new MeshStandardMaterial({ map: kit.dirt, roughness: 0.96 }),
  );
  earth.position.y = -0.92;
  earth.receiveShadow = true;
  earth.castShadow = true;
  g.add(earth);

  const lip = new MeshStandardMaterial({ map: kit.dirt, color: "#c49860", roughness: 0.95 });
  const lipW = field + 0.35;
  const edge = 0.42;
  for (const [w, d, x, z] of [
    [lipW, edge, 0, field / 2 + 0.05],
    [lipW, edge, 0, -field / 2 - 0.05],
    [edge, field, field / 2 + 0.05, 0],
    [edge, field, -field / 2 - 0.05, 0],
  ] as const) {
    const plank = new Mesh(new BoxGeometry(w, 0.16, d), lip);
    plank.position.set(x, -0.06, z);
    plank.receiveShadow = true;
    g.add(plank);
  }

  const pathMat = new MeshStandardMaterial({ map: kit.path, roughness: 0.98, color: "#e8c890" });
  const main = new Mesh(new PlaneGeometry(1.55, inner * 0.62), pathMat);
  main.rotation.x = -Math.PI / 2;
  main.position.set(0, 0.02, wallHalf() * 0.28);
  main.receiveShadow = true;
  g.add(main);

  const cross = new Mesh(new PlaneGeometry(inner * 0.42, 1.15), pathMat);
  cross.rotation.x = -Math.PI / 2;
  cross.position.set(0, 0.021, 0.15);
  cross.receiveShadow = true;
  g.add(cross);

  g.add(createWalls(kit, enemy));
  return g;
}

function wallRun(
  parent: Group,
  stone: MeshStandardMaterial,
  wood: MeshStandardMaterial,
  x: number,
  z: number,
  length: number,
  alongX: boolean,
): void {
  const h = 0.98;
  const thick = 0.36;
  const wall = new Mesh(new BoxGeometry(alongX ? length : thick, h, alongX ? thick : length), stone);
  wall.position.set(x, h / 2, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  parent.add(wall);
  const cap = new Mesh(new BoxGeometry(alongX ? length + 0.06 : 0.44, 0.1, alongX ? 0.44 : length + 0.06), wood);
  cap.position.set(x, h + 0.02, z);
  parent.add(cap);
  const count = Math.max(2, Math.floor(length / 1.05));
  for (let i = 0; i < count; i++) {
    if (i % 2 === 1) continue;
    const t = -length / 2 + (i + 0.5) * (length / count);
    const merlon = new Mesh(new BoxGeometry(alongX ? 0.32 : 0.22, 0.22, alongX ? 0.22 : 0.32), stone);
    merlon.position.set(alongX ? x + t : x, h + 0.16, alongX ? z : z + t);
    merlon.castShadow = true;
    parent.add(merlon);
  }
}

function createWalls(kit: ArtKit, enemy: boolean): Group {
  const g = new Group();
  const stone = new MeshStandardMaterial({
    map: enemy ? kit.enemyStone : kit.mossStone,
    roughness: 0.86,
  });
  const wood = new MeshStandardMaterial({ map: kit.wood, roughness: 0.88 });
  const roof = new MeshStandardMaterial({ map: enemy ? kit.darkRoof : kit.roof, roughness: 0.7 });
  const half = wallHalf();
  const gateW = 2.6;
  const inset = 0.55;
  const run = half * 2 - inset * 2;

  wallRun(g, stone, wood, 0, -half, run, true);
  wallRun(g, stone, wood, -half, 0, run, false);
  wallRun(g, stone, wood, half, 0, run, false);

  const southLen = (run - gateW) / 2;
  const southOff = gateW / 2 + southLen / 2;
  wallRun(g, stone, wood, -southOff, half, southLen, true);
  wallRun(g, stone, wood, southOff, half, southLen, true);

  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ];
  for (const [x, z] of corners) {
    const tower = new Mesh(new CylinderGeometry(0.5, 0.56, 1.38, 10), stone);
    tower.position.set(x, 0.7, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    g.add(tower);
    const cap = new Mesh(new ConeGeometry(0.6, 0.5, 8), roof);
    cap.position.set(x, 1.62, z);
    cap.castShadow = true;
    g.add(cap);
  }

  const postL = new Mesh(new BoxGeometry(0.44, 1.38, 0.44), stone);
  postL.position.set(-gateW / 2, 0.7, half);
  const postR = new Mesh(new BoxGeometry(0.44, 1.38, 0.44), stone);
  postR.position.set(gateW / 2, 0.7, half);
  postL.castShadow = true;
  postR.castShadow = true;
  g.add(postL, postR);
  const lintel = new Mesh(new BoxGeometry(gateW + 0.25, 0.22, 0.4), wood);
  lintel.position.set(0, 1.32, half);
  g.add(lintel);
  const doorL = new Mesh(new BoxGeometry(0.98, 1.08, 0.08), wood);
  doorL.position.set(-0.64, 0.56, half + 0.14);
  doorL.rotation.y = 0.38;
  const doorR = new Mesh(new BoxGeometry(0.98, 1.08, 0.08), wood);
  doorR.position.set(0.64, 0.56, half + 0.14);
  doorR.rotation.y = -0.38;
  doorL.castShadow = true;
  doorR.castShadow = true;
  g.add(doorL, doorR);

  return g;
}

export function createProps(kit: ArtKit, enemy: boolean): Group {
  const g = new Group();
  const half = wallHalf();
  const meadow = meadowHalf();
  const inner = gridHalf();
  const rng = (i: number) => {
    const n = Math.sin(i * 91.13 + (enemy ? 4.2 : 1.7)) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2 + rng(i) * 0.28;
    const r = half + 1.15 + rng(i + 3) * (meadow - half - 1.6);
    const usePine = rng(i + 8) > 0.62;
    const tree = usePine ? createPine(kit, rng(i + 9)) : createTree(kit, rng(i + 8));
    tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    tree.rotation.y = rng(i + 2) * Math.PI;
    g.add(tree);
  }

  const innerCorners: [number, number][] = [
    [-(half - 0.85), -(half - 0.85)],
    [half - 0.85, -(half - 0.85)],
    [-(half - 0.85), half - 0.85],
    [half - 0.85, half - 0.85],
  ];
  for (let i = 0; i < innerCorners.length; i++) {
    const [x, z] = innerCorners[i]!;
    const bush = createBush(kit, rng(i + 140));
    bush.position.set(x, 0, z);
    g.add(bush);
    const fl = createFlower(kit, rng(i + 141));
    fl.position.set(x + 0.35, 0, z - 0.2);
    g.add(fl);
  }

  for (let i = 0; i < 10; i++) {
    const a = rng(i + 90) * Math.PI * 2;
    const r = inner + 0.35 + rng(i + 91) * (half - inner - 0.7);
    if (a > 0.3 && a < Math.PI - 0.3 && Math.sin(a) > 0.75) continue;
    const bush = createBush(kit, rng(i + 92));
    bush.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.add(bush);
  }

  for (let i = 0; i < 18; i++) {
    const a = rng(i + 20) * Math.PI * 2;
    const r = half + 0.8 + rng(i + 21) * 3.2;
    const rock = createRock(kit, rng(i + 30));
    rock.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
    g.add(rock);
  }

  for (let i = 0; i < 46; i++) {
    const a = rng(i + 50) * Math.PI * 2;
    const r = half + 0.4 + rng(i + 51) * (meadow - half - 0.8);
    const fl = createFlower(kit, rng(i + 52));
    fl.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.add(fl);
  }

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = half - 0.55;
    if (Math.abs(((a + Math.PI / 2) % (Math.PI * 2)) - 0) < 0.45 || Math.abs(a - Math.PI / 2) < 0.35) continue;
    const fl = createFlower(kit, rng(i + 70));
    fl.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    g.add(fl);
  }

  for (let i = 0; i < 14; i++) {
    const stone = createPathStone(kit);
    stone.position.set((rng(i + 110) - 0.5) * 0.7, 0.028, 1.1 + i * 0.55);
    stone.rotation.y = rng(i + 111) * 0.8;
    g.add(stone);
  }

  return g;
}

export function createGridOverlay(): Group {
  const g = new Group();
  g.visible = false;
  const origin = -((GRID * CELL) / 2);
  const line = new MeshStandardMaterial({
    color: "#fff4b0",
    transparent: true,
    opacity: 0.28,
    roughness: 1,
    metalness: 0,
  });
  for (let i = 0; i <= GRID; i++) {
    const h = new Mesh(new BoxGeometry(GRID * CELL, 0.015, 0.03), line);
    h.position.set(0, 0.04, origin + i * CELL);
    const v = new Mesh(new BoxGeometry(0.03, 0.015, GRID * CELL), line);
    v.position.set(origin + i * CELL, 0.04, 0);
    g.add(h, v);
  }
  return g;
}

export function createGhostTile(size: number): Mesh {
  const m = new Mesh(
    new BoxGeometry(size * CELL * 0.96, 0.05, size * CELL * 0.96),
    new MeshStandardMaterial({
      color: "#7dff9a",
      transparent: true,
      opacity: 0.38,
      roughness: 0.5,
    }),
  );
  m.position.y = 0.04;
  m.visible = false;
  return m;
}

export function createDeployField(): Mesh {
  const zone = deployBounds();
  const depth = zone.zMax - zone.zMin;
  const m = new Mesh(
    new PlaneGeometry(zone.xHalf * 2, depth),
    new MeshStandardMaterial({
      color: "#f0c85a",
      transparent: true,
      opacity: 0.18,
      roughness: 1,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, 0.035, (zone.zMin + zone.zMax) / 2);
  return m;
}
