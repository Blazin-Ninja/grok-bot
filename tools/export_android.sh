#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GODOT="${GODOT:-$HOME/godot/Godot_v4.7.2-stable_linux.x86_64}"
OUT="${1:-$ROOT/dist/feel-pass-arm64-debug.apk}"
mkdir -p "$(dirname "$OUT")"

if [[ ! -x "$GODOT" ]]; then
  echo "Godot binary missing: $GODOT" >&2
  exit 2
fi

TPL="$HOME/.local/share/godot/export_templates/4.7.2.stable"
if [[ ! -d "$TPL" ]]; then
  echo "Export templates not installed at $TPL" >&2
  echo "Download Godot_v4.7.2-stable_export_templates.tpz and unpack into that folder." >&2
  exit 3
fi

if [[ -z "${ANDROID_HOME:-}" && -z "${ANDROID_SDK_ROOT:-}" ]]; then
  echo "ANDROID_HOME / ANDROID_SDK_ROOT not set. Android SDK is required to export an APK." >&2
  exit 4
fi

"$GODOT" --headless --path "$ROOT" --import
"$GODOT" --headless --path "$ROOT" --export-debug "Android" "$OUT"
echo "APK: $OUT"
ls -la "$OUT"
