// Écrit les repères audio d'un format depuis sa timeline (la même que la composition) :
//   npx tsx scripts/cues.mts --format=meta-movers   →  public/audio/<format>.cues.json
import fs from 'node:fs';
import path from 'node:path';
import { CHAMPION_FORMAT, FORMATS } from '../src/formats/registry';

const arg = (n: string, d: string) => { const h = process.argv.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };
const id = arg('format', 'meta-movers');
if (!FORMATS.includes(id as never) && id !== CHAMPION_FORMAT) throw new Error(`format inconnu : ${id} (connus : ${[...FORMATS, CHAMPION_FORMAT].join(', ')})`);
const { timeline } = await import(`../src/formats/${id}/timeline.ts`);
const out = path.resolve('public/audio', `${id}.cues.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ fps: timeline.fps, bpm: timeline.bpm, total: timeline.total, sections: timeline.sections, cues: timeline.cues }, null, 1) + '\n');
console.log(`${id} : ${timeline.total} images, ${timeline.sections.length} sections, ${timeline.cues.length} repères → ${path.relative(process.cwd(), out)}`);
