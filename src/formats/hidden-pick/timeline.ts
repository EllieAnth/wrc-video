// Timeline de « Hidden Pick » (30 i/s, 100 BPM).
export const FPS = 30;
export const HOOK = 75;    // « nobody plays him »
export const NUMBERS = 120; // les deux chiffres
export const PROOF = 150;  // clip + courbe
export const TRY = 90;     // « try it this week » + les deux suivants
export const OUTRO = 90;

export const NUMBERS_START = HOOK;
export const PROOF_START = NUMBERS_START + NUMBERS;
export const TRY_START = PROOF_START + PROOF;
export const OUTRO_START = TRY_START + TRY;
export const TOTAL = OUTRO_START + OUTRO;

const scenes = [
  { name: 'hook', start: 0, len: HOOK }, { name: 'numbers', start: NUMBERS_START, len: NUMBERS }, { name: 'proof', start: PROOF_START, len: PROOF },
  { name: 'try', start: TRY_START, len: TRY }, { name: 'outro', start: OUTRO_START, len: OUTRO },
];
const cues = [
  { frame: 2, type: 'impact', gain: 0.7 }, { frame: 30, type: 'tick' }, { frame: 36, type: 'tick' }, { frame: 42, type: 'tick' },
  { frame: NUMBERS_START, type: 'whoosh' }, { frame: NUMBERS_START + 14, type: 'up', pan: -0.4 }, { frame: NUMBERS_START + 50, type: 'down', pan: 0.4 }, { frame: NUMBERS_START + 90, type: 'pop', pitch: 4 },
  { frame: PROOF_START, type: 'whoosh' }, { frame: PROOF_START + 60, type: 'pop', pitch: 2 },
  { frame: TRY_START, type: 'impact', gain: 0.6 }, { frame: TRY_START + 30, type: 'pop', pitch: 1, pan: -0.3 }, { frame: TRY_START + 36, type: 'pop', pitch: 3, pan: 0.3 },
  { frame: OUTRO_START, type: 'roll' }, { frame: OUTRO_START, type: 'whoosh' },
];
export const timeline = {
  id: 'hidden-pick', fps: FPS, bpm: 100, total: TOTAL, scenes, cues,
  sections: [
    { start: 0, len: HOOK, kind: 'intro', chords: ['Em'] },
    { start: NUMBERS_START, len: NUMBERS, kind: 'break', chords: ['Em', 'C'] },
    { start: PROOF_START, len: PROOF + TRY, kind: 'groove', chords: ['Em', 'C', 'G', 'G'], intensity: 1 },
    { start: OUTRO_START, len: OUTRO, kind: 'outro', chords: ['Em'] },
  ],
};
