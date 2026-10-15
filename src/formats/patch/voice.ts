import data from '../../data/patch.json';

const names = (xs: { name: string }[]) => xs.map((x) => x.name).join(', ').replace(/, ([^,]*)$/, ' and $1');
const top = [...data.effects].sort((a, b) => Math.abs(b.wrDelta) - Math.abs(a.wrDelta)).slice(0, 4);
const fx = (e: typeof top[number]) => `${e.name} ${e.wrDelta > 0 ? 'up' : 'down'} ${Math.abs(e.wrDelta).toFixed(1)} points`;

export const title = `Patch ${data.notesVersion} in 30 seconds`;
export const voice: { scene: string; offset?: number; text: string }[] = [
  { scene: 'intro', offset: 6, text: `Patch ${data.notesVersion.replace(/(\d)([a-z])/, '$1 $2')}, in thirty seconds.` },
  { scene: 'buffs', offset: 4, text: `Buffs: ${names(data.buffs)}.` },
  { scene: 'nerfs', offset: 4, text: `Nerfs: ${names(data.nerfs)}.` },
  { scene: 'items', offset: 4, text: `Items: ${names(data.items)}.` },
  { scene: 'effects', offset: 4, text: `Did the last patch work? ${top.map(fx).join('. ')}.` },
  { scene: 'outro', offset: 4, text: 'Full patch notes and every win rate on wild rift core dot com.' },
];
