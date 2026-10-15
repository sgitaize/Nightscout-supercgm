#!/usr/bin/env bash
# Uploads the current build to the Pebble appstore and publishes it (--is-published).
# Screenshots are not replaced (--no-gif-all-platforms). Requires a prior pebble login.
set -euo pipefail
export PATH=$HOME/.local/bin:$PATH
cd "$(dirname "$0")/.."
pebble login --status
pebble publish --non-interactive --is-published --no-gif-all-platforms \
  --description "$(cat store/description.txt)" \
  --release-notes "$(cat store/release-notes.txt)" "$@"
