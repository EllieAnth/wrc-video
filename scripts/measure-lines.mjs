#!/usr/bin/env node
// Lisibilité MESURÉE (demande du second agent, 16/10) : chaque ligne est posée dans un Chromium
// headless avec la police, le corps et la largeur exacts du gabarit (src/formats/champion-35s/index.tsx),
// et on compte les lignes rendues. Un budget en caractères (lines-contract.mjs) est une approximation ;
// ceci est la vérité du rendu. Sortie ≠ 0 si un champ déborde.
//   node scripts/measure-lines.mjs [--slugs=a,b] [--calibrate]   (--calibrate : largeur moyenne par caractère)
// Playwright vient de ../nexus-core (pas une dépendance de ce dépôt public) : local seulement, pas en Actions.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { FIELDS, get } from './lines-contract.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.resolve(ROOT, '../nexus-core/package.json'));
const { chromium } = require('playwright');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const DIR = path.join(ROOT, 'src/data/champion-lines');
const slugs = arg('slugs', '') ? arg('slugs', '').split(',') : fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));

// Gabarit : police, graisse, corps, largeur utile, interligne — à tenir en phase avec index.tsx.
const STYLE = {
  tagline: { font: 'Inter', weight: 800, px: 54, width: 940, lh: 1.15 },
  'decision.title': { font: 'Orbitron', weight: 900, px: 68, width: 940, lh: 1.1 },
  'decision.sub': { font: 'Inter', weight: 600, px: 42, width: 940, lh: 1.3 },
  'execution.why': { font: 'Inter', weight: 600, px: 40, width: 940, lh: 1.3 },
  'plan.early': { font: 'Inter', weight: 700, px: 38, width: 740, lh: 1.2 },
  'plan.mid': { font: 'Inter', weight: 700, px: 38, width: 740, lh: 1.2 },
  'plan.late': { font: 'Inter', weight: 700, px: 38, width: 740, lh: 1.2 },
  'matchup.line': { font: 'Inter', weight: 600, px: 32, width: 700, lh: 1.25 },
};
const html = `<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&family=Orbitron:wght@900&display=block"><style>body{margin:0;background:#000;color:#fff}.box{position:absolute;left:0;top:0;text-align:center}</style></head><body></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const measure = (field, text) => page.evaluate(([s, text]) => {
  const el = document.createElement('div'); el.className = 'box';
  Object.assign(el.style, { fontFamily: s.font, fontWeight: String(s.weight), fontSize: `${s.px}px`, lineHeight: String(s.lh), width: `${s.width}px` });
  el.textContent = text; document.body.appendChild(el);
  const lines = Math.round(el.getBoundingClientRect().height / (s.px * s.lh));
  const span = document.createElement('span'); span.style.whiteSpace = 'nowrap'; span.textContent = text; el.textContent = ''; el.appendChild(span);
  const w = span.getBoundingClientRect().width; el.remove();
  return { lines, width: w, perChar: w / text.length };
}, [STYLE[field], text]);

if (process.argv.includes('--calibrate')) {
  const sample = 'Force short trades when Decisive Strike is up, then reset the wave under tower';
  for (const field of Object.keys(STYLE)) { const m = await measure(field, sample); console.log(`${field.padEnd(16)} ${m.perChar.toFixed(1)} px/car. → ${Math.floor(STYLE[field].width / m.perChar)} car./ligne · budget ${FIELDS[field].max} sur ${FIELDS[field].lines} ligne(s)`); }
  await browser.close(); process.exit(0);
}
let failed = 0;
for (const slug of slugs) {
  const file = JSON.parse(fs.readFileSync(path.join(DIR, `${slug}.json`), 'utf8'));
  const bad = [];
  for (const field of Object.keys(STYLE)) {
    const text = get(file.lines, field)?.text; if (!text) continue;
    const m = await measure(field, text);
    if (m.lines > FIELDS[field].lines) bad.push(`${field} : ${m.lines} lignes rendues > ${FIELDS[field].lines} (« ${text} »)`);
  }
  if (bad.length) { failed++; console.log(`✗ ${slug}\n  - ${bad.join('\n  - ')}`); }
}
await browser.close();
console.log(`${slugs.length - failed}/${slugs.length} champions sans débordement`);
process.exit(failed ? 1 : 0);
