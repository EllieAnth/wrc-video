# wrc-video — règles

- **Anglais uniquement** (décision d'Anthony, 2026-10-15) : aucune vidéo n'est publiée en français.
  Ne produire, ne traduire et ne rendre que la version EN — pas de composition FR, pas de dictionnaire
  de chaînes multilingue. Le français reste la langue des échanges avec Anthony, pas des vidéos.
- **La semaine de méta apparaît à l'écran** (intro + bandeau) : elle se calcule depuis
  `computedAt` de `tierlist-computed.json` (semaine lundi → dimanche), jamais depuis la date du rendu.
- Données : lues sur `origin/main` de `../nexus-core` par `scripts/sync-data.mjs`, jamais modifiées.
- Son : `scripts/synth-audio.mjs` synthétise musique + bruitages (aucun fichier sous droits). Les
  instants des bruitages se lisent dans `src/timeline.json`, la même source que la composition :
  changer un timing ne se fait qu'à cet endroit.
- Droits Riot (V3) : organique seulement (TikTok/Reels/Shorts), jamais de pub payante ; la mention
  fan-content de l'outro est un texte imposé, ne pas la reformuler.
- **Clips d'action = aperçus officiels Riot des sorts uniquement** (CDN des pages champion de
  leagueoflegends.com, téléchargés par `sync-data.mjs`). Jamais de clip de créateur (YouTube, TikTok,
  Twitch) sans son accord écrit, monétisé ou non (décision du 2026-10-15) : contrefaçon, et les
  réclamations Content ID mènent à la suppression de la chaîne. Pour du vrai jeu haut niveau : accord du
  créateur, ou parties enregistrées par Anthony.
- Coût : `npm run render` = 0 token, 0 appel IA. Seul un nouveau format coûte une session.
