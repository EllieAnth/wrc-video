// Contrat des lignes éditoriales d'une vidéo `champion-35s` (src/data/champion-lines/<slug>.json).
// Une seule définition, lue par draft-lines.mjs (brouillon), validate-lines.mjs (garde-fou) et la
// composition (via le JSON). Les budgets en caractères viennent des largeurs réelles du gabarit
// (1080 px, marges 70 px → 940 px utiles) ; la planche-contact (stills.mts) reste le juge final.
//
// Chaque champ porte : text, source (chemin dans les données), why (justification), confidence
// (0-1), et le fichier porte patch + dataHash — demande du second agent (16/10), pour savoir
// pourquoi une ligne existe et quand elle doit être relue.
export const SCHEMA = 'wrc.champion-lines/1';

/** Champ → { max: caractères, lines: nombre de lignes rendues au plus, font, px } */
export const FIELDS = {
  tagline: { max: 30, lines: 1, hint: 'Hook: who this champion is in ≤ 5 words (e.g. "Unkillable lane bully").' },
  'decision.title': { max: 36, lines: 2, hint: 'The one decision that wins games with this champion, as a headline (≤ 6 words).' },
  'decision.sub': { max: 72, lines: 2, hint: 'Why / when, one sentence, concrete (ability names allowed).' },
  'execution.why': { max: 72, lines: 2, hint: 'What the combo achieves and the timing that matters.' },
  // 36 et non 40 : mesuré le 16/10, 32 brouillons à 37-40 caractères passaient sur deux lignes (majuscules, →).
  'plan.early': { max: 36, lines: 1, hint: 'Early game priority, imperative, ≤ 7 words.' },
  'plan.mid': { max: 36, lines: 1, hint: 'Mid game priority, imperative, ≤ 7 words.' },
  'plan.late': { max: 36, lines: 1, hint: 'Late game priority, imperative, ≤ 7 words.' },
  'matchup.line': { max: 72, lines: 2, hint: 'How to survive the hardest matchup, one sentence.' },
};
export const STATUSES = ['draft', 'validated', 'rendered', 'ready', 'stale'];

export const get = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
export const set = (obj, dotted, value) => { const ks = dotted.split('.'); let o = obj; for (const k of ks.slice(0, -1)) o = o[k] ??= {}; o[ks.at(-1)] = value; };

const FR = /\b(le|la|les|des|une|pour|avec|sur|tes|ton|ta|est|et|ou|pas|si|dans|sans|puis|vers|contre|après|avant|très|bouclier|dégâts|soin|sorts|objectif|couloir|adversaire|ennemi|gagne|tour|ultime|niveau)\b/i;

/** Problèmes d'une ligne : [] si elle passe. `names` = noms (champion, sorts, objets) qui ne doivent pas être coupés. */
export function checkLine(field, entry, names = []) {
  const spec = FIELDS[field]; const issues = [];
  if (!spec) return [`champ inconnu : ${field}`];
  const text = entry?.text;
  if (typeof text !== 'string' || !text.trim()) return [`${field} : vide`];
  if (text.length > spec.max) issues.push(`${field} : ${text.length} caractères > ${spec.max}`);
  if (FR.test(text)) issues.push(`${field} : mot français`);
  if (/\*\*|__|<[a-z]/i.test(text)) issues.push(`${field} : balisage (**, <…>) interdit à l'écran`);
  if (/[.!?]\s+[A-Z].*[.!?]/.test(text) && spec.lines === 1) issues.push(`${field} : deux phrases sur une ligne`);
  if (spec.lines === 1 && text.split(/\s+/).length > 8) issues.push(`${field} : ${text.split(/\s+/).length} mots > 8`);
  // Un nom composé coupé par un retour à la ligne est illisible : on l'interdit sur les champs à 1 ligne
  // longs, et on demande qu'il tienne en entier sur une ligne du gabarit (≈ max/lines caractères).
  for (const n of names) if (n.includes(' ') && text.includes(n) && n.length > Math.floor(spec.max / spec.lines)) issues.push(`${field} : « ${n} » ne tient pas sur une ligne`);
  if (typeof entry.confidence === 'number' && (entry.confidence < 0 || entry.confidence > 1)) issues.push(`${field} : confidence hors [0,1]`);
  if (!entry.source) issues.push(`${field} : source manquante`);
  return issues;
}

/** Fichier complet → liste de problèmes (vide = valide). */
export function checkFile(file, data) {
  const issues = [];
  if (file?.schema !== SCHEMA) issues.push(`schema ≠ ${SCHEMA}`);
  if (!STATUSES.includes(file?.status)) issues.push(`status inconnu : ${file?.status}`);
  if (data && file?.slug !== data.slug) issues.push(`slug ${file?.slug} ≠ données ${data.slug}`);
  if (data && file?.patch !== data.patch) issues.push(`patch ${file?.patch} ≠ données ${data.patch} (stale)`);
  const names = data ? [data.name, ...(data.spells || []).map((s) => s.name), ...(data.build?.items || []).map((i) => i.name)] : [];
  for (const field of Object.keys(FIELDS)) {
    const entry = get(file?.lines, field);
    if (field === 'matchup.line' && data && !data.matchups?.hard?.length) continue; // pas de matchup connu → scène sans carte
    issues.push(...checkLine(field, entry, names));
  }
  if (file?.lines?.matchup?.vs && data && !data.matchups.hard.some((m) => m.vs === file.lines.matchup.vs)) issues.push(`matchup.vs ${file.lines.matchup.vs} absent des matchups durs`);
  // Répétition : la décision clé doit être propre au champion (contrôle inter-fichiers dans validate-lines.mjs).
  return issues;
}
