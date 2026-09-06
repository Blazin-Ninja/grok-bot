import {
  BackSide,
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { CELL, GRID } from "../game/catalog";
import { plateauHalf } from "../game/state";
import { createRock, createTree } from "./meshes";
import type { ArtKit } from "./textures";

export function createSky(): Mesh {
  const mat = new ShaderMaterial({
    uniforms: {
      top: { value: new Color("#1c1248") },
      mid: { value: new Color("#e07a4a") },
      bot: { value: new Color("#f6c98a") },
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
      void main() {
        float h = vP.y;
        vec3 c = mix(bot, mid, smoothstep(-0.05, 0.16, h));
        c = mix(c, top, smoothstep(0.14, 0.78, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
    side: BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new Mesh(new SphereGeometry(70, 32, 20), mat);
  sky.frustumCulled = false;
  return sky;
}

export function createPlateau(kit: ArtKit, enemy: boolean): Group {
  const g = new Group();
  const half = plateauHalf();
  const top = new Mesh(
    new CircleGeometry(half + 0.6, 48),
    new MeshStandardMaterial({
      map: kit.grass,
      roughness: 0.95,
      color: enemy ? "#7a8a52" : "#ffffff",
    }),
  );
  top.rotation.x = -Math.PI / 2;
  top.receiveShadow = true;
  g.add(top);

  const cliff = new Mesh(
    new CylinderGeometry(half + 0.55, half + 1.4, 1.8, 48),
    new MeshStandardMaterial({ map: kit.dirt, roughness: 0.96 }),
  );
  cliff.position.y = -0.9;
  cliff.receiveShadow = true;
  cliff.castShadow = true;
  g.add(cliff);

  const rim = new Mesh(
    new CylinderGeometry(half + 0.62, half + 0.62, 0.16, 48, 1, true),
    new MeshStandardMaterial({ map: kit.dirt, roughness: 0.95 }),
  );
  rim.position.y = 0.02;
  g.add(rim);

  const path = new Mesh(
    new PlaneGeometry(1.35, half * 1.15),
    new MeshStandardMaterial({ map: kit.dirt, roughness: 0.98, color: "#c4a078" }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.012, half * 0.22);
  path.receiveShadow = true;
  g.add(path);

  return g;
}

export function createProps(kit: ArtKit, enemy: boolean): Group {
  const g = new Group();
  const half = plateauHalf();
  const rng = (i: number) => {
    const n = Math.sin(i * 91.13 + (enemy ? 4.2 : 1.7)) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + rng(i) * 0.2;
    const r = half - 0.55 - rng(i + 3) * 0.7;
    const tree = createTree(kit, rng(i + 8));
    tree.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    tree.rotation.y = rng(i + 2) * Math.PI;
    g.add(tree);
  }

  for (let i = 0; i < 14; i++) {
    const a = rng(i + 20) * Math.PI * 2;
    const r = half * (0.72 + rng(i + 21) * 0.22);
    const rock = createRock(kit, rng(i + 30));
    rock.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r);
    g.add(rock);
  }

  const stone = new MeshStandardMaterial({
    map: enemy ? kit.enemyStone : kit.mossStone,
    roughness: 0.88,
  });
  const wallR = half - 0.15;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    // Gate opening toward +Z (camera-facing path).
    const deg = ((a + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (deg < 0.42 || deg > Math.PI * 2 - 0.42) continue;
    const post = new Mesh(new BoxGeometry(0.2, 0.82, 0.2), stone);
    post.position.set(Math.cos(a) * wallR, 0.41, Math.sin(a) * wallR);
    post.lookAt(new Vector3(0, 0.41, 0));
    post.castShadow = true;
    post.receiveShadow = true;
    g.add(post);
    const spike = new Mesh(new ConeGeometry(0.12, 0.22, 5), stone);
    spike.position.set(Math.cos(a) * wallR, 0.92, Math.sin(a) * wallR);
    spike.castShadow = true;
    g.add(spike);
    const panel = new Mesh(new BoxGeometry(0.12, 0.48, 1.05), stone);
    const a2 = a + Math.PI / 28;
    panel.position.set(Math.cos(a2) * wallR, 0.28, Math.sin(a2) * wallR);
    panel.lookAt(new Vector3(0, 0.28, 0));
    panel.castShadow = true;
    g.add(panel);
  }

  return g;
}

export function createGridOverlay(): Group {
  const g = new Group();
  g.visible = false;
  const origin = -((GRID * CELL) / 2);
  const line = new MeshStandardMaterial({
    color: "#e8d48a",
    transparent: true,
    opacity: 0.22,
    roughness: 1,
    metalness: 0,
  });
  for (let i = 0; i <= GRID; i++) {
    const h = new Mesh(new BoxGeometry(GRID * CELL, 0.015, 0.03), line);
    h.position.set(0, 0.03, origin + i * CELL);
    const v = new Mesh(new BoxGeometry(0.03, 0.015, GRID * CELL), line);
    v.position.set(origin + i * CELL, 0.03, 0);
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
  const m = new Mesh(
    new PlaneGeometry(CELL * GRID * 0.92, 3.2),
    new MeshStandardMaterial({
      color: "#e8c36a",
      transparent: true,
      opacity: 0.22,
      roughness: 1,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(0, 0.03, plateauHalf() * 0.55);
  return m;
}
