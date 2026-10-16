// Timeline de « champion-35s » (30 i/s) : six scènes, 35 s, la même pour les 142 champions
// (arbitrage des deux agents, 16/10 — debat-video-champion-2026-10-16-reponse.md § 5).
// Seule source des timings : la composition, cues.mts et stills.mts la lisent.
export const FPS = 30;
export const HOOK = 90;       // 3 s  — nom, rôle, tier et win rate contextualisés, accroche
export const DECISION = 150;  // 5 s  — la décision clé, propre au champion
export const BUILD = 210;     // 7 s  — 5 objets + bottes, rune clé, priorité des sorts
export const EXECUTION = 300; // 10 s — combo : touches en séquence + pourquoi
export const PLAN = 210;      // 7 s  — early / mid / late + un matchup à surveiller
export const OUTRO = 90;      // 3 s  — appel vers la fiche, mention courte Riot

export const DECISION_START = HOOK;
export const BUILD_START = DECISION_START + DECISION;
export const EXECUTION_START = BUILD_START + BUILD;
export const PLAN_START = EXECUTION_START + EXECUTION;
export const OUTRO_START = PLAN_START + PLAN;
export const TOTAL = OUTRO_START + OUTRO; // 1050 images = 35 s

export const ITEM_EVERY = 14; // un objet toutes les 14 images dans la scène build
export const CHIP_EVERY = 18; // une touche de combo toutes les 18 images

const scenes = [
  { name: 'hook', start: 0, len: HOOK }, { name: 'decision', start: DECISION_START, len: DECISION }, { name: 'build', start: BUILD_START, len: BUILD },
  { name: 'execution', start: EXECUTION_START, len: EXECUTION }, { name: 'plan', start: PLAN_START, len: PLAN }, { name: 'outro', start: OUTRO_START, len: OUTRO },
];
const cues = [
  { frame: 2, type: 'impact', gain: 0.8 }, { frame: 24, type: 'pop', pitch: 4 }, { frame: 44, type: 'tick' },
  { frame: DECISION_START, type: 'whoosh' }, { frame: DECISION_START + 14, type: 'impact', gain: 0.5 }, { frame: DECISION_START + 50, type: 'tick' },
  { frame: BUILD_START, type: 'whoosh' }, ...[0, 1, 2, 3, 4, 5].map((i) => ({ frame: BUILD_START + 16 + i * ITEM_EVERY, type: 'pop', pitch: i })),
  { frame: BUILD_START + 130, type: 'up', pan: 0.3 },
  { frame: EXECUTION_START - 12, type: 'riser', len: 0.4 }, { frame: EXECUTION_START, type: 'impact', gain: 0.7 },
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ frame: EXECUTION_START + 40 + i * CHIP_EVERY, type: 'tick', pan: -0.5 + i * 0.16 })),
  { frame: PLAN_START, type: 'whoosh' }, ...[0, 1, 2].map((i) => ({ frame: PLAN_START + 14 + i * 36, type: 'pop', pitch: 2 + i })), { frame: PLAN_START + 140, type: 'down', pan: 0.4 },
  { frame: OUTRO_START, type: 'roll' }, { frame: OUTRO_START, type: 'whoosh' },
];
export const timeline = {
  id: 'champion-35s', fps: FPS, bpm: 100, total: TOTAL, scenes, cues,
  sections: [
    { start: 0, len: HOOK, kind: 'intro', chords: ['Am'] },
    { start: DECISION_START, len: DECISION, kind: 'break', chords: ['F', 'G'] },
    { start: BUILD_START, len: BUILD, kind: 'groove', chords: ['C', 'G', 'Am', 'F'], intensity: 1 },
    { start: EXECUTION_START, len: EXECUTION, kind: 'groove', chords: ['Am', 'C', 'G', 'F'], intensity: 1.15 },
    { start: PLAN_START, len: PLAN, kind: 'groove', chords: ['F', 'G', 'Am', 'Em'], intensity: 1 },
    { start: OUTRO_START, len: OUTRO, kind: 'outro', chords: ['Am'] },
  ],
};
