import type { BuildingType, TroopType } from "../game/catalog";

function canvas(size = 96): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return { c, ctx: c.getContext("2d")! };
}

function sky(ctx: CanvasRenderingContext2D, s: number, top: string, bot: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}

export function buildingThumb(type: BuildingType): string {
  const { c, ctx } = canvas(96);
  const s = 96;
  if (type === "crystal") {
    sky(ctx, s, "#7ec8ee", "#6ec86a");
    ctx.fillStyle = "#b8a078";
    ctx.fillRect(18, 62, 60, 16);
    ctx.fillStyle = "#5ee6ff";
    ctx.beginPath();
    ctx.moveTo(48, 16);
    ctx.lineTo(64, 52);
    ctx.lineTo(32, 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#a8f4ff";
    ctx.beginPath();
    ctx.moveTo(66, 36);
    ctx.lineTo(76, 58);
    ctx.lineTo(56, 58);
    ctx.closePath();
    ctx.fill();
  } else if (type === "vault") {
    sky(ctx, s, "#8ed0f0", "#70c060");
    ctx.fillStyle = "#e8d2a4";
    ctx.fillRect(16, 38, 64, 36);
    ctx.fillStyle = "#c44a32";
    ctx.fillRect(12, 30, 72, 12);
    ctx.fillStyle = "#7a4a26";
    ctx.fillRect(40, 48, 16, 26);
    ctx.fillStyle = "#f0d050";
    ctx.beginPath();
    ctx.arc(70, 70, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "tower") {
    sky(ctx, s, "#8ed0f0", "#68bc58");
    ctx.fillStyle = "#c8c0a4";
    ctx.beginPath();
    ctx.moveTo(34, 78);
    ctx.lineTo(38, 28);
    ctx.lineTo(58, 28);
    ctx.lineTo(62, 78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c44a32";
    ctx.beginPath();
    ctx.moveTo(48, 8);
    ctx.lineTo(66, 30);
    ctx.lineTo(30, 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7cf0ff";
    ctx.beginPath();
    ctx.arc(48, 12, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    sky(ctx, s, "#8ed0f0", "#6ec05a");
    ctx.fillStyle = "#d8c8a0";
    ctx.fillRect(22, 36, 52, 40);
    ctx.fillStyle = "#c44a32";
    ctx.beginPath();
    ctx.moveTo(48, 10);
    ctx.lineTo(80, 40);
    ctx.lineTo(16, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7a4a26";
    ctx.fillRect(40, 52, 16, 24);
  }
  return c.toDataURL("image/png");
}

export function troopThumb(type: TroopType): string {
  const { c, ctx } = canvas(96);
  const s = 96;
  if (type === "imp") {
    sky(ctx, s, "#f0a060", "#c04028");
    ctx.fillStyle = "#e06038";
    ctx.beginPath();
    ctx.arc(48, 52, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(48, 32, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a1810";
    ctx.beginPath();
    ctx.moveTo(38, 22);
    ctx.lineTo(34, 8);
    ctx.lineTo(44, 20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(58, 22);
    ctx.lineTo(62, 8);
    ctx.lineTo(52, 20);
    ctx.fill();
    ctx.fillStyle = "#ffe56a";
    ctx.beginPath();
    ctx.arc(43, 32, 3, 0, Math.PI * 2);
    ctx.arc(53, 32, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "wolf") {
    sky(ctx, s, "#8aa0b0", "#4a4038");
    ctx.fillStyle = "#6a5a4a";
    ctx.fillRect(22, 42, 52, 22);
    ctx.fillRect(56, 34, 24, 18);
    ctx.fillStyle = "#3a322c";
    ctx.beginPath();
    ctx.moveTo(62, 34);
    ctx.lineTo(58, 18);
    ctx.lineTo(70, 34);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(74, 34);
    ctx.lineTo(78, 16);
    ctx.lineTo(82, 34);
    ctx.fill();
    ctx.fillStyle = "#2a2420";
    ctx.fillRect(28, 62, 8, 16);
    ctx.fillRect(44, 62, 8, 16);
    ctx.fillRect(58, 62, 8, 16);
  } else {
    sky(ctx, s, "#b8c868", "#5a7030");
    ctx.fillStyle = "#7a9a3a";
    ctx.beginPath();
    ctx.arc(48, 56, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(48, 28, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6a4024";
    ctx.fillRect(30, 58, 36, 14);
    ctx.fillStyle = "#f0e0c0";
    ctx.fillRect(40, 36, 4, 10);
    ctx.fillRect(52, 36, 4, 10);
    ctx.fillStyle = "#4a2e18";
    ctx.fillRect(66, 40, 8, 28);
    ctx.beginPath();
    ctx.arc(70, 36, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  return c.toDataURL("image/png");
}
