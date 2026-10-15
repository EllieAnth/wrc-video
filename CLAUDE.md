# wrc-video — règles

- **Anglais uniquement** (décision d'Anthony, 2026-10-15) : aucune vidéo n'est publiée en français.
  Ne produire, ne traduire et ne rendre que la version EN — pas de composition FR, pas de dictionnaire
  de chaînes multilingue. Le français reste la langue des échanges avec Anthony, pas des vidéos.
- **La semaine de méta apparaît à l'écran** (intro + bandeau) : elle se calcule depuis
  `computedAt` de `tierlist-computed.json` (semaine lundi → dimanche), jamais depuis la date du rendu.
- Données : lues sur `origin/main` de `../nexus-core` par `scripts/sync-data.mjs`, jamais modifiées.
  L'arbre de travail de nexus-core peut être en retard ou sale : **toujours `git show origin/main:`**.
- Réseaux visés : TikTok, YouTube Shorts, Instagram Reels (9:16, 1080×1920, 30 i/s, 17 à 40 s).

## Les cinq formats (`src/formats/<id>/`, liste dans `registry.ts`)

| id | sujet | données | durée |
|---|---|---|---|
| `meta-movers` | tier list de la semaine, tableau qui bouge, ▲/▼ | `tierlist.json` | 38 s |
| `duel` | n° 1 d'un rôle contre son counter, interaction clé, verdict | `duel.json` (ledger counters) | 23 s |
| `hidden-pick` | champion fort et peu joué, preuve par la courbe | `hidden.json` | 17,5 s |
| `patch` | buffs/nerfs/objets du patch, puis « did it work? » (avant → après) | `patch.json` | 24,5 s |
| `draft-report` | drafts analysés sur 30 j, ennemi le plus affronté, paire du mois | `draft.json` | 17,5 s |

Chaque dossier contient `timeline.ts` (durées des scènes + repères sonores — **seule source des
timings**, lue par la composition, `cues.mts` et `export-voice.mts`), `voice.ts` (texte à dire,
par scène) et `index.tsx`. La bibliothèque d'effets vit dans `src/fx/` (cartes façon tier list du
site, tableau FLIP, sparkline, panneaux vidéo, chrome). Un nouveau format = un dossier + une ligne
dans `registry.ts` + une `Composition` dans `src/Root.tsx`.

## Chaîne de production (`npm run render` = 0 token, 0 appel IA)

`sync` (données + icônes/splashs CommunityDragon + aperçus Riot des sorts) → `clips` (clips de
créateurs, ci-dessous) → `cues` → `audio` (`scripts/synth-audio.mjs` : musique et bruitages
**synthétisés**, aucun fichier sous droits) → `voice` (`out/<id>-voice.md`) → `render:all`.
Vérification visuelle sans rendu complet : `npx tsx scripts/stills.mts --format=<id>` →
planche-contact `out/stills/<id>-sheet.jpg`. Les fichiers lourds (cache yt-dlp, logs) vont sur
`/Volumes/T7/wrc-video-cache/`, jamais sur le disque natif.

## Voix : synthèse TikTok, pas de TTS payant (décision du 2026-10-15)

La voix off est faite par **le text-to-speech gratuit de TikTok** au moment de publier. Pour chaque
vidéo, `out/<id>-voice.md` donne **scène par scène** l'instant (s), la durée et le texte à coller.
`voice.ts` porte des phrases courtes (≤ 4 s de parole par scène de 4 s) ; une phrase trop longue
pour sa scène se raccourcit dans `voice.ts`, on n'allonge pas la scène pour elle.

## Clips de créateurs (décision d'Anthony, 2026-10-15)

Les créateurs YouTube sont **réputés consentants** : on reprend des extraits de leurs vidéos pour
illustrer un champion, **à condition d'afficher le nom de la chaîne en évidence** (`CreatorBadge`,
« CLIP BY <chaîne> », jamais retiré ni réduit). `scripts/fetch-clips.mjs` : index
`champion_videos.json` du site → repli recherche YouTube ; sonde audio pour trouver le passage le
plus fort (ebur128), télécharge 4 à 8 s en 1080p, recadre en 9:16, sans son. Sorties :
`public/clips/<key>-creator.mp4` + `src/data/clips-creators.json` (chaîne, URL, instant).
Chaînes exclues : Riot / Wild Rift officiel. Anthony juge les clips et demande des remplacements :
`--champ=<key> --replace` refait le choix. Repli automatique si aucun clip : splash en Ken Burns.

## Droits

- Riot (« Legal Jibber Jabber ») : organique seulement, jamais de pub payante ; la mention fan-content
  de l'outro est un texte imposé, ne pas la reformuler. Aperçus de sorts = CDN officiel des pages
  champion, icônes/splashs = CommunityDragon.
- Le dépôt est **public** (rendu par GitHub Actions) : il ne versionne ni les clips, ni les images
  téléchargées, ni les sons générés (`.gitignore`) — seulement le code et les JSON de données.
