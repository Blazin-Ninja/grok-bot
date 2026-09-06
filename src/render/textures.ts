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
  dirt: Texture;
  stone: Texture;
  mossStone: Texture;
  enemyStone: Texture;
  wood: Texture;
  roof: Texture;
  darkRoof: Texture;
  banner: Texture;
  enemyBanner: Texture;
  iron: Texture;
  rune: Texture;
}

export function createArtKit(): ArtKit {
  const grass = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#3d7a38";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1400; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const g = 90 + Math.random() * 70;
      ctx.fillStyle = `rgba(${40 + Math.random() * 40},${g},${35 + Math.random() * 30},${0.35 + Math.random() * 0.4})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 4);
    }
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(210,190,70,${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 4);

  const dirt = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#6b4a2c";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 900; i++) {
      const shade = 70 + Math.random() * 50;
      ctx.fillStyle = `rgba(${shade},${shade * 0.65},${shade * 0.4},0.45)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 5, 1 + Math.random() * 3);
    }
  }, 2);

  const stonePaint =
    (base: [number, number, number], grout: string, mortar = 8) =>
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
          ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
          ctx.fillRect(x + ox + 1, y + 1, bw - 2, bh - mortar / 8);
          ctx.fillStyle = "rgba(255,255,255,0.07)";
          ctx.fillRect(x + ox + 2, y + 2, bw - 6, 3);
          ctx.fillStyle = "rgba(0,0,0,0.12)";
          ctx.fillRect(x + ox + 2, y + bh - 5, bw - 6, 3);
        }
      }
    };

  const stone = canvasTex(256, stonePaint([168, 150, 128], "#5c5348"), 2);
  const mossStone = canvasTex(256, (ctx, s) => {
    stonePaint([150, 148, 118], "#4a5340")(ctx, s);
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(60,110,50,${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 6 + Math.random() * 10, 3 + Math.random() * 5, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }, 2);
  const enemyStone = canvasTex(256, stonePaint([118, 108, 112], "#3a3236"), 2);

  const wood = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = "#6a3f22";
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 22) {
      const n = hash(x, 4);
      ctx.fillStyle = `rgb(${90 + n * 40 | 0},${52 + n * 20 | 0},${28 + n * 12 | 0})`;
      ctx.fillRect(x + 1, 0, 20, s);
      ctx.strokeStyle = "rgba(30,16,8,0.45)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 21, 0);
      ctx.lineTo(x + 21, s);
      ctx.stroke();
      ctx.strokeStyle = "rgba(90,50,24,0.35)";
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
        ctx.strokeStyle = "rgba(40,20,16,0.25)";
        ctx.stroke();
      }
    }
  };
  const roof = canvasTex(256, roofPaint("#8b3a2a", "#a84a32"), 2);
  const darkRoof = canvasTex(256, roofPaint("#4a2a38", "#5c3244"), 2);

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
    ctx.strokeStyle = "rgba(255,220,120,0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, s - 16, s - 16);
  };
  const banner = canvasTex(128, bannerPaint("#7a1e24", "#e6c35a"));
  const enemyBanner = canvasTex(128, bannerPaint("#2a1a3a", "#c45a4a"));

  const iron = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#3c3a3d";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = `rgba(${80 + Math.random() * 50},${80 + Math.random() * 40},${70},0.35)`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
    ctx.strokeStyle = "rgba(20,18,16,0.5)";
    ctx.strokeRect(4, 4, s - 8, s - 8);
  });

  const rune = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = "#2a2430";
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
    dirt,
    stone,
    mossStone,
    enemyStone,
    wood,
    roof,
    darkRoof,
    banner,
    enemyBanner,
    iron,
    rune,
  };
}
