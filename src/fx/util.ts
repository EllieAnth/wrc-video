import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
export const ease = {
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back(1.4)),
  expo: Easing.out(Easing.exp),
};

/** 0 → 1 entre `from` et `to` (images), bornée, avec une courbe. */
export const ramp = (f: number, from: number, to: number, easing = ease.out) =>
  interpolate(f, [from, to], [0, 1], { ...clamp, easing });

/** Ressort retardé : 0 tant que `f < delay`, puis ressort. */
export const useSpring = (delay = 0, config: { damping?: number; mass?: number; stiffness?: number } = {}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: { damping: 14, mass: 0.8, stiffness: 120, ...config } });
};

/** Entrée (glissement + fondu) et sortie d'une scène. */
export const useSceneInOut = (duration: number, inFrames = 10, outFrames = 8) => {
  const f = useCurrentFrame();
  const inP = ramp(f, 0, inFrames, ease.expo);
  const outP = ramp(f, duration - outFrames, duration, ease.inOut);
  return { opacity: inP * (1 - outP), transform: `translateX(${(1 - inP) * 40 - outP * 90}px) scale(${1 - outP * 0.04})` };
};

/** Nombre qui monte vers sa valeur, avec un léger dépassement. */
export const countUp = (f: number, from: number, to: number, value: number, start = 0) => {
  const p = ramp(f, from, to, ease.expo);
  return start + (value - start) * p;
};
