#!/bin/bash
# Clips de créateurs, chaque lundi, depuis le Mac : YouTube refuse les IP GitHub (« Sign in to confirm you're
# not a bot », mesuré le 2026-10-18) mais pas celle du Mac. Le rendu, lui, reste sur GitHub : Remotion lancé
# hors de VS Code (launchd comme Terminal) se fige, Chrome ouvert, 0 % CPU (mesuré le 18/10, cause non trouvée).
#
# 1. données de la semaine + clips (yt-dlp) ; 2. clips-creators.json et données → git ; 3. mp4 absents ou
# modifiés → release `clips-cache` (pré-release, ne passe jamais « Latest ») ; 4. lance render.yml, qui
# télécharge ces mp4 avant de rendre.
# Lancé par launchd (~/Library/LaunchAgents/com.wildriftcore.video-clips.plist, modèle dans docs/), lundi
# 12:00 ; un Mac endormi le rattrape au réveil.
#
#   bash scripts/clips-weekly.sh            # à la main, même effet
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
# Sous launchd, TCC refuse l'écriture sur le T7 alors que `[ -d ]` répond vrai : cache et log sur le disque
# natif, cache vidé en fin de run (les clips gardés vivent dans public/clips, pas dans le cache).
LOG_DIR="$HOME/Library/Logs/wrc-video"; CACHE="$HOME/Library/Caches/wrc-video-yt"
mkdir -p "$LOG_DIR" "$CACHE"
trap 'rm -rf "$CACHE"' EXIT
LOG="$LOG_DIR/clips-$(date +%F).log"
exec >>"$LOG" 2>&1 </dev/null
echo "=== $(date) — clips de la semaine"

notify() { osascript -e "display notification \"$1\" with title \"WRC vidéos\"" >/dev/null 2>&1 || true; }
fail() { echo "ÉCHEC : $1"; notify "Clips vidéo : échec ($1), log $LOG"; exit 1; }

git pull -q --ff-only origin master || fail "git pull wrc-video"
git -C ../nexus-core fetch -q origin main || fail "git fetch nexus-core"
npm run sync || fail "sync"
node scripts/fetch-clips.mjs --cache="$CACHE" || echo "clips : échec partiel"

git add src/data/clips-creators.json src/data/creators.json src/data/patch.json src/data/splash.json src/data/tierlist.json
git diff --cached --quiet || git commit -q -m "data: clips et données de la semaine (Mac)"
git push -q origin master || fail "git push"

REL=clips-cache
gh release view "$REL" >/dev/null 2>&1 || gh release create "$REL" --prerelease --title "Creator clips cache" \
  --notes "Clips de créateurs téléchargés par le Mac (YouTube bloque GitHub), lus par render.yml. Pas une publication." || fail "création $REL"
REMOTE="$(gh release view "$REL" --json assets -q '.assets[] | "\(.name) \(.size)"')"
UP=()
for f in public/clips/*-creator.mp4; do
  n="$(basename "$f")"; s="$(stat -f %z "$f")"
  grep -qx "$n $s" <<<"$REMOTE" || UP+=("$f")
done
echo "${#UP[@]} clip(s) à envoyer"
[ ${#UP[@]} -eq 0 ] || gh release upload "$REL" "${UP[@]}" --clobber || fail "upload clips"

gh workflow run render.yml || fail "lancement render.yml"
echo "=== OK — render.yml lancé"
notify "Clips envoyés, rendu lancé sur GitHub"
