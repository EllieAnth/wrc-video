// Planche-contact d'un format : une image au cœur de chaque scène (60 %) + une à 20 %, assemblées par ffmpeg.
// npx tsx scripts/stills.mts --format=patch [--frames=10,80,200]  → out/stills/<format>-sheet.jpg
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Format à props (champion-35s) : `--props=out/props/<slug>.json` (écrit par champion-props.mjs) et
// `--name=<slug>` pour nommer la planche ; `--sheet-dir=` pour la mettre ailleurs que out/stills.
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const id = arg('format');
if (!id) throw new Error('--format=<id> requis');
const { timeline } = await import(`../src/formats/${id}/timeline.ts`);
const frames: number[] = arg('frames')
  ? arg('frames')!.split(',').map(Number)
  : timeline.scenes.flatMap((s: { start: number; len: number }) => [s.start + Math.round(s.len * 0.2), s.start + Math.round(s.len * 0.6)]);
const inputProps = arg('props') ? JSON.parse(fs.readFileSync(path.resolve(arg('props')!), 'utf8')) : {};
const name = arg('name') || id;
const sheetDir = path.resolve(arg('sheet-dir') || 'out/stills');

const dir = path.join(sheetDir, name);
fs.mkdirSync(dir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id, inputProps });
const files: string[] = [];
for (const frame of frames) {
  const output = path.join(dir, `${String(frame).padStart(4, '0')}.jpg`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: 'jpeg', jpegQuality: 85, inputProps });
  files.push(output);
  process.stdout.write(`${frame} `);
}
// Contact sheet : vignettes 360×640, 6 par ligne.
const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
const sheet = path.join(sheetDir, `${name}-sheet.jpg`);
execFileSync('ffmpeg', ['-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=360:640[v${i}]`).join(';')};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|')}:fill=black[out]`, '-map', '[out]', '-frames:v', '1', '-q:v', '4', sheet], { stdio: 'ignore' });
console.log(`\n${files.length} images → ${sheet} (${cols}×${rows})`);
