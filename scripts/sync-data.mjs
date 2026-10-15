#!/usr/bin/env node
// Extrait les données PUBLIÉES de nexus-core (origin/main, jamais l'arbre de travail : une session
// pair peut y avoir des tierslist/*.json en cours) vers src/data/, un fichier par format, et
// télécharge les visuels (public/champions, public/splash, public/clips/*-R.webm).
// Lecture seule côté nexus-core. Les clips de créateurs, eux, viennent de scripts/fetch-clips.mjs.
//
//   node scripts/sync-data.mjs [--nexus=../nexus-core]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (name, def) => { const hit = process.argv.find((a) => a.startsWith(`--${name}=`)); return hit ? hit.split('=')[1] : def; };
const NEXUS = path.resolve(arg('nexus', '../nexus-core'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = path.join(ROOT, 'src/data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const show = (file) => { try { return execFileSync('git', ['-C', NEXUS, 'show', `origin/main:${file}`], { maxBuffer: 1e9, stdio: ['pipe', 'pipe', 'ignore'] }).toString(); } catch { return null; } };
const json = (file) => { const t = show(file); if (t == null) throw new Error(`absent d'origin/main : ${file}`); return JSON.parse(t); };
const tryJson = (file) => { const t = show(file); return t == null ? null : JSON.parse(t); };
const list = (dir) => execFileSync('git', ['-C', NEXUS, 'ls-tree', '--name-only', `origin/main:${dir}`], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');
const write = (name, obj) => fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(obj, null, 2) + '\n');

const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];
const TIER_RANK = { C: 0, B: 1, A: 2, S: 3, S_PLUS: 4 };

// ── Sources ───────────────────────────────────────────────────────────────────
const computed = json('assets/data/tierlist-computed.json');
const avatars = json('assets/data/champions-avatar-index.json');
// Quatre entrées de l'index (mel, nidalee, rell, velkoz, mesuré le 15/10) portent un slug à la place de l'URL :
// on reconstruit l'URL CommunityDragon sur le même gabarit que les autres (vérifié : /tile et /splash-art répondent 200).
const avatarByNorm = new Map(avatars.map((a) => [norm(a.name), /^https?:\/\//.test(a.icon) ? a : { ...a, icon: `https://cdn.communitydragon.org/latest/champion/${a.slug || a.icon}/square` }]));
const changelog = json('assets/data/tierlist-changelog.json');
const meta = json('assets/data/meta_current.json');
const trends = json('assets/data/meta-trends.json');
const palettes = json('assets/data/champion-palettes.json');
const patchEffect = json('assets/data/patch-effect.json');
const lanes = Object.fromEntries(ROLES.map((r) => [r, json(`tierslist/${r}.json`)]));

const trendRows = Array.isArray(trends.champions) ? trends.champions : Object.values(trends.champions);
const trendFor = (key, role) => trendRows.find((c) => norm(c.name) === key && c.role === role) || trendRows.find((c) => norm(c.name) === key) || null;
const sparkFor = (key, role) => { const t = trendFor(key, role); return t ? { values: t.sparkline, dates: t.sparklineDates, delta7d: t.delta7d, delta30d: t.delta30d } : null; };
const rowFor = (role, key) => (computed.roles[role.toUpperCase()] || []).find((c) => norm(c.champKey) === key || norm(c.name) === key);
const paletteFor = (key) => palettes[key] || Object.entries(palettes).find(([k]) => norm(k) === key)?.[1] || null;
const nameFor = (key) => avatarByNorm.get(key)?.name || key;

// Semaine de méta (lundi → dimanche) du dernier recalcul de la tier list, pas de la date du rendu.
const computedDay = new Date(computed.computedAt.slice(0, 10) + 'T00:00:00Z');
const monday = new Date(computedDay); monday.setUTCDate(computedDay.getUTCDate() - ((computedDay.getUTCDay() + 6) % 7));
const sunday = new Date(monday); sunday.setUTCDate(monday.getUTCDate() + 6);
const isoDay = (d) => d.toISOString().slice(0, 10);
const common = { patch: meta.patch.version, week: { start: isoDay(monday), end: isoDay(sunday) }, rank: computed.danLabel, syncedAt: isoDay(new Date()) };

const champ = (role, key, name) => {
  const b = rowFor(role, key);
  return { key, name: name || b?.name || nameFor(key), role: role.toUpperCase(), winRate: b?.breakdown?.winRate ?? null, pickRate: b?.breakdown?.pickRate ?? null, banRate: b?.breakdown?.banRate ?? null, score: b?.score ?? 0, tier: b?.computedTier ?? null, palette: paletteFor(key), spark: sparkFor(key, role.toUpperCase()) };
};

// ── 1. Meta Movers (tier list hebdo) ──────────────────────────────────────────
const roles = ROLES.map((role) => {
  const t = lanes[role];
  const splus = (t.tiers.S_PLUS || []).map((c) => ({ ...champ(role, norm(c.name), c.name), reason: c.reason?.en || null }));
  const spotlight = [...splus].sort((a, b) => b.score - a.score)[0]?.key ?? null;
  return { role: role.toUpperCase(), spotlight, splus };
});
const lastRun = changelog.runs.at(-1);
const moves = lastRun.changes.filter((c) => c.from && c.to).map((c) => ({ ...champ(c.role.toLowerCase(), norm(c.name), c.name), from: c.from, to: c.to, delta: TIER_RANK[c.to] - TIER_RANK[c.from] }));
const byHeight = (a, b) => Math.abs(b.delta) - Math.abs(a.delta) || Math.max(TIER_RANK[b.to], TIER_RANK[b.from]) - Math.max(TIER_RANK[a.to], TIER_RANK[a.from]);
const hero = Object.values(computed.roles).flat().sort((a, b) => b.score - a.score || b.percentile - a.percentile)[0];
const heroKey = norm(hero.name);
// Tableau animé : le rôle qui a le plus bougé, tiers S+ → B, état avant (reconstitué depuis le journal) et après.
const movesByRole = {}; for (const m of moves) movesByRole[m.role] = (movesByRole[m.role] || 0) + 1;
const boardRole = Object.entries(movesByRole).sort((a, b) => b[1] - a[1])[0]?.[0] || 'TOP';
const lane = lanes[boardRole.toLowerCase()];
const lite = (role, c) => { const b = rowFor(role, norm(c.name)); return { key: norm(c.name), name: c.name, palette: paletteFor(norm(c.name)), winRate: b?.breakdown?.winRate ?? null }; };
const rowsAfter = ['S_PLUS', 'S', 'A', 'B'].map((tier) => ({ tier, champs: (lane.tiers[tier] || []).map((c) => lite(boardRole.toLowerCase(), c)) }));
const roleMoves = moves.filter((m) => m.role === boardRole);
const rowsBefore = rowsAfter.map((r) => ({ tier: r.tier, champs: r.champs.filter((c) => !roleMoves.some((m) => m.key === c.key && m.to === r.tier)) }));
for (const m of roleMoves) { const r = rowsBefore.find((x) => x.tier === m.from); if (r) r.champs.push(rowsAfter.flatMap((x) => x.champs).find((c) => c.key === m.key) || lite(boardRole.toLowerCase(), m)); }
const movers = { ...common, hero: heroKey, roles, board: { role: boardRole, rows: rowsAfter, fromRows: rowsBefore, moved: roleMoves.map((m) => m.key) }, moves: { date: lastRun.date, ups: moves.filter((m) => m.delta > 0).sort(byHeight).slice(0, 3), downs: moves.filter((m) => m.delta < 0).sort(byHeight).slice(0, 3) } };

// ── 2. Duel of the Week ───────────────────────────────────────────────────────
// ── 4. Patch : notes + effet mesuré ───────────────────────────────────────────
const effect = patchEffect.patches.at(-1);
const notesFile = list('assets/data').filter((f) => /^patch\d+[a-z]?\.json$/.test(f)).sort().at(-1);
const notes = notesFile ? tryJson(`assets/data/${notesFile}`) : null;
const noteChamp = (c, type) => ({ key: norm(c.name), name: c.name, type, summary: c.summary?.en || null, abilities: (c.abilities || []).map((a) => ({ slot: a.slot, name: a.en })), palette: paletteFor(norm(c.name)) });
const patch = {
  ...common,
  version: effect.version, date: effect.date,
  notesVersion: notesFile?.replace(/^patch|\.json$/g, '').replace(/^(\d)(\d)/, '$1.$2'),
  buffs: (notes?.champions?.buffs || []).map((c) => noteChamp(c, 'buff')),
  nerfs: (notes?.champions?.nerfs || []).map((c) => noteChamp(c, 'nerf')),
  adjustments: (notes?.champions?.adjustments || notes?.champions?.ajustements || []).map((c) => noteChamp(c, 'adjust')),
  items: ['buffs', 'nerfs'].flatMap((t) => (notes?.items?.[t] || []).map((i) => ({ key: i.itemKey, name: i.name_en || i.name, type: t.slice(0, -1), summary: i.summary?.en || null, image: i.imageUrl || null }))),
  effects: effect.champions.map((c) => ({ key: norm(c.name), name: c.name, type: c.type, wrBefore: c.wr.before, wrAfter: c.wr.after, wrDelta: c.wr.delta, days: c.wr.days, pickBefore: c.pick?.before ?? null, pickAfter: c.pick?.after ?? null, pickDelta: c.pick?.delta ?? null, palette: paletteFor(norm(c.name)) })).sort((a, b) => Math.abs(b.wrDelta) - Math.abs(a.wrDelta)),
};

// ── Visuels ───────────────────────────────────────────────────────────────────
// CommunityDragon (même hôte que champions-avatar-index du site) : `tile` 380 px pour les cartes,
// `splash-art/centered` 1280×720 pour les fonds. Clips d'action : aperçus officiels Riot des sorts
// (CDN des pages champion de leagueoflegends.com, « Legal Jibber Jabber »).
const keys = new Set();
const collect = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(collect); if (typeof o.key === 'string' && o.key && 'name' in o && 'palette' in o) keys.add(o.key); for (const v of Object.values(o)) if (v && typeof v === 'object') collect(v); };
collect([movers, patch]); keys.add(heroKey);

const fetchTo = async (url, out, type = 'image/') => {
  if (fs.existsSync(out)) return true;
  if (!/^https?:\/\//.test(url)) { console.warn(`! pas une URL : ${url} (${path.basename(out)})`); return false; } // ex. Nidalee, icon: 'nidalee' dans l'index du site (15/10)
  const res = await fetch(url);
  if (!res.ok || !String(res.headers.get('content-type')).startsWith(type)) { console.warn(`! ${url} : ${res.status}`); return false; }
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer())); return true;
};
const iconDir = path.join(ROOT, 'public/champions'); fs.mkdirSync(iconDir, { recursive: true });
const splashDir = path.join(ROOT, 'public/splash'); fs.mkdirSync(splashDir, { recursive: true });
const clipDir = path.join(ROOT, 'public/clips'); fs.mkdirSync(clipDir, { recursive: true });
// Images d'objets du patch : fichiers du site (assets/images/...), copiés depuis origin/main.
const itemDir = path.join(ROOT, 'public/items'); fs.mkdirSync(itemDir, { recursive: true });
for (const it of patch.items) {
  if (!it.image) continue;
  const rel = it.image.replace(/^\//, ''); const out = path.join(itemDir, `${it.key}${path.extname(rel)}`);
  try { if (!fs.existsSync(out)) fs.writeFileSync(out, execFileSync('git', ['-C', NEXUS, 'show', `origin/main:${rel}`], { maxBuffer: 1e8, stdio: ['pipe', 'pipe', 'ignore'] })); it.image = `items/${path.basename(out)}`; }
  catch { console.warn(`! image d'objet absente : ${rel}`); it.image = null; }
}
for (const key of keys) {
  const a = avatarByNorm.get(key);
  if (!a) { console.warn(`! pas d'icône pour ${key}`); continue; }
  await fetchTo(a.icon.replace(/\/square$/, '/tile'), path.join(iconDir, `${key}.jpg`));
}
// Tous les champions cités : CreatorPanel se replie sur le splash quand aucun clip de créateur n'existe.
const splashKeys = keys;
for (const key of splashKeys) { const a = avatarByNorm.get(key); if (a) await fetchTo(a.icon.replace(/\/square$/, '/splash-art/centered'), path.join(splashDir, `${key}.jpg`)); }

const summary = await (await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json')).json();
const idFor = (key) => summary.find((c) => norm(c.alias) === key || norm(c.name) === key)?.id;
const CLIP_START = { 'nocturne-R': 4.6, 'malphite-R': 0.6 }; // instant (s) où l'action commence, relevé sur une planche à 2 i/s
const clips = {};
const used = new Set();
const clipJobs = [{ key: heroKey, spell: 'R' }];
for (const r of roles) { if (!r.spotlight) continue; r.spotlightSpell = used.has(r.spotlight) ? 'Q' : 'R'; used.add(r.spotlight); clipJobs.push({ key: r.spotlight, spell: r.spotlightSpell }); }
for (const e of patch.effects.slice(0, 3)) clipJobs.push({ key: e.key, spell: 'R' });
for (const { key, spell } of clipJobs) {
  const id = idFor(key); if (id == null) { console.warn(`! pas d'id Riot pour ${key}`); continue; }
  const pad = String(id).padStart(4, '0');
  const out = path.join(clipDir, `${key}-${spell}.webm`);
  if (await fetchTo(`https://d28xe8vt774jo5.cloudfront.net/champion-abilities/${pad}/ability_${pad}_${spell}1.webm`, out, 'video/')) clips[`${key}-${spell}`] = { src: `clips/${key}-${spell}.webm`, start: CLIP_START[`${key}-${spell}`] ?? 0.4 };
}

movers.clips = clips;
write('tierlist.json', movers);
write('patch.json', patch);
write('splash.json', [...splashKeys].filter((k) => fs.existsSync(path.join(splashDir, `${k}.jpg`))));
console.log(`patch ${common.patch} · semaine ${common.week.start} → ${common.week.end} · ${keys.size} icônes · ${splashKeys.size} splashs · ${Object.keys(clips).length} clips Riot`);
