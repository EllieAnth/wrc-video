import data from '../../data/duel.json';

const pct = (n: number | null) => (n == null ? '' : `${n.toFixed(1).replace('.0', '')} percent`);
const winner = data.edge > 0 ? data.a : data.b;
const loser = data.edge > 0 ? data.b : data.a;
const strength = Math.abs(data.edge) >= 2 ? 'clearly' : 'slightly';

export const title = `Duel of the Week · ${data.a.name} vs ${data.b.name} · patch ${data.patch}`;
export const voice: { scene: string; offset?: number; text: string }[] = [
  { scene: 'intro', offset: 6, text: `Duel of the week, ${data.role.toLowerCase()} lane: ${data.a.name} versus ${data.b.name}.` },
  { scene: 'clipA', offset: 4, text: `${data.a.name}, number one of the role, ${pct(data.a.winRate)} win rate.` },
  { scene: 'clipB', offset: 4, text: `${data.b.name}, picked in ${pct(data.b.pickRate)} of games, ${pct(data.b.winRate)} win rate.` },
  { scene: 'key', offset: 4, text: data.keyInteraction },
  { scene: 'verdict', offset: 6, text: `Verdict: ${winner.name} ${strength} wins this matchup. ${loser.name} players, ban or dodge.` },
  { scene: 'outro', offset: 4, text: 'Every counter, with the key interaction, on wild rift core dot com.' },
];
