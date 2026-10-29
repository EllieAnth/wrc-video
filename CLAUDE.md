# wrc-video — règles

- **Anglais uniquement** (décision d'Anthony, 2026-10-15) : aucune vidéo n'est publiée en français.
  Ne produire, ne traduire et ne rendre que la version EN — pas de composition FR, pas de dictionnaire
  de chaînes multilingue. Le français reste la langue des échanges avec Anthony, pas des vidéos.
- **La semaine de méta apparaît à l'écran** (intro + bandeau) : elle se calcule depuis
  `computedAt` de `tierlist-computed.json` (semaine lundi → dimanche), jamais depuis la date du rendu.
- Données : lues sur `origin/main` de `../nexus-core` par `scripts/sync-data.mjs`, jamais modifiées.
  L'arbre de travail de nexus-core peut être en retard ou sale : **toujours `git show origin/main:`**.
- Réseaux visés : TikTok, YouTube Shorts, Instagram Reels (9:16, 1080×1920, 30 i/s, 17 à 40 s).

## Les deux formats (`src/formats/<id>/`, liste dans `registry.ts`)

| id | sujet | données | durée |
|---|---|---|---|
| `meta-movers` | tier list de la semaine, tableau qui bouge, ▲/▼ | `tierlist.json` | 38 s |
| `patch` | buffs/nerfs/objets du patch, puis « did it work? » (avant → après) | `patch.json` | 24,5 s |

Trois autres formats (duel, hidden-pick, draft-report) ont été construits puis **retirés le 2026-10-15** :
Anthony ne les a pas jugés utiles. Ils restent dans l'historique git (commit `bb353f7`) ; ne pas les
reproposer sans demande explicite.

Chaque dossier contient `timeline.ts` (durées des scènes + repères sonores — **seule source des
timings**, lue par la composition, `cues.mts` et `export-voice.mts`), `voice.ts` (texte à dire,
par scène) et `index.tsx`. La bibliothèque d'effets vit dans `src/fx/` (cartes façon tier list du
site, tableau FLIP, sparkline, panneaux vidéo, chrome). Un nouveau format = un dossier + une ligne
dans `registry.ts` + une `Composition` dans `src/Root.tsx`.

## Chaîne de production (`npm run render` = 0 token, 0 appel IA)

`sync` (données + icônes/splashs CommunityDragon + aperçus Riot des sorts) → `clips` (clips de
créateurs, ci-dessous) → `cues` → `audio` (`scripts/synth-audio.mjs` : **bruitages seulement**,
synthétisés, aucun fichier sous droits) → `voice` (`out/<id>-voice.md`) → `render:all`.
Vérification visuelle sans rendu complet : `npx tsx scripts/stills.mts --format=<id>` →
planche-contact `out/stills/<id>-sheet.jpg`. Les fichiers lourds (cache yt-dlp, logs) vont sur
`/Volumes/T7/wrc-video-cache/`, jamais sur le disque natif.

## Version site : la release porte aussi de quoi publier sur wildriftcore.com (2026-10-21)

`render.yml` ajoute à chaque release, pour chaque format, `<id>.web.mp4` (720×1280, crf 24, ≤ 1,6 Mbit/s :
≈ 6 Mo pour 38 s contre ≈ 31 Mo pour le master), `<id>.jpg` (affiche, image à 1,5 s) et `<id>-chapters.json`
(`scripts/export-chapters.mts`, meta-movers et patch : instant de chaque scène et passages de chaque champion,
tirés de `timeline.ts`). Encodage : `scripts/site-encode.sh` (même commande en CI et sur le Mac). nexus-core
les publie (`scripts/publish-meta-movers-video.mjs --format=<id>`, workflow « Meta Movers Video » du lundi) sur
R2 : Meta Movers en tête de l'article hebdo, sur la tier list et sur les fiches des champions cités ; patch sur
/meta/, l'article du patch et la tier list. Le schéma `wrc.video-chapters/1` est un contrat : renommer une
scène ou retirer `champions[].moments` casse cette lecture côté site.

## Son : bruitages seulement dans le master, musique dans la version site (15/10, puis 21/10)

Le master (`out/<id>.mp4`, TikTok) n'a aucune musique : `synth-audio.mjs` ne pose que les bruitages (impact
d'ouverture, whoosh, pops, ticks, montée, impact de fin) calés sur les repères de `timeline.ts`, et la musique
est ajoutée dans TikTok au moment de publier (bibliothèque de la plateforme, droits couverts). `--music` remet
l'ancienne bande-son synthétisée pour un essai, jamais pour une publication.

La **version site** (`<id>.web.mp4`) reçoit une musique sous les bruitages (demande d'Anthony, 21/10) : pistes
déposées dans la **pré-release `site-music`** (`<id>.mp3|wav|m4a` pour un format, `site.*` pour tous ;
jamais dans le dépôt, qui est public). `site-encode.sh` ramène la piste à `MUSIC_LUFS` (-21 par défaut), la
coupe à la durée (`MUSIC_START` pour sauter une intro), fondu de sortie 1,5 s, limiteur à -1 dB. Mesuré :
bruitages inchangés (-16,8 → -17,0 LUFS sur la chaîne seule), pic -0,6 dBFS. Le LUFS intégré du mixage BAISSE
(-18,3) alors qu'il y a plus de son : la porte de mesure ne comptait que les bruitages, les blancs remplis par la
musique entrent dans la moyenne — ce n'est pas une perte de niveau. Changer de piste = la redéposer dans
`site-music` puis relancer `render.yml` (et le workflow nexus-core « Meta Movers Video » hors lundi).
Piste en place depuis le 28/10 : `site.wav` = « Two Toned » (Suno), **déjà coupée à 21 s** (intro calme de
−32 à −20 LUFS sur 20 s, le corps du morceau tient de 21 à 63 s), donc sans `MUSIC_START` en CI. Original
complet (121 s) : `/Volumes/T7/wrc-video-cache/music/Two Toned.wav`.

## Voix : synthèse TikTok, pas de TTS payant (décision du 2026-10-15)

La voix off est faite par **le text-to-speech gratuit de TikTok** au moment de publier. Pour chaque
vidéo, `out/<id>-voice.md` donne **scène par scène** l'instant (s), la durée et le texte à coller.
`voice.ts` porte des phrases courtes (≤ 4 s de parole par scène de 4 s) ; une phrase trop longue
pour sa scène se raccourcit dans `voice.ts`, on n'allonge pas la scène pour elle.

## Clips de créateurs (décision d'Anthony, 2026-10-15, précisée le 2026-10-27)

Un créateur est **réputé d'accord une fois PRÉVENU**, et **retiré s'il refuse** (27/10). On reprend des
extraits de ses vidéos pour illustrer un champion, **à condition d'afficher le nom de la chaîne en
évidence** (`CreatorBadge`, « CLIP BY <chaîne> », jamais retiré ni réduit). Registre :
`src/data/creators.json` (`pending` → `notified` → `agreed` | `refused`), tenu par `fetch-clips.mjs` ;
message et processus : `docs/creator-notice.md`. Une chaîne `refused` n'est plus téléchargée et la
composition refuse ses clips (repli splash). Le site affiche les clips dès le rendu ; nexus-core ne publie
sur les réseaux **aucune** vidéo dont un clip vient d'une chaîne `pending` ou `refused`. `scripts/fetch-clips.mjs` : index
`champion_videos.json` du site → repli recherche YouTube ; sonde audio pour trouver le passage le
plus fort (ebur128), télécharge 4 à 8 s en 1080p, **garde l'image entière au ratio de la source**
(16:9 → 1920×1080, Short → 1080×1920), sans son. Sorties : `public/clips/<key>-creator.mp4` +
`src/data/clips-creators.json` (chaîne, URL, instant, `source` = dimensions réelles).
**Le cadrage se fait dans `ClipPanel` (`src/fx/Video.tsx`)**, jamais à l'encodage : recadrage ≤ 25 % en
largeur (paysage) ou ≤ 40 % en hauteur (portrait), reste du panneau rempli par le clip flouté. Un
recadrage 9:16 au centre perdait le champion dès que la caméra du créateur n'était pas verrouillée
sur lui (retour d'Anthony, 2026-10-15). Changer le cadrage = re-rendre ; changer l'encodage =
`fetch-clips.mjs --reframe` (ré-encode depuis le cache du T7, sans re-télécharger).
Chaînes exclues : Riot / Wild Rift officiel. Anthony juge les clips et demande des remplacements :
`--champ=<key> --replace` refait le choix. Repli automatique si aucun clip : splash en Ken Burns.

## Droits

- Riot (« Legal Jibber Jabber ») : organique seulement, jamais de pub payante ; la mention fan-content
  de l'outro est un texte imposé, ne pas la reformuler. Aperçus de sorts = CDN officiel des pages
  champion, icônes/splashs = CommunityDragon.
- Le dépôt est **public** (rendu par GitHub Actions) : il ne versionne ni les clips, ni les images
  téléchargées, ni les sons générés (`.gitignore`) — seulement le code et les JSON de données.

## Format `champion-35s` — une vidéo par champion (chantier du 16/10, arbitrage de deux agents)

Décisions : `docs/second-brain/avis-video-guides-champion-2026-10-16.md` et
`debat-video-champion-2026-10-16-reponse.md` (nexus-core). **Pas de voix** : le texte à l'écran est le
script. Six scènes, 35 s (`src/formats/champion-35s/timeline.ts`) : hook 3 s · décision clé 5 s ·
build + sorts 7 s · exécution 10 s · plan + matchup 7 s · outro 3 s. Aperçus Riot des sorts seuls
(pas de clips de créateurs sur ce format). Mention Riot : ligne courte dans l'outro, notice complète
dans la description de chaque publication (politique § 6 : « conspicuously, e.g. on your website »).

Chaîne (0 appel IA ; les lignes s'écrivent en session) :
1. `npm run champions:sync [-- --slugs=a,b]` → `public/data/champions/<slug>.json` (faits, lus sur
   origin/main de nexus-core : build moteur, tier list, sorts, combos, plan, ledger des matchups ;
   **un champ français vaut absent**) + `src/data/champions-index.json` (versionné : lacunes par champion).
   Aperçus (≈ 1,7 Go) dans `public/clips-champ` → lien vers `/Volumes/T7/wrc-video-cache/clips-champ`.
2. `npm run champions:draft -- --slugs=…` → `src/data/champion-lines/<slug>.json` en `status: draft`
   (brouillon déterministe). Un agent le réécrit champ par champ (`docs/lines-brief.md`), `validated`.
   **Jamais `--force` sur un fichier validé** : c'est un travail éditorial versionné.
3. `npm run champions:validate` (budgets, langue, noms coupés, patch/hash périmés, décision clé
   dupliquée) puis `npm run champions:measure` (Chromium : lignes réellement rendues, Playwright de
   ../nexus-core — local seulement). Les deux doivent être verts avant tout rendu.
4. `npm run champions:audio` (une seule bande de bruitages pour tous), `npm run champions:stills --
   --slugs=…` (planche-contact sur le T7 = juge final de la lisibilité).
5. `npm run champions:render -- --slugs=…` → master 1080×1920 crf 18 + `.web.mp4` 720×1280 ≈ 1,5 Mbit/s
   + affiche, manifeste `renders/manifest.json` (hash, taille, durée). Sorties sur le T7. Mesuré : ≈ 80 s
   par champion sur ce Mac ; GitHub (4 vCPU) ≈ 2-3 min → matrice de lots, jamais 142 en séquence.
   Props = `scripts/champion-props.mjs` (données + lignes résolues en Node) : pas de fetch au rendu.

Le contrat des lignes vit dans `scripts/lines-contract.mjs` (budgets dérivés des largeurs mesurées :
`champions:measure --calibrate`). Changer une taille de police dans `index.tsx` = recalibrer et
mettre `STYLE` de `measure-lines.mjs` en phase.
