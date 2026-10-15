// Timeline de « Draft Report » (30 i/s, 100 BPM).
export const FPS = 30;
export const INTRO = 90;    // le compteur de drafts
export const FACED = 135;   // l'ennemi que vous affrontez
export const PICKED = 105;  // ce que vous jouez
export const PAIRS = 105;   // le duel du mois
export const OUTRO = 90;

export const FACED_START = INTRO;
export const PICKED_START = FACED_START + FACED;
export const PAIRS_START = PICKED_START + PICKED;
export const OUTRO_START = PAIRS_START + PAIRS;
export const TOTAL = OUTRO_START + OUTRO;

const scenes = [
  { name: 'intro', start: 0, len: INTRO }, { name: 'faced', start: FACED_START, len: FACED }, { name: 'picked', start: PICKED_START, len: PICKED },
  { name: 'pairs', start: PAIRS_START, len: PAIRS }, { name: 'outro', start: OUTRO_START, len: OUTRO },
];
const cues = [
  { frame: 2, type: 'impact', gain: 0.7 }, ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ frame: 8 + i * 5, type: 'tick' })), { frame: 50, type: 'pop', pitch: 5 },
  { frame: 60, type: 'pop', pitch: 0, pan: -0.5 }, { frame: 66, type: 'pop', pitch: 2 }, { frame: 72, type: 'pop', pitch: 4, pan: 0.5 },
  { frame: FACED_START, type: 'whoosh' }, { frame: FACED_START + 14, type: 'impact', gain: 0.5 }, ...[0, 1, 2, 3].map((i) => ({ frame: FACED_START + 50 + i * 8, type: 'up', pan: -0.5 + i * 0.33 })),
  { frame: PICKED_START, type: 'whoosh' }, ...[0, 1, 2, 3, 4].map((i) => ({ frame: PICKED_START + 12 + i * 8, type: 'pop', pitch: i, pan: -0.5 + i * 0.25 })),
  { frame: PAIRS_START - 14, type: 'riser', len: 0.45 }, { frame: PAIRS_START, type: 'impact', gain: 0.8 }, { frame: PAIRS_START + 40, type: 'tick' }, { frame: PAIRS_START + 46, type: 'tick' },
  { frame: OUTRO_START, type: 'roll' }, { frame: OUTRO_START, type: 'whoosh' },
];
export const timeline = {
  id: 'draft-report', fps: FPS, bpm: 100, total: TOTAL, scenes, cues,
  sections: [
    { start: 0, len: INTRO, kind: 'intro', chords: ['Em'] },
    { start: FACED_START, len: FACED, kind: 'groove', chords: ['Em', 'G', 'C', 'Am'], intensity: 1 },
    { start: PICKED_START, len: PICKED, kind: 'groove', chords: ['C', 'G', 'Am', 'Em'], intensity: 1.05 },
    { start: PAIRS_START, len: PAIRS, kind: 'break', chords: ['Am', 'Em'] },
    { start: OUTRO_START, len: OUTRO, kind: 'outro', chords: ['Em'] },
  ],
};
