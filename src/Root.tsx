import React from 'react';
import { Composition } from 'remotion';
import { TierListPatch, TIERLIST_PATCH_FRAMES } from './TierListPatch';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="TierListPatch-fr"
      component={TierListPatch}
      durationInFrames={TIERLIST_PATCH_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ lang: 'fr' as const }}
    />
    <Composition
      id="TierListPatch-en"
      component={TierListPatch}
      durationInFrames={TIERLIST_PATCH_FRAMES}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ lang: 'en' as const }}
    />
  </>
);
