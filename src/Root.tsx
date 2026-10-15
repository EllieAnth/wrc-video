import React from 'react';
import { Composition } from 'remotion';
import { TierListPatch, TIERLIST_PATCH_FRAMES } from './TierListPatch';
import TL from './timeline.json';

// Anglais uniquement (CLAUDE.md du dépôt).
export const RemotionRoot: React.FC = () => (
  <Composition
    id="TierListPatch"
    component={TierListPatch}
    durationInFrames={TIERLIST_PATCH_FRAMES}
    fps={TL.fps}
    width={1080}
    height={1920}
  />
);
