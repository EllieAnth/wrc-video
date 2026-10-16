#!/usr/bin/env node
// Brouillon DÉTERMINISTE des lignes d'un champion depuis ses données (0 token) :
//   node scripts/draft-lines.mjs --slugs=garen,senna [--force]
// Écrit src/data/champion-lines/<slug>.json en `status: draft`, à réécrire par un agent en session
// (champ par champ, jamais le fichier entier) puis `validated`. Un fichier existant n'est pas
// écrasé sans --force : les lignes validées sont un travail éditorial.
import fs from 'node:fs';
import path from 'node:path';
import { FIELDS, SCHEMA, set } from './lines-contract.mjs';
import { dataHash } from './draft-lines-hash.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const FORCE = process.argv.includes('--force');
const slugs = arg('slugs', '') ? arg('slugs', '').split(',') : fs.readdirSync(path.join(ROOT, 'public/data/champions')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const DIR = path.join(ROOT, 'src/data/champion-lines'); fs.mkdirSync(DIR, { recursive: true });

const clip = (s, max, words = 8) => {
  if (!s) return '';
  let t = s.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (t.length > max) { t = t.slice(0, max); t = t.slice(0, Math.max(t.lastIndexOf(' '), 12)); }
  if (words && t.split(' ').length > words) t = t.split(' ').slice(0, words).join(' ');
  return t.replace(/[,;:(\-–]$/, '');
};
const firstSentence = (s) => (s || '').split(/(?<=[.!?])\s/)[0];

for (const slug of slugs) {
  const out = path.join(DIR, `${slug}.json`);
  if (fs.existsSync(out) && !FORCE) { console.log(`= ${slug} (existe, --force pour écraser)`); continue; }
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/champions/${slug}.json`), 'utf8'));
  const combo = d.combos[0] || null; const hard = d.matchups.hard[0] || null;
  const lines = {};
  const put = (field, text, source, why) => set(lines, field, { text: clip(text, FIELDS[field].max, FIELDS[field].lines === 1 ? 8 : 0), source, why, confidence: 0.4 });
  put('tagline', d.build.label.replace(/^Standard\s*—\s*/i, '') ? `${d.build.label.replace(/^Standard\s*—\s*/i, '')} ${d.roleLabel.toLowerCase()}` : d.roleLabel, 'build.label', 'draft: archetype of the engine build');
  put('decision.title', firstSentence(d.tips[0] || d.gamePlan?.early || `Play around ${d.spells.find((s) => s.key === 'R')?.name || 'your ultimate'}`), d.tips[0] ? 'tips[0]' : 'gamePlan.early', 'draft: first play tip');
  put('decision.sub', d.tips[1] || d.gamePlan?.mid || d.build.spikes[0]?.label || '', d.tips[1] ? 'tips[1]' : 'gamePlan.mid', 'draft: second play tip');
  put('execution.why', combo?.tip || d.spells.find((s) => s.key === 'R')?.desc || '', combo ? 'combos[0].tip' : 'spells.R.desc', 'draft: combo tip');
  put('plan.early', d.gamePlan?.early || `Farm safely until ${d.build.items[0]?.name || 'first item'}`, 'gamePlan.early', 'draft');
  put('plan.mid', d.gamePlan?.mid || `Spike on ${d.build.items[1]?.name || 'second item'}`, 'gamePlan.mid', 'draft');
  put('plan.late', d.gamePlan?.late || 'Group and fight around objectives', 'gamePlan.late', 'draft');
  if (hard) { set(lines, 'matchup.vs', hard.vs); put('matchup.line', hard.line, `matchups.hard[0] (${hard.vs})`, 'draft: ledger key interaction'); }
  lines.combo = combo ? { name: combo.name, inputs: combo.inputs, source: 'combos[0]' } : null;
  const file = { schema: SCHEMA, slug, patch: d.patch, dataHash: dataHash(d), status: 'draft', writtenAt: new Date().toISOString().slice(0, 10), writtenBy: 'draft-lines.mjs', reviewedBy: null, lines };
  fs.writeFileSync(out, JSON.stringify(file, null, 1) + '\n');
  console.log(`+ ${slug} (brouillon${d.gaps.length ? `, lacunes : ${d.gaps.join(' ')}` : ''})`);
}
