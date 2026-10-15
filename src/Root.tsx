import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './theme';
import { MetaMovers, DURATION as METAMOVERS } from './formats/meta-movers';
import { Duel, DURATION as DUEL } from './formats/duel';
import { HiddenPick, DURATION as HIDDEN } from './formats/hidden-pick';
import { Patch, DURATION as PATCH } from './formats/patch';
import { DraftReport, DURATION as DRAFT } from './formats/draft-report';

// Anglais uniquement (CLAUDE.md du dépôt). Un identifiant de composition = un dossier src/formats/<id>/
// (liste canonique : src/formats/registry.ts).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="meta-movers" component={MetaMovers} durationInFrames={METAMOVERS} fps={FPS} width={W} height={H} />
    <Composition id="duel" component={Duel} durationInFrames={DUEL} fps={FPS} width={W} height={H} />
    <Composition id="hidden-pick" component={HiddenPick} durationInFrames={HIDDEN} fps={FPS} width={W} height={H} />
    <Composition id="patch" component={Patch} durationInFrames={PATCH} fps={FPS} width={W} height={H} />
    <Composition id="draft-report" component={DraftReport} durationInFrames={DRAFT} fps={FPS} width={W} height={H} />
  </>
);
