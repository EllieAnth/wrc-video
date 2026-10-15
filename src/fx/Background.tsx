import React, { useMemo } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { C } from '../theme';

/** Fond vivant : dégradé, deux halos qui dérivent, particules portées par un bruit, trame diagonale, vignette.
 *  `accent` (couleur du champion à l'écran) teinte le halo haut ; `pulse` (0-1) le fait respirer. */
export const Background: React.FC<{ accent?: string | null; accent2?: string | null; pulse?: number; speed?: number }> = ({ accent, accent2, pulse = 0, speed = 1 }) => {
  const f = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = (f / durationInFrames) * speed;
  const a1 = accent || C.cyan;
  const a2 = accent2 || C.gold;
  const particles = useMemo(() => Array.from({ length: 70 }, (_, i) => ({ seed: i * 7.13, size: 2 + (i % 5) })), []);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 55%, ${C.bg2} 100%)`, overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${900 + pulse * 200}px ${900 + pulse * 200}px at ${30 + t * 40}% ${18 + t * 10}%, ${a1}3a, transparent 70%),
                       radial-gradient(800px 800px at ${80 - t * 30}% ${85 - t * 15}%, ${a2}2a, transparent 70%)`,
        }}
      />
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {particles.map((p, i) => {
          const x = (noise2D('x' + i, p.seed, f * 0.004) * 0.5 + 0.5) * width;
          const y = ((noise2D('y' + i, p.seed, f * 0.003) * 0.5 + 0.5) * height * 1.2 - (f * (0.6 + (i % 3) * 0.3)) % (height * 1.2) + height * 1.2) % (height * 1.2) - height * 0.1;
          const o = 0.15 + (noise2D('o' + i, p.seed, f * 0.02) * 0.5 + 0.5) * 0.45;
          return <circle key={i} cx={x} cy={y} r={p.size} fill={i % 3 === 0 ? a2 : a1} opacity={o} />;
        })}
      </svg>
      <AbsoluteFill
        style={{
          opacity: 0.07,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.text} 0 1px, transparent 1px 46px)`,
          transform: `translateY(${-(f * 0.8) % 46}px)`,
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, #000000aa 100%)' }} />
    </AbsoluteFill>
  );
};

/** Flash blanc bref (impact) : à poser au début d'une scène. */
export const Flash: React.FC<{ at?: number; strength?: number }> = ({ at = 0, strength = 0.55 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 2, at + 14], [0, strength, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: '#fff', opacity: o, pointerEvents: 'none' }} />;
};
