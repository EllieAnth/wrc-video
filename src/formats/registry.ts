// Identifiants des formats : un dossier src/formats/<id>/ avec timeline.ts, voice.ts et index.tsx.
// FORMATS = les formats hebdomadaires rendus tels quels (render:all). `champion-35s` se rend une
// fois par champion avec des props (scripts/render-champions.mjs) : il n'est pas dans la boucle.
export const FORMATS = ['meta-movers', 'patch'] as const;
export const CHAMPION_FORMAT = 'champion-35s' as const;
export type FormatId = (typeof FORMATS)[number] | typeof CHAMPION_FORMAT;
