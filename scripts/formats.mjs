// Liste des formats, un par ligne — lue par les scripts npm (`for f in $(node scripts/formats.mjs)`).
// Source unique : src/formats/registry.ts.
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../src/formats/registry.ts', import.meta.url), 'utf8');
const m = src.match(/FORMATS\s*=\s*\[([^\]]*)\]/);
if (!m) throw new Error('FORMATS introuvable dans src/formats/registry.ts');
console.log([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).join('\n'));
