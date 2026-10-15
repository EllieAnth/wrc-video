// Timeline de « Meta Movers » (30 i/s, 100 BPM : un temps = 18 images, une mesure = 72).
// Lue par la composition ET par scripts/cues.mts (bande-son) : un seul endroit pour changer un timing.
import data from '../../data/tierlist.json';

export const FPS = 30;
export const INTRO = 75;
export const ROLE = 150;
export const BOARD = 105;
export const LIST = 120;
export const OUTRO = 90;
export const CARD_DELAY = 14;
export const CARD_STAGGER = 5;
export const BOARD_GLIDE = 30; // image (dans la scène) où les cartes commencent à se replacer
export const BOARD_TRAVEL = 26;
export const ROW_DELAY = 16;
export const ROW_STAGGER = 7;
export const DOWNS_OFFSET = 24;

const nRoles = data.roles.length;
export const ROLES_START = INTRO;
export const BOARD_START = ROLES_START + ROLE * nRoles;
export const LIST_START = BOARD_START + BOARD;
export const OUTRO_START = LIST_START + LIST;
export const TOTAL = OUTRO_START + OUTRO;

type Cue = { frame: number; type: 'whoosh' | 'pop' | 'up' | 'down' | 'impact' | 'riser' | 'tick' | 'crash' | 'roll'; pan?: number; pitch?: number; gain?: number; len?: number };
const cues: Cue[] = [{ frame: 2, type: 'impact', gain: 0.8 }, { frame: ROLES_START, type: 'riser', len: 1.4 }];
const scenes = [{ name: 'intro', start: 0, len: INTRO }];
data.roles.forEach((r, i) => {
  const start = ROLES_START + i * ROLE;
  scenes.push({ name: r.role.toLowerCase(), start, len: ROLE });
  cues.push({ frame: start, type: 'whoosh' });
  r.splus.forEach((_, j) => cues.push({ frame: start + CARD_DELAY + j * CARD_STAGGER, type: 'pop', pitch: j, pan: j % 2 ? 0.3 : -0.3 }));
});
scenes.push({ name: 'board', start: BOARD_START, len: BOARD });
cues.push({ frame: BOARD_START, type: 'whoosh' });
data.board.moved.forEach((_, i) => cues.push({ frame: BOARD_START + BOARD_GLIDE + 4 + i * 4, type: 'tick', pan: i % 2 ? 0.4 : -0.4 }));
scenes.push({ name: 'list', start: LIST_START, len: LIST });
cues.push({ frame: LIST_START, type: 'whoosh' });
data.moves.ups.forEach((_, i) => cues.push({ frame: LIST_START + ROW_DELAY + i * ROW_STAGGER, type: 'up', pan: -0.3 }));
data.moves.downs.forEach((_, i) => cues.push({ frame: LIST_START + ROW_DELAY + DOWNS_OFFSET + i * ROW_STAGGER, type: 'down', pan: 0.3 }));
scenes.push({ name: 'outro', start: OUTRO_START, len: OUTRO });
cues.push({ frame: OUTRO_START, type: 'roll' }, { frame: OUTRO_START, type: 'whoosh' });

export const timeline = {
  id: 'meta-movers', fps: FPS, bpm: 100, total: TOTAL, scenes, cues,
  sections: [
    { start: 0, len: INTRO, kind: 'intro', chords: ['Am'] },
    { start: ROLES_START, len: ROLE * nRoles, kind: 'groove', chords: ['Am', 'F', 'C', 'G', 'Am'] },
    { start: BOARD_START, len: BOARD + LIST, kind: 'groove', chords: ['F', 'G', 'Am', 'Em'], intensity: 1.1 },
    { start: OUTRO_START, len: OUTRO, kind: 'outro', chords: ['Am'] },
  ],
};
