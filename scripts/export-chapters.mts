// Chapitres de la vidéo hebdo pour le site : instant de chaque scène et passages de chaque champion.
//   npx tsx scripts/export-chapters.mts --format=meta-movers   →  out/<format>-chapters.json
// Publié dans la release de la semaine avec `<format>.web.mp4` et `<format>.jpg` (render.yml) ; lu par
// nexus-core (scripts/publish-meta-movers-video.mjs) pour lancer la vidéo au passage d'un champion (fiche
// champion) ou d'un rôle (tier list par rôle). Les instants viennent de timeline.ts : un timing changé là
// se répercute ici sans rien recopier.
import fs from 'node:fs';
import path from 'node:path';

const arg = (n: string, d: string) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const id = arg('format', 'meta-movers');
if (id !== 'meta-movers') throw new Error(`chapitres non définis pour le format ${id}`);

const { default: data } = await import('../src/data/tierlist.json', { with: { type: 'json' } });
const T = await import('../src/formats/meta-movers/timeline.ts');
const sec = (f: number) => Math.round((f / T.FPS) * 100) / 100;

type Moment = { t: number; scene: string; kind: 'spotlight' | 'splus' | 'board' | 'up' | 'down'; role: string; tier?: string | null; from?: string; to?: string };
const champions = new Map<string, { key: string; name: string; moments: Moment[] }>();
const add = (c: { key: string; name: string }, m: Moment) => {
  if (!champions.has(c.key)) champions.set(c.key, { key: c.key, name: c.name, moments: [] });
  champions.get(c.key)!.moments.push(m);
};

data.roles.forEach((r, i) => r.splus.forEach((c) => add(c, { t: sec(T.ROLES_START + i * T.ROLE), scene: r.role.toLowerCase(), kind: c.key === r.spotlight ? 'spotlight' : 'splus', role: r.role, tier: c.tier })));
const boardChamps = data.board.rows.flatMap((r) => r.champs);
data.board.moved.forEach((k) => { const c = boardChamps.find((x) => x.key === k); if (c) add(c, { t: sec(T.BOARD_START), scene: 'board', kind: 'board', role: data.board.role }); });
for (const [kind, list] of [['up', data.moves.ups], ['down', data.moves.downs]] as const) {
  list.forEach((m) => add(m, { t: sec(T.LIST_START), scene: 'list', kind, role: m.role, from: m.from, to: m.to }));
}

const out = {
  schema: 'wrc.video-chapters/1',
  format: id,
  week: data.week,
  patch: data.patch,
  fps: T.FPS,
  duration: sec(T.TOTAL),
  scenes: T.timeline.scenes.map((s: { name: string; start: number; len: number }) => ({ name: s.name, start: sec(s.start), len: sec(s.len) })),
  champions: [...champions.values()],
};
fs.mkdirSync('out', { recursive: true });
const file = path.resolve('out', `${id}-chapters.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
console.log(`${out.champions.length} champions, ${out.scenes.length} scènes, ${out.duration} s → ${path.relative(process.cwd(), file)}`);
