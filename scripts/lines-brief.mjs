#!/usr/bin/env node
// Brief d'un lot pour un agent rédacteur : le contrat (docs/lines-brief.md), puis par champion un
// condensé des données (rôle, tier, build, sorts EN, combos, plan, conseils, matchups durs) et le
// brouillon courant. L'agent répond par un JSON au format de set-lines.mjs, jamais en éditant les fichiers.
//   node scripts/lines-brief.mjs --slugs=a,b,c [--out=/Volumes/T7/wrc-video-cache/lines/brief-<lot>.md]
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.slice(n.length + 3) : d; };
const slugs = arg('slugs', '').split(',').filter(Boolean);
if (!slugs.length) { console.error('--slugs=a,b requis'); process.exit(2); }
const out = [fs.readFileSync(path.join(ROOT, 'docs/lines-brief.md'), 'utf8'), '', '---', '', '# Champions of this lot', ''];
for (const slug of slugs) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, `public/data/champions/${slug}.json`), 'utf8'));
  const draft = JSON.parse(fs.readFileSync(path.join(ROOT, `src/data/champion-lines/${slug}.json`), 'utf8'));
  out.push(`## ${d.name} (\`${slug}\`) · ${d.role} · ${d.stats ? `${d.stats.tier} ${d.stats.winRate}% WR` : 'no stats this week'} · patch ${d.patch}${d.gaps.length ? ` · DATA GAPS: ${d.gaps.join(', ')}` : ''}`);
  out.push(`- build (${d.build.label}): ${d.build.items.map((i) => i.name).join(', ')} · keystone ${d.build.keystone}`);
  out.push(`- skill priority: ${d.skill?.priority || '(unknown)'} · spikes: ${d.build.spikes.map((s) => `L${s.level} ${s.label}`).join(' | ')}`);
  out.push('- abilities:'); for (const s of d.spells) out.push(`  - ${s.key} ${s.name}: ${s.desc || '(no description)'}`);
  if (d.combos.length) { out.push('- combos (index → name | inputs | tip):'); d.combos.forEach((c, i) => out.push(`  - ${i} → ${c.name || '(unnamed)'} | ${c.inputs} | ${c.tip}`)); } else out.push('- combos: none in the data → `execution.why` explains the ultimate or the core ability; no `combo` index.');
  out.push(`- game plan: ${d.gamePlan ? JSON.stringify(d.gamePlan) : '(none → derive from spikes and tips)'}`);
  if (d.tips.length) { out.push('- play tips:'); for (const t of d.tips.slice(0, 6)) out.push(`  - ${t}`); }
  if (d.matchups.hard.length) { out.push('- hard matchups (vs | edge | key interaction):'); for (const m of d.matchups.hard) out.push(`  - ${m.vs} | ${m.edge} | ${m.line}`); } else out.push('- hard matchups: none in the ledger → omit `matchup`.');
  out.push(`- current draft: ${JSON.stringify(Object.fromEntries(['tagline', 'decision', 'execution', 'plan', 'matchup'].map((k) => [k, draft.lines[k]])))}`);
  out.push('');
}
out.push('# Your answer', '', 'Reply with ONE JSON object, keyed by slug, in the exact shape of `scripts/set-lines.mjs` (fields: tagline, decision{title,sub,spell}, execution{why,spell}, combo (index), plan{early,mid,late}, matchup{vs,line}). Each text may be a string or {text, why, confidence}. Nothing else in the reply.');
const target = arg('out', path.join('/Volumes/T7/wrc-video-cache/lines', `brief-${slugs[0]}.md`));
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out.join('\n'));
console.log(`${slugs.length} champions → ${target} (${(fs.statSync(target).size / 1024).toFixed(0)} Ko)`);
