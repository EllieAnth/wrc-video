import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, RIOT_NOTICE, SITE, TITLE } from '../theme';
import { GoldText, Pill, RevealWords } from './Text';
import { clamp, ease, ramp, useSpring } from './util';

/** Bandeau du haut : marque + pastille (patch · semaine). */
export const TopBar: React.FC<{ right: string }> = ({ right }) => {
  const f = useCurrentFrame();
  const o = ramp(f, 0, 12);
  return (
    <div style={{ position: 'absolute', top: 110, left: 90, right: 90, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: o }}>
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: C.text }}>
        WILD RIFT <span style={{ color: C.gold }}>CORE</span>
      </div>
      <Pill size={24}>{right}</Pill>
    </div>
  );
};

/** Barre de progression de la vidéo + repères de scènes. */
export const ProgressBar: React.FC<{ marks?: number[] }> = ({ marks = [] }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 190, height: 6, borderRadius: 3, background: '#ffffff14' }}>
      <div style={{ width: `${(f / (durationInFrames - 1)) * 100}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})`, boxShadow: `0 0 12px ${C.cyan}88` }} />
      {marks.map((m, i) => <div key={i} style={{ position: 'absolute', left: `${(m / durationInFrames) * 100}%`, top: -3, width: 2, height: 12, background: '#ffffff55' }} />)}
    </div>
  );
};

/** Titre de scène : kicker + grand mot + pastille. */
export const SceneHead: React.FC<{ kicker: string; title: string; badge?: string; badgeBg?: string; top?: number; size?: number }> = ({ kicker, title, badge, badgeBg = C.gold, top = 290, size = 110 }) => {
  const head = useSpring(0, { damping: 16 });
  return (
    <div style={{ position: 'absolute', top, left: 0, right: 0, textAlign: 'center', opacity: head }}>
      <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.muted, letterSpacing: 6, textTransform: 'uppercase' }}>{kicker}</div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
        <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: size, color: C.text, textShadow: `0 0 40px ${C.cyan}44` }}>{title}</span>
        {badge && (
          <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: size * 0.55, color: C.bg0, background: `linear-gradient(180deg, ${C.gold2}, ${badgeBg})`, padding: '6px 24px', borderRadius: 18, transform: `rotate(-4deg) scale(${head})` }}>{badge}</span>
        )}
      </div>
    </div>
  );
};

/** Lettrage géant en filigrane (contour), pour habiller le bas d'une scène. */
export const Watermark: React.FC<{ text: string; top?: number }> = ({ text, top = 1560 }) => {
  const head = useSpring(0, { damping: 16 });
  return (
    <div style={{ position: 'absolute', top, left: -200, right: -200, textAlign: 'center', fontFamily: TITLE, fontWeight: 900, fontSize: 300, color: 'transparent', WebkitTextStroke: `3px ${C.cyan}38`, letterSpacing: 10, whiteSpace: 'nowrap', transform: `translateX(${(1 - head) * 200}px)` }}>
      {text}
    </div>
  );
};

/** Outro : marque, appel à l'action, lien qui pulse, mention Riot. */
export const Outro: React.FC<{ cta: string; url: string; sub?: string }> = ({ cta, url, sub }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useSpring(0, { damping: 14 });
  const pulse = 1 + Math.sin((f / fps) * Math.PI * 2) * 0.025;
  const ring = (f % 36) / 36;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 90px' }}>
      <div style={{ opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 76, letterSpacing: 4, color: C.text, whiteSpace: 'nowrap' }}>
          WILD RIFT <GoldText>CORE</GoldText>
        </div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 700, fontSize: 52, color: C.text, lineHeight: 1.25 }}>
          <RevealWords text={cta} delay={4} stagger={2} />
        </div>
        {sub && <div style={{ marginTop: 22, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.gold2, letterSpacing: 4, textTransform: 'uppercase' }}>{sub}</div>}
        <div style={{ position: 'relative', marginTop: 56, display: 'inline-block' }}>
          <div style={{ position: 'absolute', inset: -6, borderRadius: 999, border: `3px solid ${C.cyan}`, opacity: 1 - ring, transform: `scale(${1 + ring * 0.25})` }} />
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 48, color: C.bg0, background: `linear-gradient(90deg, ${C.cyan}, ${C.cyan2})`, padding: '24px 46px', borderRadius: 999, transform: `scale(${pulse})`, boxShadow: `0 0 60px ${C.cyan}66` }}>
            {SITE}{url}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 330, left: 120, right: 120, fontFamily: BODY, fontWeight: 500, fontSize: 22, lineHeight: 1.4, color: '#9ea8c7aa', opacity: s }}>{RIOT_NOTICE}</div>
    </AbsoluteFill>
  );
};

/** Compte à rebours « 3 · 2 · 1 » ou pastille de rang (#1) qui tombe avec rebond. */
export const DropBadge: React.FC<{ children: React.ReactNode; delay?: number; size?: number; bg?: string; style?: React.CSSProperties }> = ({ children, delay = 0, size = 64, bg = C.gold, style }) => {
  const s = useSpring(delay, { damping: 11, stiffness: 160 });
  return (
    <span style={{ display: 'inline-block', fontFamily: TITLE, fontWeight: 900, fontSize: size, color: C.bg0, background: `linear-gradient(180deg, ${C.gold2}, ${bg})`, padding: `${size * 0.1}px ${size * 0.4}px`, borderRadius: size * 0.3, transform: `scale(${s}) rotate(${(1 - s) * -20 - 4}deg)`, opacity: Math.min(1, s * 2), boxShadow: `0 10px 40px ${bg}66`, ...style }}>
      {children}
    </span>
  );
};
