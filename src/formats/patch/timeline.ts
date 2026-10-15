// Timeline de « Patch in 30 seconds » (30 i/s, 100 BPM).
export const FPS = 30;
export const INTRO = 75;
export const BUFFS = 150;
export const NERFS = 150;
export const ITEMS = 90;
export const EFFECTS = 180; // « did it work? » : 4 champions, avant → après
export const OUTRO = 90;

export const BUFFS_START = INTRO;
export const NERFS_START = BUFFS_START + BUFFS;
export const ITEMS_START = NERFS_START + NERFS;
export const EFFECTS_START = ITEMS_START + ITEMS;
export const OUTRO_START = EFFECTS_START + EFFECTS;
export const TOTAL = OUTRO_START + OUTRO;
export const EFFECT_EVERY = 42; // une ligne d'effet toutes les 42 images

const scenes = [
  { name: 'intro', start: 0, len: INTRO }, { name: 'buffs', start: BUFFS_START, len: BUFFS }, { name: 'nerfs', start: NERFS_START, len: NERFS },
  { name: 'items', start: ITEMS_START, len: ITEMS }, { name: 'effects', start: EFFECTS_START, len: EFFECTS }, { name: 'outro', start: OUTRO_START, len: OUTRO },
];
const cues = [
  { frame: 2, type: 'impact', gain: 0.8 }, { frame: 20, type: 'tick' }, { frame: 26, type: 'tick' }, { frame: 32, type: 'tick' }, { frame: 38, type: 'pop', pitch: 5 },
  { frame: BUFFS_START, type: 'whoosh' }, ...[0, 1, 2, 3].map((i) => ({ frame: BUFFS_START + 12 + i * 8, type: 'up', pan: -0.6 + i * 0.4 })),
  { frame: NERFS_START, type: 'whoosh' }, ...[0, 1, 2, 3].map((i) => ({ frame: NERFS_START + 12 + i * 8, type: 'down', pan: -0.6 + i * 0.4 })),
  { frame: ITEMS_START, type: 'whoosh' }, { frame: ITEMS_START + 14, type: 'pop', pitch: 0 }, { frame: ITEMS_START + 26, type: 'pop', pitch: 2 }, { frame: ITEMS_START + 38, type: 'pop', pitch: 4 },
  { frame: EFFECTS_START - 16, type: 'riser', len: 0.5 }, { frame: EFFECTS_START, type: 'impact', gain: 0.8 },
  ...[0, 1, 2, 3].map((i) => ({ frame: EFFECTS_START + 20 + i * EFFECT_EVERY, type: 'tick' })),
  { frame: OUTRO_START, type: 'roll' }, { frame: OUTRO_START, type: 'whoosh' },
];
export const timeline = {
  id: 'patch', fps: FPS, bpm: 100, total: TOTAL, scenes, cues,
  sections: [
    { start: 0, len: INTRO, kind: 'intro', chords: ['Am'] },
    { start: BUFFS_START, len: BUFFS, kind: 'groove', chords: ['C', 'G', 'Am', 'F'], intensity: 1 },
    { start: NERFS_START, len: NERFS, kind: 'groove', chords: ['Am', 'F', 'Dm', 'Em'], intensity: 1 },
    { start: ITEMS_START, len: ITEMS, kind: 'break', chords: ['F', 'G'] },
    { start: EFFECTS_START, len: EFFECTS, kind: 'groove', chords: ['Am', 'C', 'G', 'F'], intensity: 1.15 },
    { start: OUTRO_START, len: OUTRO, kind: 'outro', chords: ['Am'] },
  ],
};
