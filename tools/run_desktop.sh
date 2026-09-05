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
exec "$GODOT" --path "$ROOT" "$@"
