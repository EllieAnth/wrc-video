import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './theme';
import { MetaMovers, DURATION as METAMOVERS } from './formats/meta-movers';
import { Patch, DURATION as PATCH } from './formats/patch';

// Anglais uniquement (CLAUDE.md du dépôt). Un identifiant de composition = un dossier src/formats/<id>/
// (liste canonique : src/formats/registry.ts).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="meta-movers" component={MetaMovers} durationInFrames={METAMOVERS} fps={FPS} width={W} height={H} />
    <Composition id="patch" component={Patch} durationInFrames={PATCH} fps={FPS} width={W} height={H} />
  </>
);
