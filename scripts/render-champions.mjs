#!/usr/bin/env node
// Rend les vidéos `champion-35s` : master réseaux (1080×1920, crf 18) + version site (720×1280,
// ≈ 1,5 Mbit/s, +faststart) + affiche JPEG, et un manifeste par lot avec hash, taille, durée.
//   node scripts/render-champions.mjs --slugs=garen,senna [--out=/Volumes/T7/wrc-video-cache/renders]
//                                    [--allow-draft] [--web-only] [--force]
// Reprise idempotente : un champion dont le master existe avec le même hash de props est sauté.
// Mesuré le 16/10 sur ce Mac : ≈ 2,3 s de rendu par seconde de vidéo (≈ 80 s par champion).
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { propsFor } from './champion-props.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const OUT = path.resolve(arg('out', fs.existsSync('/Volumes/T7') ? '/Volumes/T7/wrc-video-cache/renders' : 'out/champions'));
const slugs = arg('slugs', '') ? arg('slugs', '').split(',') : fs.readdirSync(path.join(ROOT, 'src/data/champion-lines')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const ALLOW_DRAFT = process.argv.includes('--allow-draft'), WEB_ONLY = process.argv.includes('--web-only'), FORCE = process.argv.includes('--force');
fs.mkdirSync(path.join(OUT, 'props'), { recursive: true });
const manifestPath = path.join(OUT, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { schema: 'wrc.champion-renders/1', renders: {} };
const sha = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex').slice(0, 12);
const probe = (p) => { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], { encoding: 'utf8' }); return Number(r.stdout.trim()) || null; };
const ff = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' }); if (r.status !== 0) throw new Error(`ffmpeg : ${r.stderr.slice(0, 300)}`); };

let n = 0, skipped = 0;
for (const slug of slugs) {
  const t0 = Date.now();
  const props = propsFor(slug, { allowDraft: ALLOW_DRAFT });
  const propsPath = path.join(OUT, 'props', `${slug}.json`); fs.writeFileSync(propsPath, JSON.stringify(props));
  const propsHash = crypto.createHash('sha1').update(JSON.stringify(props)).digest('hex').slice(0, 12);
  const master = path.join(OUT, `${slug}.mp4`), web = path.join(OUT, `${slug}.web.mp4`), poster = path.join(OUT, `${slug}.jpg`);
  const prev = manifest.renders[slug];
  if (!FORCE && prev?.propsHash === propsHash && fs.existsSync(master) && fs.existsSync(web)) { skipped++; process.stdout.write(`= ${slug}\n`); continue; }
  if (!WEB_ONLY || !fs.existsSync(master)) {
    execFileSync('npx', ['remotion', 'render', 'src/index.ts', 'champion-35s', master, `--props=${propsPath}`, '--codec=h264', '--crf=18', '--audio-codec=aac', '--audio-bitrate=192k', '--log=error'], { cwd: ROOT, stdio: 'inherit' });
  }
  // Version site : 720×1280, débit plafonné, sans piste audio inutilement lourde (AAC 96 k), index en tête.
  ff(['-i', master, '-vf', 'scale=720:1280', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '1600k', '-bufsize', '3200k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', web]);
  ff(['-ss', '2.4', '-i', master, '-frames:v', '1', '-vf', 'scale=720:1280', '-q:v', '3', poster]);
  const st = (p) => fs.statSync(p).size;
  manifest.renders[slug] = {
    slug, patch: props.data.patch, dataHash: props.lines.dataHash, linesStatus: props.lines.status, propsHash,
    master: { file: path.basename(master), bytes: st(master), sha1: sha(master), duration: probe(master) },
    web: { file: path.basename(web), bytes: st(web), sha1: sha(web), duration: probe(web) },
    poster: { file: path.basename(poster), bytes: st(poster) },
    renderedAt: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000),
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1) + '\n');
  n++;
  console.log(`✓ ${slug} · ${manifest.renders[slug].seconds} s · master ${(st(master) / 1e6).toFixed(1)} Mo · web ${(st(web) / 1e6).toFixed(1)} Mo`);
}
console.log(`${n} rendus, ${skipped} déjà à jour → ${OUT} (manifest.json)`);
