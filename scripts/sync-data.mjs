#!/usr/bin/env node
// Extrait les données PUBLIÉES de nexus-core (origin/main, jamais l'arbre de travail : une
// session pair peut y avoir des tierslist/*.json en cours) vers src/data/, et télécharge les
// icônes de champions dans public/champions/. Lecture seule côté nexus-core.
//
//   node scripts/sync-data.mjs [--nexus=../nexus-core]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (name, def) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : def;
};
const NEXUS = path.resolve(arg('nexus', '../nexus-core'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const show = (file, enc = 'utf8') =>
  execFileSync('git', ['-C', NEXUS, 'show', `origin/main:${file}`], { maxBuffer: 1e9, encoding: enc });
const json = (file) => JSON.parse(show(file));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];
const TIER_RANK = { C: 0, B: 1, A: 2, S: 3, S_PLUS: 4 };

const computed = json('assets/data/tierlist-computed.json');
const avatars = json('assets/data/champions-avatar-index.json');
const avatarByNorm = new Map(avatars.map((a) => [norm(a.name), a]));
const changelog = json('assets/data/tierlist-changelog.json');
const meta = json('assets/data/meta_current.json');

const statsFor = (role, key) =>
  (computed.roles[role.toUpperCase()] || []).find((c) => norm(c.champKey) === norm(key))?.breakdown;

const roles = ROLES.map((role) => {
  const t = json(`tierslist/${role}.json`);
  return {
    role: role.toUpperCase(),
    label: t.laneLabel,
    splus: (t.tiers.S_PLUS || []).map((c) => {
      const b = statsFor(role, c.champKey);
      return { key: norm(c.name), name: c.name, winRate: b?.winRate ?? null, pickRate: b?.pickRate ?? null };
    }),
  };
});

// Derniers mouvements : le passage le plus récent du journal (le site n'affiche que le net du patch,
// mais une vidéo hebdo montre ce qui vient de bouger).
const lastRun = changelog.runs.at(-1);
const moves = lastRun.changes
  .filter((c) => c.from && c.to)
  .map((c) => ({ key: norm(c.name), name: c.name, role: c.role, from: c.from, to: c.to, delta: TIER_RANK[c.to] - TIER_RANK[c.from] }));
const byHeight = (a, b) => Math.abs(b.delta) - Math.abs(a.delta) || Math.max(TIER_RANK[b.to], TIER_RANK[b.from]) - Math.max(TIER_RANK[a.to], TIER_RANK[a.from]);
const ups = moves.filter((m) => m.delta > 0).sort(byHeight).slice(0, 3);
const downs = moves.filter((m) => m.delta < 0).sort(byHeight).slice(0, 3);

// Héros de l'intro : le champion au meilleur score calculé, tous rôles confondus.
const hero = Object.values(computed.roles).flat().sort((a, b) => b.score - a.score || b.percentile - a.percentile)[0];
const heroKey = norm(hero.name);

const data = {
  patch: meta.patch.version,
  syncedAt: new Date().toISOString().slice(0, 10),
  rank: computed.danLabel,
  hero: heroKey,
  roles,
  moves: { date: lastRun.date, ups, downs },
};

fs.mkdirSync(path.join(ROOT, 'src/data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/data/tierlist.json'), JSON.stringify(data, null, 2) + '\n');

// Visuels CommunityDragon (même hôte que champions-avatar-index du site) : `tile` 380 px pour les
// cartes (le `square` de l'index fait 128 px, flou à 300 px en 1080p), `splash-art/centered`
// 1280×720 pour l'intro.
const iconDir = path.join(ROOT, 'public/champions');
fs.mkdirSync(iconDir, { recursive: true });
const keys = new Set([...roles.flatMap((r) => r.splus.map((c) => c.key)), ...ups.map((m) => m.key), ...downs.map((m) => m.key)]);
for (const key of keys) {
  const out = path.join(iconDir, `${key}.jpg`);
  if (fs.existsSync(out)) continue;
  const a = avatarByNorm.get(key);
  if (!a) { console.warn(`! pas d'icône pour ${key}`); continue; }
  const res = await fetch(a.icon.replace(/\/square$/, '/tile'));
  if (!res.ok || !String(res.headers.get('content-type')).startsWith('image/')) { console.warn(`! ${key} : ${res.status} ${res.headers.get('content-type')}`); continue; }
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}
const heroArt = avatarByNorm.get(heroKey)?.icon.replace(/\/square$/, '/splash-art/centered');
const heroRes = heroArt && (await fetch(heroArt));
if (heroRes?.ok) fs.writeFileSync(path.join(ROOT, `public/hero-${heroKey}.jpg`), Buffer.from(await heroRes.arrayBuffer()));
else console.warn(`! pas de splash pour ${heroKey}`);

console.log(`patch ${data.patch} · ${keys.size} icônes · héros ${heroKey} · mouvements du ${lastRun.date} : ${ups.length}▲ ${downs.length}▼`);
