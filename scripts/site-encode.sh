#!/usr/bin/env bash
# Version site d'un rendu : 720×1280 à débit plafonné (≈ 6 Mo pour 38 s), affiche (image à 1,5 s) et, si une
# piste est fournie, une MUSIQUE sous les bruitages. Avec une piste, produit aussi la version RÉSEAUX
# YouTube/Instagram : image du master copiée telle quelle (-c:v copy), même mixage, AAC 192k (décision du 31/10).
# Le master (out/<id>.mp4, TikTok) n'est jamais touché : la musique de TikTok se pose dans l'app à la
# publication (décision du 15/10) ; celle du site vient d'ici (21/10), celle de YouTube et Instagram aussi (31/10).
#   scripts/site-encode.sh out/<id>.mp4 [piste.mp3|wav|m4a]
#     →  out/<id>.web.mp4 + out/<id>.jpg  (+ out/<id>.social.mp4 si une piste est fournie)
# Réglages : MUSIC_LUFS (défaut -21 : niveau du lit musical avant mixage, sous les bruitages à ≈ -14),
#            MUSIC_START (défaut 0 : seconde de la piste où commencer, pour sauter une intro).
set -euo pipefail
m="$1"; music="${2:-}"
b="${m%.mp4}"
ENC=(-c:v libx264 -preset slow -crf 24 -maxrate 1600k -bufsize 3200k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart)

# Mixage bruitages + musique, partagé par la version site et la version réseaux (une seule chaîne, jamais deux
# copies) : entrée 0 = master, entrée 1 = piste. Lit musical ramené à MUSIC_LUFS, coupé à la durée de la vidéo
# (bouclé si la piste est plus courte), entrée 0,3 s, sortie 1,5 s ; mixé SANS normalisation (amix diviserait
# les bruitages par 2), puis limiteur pour qu'un impact sur la musique ne sature pas. Sortie : [a].
mix_filter() {
  local d fade
  d="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$m")"
  fade="$(awk -v d="$d" 'BEGIN { printf "%.2f", (d > 2 ? d - 1.5 : 0) }')"
  printf '%s' "[1:a]aresample=48000,loudnorm=I=${MUSIC_LUFS:--21}:TP=-3:LRA=11,aresample=48000,atrim=0:${d},asetpts=PTS-STARTPTS,afade=t=in:d=0.3,afade=t=out:st=${fade}:d=1.5[bg];\
[0:a]aresample=48000[fx];\
[fx][bg]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.89:level=false[a]"
}

if [ -n "$music" ]; then
  mix="$(mix_filter)"
  ffmpeg -loglevel error -y -i "$m" -ss "${MUSIC_START:-0}" -stream_loop -1 -i "$music" -filter_complex \
    "[0:v]scale=720:1280[v];${mix}" -map "[v]" -map "[a]" "${ENC[@]}" "$b.web.mp4"
  # Réseaux : image et métadonnées couleur du master à l'identique, seul le son change.
  ffmpeg -loglevel error -y -i "$m" -ss "${MUSIC_START:-0}" -stream_loop -1 -i "$music" -filter_complex "$mix" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$b.social.mp4"
else
  ffmpeg -loglevel error -y -i "$m" -vf scale=720:1280 "${ENC[@]}" "$b.web.mp4"
fi
ffmpeg -loglevel error -y -ss 1.5 -i "$m" -frames:v 1 -vf scale=720:1280 -q:v 3 "$b.jpg"
echo "$(basename "$b").web.mp4 $(du -h "$b.web.mp4" | cut -f1)${music:+ · musique $(basename "$music") · $(basename "$b").social.mp4 $(du -h "$b.social.mp4" | cut -f1)}"
