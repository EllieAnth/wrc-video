// Timeline de « Duel of the Week » (30 i/s, 100 BPM). Lue par la composition et par scripts/cues.mts.
export const FPS = 30;
export const INTRO = 90;   // les deux champions face à face
export const CLIP_A = 120; // le n° 1 en action (créateur)
export const CLIP_B = 120; // l'adversaire en action
export const KEY = 150;    // l'interaction clé
export const VERDICT = 120;
export const OUTRO = 90;

export const CLIP_A_START = INTRO;
export const CLIP_B_START = CLIP_A_START + CLIP_A;
export const KEY_START = CLIP_B_START + CLIP_B;
export const VERDICT_START = KEY_START + KEY;
export const OUTRO_START = VERDICT_START + VERDICT;
export const TOTAL = OUTRO_START + OUTRO;

const scenes = [
  { name: 'intro', start: 0, len: INTRO },
  { name: 'clipA', start: CLIP_A_START, len: CLIP_A },
  { name: 'clipB', start: CLIP_B_START, len: CLIP_B },
  { name: 'key', start: KEY_START, len: KEY },
  { name: 'verdict', start: VERDICT_START, len: VERDICT },
  { name: 'outro', start: OUTRO_START, len: OUTRO },
];
const cues = [
  { frame: 2, type: 'impact', gain: 0.8 }, { frame: 10, type: 'pop', pitch: 0, pan: -0.5 }, { frame: 18, type: 'pop', pitch: 3, pan: 0.5 }, { frame: 40, type: 'impact', gain: 0.6 },
  { frame: CLIP_A_START, type: 'whoosh' }, { frame: CLIP_B_START, type: 'whoosh' },
  { frame: KEY_START, type: 'whoosh' }, { frame: KEY_START + 20, type: 'tick' }, { frame: KEY_START + 26, type: 'tick' }, { frame: KEY_START + 32, type: 'tick' },
  { frame: VERDICT_START - 20, type: 'riser', len: 0.7 }, { frame: VERDICT_START, type: 'impact', gain: 0.9 }, { frame: VERDICT_START + 24, type: 'up', pan: 0 },
  { frame: OUTRO_START, type: 'roll' }, { frame: OUTRO_START, type: 'whoosh' },
];
export const timeline = {
  id: 'duel', fps: FPS, bpm: 100, total: TOTAL, scenes, cues,
  sections: [
    { start: 0, len: INTRO, kind: 'intro', chords: ['Dm'] },
    { start: CLIP_A_START, len: CLIP_A + CLIP_B, kind: 'groove', chords: ['Dm', 'Am', 'F', 'G'], intensity: 1.05 },
    { start: KEY_START, len: KEY, kind: 'break', chords: ['Dm', 'F'] },
    { start: VERDICT_START, len: VERDICT, kind: 'groove', chords: ['Am', 'G', 'F', 'Em'], intensity: 1.15 },
    { start: OUTRO_START, len: OUTRO, kind: 'outro', chords: ['Am'] },
  ],
};
