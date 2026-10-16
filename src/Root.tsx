import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './theme';
import { MetaMovers, DURATION as METAMOVERS } from './formats/meta-movers';
import { Patch, DURATION as PATCH } from './formats/patch';
import { Champion35s, DURATION as CHAMPION } from './formats/champion-35s';
import type { ChampionProps } from './formats/champion-35s/types';

// Anglais uniquement (CLAUDE.md du dépôt). Un identifiant de composition = un dossier src/formats/<id>/
// (liste canonique : src/formats/registry.ts). `champion-35s` est rendu une fois PAR CHAMPION : ses
// props (données + lignes) viennent de `scripts/champion-props.mjs`, jamais d'un fetch au rendu.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="meta-movers" component={MetaMovers} durationInFrames={METAMOVERS} fps={FPS} width={W} height={H} />
    <Composition id="patch" component={Patch} durationInFrames={PATCH} fps={FPS} width={W} height={H} />
    <Composition id="champion-35s" component={Champion35s} durationInFrames={CHAMPION} fps={FPS} width={W} height={H} defaultProps={{ slug: '', data: null, lines: null } satisfies ChampionProps} />
  </>
);
