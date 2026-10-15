import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { noise2D } from '@remotion/noise';
import { BODY, C, TIER_COLOR, TITLE, tierLabel, pct } from '../theme';
import { clamp, ease, ramp, useSpring } from './util';

export type ChampLike = { key: string; name: string; winRate?: number | null; pickRate?: number | null; banRate?: number | null; palette?: [string, string] | null | string[]; tier?: string | null };

/** Carte champion façon tier list du site : cadre dégradé (palette du champion), reflet qui balaye,
 *  inclinaison 3D qui respire, pastille de tier, taux de victoire qui s'affiche. */
export const ChampCard: React.FC<{
  c: ChampLike; size?: number; delay?: number; star?: boolean; rank?: number; showStats?: boolean; showName?: boolean; tier?: string | null; style?: React.CSSProperties; sweepAt?: number;
}> = ({ c, size = 220, delay = 0, star, rank, showStats = true, showName = true, tier, style, sweepAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = useSpring(delay, { damping: 12, mass: 0.7, stiffness: 150 });
  const statsIn = ramp(f, delay + 12, delay + 26);
  const p1 = (c.palette?.[0] as string) || C.gold2;
  const p2 = (c.palette?.[1] as string) || C.cyan;
  // Respiration 3D : légère rotation portée par un bruit (jamais la même sur deux cartes).
  const rx = noise2D('rx' + c.key, f * 0.02, 0) * 5;
  const ry = noise2D('ry' + c.key, f * 0.02, 1) * 7;
  const sweep = sweepAt == null ? -200 : interpolate(f, [sweepAt, sweepAt + 22], [-120, 220], { ...clamp, easing: ease.inOut });
  const t = tier ?? c.tier ?? null;
  const tierCol = t ? TIER_COLOR[t] || C.muted : null;
  return (
    <div style={{ width: size + 24, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - s) * 90}px) scale(${0.5 + s * 0.5})`, opacity: s, perspective: 900, ...style }}>
      <div style={{ position: 'relative', width: size, height: size, borderRadius: size * 0.14, padding: 5, background: `linear-gradient(140deg, ${p1}, ${p2})`, boxShadow: `0 ${size * 0.08}px ${size * 0.25}px #000a, 0 0 ${star ? 70 : 36}px ${star ? p1 : p2}66`, transform: `rotateX(${rx}deg) rotateY(${ry}deg)`, transformStyle: 'preserve-3d' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: size * 0.14 - 5, overflow: 'hidden', background: C.bg0 }}>
          <Img src={staticFile(`champions/${c.key}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {/* reflet wrcSweep du site : translateX, jamais left */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '35%', background: 'linear-gradient(90deg, transparent, #ffffff66, transparent)', transform: `translateX(${sweep}%) skewX(-20deg)`, mixBlendMode: 'screen' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, #05060dcc 100%)' }} />
        </div>
        {rank != null && (
          <div style={{ position: 'absolute', top: -size * 0.09, left: -size * 0.09, width: size * 0.3, height: size * 0.3, borderRadius: '50%', background: `linear-gradient(180deg, ${C.gold2}, ${C.gold})`, color: C.bg0, fontFamily: TITLE, fontWeight: 900, fontSize: size * 0.14, display: 'grid', placeItems: 'center', boxShadow: `0 6px 20px #000a`, transform: `scale(${useSpringStatic(s)})` }}>#{rank}</div>
        )}
        {tierCol && (
          <div style={{ position: 'absolute', bottom: -size * 0.07, right: -size * 0.05, padding: `${size * 0.02}px ${size * 0.07}px`, borderRadius: size * 0.06, background: tierCol, color: C.bg0, fontFamily: TITLE, fontWeight: 900, fontSize: size * 0.13, boxShadow: '0 6px 20px #000a' }}>{tierLabel(t!)}</div>
        )}
      </div>
      {showName && <div style={{ marginTop: size * 0.09, fontFamily: BODY, fontWeight: 800, fontSize: Math.max(26, Math.round(size * 0.17)), color: C.text, whiteSpace: 'nowrap', textShadow: '0 2px 12px #000' }}>{c.name}</div>}
      {showStats && c.winRate != null && (
        <div style={{ marginTop: 2, fontFamily: BODY, fontWeight: 700, fontSize: Math.max(22, Math.round(size * 0.12)), color: C.up, opacity: statsIn, transform: `translateY(${(1 - statsIn) * 10}px)`, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {pct(c.winRate)} <span style={{ color: C.muted, fontWeight: 600 }}>WR</span>
        </div>
      )}
    </div>
  );
};
const useSpringStatic = (s: number) => Math.min(1, s * 1.2);

/** Rangée horizontale de cartes, avec décalage d'entrée. */
export const CardRow: React.FC<{ champs: ChampLike[]; size?: number; delay?: number; stagger?: number; star?: string | null; gap?: number; ranks?: boolean; tiers?: boolean; sweepAt?: number; top?: number }> = ({ champs, size = 200, delay = 0, stagger = 5, star, gap = 12, ranks, tiers, sweepAt, top }) => (
  <div style={{ position: top == null ? 'relative' : 'absolute', top, left: 40, right: 40, display: 'flex', justifyContent: 'center', columnGap: gap, alignItems: 'flex-start' }}>
    {champs.map((c, i) => <ChampCard key={c.key} c={c} size={size} delay={delay + i * stagger} star={c.key === star} rank={ranks ? i + 1 : undefined} tier={tiers ? c.tier : null} sweepAt={sweepAt == null ? undefined : sweepAt + i * 3} />)}
  </div>
);

/** Ligne de mouvement (▲/▼) : carte, nom, rôle, ancien → nouveau tier, qui glisse depuis le côté. */
export const MoveRow: React.FC<{ c: ChampLike & { role: string; from: string; to: string }; delay?: number; up: boolean }> = ({ c, delay = 0, up }) => {
  const s = useSpring(delay, { damping: 15 });
  const col = up ? C.up : C.down;
  const p1 = (c.palette?.[0] as string) || col;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '16px 26px', borderRadius: 26, background: `linear-gradient(90deg, ${col}14, #ffffff06)`, border: `2px solid ${col}55`, opacity: s, transform: `translateX(${(1 - s) * (up ? -220 : 220)}px)`, boxShadow: `inset 4px 0 0 ${col}` }}>
      <div style={{ width: 104, height: 104, borderRadius: 22, padding: 3, background: `linear-gradient(140deg, ${p1}, ${col})` }}>
        <Img src={staticFile(`champions/${c.key}.jpg`)} style={{ width: '100%', height: '100%', borderRadius: 19, objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: C.text }}>{c.name}</div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.muted, letterSpacing: 3 }}>{c.role}{c.winRate != null ? ` · ${pct(c.winRate)} WR` : ''}</div>
      </div>
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 50, color: C.text, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: C.muted }}>{tierLabel(c.from)}</span>
        <span style={{ color: col, fontSize: 40, display: 'inline-block', transform: `translateY(${Math.sin(delay + s * 6) * 0}px)` }}>{up ? '▲' : '▼'}</span>
        <span style={{ color: col, textShadow: `0 0 20px ${col}88` }}>{tierLabel(c.to)}</span>
      </div>
    </div>
  );
};

/** Tier list animée : les cartes se replacent de l'ancien rang au nouveau (FLIP), sur des rangées S+/S/A/B.
 *  `rows` = état final ; `fromRows` = état avant le mouvement. Entre `delay` et `delay+travel`, chaque carte
 *  glisse de son ancienne case à sa nouvelle, les montantes en vert, les descendantes en rouge. */
export const TierBoard: React.FC<{
  rows: { tier: string; champs: ChampLike[] }[]; fromRows?: { tier: string; champs: ChampLike[] }[]; delay?: number; travel?: number; cell?: number; gap?: number; width?: number; highlight?: string[];
}> = ({ rows, fromRows, delay = 20, travel = 24, cell = 112, gap = 10, width = 900, highlight = [] }) => {
  const f = useCurrentFrame();
  const labelW = 90;
  const perRow = Math.floor((width - labelW - 12) / (cell + gap));
  // Hauteur de chaque rangée de tier = nombre de lignes de cartes (l'état final fait foi pour la mise en page).
  const lines = rows.map((r) => Math.max(1, Math.ceil(r.champs.length / perRow)));
  const tops: number[] = []; let acc = 0;
  rows.forEach((_, i) => { tops[i] = acc; acc += lines[i] * (cell + gap) + 22; });
  const pos = (set: { tier: string; champs: ChampLike[] }[], key: string) => {
    for (let r = 0; r < set.length; r++) { const i = set[r].champs.findIndex((c) => c.key === key); if (i >= 0) return { x: labelW + (i % perRow) * (cell + gap), y: (tops[r] ?? 0) + Math.floor(i / perRow) * (cell + gap), tier: set[r].tier }; }
    return null;
  };
  const p = ramp(f, delay, delay + travel, ease.inOut);
  const all = rows.flatMap((r) => r.champs.map((c) => ({ c, tier: r.tier })));
  return (
    <div style={{ position: 'relative', width, height: acc }}>
      {rows.map((r, i) => (
        <div key={r.tier} style={{ position: 'absolute', left: 0, top: tops[i], width, height: lines[i] * (cell + gap) + 6, borderRadius: 18, background: `${TIER_COLOR[r.tier]}0f`, border: `1px solid ${TIER_COLOR[r.tier]}33`, opacity: ramp(f, i * 3, i * 3 + 10) }}>
          <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontFamily: TITLE, fontWeight: 900, fontSize: 40, color: TIER_COLOR[r.tier], textShadow: `0 0 18px ${TIER_COLOR[r.tier]}66` }}>{tierLabel(r.tier)}</div>
        </div>
      ))}
      {all.map(({ c, tier }, i) => {
        const to = pos(rows, c.key)!;
        const from = (fromRows && pos(fromRows, c.key)) || to;
        const moved = from.tier !== to.tier; // changement de tier : couleur + badge ; un simple décalage dans la rangée glisse sans marque
        const x = from.x + (to.x - from.x) * p, y = from.y + (to.y - from.y) * p;
        const lift = moved ? 1 + Math.sin(p * Math.PI) * 0.22 : 1;
        const col = moved ? (to.y < from.y ? C.up : C.down) : TIER_COLOR[tier];
        const inP = ramp(f, i * 1.5, i * 1.5 + 10, ease.back);
        const glow = highlight.includes(c.key) || (moved && p > 0 && p < 1);
        return (
          <div key={c.key} style={{ position: 'absolute', left: x, top: y + 8, width: cell, height: cell, borderRadius: cell * 0.16, padding: 3, background: `linear-gradient(140deg, ${col}, ${(c.palette?.[1] as string) || C.cyan})`, transform: `scale(${inP * (moved ? lift : 1)})`, opacity: inP, zIndex: moved ? 10 : 1, boxShadow: glow ? `0 0 30px ${col}aa` : '0 6px 16px #0008' }}>
            <Img src={staticFile(`champions/${c.key}.jpg`)} style={{ width: '100%', height: '100%', borderRadius: cell * 0.16 - 3, objectFit: 'cover', display: 'block' }} />
            {moved && (
              <div style={{ position: 'absolute', top: -14, right: -10, background: col, color: C.bg0, fontFamily: TITLE, fontWeight: 900, fontSize: 24, borderRadius: 999, padding: '2px 10px', opacity: p, transform: `scale(${0.6 + p * 0.4})` }}>{to.y < from.y ? '▲' : '▼'}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
