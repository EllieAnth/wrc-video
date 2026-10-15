import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, TITLE } from '../theme';
import { clamp, ease, ramp } from './util';

/** Lettrage doré ; `shine` (−15 → 115) fait traverser un reflet blanc découpé par le texte. */
export const GoldText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; shine?: number }> = ({ children, style, shine }) => (
  <span
    style={{
      backgroundImage: [
        shine == null ? null : `linear-gradient(105deg, transparent ${shine - 12}%, #fffbe8ee ${shine}%, transparent ${shine + 12}%)`,
        `linear-gradient(180deg, ${C.gold2} 0%, ${C.gold} 60%, ${C.goldDeep} 100%)`,
      ].filter(Boolean).join(', '),
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ...style,
    }}
  >
    {children}
  </span>
);

/** Reflet automatique : traverse le texte entre `from` et `to`. */
export const useShine = (from: number, to: number) => {
  const f = useCurrentFrame();
  return interpolate(f, [from, to], [-15, 115], { ...clamp, easing: ease.inOut });
};

/** Titre révélé mot par mot : chaque mot monte, se défloute, avec un décalage. */
export const RevealWords: React.FC<{ text: string; delay?: number; stagger?: number; style?: React.CSSProperties; gold?: boolean }> = ({ text, delay = 0, stagger = 4, style, gold }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.28em', ...style }}>
      {text.split(' ').map((w, i) => {
        const s = spring({ frame: f - delay - i * stagger, fps, config: { damping: 16, stiffness: 140 } });
        const inner = gold ? <GoldText>{w}</GoldText> : w;
        return (
          <span key={i} style={{ display: 'inline-block', transform: `translateY(${(1 - s) * 60}px)`, opacity: s, filter: `blur(${(1 - s) * 10}px)` }}>
            {inner}
          </span>
        );
      })}
    </span>
  );
};

/** Chiffre qui monte vers sa valeur (ex. 55.1%), chiffres tabulaires. */
export const CountUp: React.FC<{ value: number; from?: number; to?: number; decimals?: number; suffix?: string; prefix?: string; style?: React.CSSProperties; start?: number }> = ({ value, from = 0, to = 24, decimals = 1, suffix = '', prefix = '', style, start }) => {
  const f = useCurrentFrame();
  const p = ramp(f, from, to, ease.expo);
  const base = start ?? 0;
  const v = base + (value - base) * p;
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{prefix}{v.toFixed(decimals)}{suffix}</span>;
};

/** Étiquette capitale espacée (kicker). */
export const Kicker: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties; delay?: number }> = ({ children, color = C.cyan2, style, delay = 0 }) => {
  const f = useCurrentFrame();
  const o = ramp(f, delay, delay + 12);
  return (
    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color, letterSpacing: 8, textTransform: 'uppercase', opacity: o, transform: `translateY(${(1 - o) * 14}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Grand titre Orbitron avec effet « scan » : lignes horizontales qui balayent à l'arrivée. */
export const ScanTitle: React.FC<{ children: React.ReactNode; size?: number; delay?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 120, delay = 0, color = C.text, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - delay, fps, config: { damping: 15, stiffness: 110 } });
  const scan = ramp(f, delay, delay + 18, ease.inOut);
  return (
    <div style={{ position: 'relative', display: 'inline-block', fontFamily: TITLE, fontWeight: 900, fontSize: size, lineHeight: 1, color, letterSpacing: 2, transform: `scale(${0.8 + s * 0.2})`, opacity: s, ...style }}>
      {children}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent ${scan * 100 - 8}%, ${C.cyan2}aa ${scan * 100}%, transparent ${scan * 100 + 8}%)`, mixBlendMode: 'screen', opacity: 1 - scan }} />
    </div>
  );
};

/** Pastille (patch, rôle…). */
export const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; outline?: boolean; size?: number; style?: React.CSSProperties }> = ({ children, bg = C.cyan, color = C.bg0, outline, size = 30, style }) => (
  <span
    style={{
      display: 'inline-block', fontFamily: BODY, fontWeight: 800, fontSize: size, letterSpacing: 1, whiteSpace: 'nowrap',
      padding: `${size * 0.35}px ${size * 0.8}px`, borderRadius: 999,
      background: outline ? `${bg}22` : bg, color: outline ? bg : color, border: outline ? `3px solid ${bg}` : 'none', ...style,
    }}
  >
    {children}
  </span>
);
