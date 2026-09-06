import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";

function canvasTex(
  size: number,
  paint: (ctx: CanvasRenderingContext2D, size: number) => void,
  repeat = 1,
): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  paint(ctx, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  return tex;
}

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export interface ArtKit {
  grass: Texture;
  enemyGrass: Texture;
  dirt: Texture;
  path: Texture;
  stone: Texture;
  mossStone: Texture;
  enemyStone: Texture;
  plaster: Texture;
  wood: Texture;
  roof: Texture;
  darkRoof: Texture;
  leaf: Texture;
  banner: Texture;
  enemyBanner: Texture;
  iron: Texture;
  rune: Texture;
}

export function createArtKit(): ArtKit {
  const grassPaint =
    (base: [number, number, number], flowerChance: number) =>
    (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 2200; i++) {
        const x = Math.random() * s;
        const y = Math.random() * s;
        const n = hash(x * 0.2, y * 0.2);
        const r = Math.round(base[0] * 0.55 + n * 50);
        const g = Math.round(base[1] * 0.7 + n * 70);
        const b = Math.round(base[2] * 0.55 + n * 28);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.28 + Math.random() * 0.45})`;
        ctx.fillRect(x, y, 1 + Math.random() * 3, 2 + Math.random() * 6);
      }
      for (let i = 0; i < 90; i++) {
        const n = hash(i, 9);
        ctx.fillStyle = `rgba(${40 + n * 30 | 0},${110 + n * 50 | 0},${30 + n * 20 | 0},0.22)`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * s, Math.random() * s, 10 + n * 18, 6 + n * 10, n * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(210,230,90,${0.12 + Math.random() * 0.2})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 3, 2);
      }
      if (flowerChance > 0) {
        for (let i = 0; i < 55 * flowerChance; i++) {
          const pal = [
            "rgba(255,230,90,0.85)",
            "rgba(255,255,255,0.8)",
            "rgba(255,140,170,0.75)",
            "rgba(255,120,70,0.7)",
          ];
          ctx.fillStyle = pal[i % pal.length]!;
          ctx.beginPath();
          ctx.arc(Math.random() * s, Math.random() * s, 0.9 + Math.random(), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

  const grass = canvasTex(256, grassPaint([78, 186, 52], 1.15), 5);
  const enemyGrass = canvasTex(256, grassPaint([108, 168, 48], 0.5), 5);

  const dirt = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#8a6238";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const shade = 90 + Math.random() * 55;
      ctx.fillStyle = `rgba(${shade},${shade * 0.7},${shade * 0.42},0.4)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 5, 1 + Math.random() * 3);
    }
  }, 2);

  const path = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#c9a36a";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 700; i++) {
      const n = Math.random();
      ctx.fillStyle = `rgba(${160 + n * 60 | 0},${120 + n * 40 | 0},${70 + n * 20 | 0},0.4)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 2 + n * 5, 1.2 + n * 3, n * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(90,70,45,${0.12 + Math.random() * 0.2})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 4, 2);
    }
  }, 2);

  const stonePaint =
    (base: [number, number, number], grout: string) =>
    (ctx: CanvasRenderingContext2D, s: number) => {
      ctx.fillStyle = grout;
      ctx.fillRect(0, 0, s, s);
      const bw = 28;
      const bh = 16;
      for (let y = 0, row = 0; y < s + bh; y += bh, row++) {
        const ox = row % 2 === 0 ? 0 : bw / 2;
        for (let x = -bw; x < s + bw; x += bw) {
          const n = hash(x + 3, y + 1);
          const r = base[0] + n * 28 - 10;
          const g = base[1] + n * 22 - 8;
          const b = base[2] + n * 18 - 6;
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
          ctx.fillRect(x + ox + 1, y + 1, bw - 2, bh - 1);
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(x + ox + 2, y + 2, bw - 6, 3);
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.fillRect(x + ox + 2, y + bh - 5, bw - 6, 3);
        }
      }
    };

  const stone = canvasTex(256, stonePaint([186, 168, 142], "#6a6154"), 2);
  const mossStone = canvasTex(256, (ctx, s) => {
    stonePaint([168, 166, 128], "#4e5844")(ctx, s);
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = `rgba(70,130,55,${0.14 + Math.random() * 0.22})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 6 + Math.random() * 10, 3 + Math.random() * 5, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }, 2);
  const enemyStone = canvasTex(256, stonePaint([142, 128, 132], "#463e42"), 2);

  const plaster = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#e8d2a4";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 600; i++) {
      const n = Math.random();
      ctx.fillStyle = `rgba(${210 + n * 30 | 0},${180 + n * 30 | 0},${130 + n * 20 | 0},0.28)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 3, 2);
    }
    ctx.strokeStyle = "rgba(140,110,70,0.12)";
    ctx.lineWidth = 2;
    for (let y = 18; y < s; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * 2);
      ctx.lineTo(s, y);
      ctx.stroke();
    }
  }, 1);

  const wood = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#7a4a26";
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 22) {
      const n = hash(x, 4);
      ctx.fillStyle = `rgb(${110 + n * 40 | 0},${64 + n * 22 | 0},${32 + n * 12 | 0})`;
      ctx.fillRect(x + 1, 0, 20, s);
      ctx.strokeStyle = "rgba(40,20,10,0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 21, 0);
      ctx.lineTo(x + 21, s);
      ctx.stroke();
      ctx.strokeStyle = "rgba(120,70,30,0.35)";
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        const y0 = Math.random() * s;
        ctx.moveTo(x + 3, y0);
        ctx.bezierCurveTo(x + 8, y0 + 20, x + 6, y0 + 40, x + 12, y0 + 70);
        ctx.stroke();
      }
    }
  }, 1);

  const roofPaint = (a: string, b: string) => (ctx: CanvasRenderingContext2D, s: number) => {
    ctx.fillStyle = a;
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 10) {
      const ox = ((y / 10) % 2) * 9;
      for (let x = -12; x < s; x += 18) {
        ctx.fillStyle = Math.random() > 0.5 ? a : b;
        ctx.beginPath();
        ctx.moveTo(x + ox, y + 10);
        ctx.lineTo(x + ox + 9, y);
        ctx.lineTo(x + ox + 18, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(40,16,12,0.28)";
        ctx.stroke();
      }
    }
  };
  const roof = canvasTex(256, roofPaint("#c44a32", "#e06240"), 2);
  const darkRoof = canvasTex(256, roofPaint("#6a3244", "#8a4058"), 2);

  const leaf = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#3d9a36";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 800; i++) {
      const n = Math.random();
      ctx.fillStyle = `rgba(${40 + n * 40 | 0},${130 + n * 70 | 0},${30 + n * 30 | 0},0.45)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 3 + n * 6, 2 + n * 3, n * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 2);

  const bannerPaint = (field: string, stripe: string) => (ctx: CanvasRenderingContext2D, s: number) => {
    ctx.fillStyle = field;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = stripe;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * 0.18);
    ctx.lineTo(s * 0.78, s * 0.55);
    ctx.lineTo(s * 0.5, s * 0.42);
    ctx.lineTo(s * 0.22, s * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,220,120,0.7)";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, s - 16, s - 16);
  };
  const banner = canvasTex(128, bannerPaint("#b02428", "#f0d060"));
  const enemyBanner = canvasTex(128, bannerPaint("#3a2458", "#e07050"));

  const iron = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#4a484c";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(${90 + Math.random() * 50},${90 + Math.random() * 40},${80},0.35)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
    ctx.strokeStyle = "rgba(20,18,16,0.5)";
    ctx.strokeRect(4, 4, s - 8, s - 8);
  });

  const rune = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#2e3a48";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "#5ee6ff";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#5ee6ff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.75);
    ctx.lineTo(s * 0.5, s * 0.2);
    ctx.lineTo(s * 0.8, s * 0.75);
    ctx.lineTo(s * 0.2, s * 0.75);
    ctx.moveTo(s * 0.5, s * 0.2);
    ctx.lineTo(s * 0.5, s * 0.75);
    ctx.stroke();
  });

  return {
    grass,
    enemyGrass,
    dirt,
    path,
    stone,
    mossStone,
    enemyStone,
    plaster,
    wood,
    roof,
    darkRoof,
    leaf,
    banner,
    enemyBanner,
    iron,
    rune,
  };
}
