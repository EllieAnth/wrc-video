#!/usr/bin/env node
// Bruitages synthétisés (aucun fichier audio sous droits), calés sur l'image : les
// instants viennent d'un fichier de repères écrit par scripts/cues.mts depuis la timeline du format,
// la même source que la composition. Un bruitage tombe donc toujours sur l'image qu'il souligne.
//
//   node scripts/synth-audio.mjs --format=meta-movers [--music]
// Sans --music : bruitages seulement (impact d'ouverture, whoosh, pops, ticks, montée, impact de fin) —
// décision d'Anthony (2026-10-15) : la musique est ajoutée dans TikTok à la publication, jamais ici.
//   lit  public/audio/<format>.cues.json  → écrit  public/audio/<format>.wav  (stéréo 44,1 kHz, 16 bits)
//
// Repères : { fps, bpm, total, sections: [{ start, len, kind: 'intro'|'groove'|'break'|'outro', chords?, intensity? }],
//            cues: [{ frame, type: 'whoosh'|'pop'|'up'|'down'|'impact'|'riser'|'tick'|'crash'|'roll', pan?, pitch? }] }
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const FORMAT = arg('format', 'meta-movers');
const MUSIC = process.argv.includes('--music');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const Q = JSON.parse(fs.readFileSync(path.join(ROOT, `public/audio/${FORMAT}.cues.json`), 'utf8'));

const SR = 44100;
const sec = (frames) => frames / Q.fps;
const DUR = sec(Q.total);
const N = Math.ceil(DUR * SR);
const BEAT = 60 / (Q.bpm || 100);

const L = new Float32Array(N), R = new Float32Array(N), SEND = new Float32Array(N);
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 1234567;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

function add(t0, dur, gen, { gain = 1, pan = 0, send = 0 } = {}) {
  const s0 = Math.max(0, Math.round(t0 * SR)), s1 = Math.min(N, Math.round((t0 + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let s = s0; s < s1; s++) { const v = gen((s - s0) / SR, s - s0); L[s] += v * gl; R[s] += v * gr; if (send) SEND[s] += v * gain * send; }
}
const lowpass = (fc) => { let y = 0; const a = 1 - Math.exp((-2 * Math.PI * fc) / SR); return (x) => (y += a * (x - y)); };
const highpass = (fc) => { const lp = lowpass(fc); return (x) => x - lp(x); };
function svf(q = 0.7) { let lp = 0, bp = 0; return (x, fc) => { const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR); lp += f * bp; const hp = x - lp - q * bp; bp += f * hp; return lp; }; }
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));

// ── Instruments ───────────────────────────────────────────────────────────────
function kick(t, gain = 0.95) { let ph = 0; add(t, 0.5, (x) => { ph += (45 + 110 * Math.exp(-x * 28)) / SR; return Math.tanh((Math.sin(2 * Math.PI * ph) * Math.exp(-x * 7) + (x < 0.004 ? rnd() * (1 - x / 0.004) * 0.5 : 0)) * 1.6); }, { gain }); }
function snare(t, gain = 0.42) { const hp = highpass(900), lp = lowpass(7000); add(t, 0.3, (x) => lp(hp(rnd())) * Math.exp(-x * 18) + Math.sin(2 * Math.PI * 190 * x) * Math.exp(-x * 30) * 0.5, { gain, send: 0.35 }); }
function hat(t, open = false, gain = 0.13, pan = 0.25) { const hp = highpass(7500); add(t, open ? 0.2 : 0.06, (x) => hp(rnd()) * Math.exp(-x * (open ? 16 : 70)), { gain, pan }); }
function crash(t, gain = 0.22) { for (const pan of [-0.15, 0.15]) { const hp = highpass(4000); add(t, 2.2, (x) => hp(rnd()) * Math.exp(-x * 2.3), { gain, send: 0.3, pan }); } }
function bass(t, midi, dur, gain = 0.32) { const f = mtof(midi), lp = lowpass(420); let ph = 0; add(t, dur, (x) => { ph += f / SR; return lp(Math.tanh((Math.sin(2 * Math.PI * ph) + 0.35 * saw(ph * 2)) * 1.4)) * Math.min(1, x / 0.005) * Math.exp(-x * 3) * Math.min(1, (dur - x) / 0.02); }, { gain }); }
function pad(t, midis, dur, gain = 0.06) {
  for (const [vi, m] of midis.entries()) for (const det of [-0.11, 0.11]) { const f = mtof(m + det), filt = svf(0.5); let ph = (rnd() + 1) / 2; add(t, dur, (x) => { ph += f / SR; return filt(saw(ph), 900 + 500 * Math.sin(2 * Math.PI * 0.25 * (t + x))) * Math.min(1, x / 0.35) * Math.min(1, (dur - x) / 0.4); }, { gain, pan: det < 0 ? -0.5 + vi * 0.1 : 0.5 - vi * 0.1, send: 0.5 }); }
}
function pluck(t, midi, gain = 0.07, pan = 0) { const f = mtof(midi), filt = svf(0.3); let ph = 0; add(t, 0.35, (x) => { ph += f / SR; return filt(saw(ph), 300 + 4200 * Math.exp(-x * 14)) * Math.exp(-x * 9); }, { gain, pan, send: 0.4 }); }
// Bruitages
function whoosh(tc, gain = 0.32) { const filt = svf(0.25), d = 0.55; add(tc - 0.38, d, (x) => { const u = x / d; return filt(rnd(), 300 + 5200 * Math.sin(Math.PI * u)) * Math.sin(Math.PI * u) ** 2; }, { gain, send: 0.25 }); }
function pop(t, midi, gain = 0.26, pan = 0) { const f0 = mtof(midi); let ph = 0; add(t, 0.22, (x) => { ph += (f0 * (1 + 0.6 * Math.exp(-x * 40))) / SR; return Math.sin(2 * Math.PI * ph) * Math.exp(-x * 22) * Math.min(1, x / 0.002); }, { gain, pan, send: 0.3 }); }
function blip(t, up, gain = 0.22, pan = 0) { let ph = 0; add(t, 0.18, (x) => { ph += (up ? 500 + 2600 * (x / 0.18) : 1700 - 1300 * (x / 0.18)) / SR; return Math.sin(2 * Math.PI * ph) * Math.exp(-x * 14) * Math.min(1, x / 0.003); }, { gain, pan, send: 0.3 }); }
function riser(t0, dur, gain = 0.2) { const filt = svf(0.2); add(t0, dur, (x) => { const u = x / dur; return filt(rnd(), 200 + 7000 * u * u) * u * u; }, { gain, send: 0.3 }); }
function impact(t, gain = 0.8) { let ph = 0; add(t, 1.4, (x) => { ph += (32 + 70 * Math.exp(-x * 9)) / SR; return Math.tanh(Math.sin(2 * Math.PI * ph) * 2) * Math.exp(-x * 2.6); }, { gain }); crash(t, 0.18); }
function tick(t, gain = 0.18, pan = 0) { const hp = highpass(3000); add(t, 0.05, (x) => hp(rnd()) * Math.exp(-x * 90) + Math.sin(2 * Math.PI * 2400 * x) * Math.exp(-x * 60) * 0.5, { gain, pan }); }
function roll(t, gain = 0.2) { for (let k = 0; k < 4; k++) snare(t - BEAT + (k * BEAT) / 4, gain + k * 0.07); }

// ── Partition ─────────────────────────────────────────────────────────────────
const CH = { Am: [57, 60, 64], F: [53, 57, 60], C: [55, 60, 64], G: [55, 59, 62], Dm: [50, 53, 57], Em: [52, 55, 59] };
const ROOT_NOTE = { Am: 33, F: 29, C: 36, G: 31, Dm: 38, Em: 40 };
const ARP = { Am: [69, 72, 76, 72], F: [65, 69, 72, 69], C: [67, 72, 76, 72], G: [67, 71, 74, 71], Dm: [62, 65, 69, 65], Em: [64, 67, 71, 67] };
const t = (frames) => sec(frames);

const groove = (from, beats, chords, intensity = 1) => {
  for (let b = 0; b < beats; b++) {
    const tb = from + b * BEAT;
    const chord = chords[Math.floor(b / 4) % chords.length];
    if (b % 4 === 0) pad(tb, CH[chord], 4 * BEAT + 0.4);
    if (b % 2 === 0) kick(tb, 0.95 * intensity);
    if (b % 4 === 2) kick(tb + BEAT / 2, 0.7 * intensity);
    if (b % 2 === 1) snare(tb, 0.42 * intensity);
    hat(tb + BEAT / 2, b % 4 === 3, 0.12); hat(tb, false, 0.08, -0.25);
    for (let e = 0; e < 2; e++) bass(tb + (e * BEAT) / 2, ROOT_NOTE[chord] + (e === 1 && b % 4 === 3 ? 12 : 0), BEAT / 2 - 0.02);
    for (let s = 0; s < 2; s++) pluck(tb + (s * BEAT) / 2, ARP[chord][(b * 2 + s) % 4], 0.06, s ? 0.35 : -0.35);
  }
};
const breakSection = (from, beats, chords) => {
  for (let b = 0; b < beats; b++) { const tb = from + b * BEAT; const chord = chords[Math.floor(b / 4) % chords.length]; if (b % 4 === 0) pad(tb, CH[chord], 4 * BEAT + 0.4, 0.07); hat(tb + BEAT / 2, false, 0.08); if (b % 2 === 0) bass(tb, ROOT_NOTE[chord], BEAT - 0.05, 0.22); }
};

for (const s of Q.sections) {
  const from = t(s.start), beats = Math.max(1, Math.round(sec(s.len) / BEAT));
  const chords = s.chords || ['Am', 'F', 'C', 'G'];
  if (!MUSIC) { // bruitages de structure seulement : l'ouverture et la fin de chaque section
    if (s.kind === 'intro') { impact(from + 0.2); riser(from + sec(s.len) - 1.4, 1.4); }
    else if (s.kind === 'groove') crash(from, 0.16);
    else if (s.kind === 'outro') impact(from, 0.7);
    continue;
  }
  if (s.kind === 'intro') { impact(from + 0.2); pad(from, CH[chords[0]], sec(s.len) + 0.3, 0.05); riser(from + sec(s.len) - 1.4, 1.4); }
  else if (s.kind === 'groove') { groove(from, beats, chords, s.intensity ?? 1); crash(from); }
  else if (s.kind === 'break') breakSection(from, beats, chords);
  else if (s.kind === 'outro') { impact(from, 0.7); kick(from); pad(from, [...CH[chords[0]], 69], DUR - from, 0.055); bass(from, ROOT_NOTE[chords[0]], 1.6, 0.3); }
}
const PENTA = [81, 84, 86, 88, 91, 93];
let popI = 0;
for (const c of Q.cues) {
  const tc = t(c.frame), pan = c.pan ?? 0;
  if (c.type === 'whoosh') whoosh(tc);
  else if (c.type === 'pop') pop(tc, PENTA[(c.pitch ?? popI++) % PENTA.length], 0.24, pan);
  else if (c.type === 'up') blip(tc, true, 0.2, pan);
  else if (c.type === 'down') blip(tc, false, 0.2, pan);
  else if (c.type === 'impact') impact(tc, c.gain ?? 0.7);
  else if (c.type === 'riser') riser(tc - (c.len ?? 1.2), c.len ?? 1.2);
  else if (c.type === 'tick') tick(tc, 0.18, pan);
  else if (c.type === 'crash') crash(tc);
  else if (c.type === 'roll') roll(tc);
}

// ── Réverbe (Schroeder) puis master ───────────────────────────────────────────
function reverb(input, combs, aps) {
  const out = new Float32Array(N);
  for (const [len, fb] of combs) { const buf = new Float32Array(len); let i = 0, lpS = 0; for (let s = 0; s < N; s++) { const y = buf[i]; lpS = y * 0.7 + lpS * 0.3; buf[i] = input[s] + lpS * fb; i = (i + 1) % len; out[s] += y / combs.length; } }
  for (const len of aps) { const buf = new Float32Array(len); let i = 0; for (let s = 0; s < N; s++) { const b = buf[i]; const y = -out[s] + b; buf[i] = out[s] + b * 0.5; i = (i + 1) % len; out[s] = y; } }
  return out;
}
const revL = reverb(SEND, [[1557, 0.82], [1617, 0.82], [1491, 0.82], [1422, 0.82]], [225, 556]);
const revR = reverb(SEND, [[1601, 0.82], [1559, 0.82], [1487, 0.82], [1453, 0.82]], [241, 579]);
let peak = 0;
for (let s = 0; s < N; s++) {
  const fo = Math.min(1, (N - s) / (SR * 0.8)), fi = Math.min(1, s / (SR * 0.01));
  L[s] = Math.tanh((L[s] + revL[s] * 0.6) * 1.1) * fi * fo; R[s] = Math.tanh((R[s] + revR[s] * 0.6) * 1.1) * fi * fo;
  peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
}
const norm = 0.72 / peak; // crête à -2,9 dBFS ; avec la musique ≈ -14 LUFS intégrés (cible TikTok/Reels/Shorts) ; bruitages seuls : des pics nets, la musique TikTok comble
const wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVE', 8); wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let s = 0; s < N; s++) { wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[s] * norm)) * 32767), 44 + s * 4); wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[s] * norm)) * 32767), 46 + s * 4); }
fs.writeFileSync(path.join(ROOT, `public/audio/${FORMAT}.wav`), wav);
console.log(`${FORMAT}.wav · ${DUR.toFixed(2)} s · ${Q.total} images · ${Q.cues.length} repères`);
