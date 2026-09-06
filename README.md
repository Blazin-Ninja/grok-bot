# Emberkeep

A browser-first fantasy village builder — stone keep, mana crystals, a short raid.

Boots straight into the village. No accounts, no servers, no clans. Save lives in `localStorage`.

## Play

On a phone, open the GitHub Pages URL (HTTPS):

**https://blazin-ninja.github.io/grok-bot/**

If that 404s, a repo admin still needs to enable Pages once:

1. Repo **Settings → Pages**
2. Source: **GitHub Actions**
3. Re-run the **Deploy GitHub Pages** workflow (or push this branch again)

Local play:

```bash
npm install
npm run dev
```

Then open the printed localhost URL. Touch: drag to pan, pinch to zoom. Mouse: drag + wheel.

```bash
npm test        # economy / save / upgrade checks
npm run build   # production bundle in dist/
npm run preview # serve the production build
```

## What you can do

1. Pan and zoom the tilted 3D village.
2. **Build** a mana crystal, dragon vault, and warding tower on the grid (keep is already raised).
3. Gold drips while the tab is open. Closing the tab stores a timestamp; reload applies a simple offline catch-up (capped at 3 hours).
4. Tap the keep (or any building) and **Upgrade** — a short visible timer, then a new level.
5. **Raid**: pick a warband of imps, worgs, and ogres, deploy them on the gold field of a premade rival hold, fight, take loot.
6. Progress writes itself to the browser. **New village** clears it.

## Stack

Vite + TypeScript + Three.js. Buildings and creatures are composed meshes with painted materials (stone, wood, banners, dusk lighting) — not gray boxes.

Android / native is out of scope. This slice is the web game.

## Screenshots

Village and raid captures live in [`docs/`](docs/).
