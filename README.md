# wrc-video

Short vertical videos (TikTok / YouTube Shorts / Instagram Reels, 1080×1920, 30 fps) for
[Wild Rift Core](https://wildriftcore.com), rendered with [Remotion](https://www.remotion.dev)
from the site's weekly data. English only.

| Composition | What it shows |
|---|---|
| `meta-movers` | Tier list of the week: live board, who moved up or down, why |
| `patch` | Buffs, nerfs, items — then "did it work?" before/after |

```bash
npm ci
npm run sync      # data + visuals from ../nexus-core (origin/main)
npm run clips     # creator clips (yt-dlp + ffmpeg), channel credited on screen
npm run cues && npm run audio && npm run voice
npm run studio    # preview
npm run render:all
```

Sound effects only, synthesized (`scripts/synth-audio.mjs`), no licensed audio: music is added on TikTok at publish time.
Voice-over is TikTok's free text-to-speech: `out/<id>-voice.md` gives the text per scene with timings.

Wild Rift Core was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by
Riot Games. Riot Games does not endorse or sponsor this project.
