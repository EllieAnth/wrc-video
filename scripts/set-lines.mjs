#!/usr/bin/env node
// Applique des lignes écrites en session à un ou plusieurs fichiers src/data/champion-lines/<slug>.json :
//   node scripts/set-lines.mjs --from=<spec.json> [--by="agent sonnet lot 3"]
// spec.json = { "<slug>": { tagline, decision: { title, sub, spell? }, execution: { why, spell? },
//               plan: { early, mid, late }, matchup?: { vs, line }, combo?: <index dans data.combos> }, … }
// Chaque champ texte est soit une chaîne, soit { text, why?, confidence?, source? }. Les champs absents
// gardent la valeur du brouillon. Le fichier passe en `status: validated` et est contrôlé (contrat) ;
// un fichier invalide n'est pas écrit. L'auteur va dans `reviewedBy`.
import fs from 'node:fs';
import path from 'node:path';
import { checkFile, get, set } from './lines-contract.mjs';
import { dataHash } from './draft-lines-hash.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : d; };
const spec = JSON.parse(fs.readFileSync(path.resolve(arg('from', '')), 'utf8'));
const by = arg('by', 'session');
const DEFAULT_SOURCE = { tagline: 'build.label + spells', 'decision.title': 'tips + gamePlan', 'decision.sub': 'tips + spells', 'execution.why': 'combos[i].tip', 'plan.early': 'gamePlan.early', 'plan.mid': 'gamePlan.mid', 'plan.late': 'gamePlan.late', 'matchup.line': 'matchups.hard (key_interaction)' };
const entry = (v, field, prev) => { const o = typeof v === 'string' ? { text: v } : { ...v }; return { text: o.text, source: o.source || prev?.source || DEFAULT_SOURCE[field], why: o.why || prev?.why || 'written in session from the data file', confidence: o.confidence ?? 0.8 }; };

let ok = 0, ko = 0;
for (const [slug, s] of Object.entries(spec)) {
  const file = path.join(ROOT, 'src/data/champion-lines', `${slug}.json`);
  const f = JSON.parse(fs.readFileSync(file, 'utf8'));
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/champions/${slug}.json`), 'utf8'));
  const L = f.lines;
  for (const field of ['tagline', 'decision.title', 'decision.sub', 'execution.why', 'plan.early', 'plan.mid', 'plan.late', 'matchup.line']) {
    const v = get(s, field); if (v == null) continue;
    set(L, field, entry(v, field, get(L, field)));
  }
  if (s.decision?.spell) L.decision.spell = s.decision.spell;
  if (s.execution?.spell) L.execution.spell = s.execution.spell;
  if (s.matchup?.vs) { L.matchup ??= {}; L.matchup.vs = s.matchup.vs; }
  if (typeof s.combo === 'number') { const c = data.combos[s.combo]; if (!c) { console.log(`✗ ${slug} : combo ${s.combo} absent`); ko++; continue; } L.combo = { name: c.name, inputs: c.inputs, source: `combos[${s.combo}]` }; }
  f.status = 'validated'; f.reviewedBy = by; f.writtenAt = new Date().toISOString().slice(0, 10); f.dataHash = dataHash(data);
  const issues = checkFile(f, data);
  if (issues.length) { ko++; console.log(`✗ ${slug}\n  - ${issues.join('\n  - ')}`); continue; }
  fs.writeFileSync(file, JSON.stringify(f, null, 1) + '\n'); ok++; console.log(`✓ ${slug}`);
}
console.log(`${ok} écrits, ${ko} refusés`);
process.exit(ko ? 1 : 0);
