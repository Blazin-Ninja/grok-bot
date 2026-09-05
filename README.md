# Feel-Pass

Frozen Contra-like horror/occult run-and-gun **feel-pass**. Programmer art only.

Godot 4 project **at the repo root** (`project.godot`). Working name is still TBD.

Done bar is in [`FEEL_PASS.md`](FEEL_PASS.md). This is not a campaign, not 2P, not an art pass.

## What you get

Boots **straight into play** (no menu). Landscape, mobile renderer.

- Virtual stick: move + **8-way aim**. Stick down = duck.
- **FIRE** (hold) and **JUMP** on the right.
- Optional gamepad: left stick / d-pad move+aim, **A jump**, **B fire** (Xbox layout; also RT fire).
- Keyboard (desktop): **WASD / arrows**, **Z or J fire**, **X / K / Space jump**.
- One short ground stage, camera follows right.
- Three enemy types (walker, perched spitter, hopper). They die when shot.
- One **SPREAD** pickup (default gun is rapid).
- End boss with a long, readable telegraph (`!` + red flash + slam lane).
- Death restarts the stage.

Player is **always drawn** with `Polygon2D` / `ColorRect` nodes. Sprites are never loaded via `Image.load` / `globalize_path`.

## Run (desktop)

Godot **4.3+** (developed against **4.7.2**).

```bash
godot --path .
# or
./tools/run_desktop.sh
```

## Headless smoke

Proves player exists and is visible, movement, bullets, enemy death, and restart:

```bash
./tools/run_smoke.sh
```

Proof screenshots (programmer art) live in `proof/` after:

```bash
./tools/run_desktop.sh -- --screenshot
```

## Android export (sideload APK)

Target: **landscape**, **arm64-v8a**, debug APK.

1. Install Godot 4.7.2 and matching **export templates**.
2. Install OpenJDK 17+ and the Android SDK (`platform-tools`, `build-tools;35.0.1`, `platforms;android-35`).
3. Point Godot Editor Settings at Java + Android SDK.
4. Export:

```bash
export ANDROID_HOME=/path/to/Android/Sdk
./tools/export_android.sh
# writes dist/feel-pass-arm64-debug.apk
```

Or Editor → Export → Android → Export Project (Debug).

Sideload that APK and judge the gun. That is the done bar.

A debug **arm64-v8a** APK from this pass:

- `dist/feel-pass-arm64-debug.apk` (in the repo)
- also copied to the agent artifact path when built here

Package: `org.feelpass.occultgun`. Landscape locked (`screenOrientation=landscape`).

If export fails on your machine: Godot 4.7.2 + matching export templates + Android SDK (`build-tools;35.0.1`, `platforms;android-35`) + JDK 17+. Then `./tools/export_android.sh`. Desktop proof is `./tools/run_smoke.sh`.

## Layout

| Path | Role |
| --- | --- |
| `project.godot` | Godot 4 project (repo root) |
| `scenes/main.tscn` | Boots into the stage |
| `scripts/` | Player, bullets, enemies, boss, pad, HUD |
| `autoload/game.gd` | Weapon / restart / input map |
| `tools/smoke_test.gd` | Headless feel-pass checks |
| `export_presets.cfg` | Android arm64 debug |

Deterministic: gameplay RNG is seeded (`20260905`). Enemy / boss timings are fixed, not `rand`.
