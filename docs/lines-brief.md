# Writing the lines of a `champion-35s` video (brief for a session agent)

You rewrite **one JSON file per champion**: `src/data/champion-lines/<slug>.json`. It already exists as a
deterministic draft (`status: draft`). You change the `text`, `why` and `confidence` of each field, set the
`decision.spell` / `execution.spell` letters when a specific ability illustrates the point, pick
`matchup.vs` among `data.matchups.hard`, then set `status: "validated"` and `reviewedBy`. Never touch
`schema`, `slug`, `patch`, `dataHash`, `combo.inputs`.

Input you get: `public/data/champions/<slug>.json` (facts: role, tier, win rate, engine build, skill
priority, abilities with descriptions, combos, game plan, play tips, matchups with the ledger's key
interaction). **Every line must be traceable to a field of that file** (`source`), no invented numbers,
no item or ability that is not in the data.

The video has no voice: the text IS the script, read on a phone in ≤ 2.5 s per line.

| field | max chars | lines | what it is |
|---|---|---|---|
| `tagline` | 30 | 1 | who this champion is, ≤ 5 words, no verb needed (« Unkillable lane bully ») |
| `decision.title` | 36 | 2 | THE decision that wins games with this champion, as a headline (« Trade only when Q is up ») |
| `decision.sub` | 72 | 2 | why / when, one concrete sentence, ability names allowed |
| `execution.why` | 72 | 2 | what the combo achieves and the timing that matters |
| `plan.early` / `mid` / `late` | 40 | 1 | one imperative priority per phase, ≤ 7 words |
| `matchup.line` | 72 | 2 | how to survive `matchup.vs`, one sentence (rewrite the ledger's key interaction) |

Rules that `scripts/validate-lines.mjs` enforces mechanically: budgets above; English only (a French
word fails); no `**` markup; one sentence on a 1-line field; a multi-word name must fit on one line;
`decision.title` must differ from every other champion's (normalized text). `scripts/measure-lines.mjs`
then renders each line in Chromium with the real fonts and refuses any overflow.

Style: second person, imperative, concrete. Prefer a decision (« Hold E for the Flash ») over a
description (« E is a dash »). No « unleash », « devastating », « dominate ». Numbers only when the data
gives them. Abbreviations players use are fine (AA, CC, R, Flash), but never a bare « E » without context
on `decision.title`.

Confidence: 0.9 when the line restates a data field; 0.7 when it synthesizes two; 0.5 when it relies on
game knowledge outside the file (say so in `why`). Lines under 0.5 go to human review.
