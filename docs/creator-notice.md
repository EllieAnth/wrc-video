# Prévenir un créateur dont un clip est utilisé

Règle (décision d'Anthony, 2026-10-29, remplace celle du 27/10) : **accord tacite** — on publie, on prévient
ensuite, on **retire** s'il refuse. Registre : `src/data/creators.json` (une entrée par chaîne, clé = URL de la chaîne).

## Processus

1. `node -e "const r=require('./src/data/creators.json').channels; for (const [u,c] of Object.entries(r)) if (c.status==='pending') console.log(c.creator, u, c.champions.join(','))"`
   → la liste des créateurs à prévenir.
2. Envoyer le message ci-dessous (commentaire YouTube, DM Instagram/TikTok, ou e-mail de la page « À propos »).
3. Dans `creators.json` : `status: "notified"`, `notifiedAt: "AAAA-MM-JJ"`, `contact` (où le message est parti).
4. Réponse :
   - oui → `status: "agreed"`, `answeredAt` ;
   - non → `status: "refused"`, `answeredAt` : au rendu suivant, ses clips disparaissent du site comme des
     réseaux (repli splash). Relancer `render.yml` puis le workflow nexus-core « Meta Movers Video » pour que
     le site change le jour même ; **retirer à la main** les publications déjà parues sur les réseaux.
5. Une vidéo dont un clip vient d'une chaîne `refused` **ne part pas sur les réseaux**
   (`nexus-core/scripts/social-posts.mjs`) ; une chaîne `pending` part, avec l'avertissement « à prévenir
   après publication » dans l'issue de la semaine.

## Message (anglais)

> Hi {creator}! I run Wild Rift Core (wildriftcore.com), a free stats & guides site for Wild Rift.
> Our weekly "Meta Movers" shorts use a short clip (4–8 s, no audio) from your video "{title}" to
> illustrate {champion}, with your channel name shown on screen ("CLIP BY {creator}") and a link to your
> video in the description. They're posted on our site and on YouTube Shorts, TikTok and Instagram.
> If you'd rather we didn't use your footage, just reply here and we'll remove it from future videos and
> take down any post that includes it. Thanks for the great content!

Les `{…}` se remplissent depuis `src/data/clips-creators.json` (`creator`, `title`, clé = champion).
