// Texte de la voix TikTok (« texte en parole »), une entrée par scène, en anglais. Exporté par scripts/export-voice.mts.
import data from '../../data/tierlist.json';

const pct = (n: number | null) => (n == null ? '' : `${n.toFixed(1).replace('.0', '')} percent`);
const list = (names: string[]) => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const roleName: Record<string, string> = { TOP: 'Top lane', JUNGLE: 'Jungle', MID: 'Mid lane', ADC: 'Dragon lane', SUPPORT: 'Support' };

export const title = `Meta Movers · patch ${data.patch} · week of ${data.week.start}`;
export const voice: { scene: string; offset?: number; text: string }[] = [
  { scene: 'intro', offset: 6, text: `Wild Rift tier list, patch ${data.patch}. Here is the meta of the week.` },
  ...data.roles.map((r) => {
    const star = r.splus.find((c) => c.key === r.spotlight) || r.splus[0];
    const others = r.splus.filter((c) => c !== star).map((c) => c.name);
    return { scene: r.role.toLowerCase(), offset: 4, text: `${roleName[r.role]}: ${star.name} leads${star.winRate != null ? ` at ${pct(star.winRate)}` : ''}${others.length ? `, with ${list(others)}` : ''}.` };
  }),
  { scene: 'board', offset: 4, text: `${roleName[data.board.role]} is where the meta moved this week. Watch the cards.` },
  { scene: 'list', offset: 4, text: `${list(data.moves.ups.map((m) => m.name))} ${data.moves.ups.length > 1 ? 'climb' : 'climbs'}. ${list(data.moves.downs.map((m) => m.name))} ${data.moves.downs.length > 1 ? 'drop' : 'drops'}.` },
  { scene: 'outro', offset: 4, text: 'Full tier list, with the reason for every tier, on wild rift core dot com.' },
];
