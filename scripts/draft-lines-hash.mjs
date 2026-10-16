// Empreinte des données qui portent les lignes : si elle change (patch, build, combos, plan,
// matchups, stats), les lignes doivent être relues (`stale`). Partagée par draft-lines et validate-lines.
import crypto from 'node:crypto';
export const dataHash = (d) => crypto.createHash('sha1').update(JSON.stringify({ b: d.build, s: d.skill, c: d.combos, g: d.gamePlan, m: d.matchups, st: d.stats })).digest('hex').slice(0, 12);
