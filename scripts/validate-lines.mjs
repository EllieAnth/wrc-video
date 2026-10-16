#!/usr/bin/env node
// Garde-fou des lignes avant tout rendu : budgets, langue, noms coupés, patch/hash périmés, et
// répétition de la décision clé entre champions (texte normalisé). Sortie ≠ 0 si un fichier échoue.
//   node scripts/validate-lines.mjs [--slugs=a,b] [--status=validated] [--quiet]
// `--status=validated` exige aussi que chaque fichier soit au moins `validated` (pas `draft`).
import fs from 'node:fs';
import path from 'node:path';
import { STATUSES, checkFile } from './lines-contract.mjs';
import { dataHash } from './draft-lines-hash.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const DIR = path.join(ROOT, 'src/data/champion-lines');
const slugs = arg('slugs', '') ? arg('slugs', '').split(',') : fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const minStatus = arg('status', 'draft'); const QUIET = process.argv.includes('--quiet');

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\b(the|a|an|your|you|to|and|of|on|in|with|for)\b/g, '').replace(/\s+/g, ' ').trim();
const decisions = new Map();
let failed = 0;
for (const slug of slugs) {
  const file = JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8'));
  const dataPath = path.join(ROOT, `public/data/champions/${slug}.json`);
  const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : null;
  const issues = checkFile(file, data);
  if (data && file.dataHash && file.dataHash !== dataHash(data)) issues.push(`dataHash périmé (${file.dataHash} ≠ ${dataHash(data)}) : données changées, relire`);
  if (STATUSES.indexOf(file.status) < STATUSES.indexOf(minStatus)) issues.push(`status ${file.status} < ${minStatus}`);
  const key = norm(file.lines?.decision?.title?.text);
  if (key) { if (decisions.has(key)) issues.push(`decision.title identique à ${decisions.get(key)} : « ${file.lines.decision.title.text} »`); else decisions.set(key, slug); }
  if (issues.length) { failed++; console.log(`✗ ${slug}\n  - ${issues.join('\n  - ')}`); } else if (!QUIET) console.log(`✓ ${slug} (${file.status})`);
}
console.log(`${slugs.length - failed}/${slugs.length} fichiers valides`);
process.exit(failed ? 1 : 0);
