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
  scene.fog = new FogExp2(enemy ? "#c5dcc8" : "#c8e6f4", 0.0065);
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
      roughness: 0.96,
      color: enemy ? "#d8e8a8" : "#ffffff",
    }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  g.add(grass);

  const earth = new Mesh(
    new BoxGeometry(field + 0.15, 1.35, field + 0.15),
    new MeshStandardMaterial({ map: kit.dirt, roughness: 0.96 }),
  );
  earth.position.y = -0.7;
  earth.receiveShadow = true;
  earth.castShadow = true;
  g.add(earth);

  const rim = new Mesh(
    new BoxGeometry(field + 0.22, 0.14, field + 0.22),
    new MeshStandardMaterial({ map: kit.dirt, color: "#b88858", roughness: 0.95 }),
  );
  rim.position.y = -0.02;
  g.add(rim);

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

function createWalls(kit: ArtKit, enemy: boolean): Group {
  const g = new Group();
  const stone = new MeshStandardMaterial({
    map: enemy ? kit.enemyStone : kit.mossStone,
    roughness: 0.86,
  });
  const wood = new MeshStandardMaterial({ map: kit.wood, roughness: 0.88 });
  const roof = new MeshStandardMaterial({ map: enemy ? kit.darkRoof : kit.roof, roughness: 0.7 });
  const half = wallHalf();
  const gateW = 2.55;
  const seg = 1.12;
  const h = 0.92;

  const addSegment = (x: number, z: number, rot: number): void => {
    const post = new Mesh(new BoxGeometry(0.34, h, 0.34), stone);
    post.position.set(x, h / 2, z);
    post.rotation.y = rot;
    post.castShadow = true;
    post.receiveShadow = true;
    g.add(post);
    const panel = new Mesh(new BoxGeometry(seg * 0.92, h * 0.72, 0.2), stone);
    panel.position.set(x, h * 0.42, z);
    panel.rotation.y = rot;
    panel.castShadow = true;
    panel.receiveShadow = true;
    g.add(panel);
    const cap = new Mesh(new BoxGeometry(seg * 0.98, 0.1, 0.28), wood);
    cap.position.set(x, h * 0.82, z);
    cap.rotation.y = rot;
    g.add(cap);
    const merlon = new Mesh(new BoxGeometry(0.28, 0.2, 0.22), stone);
    merlon.position.set(x, h + 0.08, z);
    merlon.rotation.y = rot;
    merlon.castShadow = true;
    g.add(merlon);
  };

  const sides: { axis: "x" | "z"; sign: number }[] = [
    { axis: "z", sign: -1 },
    { axis: "z", sign: 1 },
    { axis: "x", sign: -1 },
    { axis: "x", sign: 1 },
  ];
  for (const side of sides) {
    const span = half * 2;
    const count = Math.floor(span / seg);
    for (let i = 0; i <= count; i++) {
      const t = -half + (i / count) * span;
      let x = 0;
      let z = 0;
      let rot = 0;
      if (side.axis === "z") {
        x = t;
        z = side.sign * half;
        rot = 0;
        if (side.sign === 1 && Math.abs(x) < gateW / 2) continue;
      } else {
        x = side.sign * half;
        z = t;
        rot = Math.PI / 2;
      }
      if (Math.abs(Math.abs(x) - half) < 0.35 && Math.abs(Math.abs(z) - half) < 0.35) continue;
      addSegment(x, z, rot);
    }
  }

  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ];
  for (const [x, z] of corners) {
    const tower = new Mesh(new CylinderGeometry(0.48, 0.54, 1.35, 10), stone);
    tower.position.set(x, 0.68, z);
    tower.castShadow = true;
    tower.receiveShadow = true;
    g.add(tower);
    const cap = new Mesh(new ConeGeometry(0.58, 0.48, 8), roof);
    cap.position.set(x, 1.58, z);
    cap.castShadow = true;
    g.add(cap);
  }

  const postL = new Mesh(new BoxGeometry(0.42, 1.35, 0.42), stone);
  postL.position.set(-gateW / 2, 0.68, half);
  const postR = new Mesh(new BoxGeometry(0.42, 1.35, 0.42), stone);
  postR.position.set(gateW / 2, 0.68, half);
  postL.castShadow = true;
  postR.castShadow = true;
  g.add(postL, postR);
  const lintel = new Mesh(new BoxGeometry(gateW + 0.2, 0.22, 0.38), wood);
  lintel.position.set(0, 1.28, half);
  g.add(lintel);
  const doorL = new Mesh(new BoxGeometry(0.95, 1.05, 0.08), wood);
  doorL.position.set(-0.62, 0.55, half + 0.12);
  doorL.rotation.y = 0.35;
  const doorR = new Mesh(new BoxGeometry(0.95, 1.05, 0.08), wood);
  doorR.position.set(0.62, 0.55, half + 0.12);
  doorR.rotation.y = -0.35;
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

  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2 + rng(i) * 0.35;
    const r = half + 1.15 + rng(i + 3) * (meadow - half - 1.6);
    const usePine = rng(i + 8) > 0.62;
    const tree = usePine ? createPine(kit, rng(i + 9)) : createTree(kit, rng(i + 8));
    tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    tree.rotation.y = rng(i + 2) * Math.PI;
    g.add(tree);
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

  for (let i = 0; i < 6; i++) {
    const cloud = new Mesh(
      new SphereGeometry(1.6 + rng(i + 200) * 0.8, 10, 8),
      new MeshStandardMaterial({
        color: "#ffffff",
        roughness: 1,
        transparent: true,
        opacity: 0.82,
        emissive: "#ffffff",
        emissiveIntensity: 0.12,
      }),
    );
    cloud.scale.set(1.6, 0.42, 1);
    cloud.position.set((rng(i) - 0.5) * 28, 11 + rng(i + 1) * 3, (rng(i + 2) - 0.5) * 22);
    cloud.castShadow = false;
    cloud.receiveShadow = false;
    g.add(cloud);
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
      opacity: 0.28,
      roughness: 1,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, 0.035, (zone.zMin + zone.zMax) / 2);
  return m;
}
