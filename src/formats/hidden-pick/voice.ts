import data from '../../data/hidden.json';

const p = data.pick;
const pct = (n: number | null) => (n == null ? '' : `${n.toFixed(1).replace('.0', '')} percent`);
const roleName: Record<string, string> = { TOP: 'top', JUNGLE: 'jungle', MID: 'mid', ADC: 'dragon lane', SUPPORT: 'support' };

export const title = `Hidden Pick · ${p.name} ${p.role} · patch ${data.patch}`;
export const voice: { scene: string; offset?: number; text: string }[] = [
  { scene: 'hook', offset: 4, text: `Nobody plays this ${roleName[p.role]} pick. They should.` },
  { scene: 'numbers', offset: 4, text: `${p.name}: ${pct(p.winRate)} win rate, only ${pct(p.pickRate)} pick rate, at ${data.rank}.` },
  { scene: 'proof', offset: 4, text: `${p.name} ${roleName[p.role]} is ${p.tier === 'S_PLUS' ? 'S plus' : p.tier} on our tier list, and the curve says it is not a fluke.` },
  { scene: 'try', offset: 4, text: `Try it this week. ${data.others.length ? `Also under the radar: ${data.others.map((o) => o.name).join(' and ')}.` : ''}` },
  { scene: 'outro', offset: 4, text: 'Builds and runes on wild rift core dot com.' },
];
