import React from 'react';
import { Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, TITLE } from '../theme';
import { clamp, ease, ramp, useSpring } from './util';
import creators from '../data/clips-creators.json';

export type CreatorClip = { src: string; creator: string; channel: string; url: string; title: string; kind: string; start: number; duration: number; source: string };
export const creatorClip = (key: string): CreatorClip | null => (creators as Record<string, CreatorClip>)[key] || null;

/** Panneau vidéo plein cadre ou en bande : fondu haut/bas, lent zoom, grain. `clip` = chemin sous public/. */
export const ClipPanel: React.FC<{
  src: string; startFrom?: number; top?: number; height?: number; delay?: number; zoomFrom?: number; zoomTo?: number;
  fadeEdges?: boolean; dim?: number; children?: React.ReactNode; durationFrames?: number;
}> = ({ src, startFrom = 0, top = 0, height, delay = 0, zoomFrom = 1.12, zoomTo = 1.02, fadeEdges = true, dim = 0, children, durationFrames = 90 }) => {
  const f = useCurrentFrame();
  const { height: H } = useVideoConfig();
  const open = useSpring(delay, { damping: 20 });
  const z = interpolate(f, [delay, delay + durationFrames], [zoomFrom, zoomTo], { ...clamp, easing: ease.out });
  const fade = 'linear-gradient(180deg, transparent 0%, #000 10%, #000 90%, transparent 100%)';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: height ?? H - top, overflow: 'hidden', opacity: open, maskImage: fadeEdges ? fade : undefined, WebkitMaskImage: fadeEdges ? fade : undefined, transform: `scaleY(${0.9 + open * 0.1})` }}>
      <OffthreadVideo src={staticFile(src)} startFrom={startFrom} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})` }} />
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `#05060d`, opacity: dim }} />}
      {children}
    </div>
  );
};

/** Bandeau « clip by » : nom de la chaîne en évidence, icône lecture, glisse depuis la gauche. */
export const CreatorBadge: React.FC<{ clip: CreatorClip; delay?: number; bottom?: number; left?: number }> = ({ clip, delay = 6, bottom = 40, left = 50 }) => {
  const s = useSpring(delay, { damping: 16 });
  return (
    <div style={{ position: 'absolute', left, bottom, display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${(1 - s) * -160}px)`, opacity: s }}>
      <div style={{ width: 54, height: 54, borderRadius: 14, background: '#ff0033', display: 'grid', placeItems: 'center', boxShadow: '0 6px 24px #0009' }}>
        <div style={{ width: 0, height: 0, borderLeft: '20px solid #fff', borderTop: '12px solid transparent', borderBottom: '12px solid transparent', marginLeft: 4 }} />
      </div>
      <div style={{ background: '#05060dd9', border: `2px solid ${C.cyan}`, borderRadius: 16, padding: '10px 22px' }}>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 22, color: C.muted, letterSpacing: 3, textTransform: 'uppercase' }}>Clip by</div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 34, color: C.text, whiteSpace: 'nowrap', maxWidth: 760, overflow: 'hidden', textOverflow: 'ellipsis' }}>{clip.creator}</div>
      </div>
    </div>
  );
};

/** Clip de créateur prêt à l'emploi : panneau + bandeau. Repli : splash du champion (Ken Burns) si aucun clip. */
export const CreatorPanel: React.FC<{ champ: string; top?: number; height?: number; delay?: number; durationFrames?: number; dim?: number; badgeBottom?: number }> = ({ champ, top = 0, height, delay = 0, durationFrames = 90, dim = 0, badgeBottom = 40 }) => {
  const clip = creatorClip(champ);
  if (clip) {
    return (
      <ClipPanel src={clip.src} top={top} height={height} delay={delay} durationFrames={durationFrames} dim={dim}>
        <CreatorBadge clip={clip} delay={delay + 8} bottom={badgeBottom} />
      </ClipPanel>
    );
  }
  return <SplashPanel champ={champ} top={top} height={height} delay={delay} durationFrames={durationFrames} dim={dim} />;
};

/** Splash art en Ken Burns (zoom + glissement), fondu sur les bords. */
export const SplashPanel: React.FC<{ champ: string; top?: number; height?: number; delay?: number; durationFrames?: number; dim?: number }> = ({ champ, top = 0, height, delay = 0, durationFrames = 90, dim = 0 }) => {
  const f = useCurrentFrame();
  const { height: H } = useVideoConfig();
  const open = useSpring(delay, { damping: 20 });
  const p = interpolate(f, [delay, delay + durationFrames], [0, 1], clamp);
  const fade = 'linear-gradient(180deg, transparent 0%, #000 12%, #000 88%, transparent 100%)';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, height: height ?? H - top, overflow: 'hidden', opacity: open, maskImage: fade, WebkitMaskImage: fade }}>
      <Img src={staticFile(`splash/${champ}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.25 - p * 0.1}) translateX(${(0.5 - p) * 40}px)` }} />
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: '#05060d', opacity: dim }} />}
    </div>
  );
};

/** Aperçu officiel Riot d'un sort, avec étiquette « ★ Nom · Ultimate ». */
export const SpellPanel: React.FC<{ src: string; start: number; name: string; spell: string; top: number; height: number; delay?: number; durationFrames?: number }> = ({ src, start, name, spell, top, height, delay = 0, durationFrames = 90 }) => {
  const { fps } = useVideoConfig();
  const labelIn = useSpring(delay + 8, { damping: 16 });
  const SPELL: Record<string, string> = { R: 'Ultimate', Q: 'Q ability', W: 'W ability', E: 'E ability' };
  return (
    <ClipPanel src={src} startFrom={Math.round(start * fps)} top={top} height={height} delay={delay} durationFrames={durationFrames} zoomFrom={1.32} zoomTo={1.22}>
      <div style={{ position: 'absolute', left: 50, bottom: 60, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 26px', borderRadius: 999, background: '#05060dcc', border: `2px solid ${C.cyan}`, fontFamily: BODY, fontWeight: 800, fontSize: 32, color: C.text, letterSpacing: 2, textTransform: 'uppercase', transform: `translateX(${(1 - labelIn) * -120}px)`, opacity: labelIn }}>
        <span style={{ color: C.cyan2 }}>★ {name}</span>
        <span style={{ color: C.muted, fontWeight: 600 }}>{SPELL[spell] ?? spell}</span>
      </div>
    </ClipPanel>
  );
};
