#!/usr/bin/env node
// Données d'un ou de tous les champions pour le format `champion-35s`, lues sur origin/main de
// nexus-core (jamais l'arbre de travail), écrites dans public/data/champions/<slug>.json (généré,
// non versionné) + src/data/champions-index.json (versionné : slug, nom, rôle, lacunes).
//
//   node scripts/sync-champions.mjs [--nexus=../nexus-core] [--slugs=garen,senna] [--no-media]
//
// Sources (décision du 16/10, debat-video-champion-2026-10-16-reponse.md) :
//   - slugs canoniques = assets/data/build-engine/builds/index.json (142, = URL des fiches)
//   - build : build-engine/builds/<slug>.json (variants[0], boots, runes, power.spikes EN) — la SEULE
//     source d'objets des fiches depuis le 30/09 ; noms/icônes : build-engine/item-display.json
//   - tier, win rate : tierlist-computed.json (rôle du build), rang `danLabel`, patch meta_current.json
//   - sorts : champion-abilities.json (noms + descriptions EN), icônes assets/images/spells-local
//   - ordre de sorts, combos, plan de jeu, conseils : champions.enriched.json (champs *_en seulement ;
//     un champ français est traité comme absent — jamais de fuite FR dans une vidéo EN)
//   - matchups : counters-matchup-ledger.json (edge miroité du point de vue du champion)
//   - visuels : icône/splash CommunityDragon, aperçus Riot des sorts (cloudfront, id LoL)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (name, def) => { const hit = process.argv.find((a) => a.startsWith(`--${name}=`)); return hit ? hit.split('=')[1] : def; };
const NEXUS = path.resolve(arg('nexus', '../nexus-core'));
const ONLY = arg('slugs', '') ? new Set(arg('slugs', '').split(',')) : null;
const MEDIA = !process.argv.includes('--no-media');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public/data/champions'); fs.mkdirSync(OUT, { recursive: true });
for (const d of ['public/champions', 'public/splash', 'public/items', 'public/spells']) fs.mkdirSync(path.join(ROOT, d), { recursive: true });
// Aperçus Riot : ≈ 3 Mo × 4 sorts × 142 champions ≈ 1,7 Go — jamais sur le disque natif (règle T7).
// `public/clips-champ` est un lien vers le T7 quand il est monté ; sinon un dossier local (Actions).
const PREV_DIR = path.join(ROOT, 'public/clips-champ');
if (!fs.existsSync(PREV_DIR)) {
  const t7 = '/Volumes/T7/wrc-video-cache/clips-champ';
  if (fs.existsSync('/Volumes/T7')) { fs.mkdirSync(t7, { recursive: true }); fs.symlinkSync(t7, PREV_DIR); } else fs.mkdirSync(PREV_DIR, { recursive: true });
}

const show = (file, bin = false) => { try { return execFileSync('git', ['-C', NEXUS, 'show', `origin/main:${file}`], { maxBuffer: 1e9, stdio: ['pipe', 'pipe', 'ignore'], encoding: bin ? 'buffer' : 'utf8' }); } catch { return null; } };
const json = (file) => { const t = show(file); if (t == null) throw new Error(`absent d'origin/main : ${file}`); return JSON.parse(t); };
const list = (dir) => execFileSync('git', ['-C', NEXUS, 'ls-tree', '--name-only', `origin/main:${dir}`], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const compact = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
// Un texte français n'est jamais une donnée EN. Mesuré le 16/10 : 315 notes d'objets `note_en` en français.
const FR = /\b(le|la|les|des|une|pour|avec|sur|tes|ton|ta|est|et|ou|pas|si|dans|sans|puis|vers|contre|après|avant|très|plus|bouclier|dégâts|soin|sorts|objectif|couloir|adversaire|ennemi|gagne|tour|ultime|niveau)\b/i;
const en = (s) => (typeof s === 'string' && s.trim() && !FR.test(s) ? s.trim() : null);

// ── Sources ───────────────────────────────────────────────────────────────────
const index = json('assets/data/build-engine/builds/index.json');
const meta = json('assets/data/meta_current.json');
const tier = json('assets/data/tierlist-computed.json');
const display = json('assets/data/build-engine/item-display.json').items;
const abilities = json('assets/data/champion-abilities.json').abilities;
const enriched = json('assets/data/champions.enriched.json');
const palettes = json('assets/data/champion-palettes.json');
const avatars = json('assets/data/champions-avatar-index.json');
const ledger = json('assets/data/counters-matchup-ledger.json').pairs;
const spellFiles = new Set(list('assets/images/spells-local'));
const summary = await (await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json')).json();

const enrichedByKey = new Map(enriched.map((c) => [compact(c.name), c]));
const avatarByKey = new Map(avatars.map((a) => [compact(a.name), a]));
const tierByKey = {}; for (const [role, rows] of Object.entries(tier.roles)) for (const r of rows) tierByKey[`${compact(r.champKey)}|${role}`] = r;
const LOL_ALIAS = { wukong: 'MonkeyKing', 'nunu-willump': 'Nunu' };
const lolId = (slug) => { const want = compact(LOL_ALIAS[slug] || slug); return summary.find((c) => compact(c.alias) === want || compact(c.name) === want)?.id ?? null; };
const spellPrefix = (() => { const m = new Map(); for (const f of spellFiles) { const x = f.match(/^(.+?)_?([PQWER])\.webp$/); if (x && !m.has(compact(x[1]))) m.set(compact(x[1]), x[1]); } return m; })();
const ROLE_LEDGER = { ADC: 'DRAGON' };
const ROLE_LABEL = { TOP: 'Baron lane', JUNGLE: 'Jungle', MID: 'Mid lane', ADC: 'Dragon lane', SUPPORT: 'Support' };

const fetchTo = async (url, out, type = 'image/') => {
  if (fs.existsSync(out)) return true;
  const res = await fetch(url).catch(() => null);
  // Les aperçus cloudfront répondent parfois `binary/octet-stream` (Cho'Gath, 16/10) : on juge sur l'extension.
  const ct = String(res?.headers.get('content-type') || '');
  if (!res || !res.ok) { console.warn(`! ${url} : ${res?.status ?? 'réseau'}`); return false; }
  const buf = Buffer.from(await res.arrayBuffer());
  // Un WebM se reconnaît à son en-tête EBML (1A 45 DF A3), pas au content-type : cloudfront sert
  // `binary/octet-stream` ou `text/plain` pour certains ids (Cho'Gath, 16/10) — et une page d'erreur en 200.
  const ok = type === 'video/' ? buf.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) : ct.startsWith(type);
  if (!ok) { console.warn(`! ${url} : ${res.status} ${ct} (${buf.length} o, pas un ${type})`); return false; }
  fs.writeFileSync(out, buf); return true;
};
const copyFromRepo = (repoPath, out) => { if (fs.existsSync(out)) return true; const b = show(repoPath.replace(/^\//, ''), true); if (!b) return false; fs.writeFileSync(out, b); return true; };

// ── Un champion ───────────────────────────────────────────────────────────────
const build = (slug) => json(`assets/data/build-engine/builds/${slug}.json`);
const matchupsFor = (slug, role) => {
  const want = ROLE_LEDGER[role] || role;
  const out = [];
  for (const [key, p] of Object.entries(ledger)) {
    if (!p.include || !key.endsWith(`|${want}`) || !p.champions.includes(slug)) continue;
    const [a, b] = p.champions; const edge = a === slug ? p.edge : -p.edge;
    const other = a === slug ? b : a;
    if (!en(p.key_interaction)) continue;
    out.push({ vs: other, edge, confidence: p.confidence, type: p.type, line: p.key_interaction });
  }
  return out.sort((x, y) => y.confidence - x.confidence);
};

async function one(entry) {
  const slug = entry.slug; const key = compact(slug);
  const b = build(slug); const role = b.role;
  const e = enrichedByKey.get(key) || null; const av = avatarByKey.get(key) || avatarByKey.get(compact(LOL_ALIAS[slug] || slug)) || null;
  const name = av?.name || e?.name || slug;
  const t = tierByKey[`${key}|${role}`] || null;
  const items = [...b.variants[0].items, b.boots].map((s) => ({ slug: s, name: display[s]?.en || s, icon: display[s]?.icon || null }));
  const spells = (abilities[key] || abilities[slug] || []).map((a) => ({ key: a.k, name: a.n, desc: a.de || null }));
  const gp = e?.gamePlan?.[role] || e?.gamePlan?.ALL || null;
  const combos = (e?.combos || []).filter((c) => en(c.inputs_en) && en(c.tip_en)).map((c) => ({ name: en(c.name_en) || en(c.name) || null, difficulty: c.difficulty || null, inputs: c.inputs_en, tip: c.tip_en }));
  const spikes = (b.power?.spikes || []).map((s) => ({ level: s.level, label: s.en })).filter((s) => s.label);
  const tips = [...(e?.playTips?.[`${role}_en`] || []), ...(e?.playTips?.ALL_en || [])].map(en).filter(Boolean);
  const matchups = matchupsFor(slug, role);
  const hard = matchups.filter((m) => m.edge <= -1).slice(0, 3), easy = matchups.filter((m) => m.edge >= 1).slice(0, 2);
  const id = lolId(slug);
  const data = {
    schema: 'wrc.champion-data/1', slug, key, name, role, roleLabel: ROLE_LABEL[role] || role, patch: meta.patch.version, patchLabel: meta.patch.label?.en || meta.patch.version,
    rank: tier.danLabel, computedAt: tier.computedAt, palette: palettes[slug] || palettes[key] || null, lolId: id,
    stats: t ? { tier: t.computedTier, winRate: t.breakdown?.winRate ?? null, pickRate: t.breakdown?.pickRate ?? null, banRate: t.breakdown?.banRate ?? null } : null,
    build: { label: b.variants[0].label?.en || 'Standard', items, keystone: display[b.runes?.keystone]?.en || b.runes?.keystone || null, spikes },
    skill: e?.skillOrder?.priority ? { priority: e.skillOrder.priority, levels: (e.skillOrder.levels || []).slice(0, 15) } : null,
    spells, combos, gamePlan: gp ? { early: en(gp.early_en), mid: en(gp.mid_en), late: en(gp.late_en) } : null, tips,
    matchups: { hard, easy },
    media: { icon: null, splash: null, spellIcons: {}, previews: {} },
  };
  if (MEDIA) {
    const iconUrl = av?.icon && /^https?:/.test(av.icon) ? av.icon : `https://cdn.communitydragon.org/latest/champion/${av?.slug || key}/square`;
    if (await fetchTo(iconUrl.replace(/\/square$/, '/tile'), path.join(ROOT, `public/champions/${slug}.jpg`))) data.media.icon = `champions/${slug}.jpg`;
    if (await fetchTo(iconUrl.replace(/\/square$/, '/splash-art/centered'), path.join(ROOT, `public/splash/${slug}.jpg`))) data.media.splash = `splash/${slug}.jpg`;
    for (const it of items) { if (it.icon && copyFromRepo(it.icon, path.join(ROOT, `public/items/${it.slug}${path.extname(it.icon)}`))) it.icon = `items/${it.slug}${path.extname(it.icon)}`; else it.icon = null; }
    const prefix = spellPrefix.get(key) || spellPrefix.get(compact(LOL_ALIAS[slug] || slug));
    for (const k of ['P', 'Q', 'W', 'E', 'R']) {
      const file = prefix ? `${prefix}${k === 'P' ? '_P' : k}.webp` : null;
      if (file && spellFiles.has(file) && copyFromRepo(`assets/images/spells-local/${file}`, path.join(ROOT, `public/spells/${slug}-${k}.webp`))) data.media.spellIcons[k] = `spells/${slug}-${k}.webp`;
    }
    if (id != null) {
      const pad = String(id).padStart(4, '0');
      for (const k of ['Q', 'W', 'E', 'R']) {
        const out = path.join(PREV_DIR, `${slug}-${k}.webm`);
        if (await fetchTo(`https://d28xe8vt774jo5.cloudfront.net/champion-abilities/${pad}/ability_${pad}_${k}1.webm`, out, 'video/')) data.media.previews[k] = `clips-champ/${slug}-${k}.webm`;
      }
    }
  }
  // Pour les matchups, l'icône de l'adversaire sert à la scène « plan » : même CDN.
  for (const m of [...hard, ...easy]) {
    const oa = avatarByKey.get(compact(m.vs)) || avatarByKey.get(compact(LOL_ALIAS[m.vs] || m.vs));
    m.name = oa?.name || m.vs;
    if (MEDIA && oa) { const u = /^https?:/.test(oa.icon) ? oa.icon : `https://cdn.communitydragon.org/latest/champion/${oa.slug}/square`; if (await fetchTo(u.replace(/\/square$/, '/tile'), path.join(ROOT, `public/champions/${m.vs}.jpg`))) m.icon = `champions/${m.vs}.jpg`; }
  }
  data.gaps = [
    !data.stats && 'stats', !data.skill && 'skill', !combos.length && 'combo', !data.gamePlan && 'gamePlan', !hard.length && 'matchup',
    !spells.length && 'spells', MEDIA && !data.media.previews.R && 'previewR', MEDIA && !data.media.splash && 'splash',
  ].filter(Boolean);
  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(data, null, 1) + '\n');
  return { slug, name, role, tier: data.stats?.tier ?? null, gaps: data.gaps };
}

const entries = index.champions.filter((c) => !ONLY || ONLY.has(c.slug));
const rows = [];
for (const c of entries) { rows.push(await one(c)); process.stdout.write(`${c.slug} `); }
const idxPath = path.join(ROOT, 'src/data/champions-index.json');
const prev = fs.existsSync(idxPath) ? JSON.parse(fs.readFileSync(idxPath, 'utf8')) : { champions: [] };
const merged = new Map(prev.champions.map((c) => [c.slug, c])); for (const r of rows) merged.set(r.slug, r);
fs.writeFileSync(idxPath, JSON.stringify({ schema: 'wrc.champions-index/1', patch: meta.patch.version, syncedAt: new Date().toISOString().slice(0, 10), champions: [...merged.values()].sort((a, b) => a.slug.localeCompare(b.slug)) }, null, 1) + '\n');
const gapCount = {}; for (const r of rows) for (const g of r.gaps) gapCount[g] = (gapCount[g] || 0) + 1;
console.log(`\n${rows.length} champions · patch ${meta.patch.version} · ${tier.danLabel} · lacunes : ${JSON.stringify(gapCount)}`);
