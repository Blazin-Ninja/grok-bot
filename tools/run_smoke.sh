#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GODOT="${GODOT:-$HOME/godot/Godot_v4.7.2-stable_linux.x86_64}"
if [[ ! -x "$GODOT" ]]; then
  GODOT="$(command -v godot || true)"
fi
if [[ -z "${GODOT}" || ! -x "$GODOT" ]]; then
  echo "Godot 4 binary not found. Set GODOT=/path/to/godot" >&2
  exit 1
fi
# Fail the repo if anyone reintroduces the P0 invisible-player path.
if grep -R --include='*.gd' -nE 'Image\.load\s*\(|\.globalize_path\s*\(' "$ROOT/scripts" "$ROOT/autoload" "$ROOT/scenes"; then
  echo "P0: do not load sprites via Image.load / globalize_path" >&2
  exit 1
fi
"$GODOT" --headless --path "$ROOT" --script "$ROOT/tools/smoke_test.gd"
