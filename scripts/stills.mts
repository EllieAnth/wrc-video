// Planche-contact d'un format : une image au cœur de chaque scène (60 %) + une à 20 %, assemblées par ffmpeg.
// npx tsx scripts/stills.mts --format=duel [--frames=10,80,200]  → out/stills/<format>-sheet.jpg
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const id = arg('format');
if (!id) throw new Error('--format=<id> requis');
const { timeline } = await import(`../src/formats/${id}/timeline.ts`);
const frames: number[] = arg('frames')
  ? arg('frames')!.split(',').map(Number)
  : timeline.scenes.flatMap((s: { start: number; len: number }) => [s.start + Math.round(s.len * 0.2), s.start + Math.round(s.len * 0.6)]);

const dir = path.resolve('out/stills', id);
fs.mkdirSync(dir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
const composition = await selectComposition({ serveUrl, id });
const files: string[] = [];
for (const frame of frames) {
  const output = path.join(dir, `${String(frame).padStart(4, '0')}.jpg`);
  await renderStill({ composition, serveUrl, output, frame, imageFormat: 'jpeg', jpegQuality: 85 });
  files.push(output);
  process.stdout.write(`${frame} `);
}
// Contact sheet : vignettes 360×640, 6 par ligne.
const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
const sheet = path.resolve('out/stills', `${id}-sheet.jpg`);
execFileSync('ffmpeg', ['-y', ...files.flatMap((f) => ['-i', f]), '-filter_complex', `${files.map((_, i) => `[${i}:v]scale=360:640[v${i}]`).join(';')};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|')}:fill=black[out]`, '-map', '[out]', '-frames:v', '1', '-q:v', '4', sheet], { stdio: 'ignore' });
console.log(`\n${files.length} images → ${sheet} (${cols}×${rows})`);
