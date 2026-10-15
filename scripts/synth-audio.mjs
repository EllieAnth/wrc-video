#!/usr/bin/env node
// Bande-son de « Tier list du patch », synthétisée note par note : aucun fichier audio sous droits.
// Les instants (changements de scène, entrée de chaque carte, de chaque ligne de mouvement) se lisent
// dans src/timeline.json et src/data/tierlist.json — les mêmes sources que la composition — donc un
// bruitage tombe toujours sur l'image qu'il souligne.
//
//   node scripts/synth-audio.mjs   → public/audio/soundtrack.wav (stéréo 44,1 kHz, 16 bits)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/tierlist.json'), 'utf8'));

const SR = 44100;
const nRoles = data.roles.length;
const rolesStart = TL.intro;
const movesStart = rolesStart + TL.role * nRoles;
const outroStart = movesStart + TL.moves;
const totalFrames = outroStart + TL.outro;
const sec = (frames) => frames / TL.fps;
const DUR = sec(totalFrames);
const N = Math.ceil(DUR * SR);
const BEAT = 60 / TL.bpm;

const L = new Float32Array(N);
const R = new Float32Array(N);
const SEND = new Float32Array(N); // bus réverbe (mono)

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
let seed = 1234567;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;

// Ajoute un événement : gen(t, i) → échantillon mono, de `t0` pendant `dur` secondes.
function add(t0, dur, gen, { gain = 1, pan = 0, send = 0 } = {}) {
  const s0 = Math.max(0, Math.round(t0 * SR));
  const s1 = Math.min(N, Math.round((t0 + dur) * SR));
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let s = s0; s < s1; s++) {
    const v = gen((s - s0) / SR, s - s0);
    L[s] += v * gl;
    R[s] += v * gr;
    if (send) SEND[s] += v * gain * send;
  }
}

// Filtres à état (un par voix).
const lowpass = (fc) => { let y = 0; const a = 1 - Math.exp((-2 * Math.PI * fc) / SR); return (x) => (y += a * (x - y)); };
const highpass = (fc) => { const lp = lowpass(fc); return (x) => x - lp(x); };
function svf(q = 0.7) { // passe-bas résonant, fréquence modulable à chaque échantillon
  let lp = 0, bp = 0;
  return (x, fc) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    lp += f * bp; const hp = x - lp - q * bp; bp += f * hp; return lp;
  };
}
const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));

// ── Instruments ───────────────────────────────────────────────────────────────
function kick(t, gain = 0.95) {
  let ph = 0;
  add(t, 0.5, (x) => {
    const f = 45 + 110 * Math.exp(-x * 28);
    ph += f / SR;
    const body = Math.sin(2 * Math.PI * ph) * Math.exp(-x * 7);
    const click = x < 0.004 ? rnd() * (1 - x / 0.004) * 0.5 : 0;
    return Math.tanh((body + click) * 1.6);
  }, { gain });
}
function snare(t, gain = 0.42) {
  const hp = highpass(900), lp = lowpass(7000);
  add(t, 0.3, (x) => {
    const n = lp(hp(rnd())) * Math.exp(-x * 18);
    const tone = Math.sin(2 * Math.PI * 190 * x) * Math.exp(-x * 30) * 0.5;
    return n + tone;
  }, { gain, send: 0.35 });
}
function hat(t, open = false, gain = 0.13, pan = 0.25) {
  const hp = highpass(7500);
  add(t, open ? 0.2 : 0.06, (x) => hp(rnd()) * Math.exp(-x * (open ? 16 : 70)), { gain, pan });
}
function crash(t, gain = 0.22) {
  const hp = highpass(4000);
  add(t, 2.2, (x) => hp(rnd()) * Math.exp(-x * 2.2), { gain, send: 0.3, pan: -0.15 });
  const hp2 = highpass(4000);
  add(t, 2.2, (x) => hp2(rnd()) * Math.exp(-x * 2.4), { gain, send: 0.3, pan: 0.15 });
}
function bass(t, midi, dur, gain = 0.32) {
  const f = mtof(midi); const lp = lowpass(420); let ph = 0;
  add(t, dur, (x) => {
    ph += f / SR;
    const env = Math.min(1, x / 0.005) * Math.exp(-x * 3) * Math.min(1, (dur - x) / 0.02);
    return lp(Math.tanh((Math.sin(2 * Math.PI * ph) + 0.35 * saw(ph * 2)) * 1.4)) * env;
  }, { gain });
}
function pad(t, midis, dur, gain = 0.06) {
  for (const [vi, m] of midis.entries()) {
    for (const det of [-0.11, 0.11]) {
      const f = mtof(m + det); const filt = svf(0.5); let ph = (rnd() + 1) / 2;
      add(t, dur, (x) => {
        ph += f / SR;
        const env = Math.min(1, x / 0.35) * Math.min(1, (dur - x) / 0.4);
        return filt(saw(ph), 900 + 500 * Math.sin(2 * Math.PI * 0.25 * (t + x))) * env;
      }, { gain, pan: det < 0 ? -0.5 + vi * 0.1 : 0.5 - vi * 0.1, send: 0.5 });
    }
  }
}
function pluck(t, midi, gain = 0.07, pan = 0) {
  const f = mtof(midi); const filt = svf(0.3); let ph = 0;
  add(t, 0.35, (x) => { ph += f / SR; return filt(saw(ph), 300 + 4200 * Math.exp(-x * 14)) * Math.exp(-x * 9); }, { gain, pan, send: 0.4 });
}
// Bruitages
function whoosh(tCenter, gain = 0.32) {
  const filt = svf(0.25); const d = 0.55; const t0 = tCenter - 0.38;
  add(t0, d, (x) => {
    const u = x / d; const env = Math.sin(Math.PI * u) ** 2;
    return filt(rnd(), 300 + 5200 * Math.sin(Math.PI * u)) * env;
  }, { gain, send: 0.25 });
}
function pop(t, midi, gain = 0.26, pan = 0) {
  const f0 = mtof(midi); let ph = 0;
  add(t, 0.22, (x) => {
    ph += (f0 * (1 + 0.6 * Math.exp(-x * 40))) / SR;
    return Math.sin(2 * Math.PI * ph) * Math.exp(-x * 22) * Math.min(1, x / 0.002);
  }, { gain, pan, send: 0.3 });
}
function sweepBlip(t, up, gain = 0.22, pan = 0) {
  let ph = 0;
  add(t, 0.18, (x) => {
    const f = up ? 500 + 2600 * (x / 0.18) : 1700 - 1300 * (x / 0.18);
    ph += f / SR;
    return Math.sin(2 * Math.PI * ph) * Math.exp(-x * 14) * Math.min(1, x / 0.003);
  }, { gain, pan, send: 0.3 });
}
function riser(t0, dur, gain = 0.2) {
  const filt = svf(0.2);
  add(t0, dur, (x) => { const u = x / dur; return filt(rnd(), 200 + 7000 * u * u) * u * u; }, { gain, send: 0.3 });
}
function impact(t, gain = 0.8) {
  let ph = 0;
  add(t, 1.4, (x) => { ph += (32 + 70 * Math.exp(-x * 9)) / SR; return Math.tanh(Math.sin(2 * Math.PI * ph) * 2) * Math.exp(-x * 2.6); }, { gain });
  crash(t, 0.18);
}

// ── Partition (100 BPM, la mineur) ─────────────────────────────────────────────
const CH = { Am: [57, 60, 64], F: [53, 57, 60], C: [55, 60, 64], G: [55, 59, 62] };
const ROOT_NOTE = { Am: 33, F: 29, C: 36, G: 31 };
const ARP = { Am: [69, 72, 76, 72], F: [65, 69, 72, 69], C: [67, 72, 76, 72], G: [67, 71, 74, 71] };
const t = (frames) => sec(frames);

// Intro : impact sur le titre, nappe qui monte, montée de bruit vers le premier rôle.
impact(t(6));
pad(0, CH.Am, t(rolesStart) + 0.3, 0.05);
riser(t(rolesStart) - 1.4, 1.4);

// Rôles + mouvements : groove complet ; une mesure (4 temps) par rôle.
const groove = (from, beats, chords) => {
  for (let b = 0; b < beats; b++) {
    const tb = from + b * BEAT;
    const chord = chords[Math.floor(b / 4) % chords.length];
    if (b % 4 === 0) pad(tb, CH[chord], 4 * BEAT + 0.4);
    if (b % 2 === 0) kick(tb);
    if (b % 4 === 2) kick(tb + BEAT / 2, 0.7);
    if (b % 2 === 1) snare(tb);
    hat(tb + BEAT / 2, b % 4 === 3, 0.12);
    hat(tb, false, 0.08, -0.25);
    for (let e = 0; e < 2; e++) bass(tb + (e * BEAT) / 2, ROOT_NOTE[chord] + (e === 1 && b % 4 === 3 ? 12 : 0), BEAT / 2 - 0.02);
    for (let s = 0; s < 2; s++) pluck(tb + (s * BEAT) / 2, ARP[chord][(b * 2 + s) % 4], 0.06, s ? 0.35 : -0.35);
  }
};
const rolesBeats = (TL.role * nRoles) / TL.fps / BEAT;
const movesBeats = TL.moves / TL.fps / BEAT;
groove(t(rolesStart), rolesBeats, ['Am', 'F', 'C', 'G', 'Am']);
groove(t(movesStart), movesBeats, ['F', 'G']);
crash(t(rolesStart));
// Roulement de caisse claire sur le dernier temps avant l'outro
for (let k = 0; k < 4; k++) snare(t(outroStart) - BEAT + (k * BEAT) / 4, 0.18 + k * 0.07);

// Outro : coup final puis nappe qui s'éteint.
impact(t(outroStart), 0.7);
kick(t(outroStart));
pad(t(outroStart), [...CH.Am, 69], DUR - t(outroStart), 0.055);
bass(t(outroStart), 33, 1.6, 0.3);

// ── Bruitages calés sur l'image ─────────────────────────────────────────────────
const sceneStarts = [...data.roles.map((_, i) => rolesStart + i * TL.role), movesStart, outroStart];
for (const f of sceneStarts) whoosh(t(f));
const PENTA = [81, 84, 86, 88, 91, 93];
data.roles.forEach((role, r) => {
  role.splus.forEach((_, i) => pop(t(rolesStart + r * TL.role + TL.cardDelay + i * TL.cardStagger), PENTA[i % PENTA.length], 0.24, (i % 2 ? 0.3 : -0.3)));
});
data.moves.ups.forEach((_, i) => sweepBlip(t(movesStart + TL.moveDelay + i * TL.moveStagger), true, 0.2, -0.3));
data.moves.downs.forEach((_, i) => sweepBlip(t(movesStart + TL.moveDelay + TL.downsOffset + i * TL.moveStagger), false, 0.2, 0.3));

// ── Réverbe (Schroeder), puis master ───────────────────────────────────────────
function reverb(input, combs, aps) {
  const out = new Float32Array(N);
  for (const [len, fb] of combs) {
    const buf = new Float32Array(len); let i = 0, lpState = 0;
    for (let s = 0; s < N; s++) {
      const y = buf[i]; lpState = y * 0.7 + lpState * 0.3;
      buf[i] = input[s] + lpState * fb; i = (i + 1) % len; out[s] += y / combs.length;
    }
  }
  for (const len of aps) {
    const buf = new Float32Array(len); let i = 0;
    for (let s = 0; s < N; s++) { const b = buf[i]; const y = -out[s] + b; buf[i] = out[s] + b * 0.5; i = (i + 1) % len; out[s] = y; }
  }
  return out;
}
const revL = reverb(SEND, [[1557, 0.82], [1617, 0.82], [1491, 0.82], [1422, 0.82]], [225, 556]);
const revR = reverb(SEND, [[1601, 0.82], [1559, 0.82], [1487, 0.82], [1453, 0.82]], [241, 579]);

let peak = 0;
for (let s = 0; s < N; s++) {
  const fadeOut = Math.min(1, (N - s) / (SR * 0.8));
  const fadeIn = Math.min(1, s / (SR * 0.01));
  L[s] = Math.tanh((L[s] + revL[s] * 0.6) * 1.1) * fadeIn * fadeOut;
  R[s] = Math.tanh((R[s] + revR[s] * 0.6) * 1.1) * fadeIn * fadeOut;
  peak = Math.max(peak, Math.abs(L[s]), Math.abs(R[s]));
}
const norm = 0.72 / peak; // ≈ -14 LUFS intégrés, la cible de TikTok/Reels/Shorts (mesuré par ffmpeg ebur128)

const wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let s = 0; s < N; s++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[s] * norm)) * 32767), 44 + s * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[s] * norm)) * 32767), 46 + s * 4);
}
fs.mkdirSync(path.join(ROOT, 'public/audio'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/audio/soundtrack.wav'), wav);
console.log(`soundtrack.wav · ${DUR.toFixed(2)} s · ${totalFrames} images · ${sceneStarts.length} transitions`);
