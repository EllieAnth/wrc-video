// Forme des props d'une vidéo champion : données synchronisées (scripts/sync-champions.mjs) et
// lignes éditoriales (src/data/champion-lines/<slug>.json, contrat scripts/lines-contract.mjs).
export type Item = { slug: string; name: string; icon: string | null };
export type Spell = { key: string; name: string; desc: string | null };
export type Combo = { name: string | null; difficulty: string | null; inputs: string; tip: string };
export type Matchup = { vs: string; name?: string; icon?: string; edge: number; confidence: number; type: string; line: string };
export type ChampionData = {
  slug: string; key: string; name: string; role: string; roleLabel: string; patch: string; patchLabel: string; rank: string; computedAt: string;
  palette: [string, string] | null; lolId: number | null;
  stats: { tier: string; winRate: number | null; pickRate: number | null; banRate: number | null } | null;
  build: { label: string; items: Item[]; keystone: string | null; spikes: { level: number; label: string }[] };
  skill: { priority: string; levels: string[] } | null;
  spells: Spell[]; combos: Combo[]; gamePlan: { early: string | null; mid: string | null; late: string | null } | null; tips: string[];
  matchups: { hard: Matchup[]; easy: Matchup[] };
  media: { icon: string | null; splash: string | null; spellIcons: Record<string, string>; previews: Record<string, string> };
  gaps: string[];
};
export type Line = { text: string; source?: string; why?: string; confidence?: number };
export type ChampionLines = {
  schema: string; slug: string; patch: string; dataHash: string; status: string;
  lines: {
    tagline: Line; decision: { title: Line; sub: Line; spell?: string }; execution: { why: Line; spell?: string };
    plan: { early: Line; mid: Line; late: Line }; matchup?: { vs?: string; line?: Line }; combo?: { name: string | null; inputs: string } | null;
  };
};
export type ChampionProps = { slug: string; data: ChampionData | null; lines: ChampionLines | null };
