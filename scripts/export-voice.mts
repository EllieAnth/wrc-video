// Texte de la voix TikTok, scène par scène, à coller dans l'outil « texte en parole » de TikTok :
//   npx tsx scripts/export-voice.mts --format=meta-movers   →  out/<format>-voice.md
// Chaque ligne donne l'instant (s) où afficher/déclencher le texte et la durée de la scène.
import fs from 'node:fs';
import path from 'node:path';
import { FORMATS } from '../src/formats/registry';

const arg = (n: string, d: string) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const id = arg('format', 'meta-movers');
if (!FORMATS.includes(id)) throw new Error(`format inconnu : ${id}`);
const { timeline } = await import(`../src/formats/${id}/timeline.ts`);
const { voice, title } = await import(`../src/formats/${id}/voice.ts`);
const fmt = (f: number) => (f / timeline.fps).toFixed(1).replace('.', ',') + ' s';
const lines: string[] = [`# ${title} — texte pour la voix TikTok`, '', 'Dans TikTok : ajouter un texte par scène, l\'afficher à l\'instant indiqué, puis « Texte en parole ». Les textes sont en anglais, la voix TikTok anglaise (ex. « Jessie ») les lit telle quelle.', '', '| Scène | Instant | Durée | Texte à lire |', '|---|---|---|---|'];
for (const v of voice) {
  const sc = timeline.scenes.find((s: { name: string }) => s.name === v.scene);
  const at = sc ? sc.start + (v.offset ?? 0) : v.offset ?? 0;
  lines.push(`| ${v.scene} | ${fmt(at)} | ${sc ? fmt(sc.len) : '—'} | ${v.text} |`);
}
lines.push('', '## Tout le texte, dans l\'ordre', '', voice.map((v: { text: string }) => v.text).join(' '), '');
fs.mkdirSync('out', { recursive: true });
const out = path.resolve('out', `${id}-voice.md`);
fs.writeFileSync(out, lines.join('\n'));
console.log(`${voice.length} lignes → ${path.relative(process.cwd(), out)}`);
