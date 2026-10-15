#!/usr/bin/env node
// Clips de créateurs (YouTube Shorts / vidéos) pour illustrer les champions — avec le nom de la
// chaîne, affiché à l'écran par la composition. Décision d'Anthony (2026-10-15) : les créateurs sont
// d'accord, la vidéo leur fait de la publicité.
//
// Source des candidats : l'index vidéo du site (assets/data/champion_videos.json, shorts[] puis
// youtube[], et champion-videos/<slug>.json, catégories highlights > ranked > meta), lu sur
// origin/main de ../nexus-core. Téléchargement par yt-dlp dans le cache du T7 (disque natif
// quasi plein), choix du passage le plus bruyant (ebur128, fenêtre de WINDOW s : c'est là que ça se
// bat), image 16:9 ENTIÈRE en 1920×1080, muette. Le cadrage se fait dans la composition (ClipPanel) :
// un recadrage 9:16 au centre perdait le champion dès que la caméra du créateur n'était pas verrouillée
// sur lui (retour d'Anthony, 2026-10-15).
//
//   node scripts/fetch-clips.mjs [--replace]                 # champions de tierlist.json + vedette du patch
//   node scripts/fetch-clips.mjs --reframe                   # ré-encode les clips existants depuis le cache, sans re-télécharger
//   node scripts/fetch-clips.mjs --champ=yasuo,samira --window=8
// Sorties : public/clips/<key>-creator.mp4 (gitignoré) + src/data/clips-creators.json (versionné).
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const NEXUS = path.resolve(arg('nexus', '../nexus-core'));
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = arg('cache', '/Volumes/T7/wrc-video-cache/yt');
const WINDOW = Number(arg('window', 7));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');

const show = (f) => { try { return execFileSync('git', ['-C', NEXUS, 'show', `origin/main:${f}`], { maxBuffer: 1e9, stdio: ['pipe', 'pipe', 'ignore'] }).toString(); } catch { return null; } };
const json = (f) => { const t = show(f); return t ? JSON.parse(t) : null; };

const index = json('assets/data/champion_videos.json') || {};
const avatarByNorm = new Map((json('assets/data/champions-avatar-index.json') || []).map((a) => [norm(a.name), a]));
const byNorm = new Map(Object.entries(index).map(([k, v]) => [norm(k), { slug: k, ...v }]));
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/tierlist.json'), 'utf8'));
const wanted = arg('champ')
  ? arg('champ').split(',').map(norm)
  : [...new Set([tl.hero, ...tl.roles.flatMap((r) => r.splus.map((c) => c.key)), ...tl.moves.ups.map((m) => m.key), ...tl.moves.downs.map((m) => m.key), ...patchHeadline()])];
function patchHeadline() { // vedette du format patch : l'effet mesuré le plus net (même choix que src/formats/patch/index.tsx)
  const f = path.join(ROOT, 'src/data/patch.json'); if (!fs.existsSync(f)) return [];
  const p = JSON.parse(fs.readFileSync(f, 'utf8')); const top = [...(p.effects || [])].sort((a, b) => Math.abs(b.wrDelta) - Math.abs(a.wrDelta))[0];
  return top ? [top.key] : [];
}

const OUT_DIR = path.join(ROOT, 'public/clips');
const DATA = path.join(ROOT, 'src/data/clips-creators.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });
const data = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : {};
// --replace : refuse le clip retenu (Anthony l'a jugé mauvais) et en choisit un autre ; les refus
// s'accumulent dans clips-rejected.json pour ne jamais revenir sur une vidéo écartée.
const REPLACE = process.argv.includes('--replace');
const REFRAME = process.argv.includes('--reframe');
const REJECTED = path.join(ROOT, 'src/data/clips-rejected.json');
const rejected = fs.existsSync(REJECTED) ? JSON.parse(fs.readFileSync(REJECTED, 'utf8')) : {};

const ytId = (url) => (url.match(/(?:shorts\/|v=|youtu\.be\/)([\w-]{11})/) || [])[1];

function candidates(key) {
  const e = byNorm.get(key);
  const list = [];
  if (e) {
    for (const v of e.shorts || []) list.push({ url: v.url, title: v.title, kind: 'short' });
    const cat = json(`assets/data/champion-videos/${e.slug}.json`)?.categories || {};
    for (const c of ['highlights', 'ranked', 'meta', 'guide']) for (const v of cat[c]?.videos || []) if (v.watchUrl || v.videoId) list.push({ url: v.watchUrl || `https://www.youtube.com/watch?v=${v.videoId}`, title: v.title, kind: c, channel: v.channel, duration: v.durationSeconds });
    for (const v of e.youtube || []) list.push({ url: v.url, title: v.title, kind: 'video' });
  }
  // Recherche YouTube de secours : l'index du site date, plusieurs de ses vidéos ont été retirées.
  const name = avatarByNorm.get(key)?.name || key;
  for (const q of [`${name} wild rift pentakill`, `${name} wild rift highlights`]) {
    const r = spawnSync('yt-dlp', ['--no-warnings', '--flat-playlist', '-j', `ytsearch8:${q}`], { encoding: 'utf8', timeout: 60000 });
    const hits = (r.stdout || '').trim().split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    // Shorts et vidéos courtes d'abord (le passage fort est facile à isoler), puis par audience.
    hits.sort((a, b) => ((a.duration || 999) <= 120 ? 0 : 1) - ((b.duration || 999) <= 120 ? 0 : 1) || (b.view_count || 0) - (a.view_count || 0));
    for (const h of hits) if (h.duration && h.duration <= 900) list.push({ url: h.url || `https://www.youtube.com/watch?v=${h.id}`, title: h.title, kind: 'search', channel: h.channel || h.uploader, duration: h.duration });
  }
  // Déduplication par id, et on écarte les vidéos officielles de Riot (ce sont des aperçus, pas du jeu classé).
  const seen = new Set();
  return list.filter((c) => { const id = ytId(c.url); if (!id || seen.has(id)) return false; seen.add(id); return !/wild rift official|riot games|league of legends: wild rift/i.test(c.channel || ''); });
}

const YT = ['--no-warnings', '--no-playlist', '-o', path.join(CACHE, '%(id)s.%(ext)s')];
const run = (args, timeout) => spawnSync('yt-dlp', args, { encoding: 'utf8', timeout });
const findFile = (prefix) => fs.readdirSync(CACHE).map((f) => path.join(CACHE, f)).find((f) => path.basename(f).startsWith(prefix) && !f.endsWith('.part') && !f.endsWith('.json'));

// 1. Métadonnées + piste audio seule (légère) : c'est elle qui sert à repérer le passage fort.
function probe(url) {
  const id = ytId(url);
  const meta = path.join(CACHE, `${id}.info.json`);
  if (!fs.existsSync(meta) || !findFile(`${id}.audio.`)) {
    const r = run([...YT, '-f', 'ba/b', '--write-info-json', '-o', path.join(CACHE, '%(id)s.audio.%(ext)s'), url], 120000);
    if (r.status !== 0) { console.warn(`  · ${id} : ${(r.stderr || '').trim().split('\n').pop()}`); return null; }
    // yt-dlp nomme l'info.json d'après le gabarit de sortie
    const m2 = path.join(CACHE, `${id}.audio.info.json`);
    if (fs.existsSync(m2)) fs.renameSync(m2, meta);
  }
  const audio = findFile(`${id}.audio.`);
  if (!fs.existsSync(meta) || !audio) return null;
  const info = JSON.parse(fs.readFileSync(meta, 'utf8'));
  return { id, audio, creator: info.uploader || info.channel, channel: info.channel_url || info.uploader_url, title: info.title, duration: info.duration, width: info.width, height: info.height, url: info.webpage_url || url };
}

// 2. Seulement le passage choisi, en pleine résolution (sections découpées par yt-dlp/ffmpeg).
function downloadSegment(id, url, start, len) {
  const out = path.join(CACHE, `${id}.seg.mp4`);
  if (fs.existsSync(out)) fs.unlinkSync(out);
  const r = run([...YT, '-f', 'bv*+ba/b', '-S', 'res:1920,vcodec:h264,ext:mp4', '--merge-output-format', 'mp4', '--download-sections', `*${Math.max(0, start - 1).toFixed(1)}-${(start + len + 1).toFixed(1)}`, '--force-keyframes-at-cuts', '-o', path.join(CACHE, '%(id)s.seg.%(ext)s'), url], 300000);
  if (r.status !== 0 || !fs.existsSync(out)) { console.warn(`  · segment ${id} : ${(r.stderr || '').trim().split('\n').pop()}`); return null; }
  return out;
}

// Fenêtre la plus forte (loudness momentanée ebur128 toutes les 100 ms), bords exclus.
function loudestWindow(file, duration) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=none', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1e8 });
  const pts = [];
  for (const m of r.stderr.matchAll(/t:\s*([\d.]+)\s+(?:TARGET:[^M]*)?M:\s*(-?[\d.]+)/g)) pts.push([Number(m[1]), Number(m[2])]);
  if (pts.length < 20) return Math.max(0, Math.min(duration - WINDOW, duration / 2 - WINDOW / 2));
  const step = pts[1][0] - pts[0][0] || 0.1;
  const n = Math.round(WINDOW / step);
  let best = 0, bestT = 0;
  const lo = Math.round(1.5 / step), hi = pts.length - n - Math.round(1.5 / step);
  for (let i = lo; i <= hi; i++) {
    let s = 0; for (let k = 0; k < n; k++) s += Math.max(-70, pts[i + k][1]);
    if (s > best || bestT === 0) { best = s; bestT = pts[i][0]; }
  }
  return bestT;
}

// Le segment commence ~1 s avant `start` ; image ENTIÈRE au ratio de la source (16:9 → 1920×1080, Short 9:16 → 1080×1920), sans audio.
function encode(seg, start, len, out) {
  const vf = "scale='if(gt(iw,ih),1920,-2)':'if(gt(iw,ih),-2,1920)':flags=lanczos,fps=30,format=yuv420p";
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(start > 0 ? 1 : 0), '-i', seg, '-t', String(len), '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', out], { encoding: 'utf8' });
  return r.status === 0 ? null : r.stderr.slice(0, 200);
}

const dims = (file) => { const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], { encoding: 'utf8' }); return (r.stdout || '').trim().replace(',', 'x') || '?'; };

for (const key of (REFRAME && !arg('champ') ? Object.keys(data) : wanted)) {
  const out = path.join(OUT_DIR, `${key}-creator.mp4`);
  if (REFRAME) {
    const seg = path.join(CACHE, `${ytId(data[key].url)}.seg.mp4`);
    if (!data[key] || !fs.existsSync(seg)) { console.warn(`! ${key} : pas de clip ou segment absent du cache, relancer sans --reframe`); continue; }
    const err = encode(seg, data[key].start, data[key].duration, out);
    if (!err) data[key].source = dims(out);
    console.log(err ? `! ${key} : ${err}` : `↻ ${key} (${data[key].creator}) ${data[key].source}`);
    continue;
  }
  if (REPLACE && data[key]) {
    rejected[key] = [...new Set([...(rejected[key] || []), ytId(data[key].url)].filter(Boolean))];
    fs.writeFileSync(REJECTED, JSON.stringify(rejected, null, 2) + '\n');
    console.log(`× ${key} : ${data[key].creator} écarté`); delete data[key]; if (fs.existsSync(out)) fs.unlinkSync(out);
  }
  if (fs.existsSync(out) && data[key]) { console.log(`= ${key} (${data[key].creator})`); continue; }
  const banned = new Set(rejected[key] || []);
  let done = false;
  for (const c of candidates(key)) {
    if (banned.has(ytId(c.url))) continue;
    if (c.duration && c.duration > 1500) continue; // > 25 min : trop long à sonder
    const d = probe(c.url);
    if (!d || !d.duration || d.duration > 1500) continue;
    const start = d.duration <= WINDOW + 1 ? 0 : loudestWindow(d.audio, d.duration);
    const len = Math.min(WINDOW, d.duration - start);
    const seg = downloadSegment(d.id, c.url, start, len);
    if (!seg) continue;
    const err = encode(seg, start, len, out);
    if (err) { console.warn(`! ffmpeg ${key}: ${err}`); continue; }
    data[key] = { src: `clips/${key}-creator.mp4`, creator: d.creator, channel: d.channel, url: d.url, title: d.title, kind: c.kind, start: Math.round(start * 10) / 10, duration: Math.round(len * 10) / 10, source: dims(out) };
    console.log(`+ ${key} ← ${d.creator} · ${c.kind} · ${start.toFixed(1)}s`);
    done = true; break;
  }
  if (!done) console.warn(`! ${key} : aucun clip utilisable`);
}
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`${Object.keys(data).length} clips dans src/data/clips-creators.json`);
