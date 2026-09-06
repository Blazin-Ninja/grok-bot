import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.CAPTURE_URL ?? "http://127.0.0.1:4173";
const outDir = path.resolve("docs");
await mkdir(outDir, { recursive: true });

const save = {
  version: 1,
  gold: 240,
  lastSeen: Date.now(),
  buildings: [
    { id: "keep-home", type: "keep", gx: 5, gz: 5, level: 1 },
    { id: "c1", type: "crystal", gx: 1, gz: 8, level: 1 },
    { id: "c2", type: "crystal", gx: 2, gz: 1, level: 1 },
    { id: "v1", type: "vault", gx: 9, gz: 8, level: 1 },
    { id: "t1", type: "tower", gx: 11, gz: 2, level: 1 },
    { id: "t2", type: "tower", gx: 0, gz: 4, level: 1 },
  ],
};

async function boot(page) {
  await page.addInitScript((data) => {
    localStorage.setItem("emberkeep-save-v1", JSON.stringify(data));
  }, save);
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
}

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
});

const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const phonePage = await phone.newPage();
await boot(phonePage);
await phonePage.screenshot({ path: path.join(outDir, "phone.png"), type: "png" });
await phonePage.locator("#buildBtn").click();
await phonePage.waitForTimeout(400);
await phonePage.screenshot({ path: path.join(outDir, "upgrade.png"), type: "png" });
await phonePage.locator("#buildBtn").click();
await phonePage.waitForTimeout(250);
const raidPage = await phone.newPage();
await raidPage.addInitScript((data) => {
  localStorage.setItem("emberkeep-save-v1", JSON.stringify(data));
}, save);
await raidPage.goto(`${base}/?shot=raid`, { waitUntil: "networkidle" });
await raidPage.waitForTimeout(2800);
await raidPage.screenshot({ path: path.join(outDir, "raid.png"), type: "png" });
await phone.close();

const desk = await browser.newContext({
  viewport: { width: 1100, height: 720 },
  deviceScaleFactor: 1.5,
});
const deskPage = await desk.newPage();
await boot(deskPage);
await deskPage.screenshot({ path: path.join(outDir, "village.png"), type: "png" });
await desk.close();

await writeFile(path.join(outDir, ".capture-ok"), "ok\n");
await browser.close();
console.log("wrote docs/phone.png docs/raid.png docs/upgrade.png docs/village.png");
