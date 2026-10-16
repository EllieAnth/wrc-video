#!/usr/bin/env node
// Planche-contact d'un ou plusieurs champions (12 images, 2 par scène) :
//   node scripts/champion-stills.mjs --slugs=garen,senna [--allow-draft] [--sheet-dir=/Volumes/T7/wrc-video-cache/stills]
// Enchaîne champion-props.mjs puis stills.mts (--props). C'est le juge final de la lisibilité.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { propsFor } from './champion-props.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const slugs = arg('slugs', '').split(',').filter(Boolean);
if (!slugs.length) { console.error('--slugs=a,b requis'); process.exit(2); }
const sheetDir = arg('sheet-dir', fs.existsSync('/Volumes/T7') ? '/Volumes/T7/wrc-video-cache/stills' : 'out/stills');
fs.mkdirSync(path.join(ROOT, 'out/props'), { recursive: true });
for (const slug of slugs) {
  const props = propsFor(slug, { allowDraft: process.argv.includes('--allow-draft') });
  const p = path.join(ROOT, 'out/props', `${slug}.json`); fs.writeFileSync(p, JSON.stringify(props));
  execFileSync('npx', ['tsx', 'scripts/stills.mts', '--format=champion-35s', `--props=${p}`, `--name=${slug}`, `--sheet-dir=${sheetDir}`], { cwd: ROOT, stdio: 'inherit' });
}
