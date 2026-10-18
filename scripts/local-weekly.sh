#!/bin/bash
# Rendu hebdomadaire SUR LE MAC, avec les clips de créateurs : YouTube refuse les IP GitHub
# (« Sign in to confirm you're not a bot », mesuré le 2026-10-18), donc render.yml ne sort que des splashs.
# Lancé par launchd (~/Library/LaunchAgents/com.wildriftcore.video-weekly.plist, modèle dans docs/), le lundi
# 12:00 heure locale ; un Mac endormi le rattrape au réveil. Remplace les mp4 de la release `week-<date>`
# et y dépose `local-render.txt` : render.yml voit ce marqueur et ne réécrit pas la release avec des splashs.
#
#   bash scripts/local-weekly.sh            # à la main, même effet
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
LOG_DIR="/Volumes/T7/wrc-video-cache"
CACHE="$LOG_DIR/yt"
# Sous launchd, TCC refuse l'écriture sur le T7 (« Operation not permitted », mesuré le 2026-10-18) alors que
# `[ -d ]` répond vrai : on ÉCRIT pour tester. T7 absent ou refusé → disque natif, cache vidé en fin de run.
# Jamais de mkdir sous /Volumes (il créerait le dossier sur le disque natif).
TMP_CACHE=0
if ! { [ -d "$LOG_DIR" ] && touch "$LOG_DIR/.probe" 2>/dev/null && mkdir -p "$CACHE" 2>/dev/null; }; then
  LOG_DIR="$HOME/Library/Logs/wrc-video"; CACHE="$HOME/Library/Caches/wrc-video-yt"; TMP_CACHE=1
fi
mkdir -p "$LOG_DIR" "$CACHE"
trap '[ "$TMP_CACHE" = 1 ] && rm -rf "$CACHE"' EXIT
LOG="$LOG_DIR/weekly-$(date +%F).log"
exec >>"$LOG" 2>&1 </dev/null
echo "=== $(date) — rendu local"

notify() { osascript -e "display notification \"$1\" with title \"WRC vidéos\"" >/dev/null 2>&1 || true; }
fail() { echo "ÉCHEC : $1"; notify "Échec du rendu : $1 (log $LOG)"; exit 1; }

git pull -q --ff-only origin master || fail "git pull wrc-video"
git -C ../nexus-core fetch -q origin main || fail "git fetch nexus-core"

npm run sync || fail "sync"
node scripts/fetch-clips.mjs --cache="$CACHE" || echo "clips : échec partiel, repli splash"
npm run cues && npm run audio && npm run voice || fail "audio/voix"
npm run render:all || fail "render"

TAG="week-$(node -e 'console.log(require("./src/data/tierlist.json").week.start)')"
echo "rendu local $(date -u +%FT%TZ) — clips créateurs" > out/local-render.txt
if ! gh release view "$TAG" >/dev/null 2>&1; then
  gh release create "$TAG" --title "Videos — $TAG" \
    --notes "English shorts rendered from the week's data, with creator clips (sound effects only: add music on TikTok). Voice-over text per scene in the \`*-voice.md\` files." \
    || fail "création release"
fi
# Seuls les formats de la semaine : out/ garde aussi d'anciens rendus.
FILES=(); for f in $(node scripts/formats.mjs); do FILES+=("out/$f.mp4" "out/$f-voice.md"); done
gh release upload "$TAG" "${FILES[@]}" out/local-render.txt --clobber || fail "upload release"

git add src/data/clips-creators.json src/data/patch.json src/data/splash.json src/data/tierlist.json
git diff --cached --quiet || { git commit -q -m "data: $TAG — rendu local hebdomadaire" && git push -q origin master || echo "push données : échec (non bloquant)"; }

echo "=== OK $TAG"
notify "Vidéos $TAG prêtes (avec clips) : release GitHub"
