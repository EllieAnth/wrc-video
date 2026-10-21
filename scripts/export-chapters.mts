// Chapitres d'une vidéo hebdo pour le site : instant de chaque scène et passages de chaque champion.
//   npx tsx scripts/export-chapters.mts --format=meta-movers|patch   →  out/<format>-chapters.json
// Publié dans la release de la semaine avec `<format>.web.mp4` et `<format>.jpg` (render.yml) ; lu par
// nexus-core (scripts/publish-meta-movers-video.mjs) pour lancer la vidéo au passage d'un champion (fiche
// champion) ou d'un rôle (tier list par rôle). Les instants viennent de timeline.ts : un timing changé là
// se répercute ici sans rien recopier.
import fs from 'node:fs';
import path from 'node:path';

const arg = (n: string, d: string) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const id = arg('format', 'meta-movers');

type Moment = { t: number; scene: string; kind: string; role?: string; tier?: string | null; from?: string; to?: string; wrDelta?: number; days?: number };
const champions = new Map<string, { key: string; name: string; moments: Moment[] }>();
const add = (c: { key: string; name: string }, m: Moment) => {
  if (!champions.has(c.key)) champions.set(c.key, { key: c.key, name: c.name, moments: [] });
  champions.get(c.key)!.moments.push(m);
};

let T: { FPS: number; TOTAL: number; timeline: { scenes: { name: string; start: number; len: number }[] } };
let head: Record<string, unknown>;
if (id === 'meta-movers') {
  const { default: data } = await import('../src/data/tierlist.json', { with: { type: 'json' } });
  const M = await import('../src/formats/meta-movers/timeline.ts');
  T = M;
  const sec = (f: number) => Math.round((f / M.FPS) * 100) / 100;
  data.roles.forEach((r, i) => r.splus.forEach((c) => add(c, { t: sec(M.ROLES_START + i * M.ROLE), scene: r.role.toLowerCase(), kind: c.key === r.spotlight ? 'spotlight' : 'splus', role: r.role, tier: c.tier })));
  const boardChamps = data.board.rows.flatMap((r) => r.champs);
  data.board.moved.forEach((k) => { const c = boardChamps.find((x) => x.key === k); if (c) add(c, { t: sec(M.BOARD_START), scene: 'board', kind: 'board', role: data.board.role }); });
  for (const [kind, list] of [['up', data.moves.ups], ['down', data.moves.downs]] as const) {
    list.forEach((m) => add(m, { t: sec(M.LIST_START), scene: 'list', kind, role: m.role, from: m.from, to: m.to }));
  }
  head = { week: data.week, patch: data.patch };
} else if (id === 'patch') {
  const { default: data } = await import('../src/data/patch.json', { with: { type: 'json' } });
  const P = await import('../src/formats/patch/timeline.ts');
  T = P;
  const sec = (f: number) => Math.round((f / P.FPS) * 100) / 100;
  data.buffs.forEach((c) => add(c, { t: sec(P.BUFFS_START), scene: 'buffs', kind: 'buff' }));
  data.nerfs.forEach((c) => add(c, { t: sec(P.NERFS_START), scene: 'nerfs', kind: 'nerf' }));
  // Même sélection que la composition (index.tsx) : les 4 plus gros écarts de win rate.
  [...data.effects].sort((a, b) => Math.abs(b.wrDelta) - Math.abs(a.wrDelta)).slice(0, 4)
    .forEach((e) => add(e, { t: sec(P.EFFECTS_START), scene: 'effects', kind: 'effect', wrDelta: e.wrDelta, days: e.days }));
  head = { week: data.week, patch: data.version, patchDate: data.date, counts: { buffs: data.buffs.length, nerfs: data.nerfs.length, items: data.items.length } };
} else {
  throw new Error(`chapitres non définis pour le format ${id}`);
}

const sec = (f: number) => Math.round((f / T.FPS) * 100) / 100;
const out = {
  schema: 'wrc.video-chapters/1',
  format: id,
  ...head,
  fps: T.FPS,
  duration: sec(T.TOTAL),
  scenes: T.timeline.scenes.map((s) => ({ name: s.name, start: sec(s.start), len: sec(s.len) })),
  champions: [...champions.values()],
};
fs.mkdirSync('out', { recursive: true });
const file = path.resolve('out', `${id}-chapters.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
console.log(`${out.champions.length} champions, ${out.scenes.length} scènes, ${out.duration} s → ${path.relative(process.cwd(), file)}`);
