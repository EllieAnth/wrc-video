#!/usr/bin/env node
// Props d'une composition `champion-35s` pour un champion : données (public/data/champions) +
// lignes (src/data/champion-lines), écrites en un JSON que `remotion render --props=` et stills.mts
// consomment. Pas de calculateMetadata ni de fetch côté navigateur : tout est résolu ici, en Node.
//   node scripts/champion-props.mjs --slug=garen [--allow-draft]  →  out/props/garen.json (chemin sur stdout)
import fs from 'node:fs';
import path from 'node:path';
import { checkFile } from './lines-contract.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
export function propsFor(slug, { allowDraft = false } = {}) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/champions/${slug}.json`), 'utf8'));
  const lines = JSON.parse(fs.readFileSync(path.join(ROOT, `src/data/champion-lines/${slug}.json`), 'utf8'));
  const issues = checkFile(lines, data);
  if (issues.length) throw new Error(`${slug} : lignes invalides\n  - ${issues.join('\n  - ')}`);
  if (!allowDraft && lines.status === 'draft') throw new Error(`${slug} : lignes encore en brouillon (status draft) — --allow-draft pour une planche d'essai`);
  return { slug, data, lines };
}
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  const slug = arg('slug', ''); if (!slug) { console.error('--slug=<slug> requis'); process.exit(2); }
  const props = propsFor(slug, { allowDraft: process.argv.includes('--allow-draft') });
  const out = path.join(ROOT, 'out/props', `${slug}.json`); fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(props) + '\n');
  console.log(out);
}
