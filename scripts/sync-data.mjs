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
const LEDGER_ROLE = { TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', ADC: 'DRAGON', SUPPORT: 'SUPPORT' };
const TIER_RANK = { C: 0, B: 1, A: 2, S: 3, S_PLUS: 4 };

// ── Sources ───────────────────────────────────────────────────────────────────
const computed = json('assets/data/tierlist-computed.json');
const avatars = json('assets/data/champions-avatar-index.json');
const avatarByNorm = new Map(avatars.map((a) => [norm(a.name), a]));
const changelog = json('assets/data/tierlist-changelog.json');
const meta = json('assets/data/meta_current.json');
const trends = json('assets/data/meta-trends.json');
const palettes = json('assets/data/champion-palettes.json');
const ledger = json('assets/data/counters-matchup-ledger.json');
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
// Le n° 1 d'un rôle contre un pick populaire du même rôle : écart le plus net, confiance ≥ 0,85.
const pairFor = (a, b, role) => ledger.pairs[`${a}|${b}|${role}`] || null;
const slugByNorm = new Map(); for (const k of Object.keys(ledger.pairs)) { const [a, b] = k.split('|'); slugByNorm.set(norm(a), a); slugByNorm.set(norm(b), b); }
let duel = null;
for (const r of roles) {
  const top = [...r.splus].sort((a, b) => b.score - a.score)[0];
  if (!top) continue;
  const popular = (computed.roles[r.role] || []).filter((c) => norm(c.name) !== top.key).sort((a, b) => b.breakdown.pickRate - a.breakdown.pickRate).slice(0, 8);
  for (const p of popular) {
    const A = slugByNorm.get(top.key), B = slugByNorm.get(norm(p.name));
    if (!A || !B) continue;
    const lr = LEDGER_ROLE[r.role];
    const ab = pairFor(A, B, lr), ba = pairFor(B, A, lr);
    const pair = ab || ba; if (!pair || !pair.include || pair.confidence < 0.85) continue;
    const edge = ab ? ab.edge : -ba.edge; // signe vu du n° 1
    const cand = { ...common, role: r.role, a: champ(r.role.toLowerCase(), top.key, top.name), b: champ(r.role.toLowerCase(), norm(p.name), p.name), edge, confidence: pair.confidence, type: pair.type, tags: pair.tags, keyInteraction: pair.key_interaction, judgedFrom: pair.judgedFrom };
    if (!duel || Math.abs(cand.edge) > Math.abs(duel.edge) || (Math.abs(cand.edge) === Math.abs(duel.edge) && cand.confidence > duel.confidence)) duel = cand;
  }
}

// ── 3. Hidden Pick ────────────────────────────────────────────────────────────
const hiddenRows = Object.entries(computed.roles).flatMap(([role, rows]) => rows.map((c) => ({ role, c })))
  .filter(({ c }) => c.breakdown.pickRate < 2 && c.breakdown.winRate >= 54 && TIER_RANK[c.computedTier] >= 2)
  .sort((x, y) => y.c.breakdown.winRate - x.c.breakdown.winRate);
const hiddenRow = hiddenRows[0];
const hiddenReason = hiddenRow && (lanes[hiddenRow.role.toLowerCase()].tiers[hiddenRow.c.computedTier] || []).find((c) => norm(c.name) === norm(hiddenRow.c.name))?.reason?.en;
const hidden = hiddenRow ? { ...common, pick: { ...champ(hiddenRow.role.toLowerCase(), norm(hiddenRow.c.name), hiddenRow.c.name), reason: hiddenReason || null }, others: hiddenRows.slice(1, 3).map(({ role, c }) => champ(role.toLowerCase(), norm(c.name), c.name)) } : null;

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

// ── 5. Draft Report (mensuel) ─────────────────────────────────────────────────
const draftFile = list('assets/data/draft-trends').filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().at(-1);
const dt = json(`assets/data/draft-trends/${draftFile}`);
const pickRole = (r) => (r === 'DRAGON' ? 'ADC' : r);
const draft = {
  ...common,
  generatedAt: dt.generatedAt, windowDays: dt.windowDays, drafts: dt.drafts,
  bySurface: dt.bySurface, byLang: dt.byLang.slice(0, 5), byCountry: (dt.byCountry || []).filter((c) => c.country !== 'XX').slice(0, 5),
  recoFollow: dt.recoFollow,
  mostFaced: dt.picks.filter((p) => p.side === 'enemy').slice(0, 5).map((p) => ({ ...champ(pickRole(p.role).toLowerCase(), norm(p.champ), nameFor(norm(p.champ))), n: p.n })),
  mostPicked: dt.picks.filter((p) => p.side === 'ally').slice(0, 5).map((p) => ({ ...champ(pickRole(p.role).toLowerCase(), norm(p.champ), nameFor(norm(p.champ))), n: p.n })),
  topPairs: (dt.pairs || []).slice(0, 3).map((p) => ({ role: pickRole(p.role), pick: norm(p.pick), pickName: nameFor(norm(p.pick)), versus: norm(p.versus), versusName: nameFor(norm(p.versus)), n: p.n })),
};

// ── Visuels ───────────────────────────────────────────────────────────────────
// CommunityDragon (même hôte que champions-avatar-index du site) : `tile` 380 px pour les cartes,
// `splash-art/centered` 1280×720 pour les fonds. Clips d'action : aperçus officiels Riot des sorts
// (CDN des pages champion de leagueoflegends.com, « Legal Jibber Jabber »).
const keys = new Set();
const collect = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(collect); if (typeof o.key === 'string' && o.key && 'name' in o && 'palette' in o) keys.add(o.key); for (const v of Object.values(o)) if (v && typeof v === 'object') collect(v); };
collect([movers, duel, hidden, patch, draft]); keys.add(heroKey);
for (const p of draft.topPairs) { keys.add(p.pick); keys.add(p.versus); }

const fetchTo = async (url, out, type = 'image/') => {
  if (fs.existsSync(out)) return true;
  const res = await fetch(url);
  if (!res.ok || !String(res.headers.get('content-type')).startsWith(type)) { console.warn(`! ${url} : ${res.status}`); return false; }
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer())); return true;
};
const iconDir = path.join(ROOT, 'public/champions'); fs.mkdirSync(iconDir, { recursive: true });
const splashDir = path.join(ROOT, 'public/splash'); fs.mkdirSync(splashDir, { recursive: true });
const clipDir = path.join(ROOT, 'public/clips'); fs.mkdirSync(clipDir, { recursive: true });
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
if (duel) clipJobs.push({ key: duel.a.key, spell: 'R' }, { key: duel.b.key, spell: 'R' });
if (hidden) clipJobs.push({ key: hidden.pick.key, spell: 'R' });
for (const e of patch.effects.slice(0, 3)) clipJobs.push({ key: e.key, spell: 'R' });
for (const { key, spell } of clipJobs) {
  const id = idFor(key); if (id == null) { console.warn(`! pas d'id Riot pour ${key}`); continue; }
  const pad = String(id).padStart(4, '0');
  const out = path.join(clipDir, `${key}-${spell}.webm`);
  if (await fetchTo(`https://d28xe8vt774jo5.cloudfront.net/champion-abilities/${pad}/ability_${pad}_${spell}1.webm`, out, 'video/')) clips[`${key}-${spell}`] = { src: `clips/${key}-${spell}.webm`, start: CLIP_START[`${key}-${spell}`] ?? 0.4 };
}

movers.clips = clips;
write('tierlist.json', movers);
write('duel.json', duel);
write('hidden.json', hidden);
write('patch.json', patch);
write('draft.json', draft);
write('splash.json', [...splashKeys].filter((k) => fs.existsSync(path.join(splashDir, `${k}.jpg`))));
console.log(`patch ${common.patch} · semaine ${common.week.start} → ${common.week.end} · ${keys.size} icônes · ${splashKeys.size} splashs · ${Object.keys(clips).length} clips Riot`);
console.log(`duel : ${duel ? `${duel.a.name} vs ${duel.b.name} (${duel.role}, edge ${duel.edge})` : 'aucun'} · hidden : ${hidden ? `${hidden.pick.name} ${hidden.pick.winRate}% / ${hidden.pick.pickRate}%` : 'aucun'} · patch ${patch.version} : ${patch.effects.length} effets, ${patch.buffs.length} buffs, ${patch.nerfs.length} nerfs · draft : ${draft.drafts} drafts`);
