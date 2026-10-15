import { loadFont as loadOrbitron } from '@remotion/google-fonts/Orbitron';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';

// Polices et jetons repris du site (ssg-tierlist.css, ssg-meta.css) : la vidéo doit ressembler à la page.
export const TITLE = loadOrbitron('normal', { weights: ['700', '900'], subsets: ['latin'] }).fontFamily;
export const BODY = loadInter('normal', { weights: ['500', '600', '700', '800', '900'], subsets: ['latin'] }).fontFamily;

export const C = {
  bg0: '#05060d',
  bg1: '#0b0d1a',
  bg2: '#11152a',
  line: '#232b48',
  gold: '#d8b673',
  gold2: '#f0d79a',
  goldDeep: '#a8844a',
  cyan: '#42b7ff',
  cyan2: '#7dd4ff',
  text: '#eef2ff',
  muted: '#9ea8c7',
  up: '#4ade80',
  down: '#f87171',
  warn: '#ffb020',
};

export const TIER_COLOR: Record<string, string> = {
  S_PLUS: '#f0d79a', S: '#d8b673', A: '#42b7ff', B: '#9ea8c7', C: '#6b7390',
};
export const tierLabel = (t: string) => (t === 'S_PLUS' ? 'S+' : t);

// Texte imposé par la politique fan-content de Riot : il ne se traduit pas (scripts/lib/footer.mjs du site).
export const RIOT_NOTICE =
  'Wild Rift Core was created under Riot Games\' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.';

export const SITE = 'wildriftcore.com';
export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const fmtDay = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export const weekLabel = (w: { start: string; end: string }) => {
  const [a, b] = [fmtDay(w.start), fmtDay(w.end)];
  return a.split(' ')[0] === b.split(' ')[0] ? `${a} – ${b.split(' ')[1]}` : `${a} – ${b}`;
};
export const pct = (n: number | null | undefined, d = 1) => (n == null ? '—' : `${n.toFixed(d)}%`);
export const ROLE_SUB: Record<string, string> = { TOP: 'Baron lane', JUNGLE: 'Jungle', MID: 'Mid lane', ADC: 'Dragon lane', SUPPORT: 'Support' };
