# wrc-video

Vidéos courtes de Wild Rift Core générées en code (Remotion), à partir des données publiées du site
(`../nexus-core`, lues sur `origin/main`, jamais modifiées). Décision V1/V2 de
`nexus-core/docs/second-brain/roadmap-axes-amelioration.md` § Vidéo.

```bash
npm run sync      # tier list + mouvements + visuels → src/data/, public/
npm run studio    # aperçu interactif
npm run render    # sync puis MP4 FR et EN dans out/
```

Format : 1080×1920, 30 i/s, ~20 s. La mention fan-content de Riot (texte imposé, en anglais) figure dans
l'outro. Aucun logo Riot/Wild Rift ; ne pas utiliser ces vidéos en publicité payante (droits Riot, V3).
