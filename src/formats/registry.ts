// Identifiants des formats : un dossier src/formats/<id>/ avec timeline.ts, voice.ts et index.tsx.
export const FORMATS = ['meta-movers', 'patch'] as const;
export type FormatId = (typeof FORMATS)[number];
