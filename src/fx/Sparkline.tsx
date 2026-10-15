import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { BODY, C, TITLE } from '../theme';
import { clamp, ease, ramp } from './util';

type Spark = { values: (number | null)[]; dates: string[]; delta7d?: number | null; delta30d?: number | null } | null | undefined;

/** Courbe de tendance du champion (comme /meta-trends/) : trait qui se trace, aire dégradée, grille,
 *  point de fin pulsé avec le portrait, étiquette de valeur. Couleurs = palette du champion. */
export const Sparkline: React.FC<{
  spark: Spark; champ: string; width?: number; height?: number; delay?: number; drawFrames?: number;
  palette?: [string, string] | null; label?: string; showPortrait?: boolean;
}> = ({ spark, champ, width = 900, height = 300, delay = 0, drawFrames = 40, palette, label, showPortrait = true }) => {
  const f = useCurrentFrame();
  const pts = (spark?.values || []).map((v, i) => ({ v, d: spark?.dates?.[i] })).filter((p): p is { v: number; d: string } => p.v != null);
  if (pts.length < 3) return null;
  const col = palette?.[0] || C.cyan;
  const col2 = palette?.[1] || C.gold;
  const padL = 70, padR = showPortrait ? 110 : 40, padT = 50, padB = 40;
  const w = width - padL - padR, h = height - padT - padB;
  const vals = pts.map((p) => p.v);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const X = (i: number) => padL + (i / (pts.length - 1)) * w;
  const Y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * h;
  // Courbe lissée (Catmull-Rom → Bézier), comme sur la page.
  let d = `M ${X(0)} ${Y(pts[0].v)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = X(i) + (X(i + 1) - X(Math.max(0, i - 1))) / 6, c1y = Y(p1.v) + (Y(p2.v) - Y(p0.v)) / 6;
    const c2x = X(i + 1) - (X(Math.min(pts.length - 1, i + 2)) - X(i)) / 6, c2y = Y(p2.v) - (Y(p3.v) - Y(p1.v)) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${X(i + 1)} ${Y(p2.v)}`;
  }
  const progress = ramp(f, delay, delay + drawFrames, ease.inOut);
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);
  const area = `${d} L ${X(pts.length - 1)} ${padT + h} L ${X(0)} ${padT + h} Z`;
  const last = pts[pts.length - 1];
  const endX = X(pts.length - 1), endY = Y(last.v);
  const pulse = 1 + Math.sin(f / 4) * 0.12;
  const endIn = ramp(f, delay + drawFrames - 6, delay + drawFrames + 6, ease.back);
  const delta = spark?.delta30d ?? spark?.delta7d ?? null;
  const deltaLabel = spark?.delta30d != null ? '30d' : '7d';
  const gridVals = [lo, (lo + hi) / 2, hi];
  const gid = `g-${champ}-${width}`;
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.45" /><stop offset="100%" stopColor={col} stopOpacity="0" /></linearGradient>
        <linearGradient id={gid + 's'} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={col2} /><stop offset="100%" stopColor={col} /></linearGradient>
        <clipPath id={gid + 'c'}><rect x={padL - 4} y={0} width={Math.max(0, w * progress + 8)} height={height} /></clipPath>
        <filter id={gid + 'glow'}><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {gridVals.map((g, i) => (
        <g key={i} opacity={ramp(f, delay, delay + 14)}>
          <line x1={padL} x2={padL + w} y1={Y(g)} y2={Y(g)} stroke={C.text} strokeOpacity={0.12} strokeDasharray="4 8" />
          <text x={padL - 14} y={Y(g) + 9} textAnchor="end" fontFamily={BODY} fontWeight={600} fontSize={22} fill={C.muted}>{g.toFixed(0)}%</text>
        </g>
      ))}
      <path d={area} fill={`url(#${gid})`} clipPath={`url(#${gid}c)`} />
      <path d={d} fill="none" stroke={`url(#${gid}s)`} strokeWidth={7} strokeLinecap="round" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} filter={`url(#${gid}glow)`} />
      <g transform={`translate(${endX} ${endY}) scale(${endIn})`}>
        <circle r={22 * pulse} fill={col} opacity={0.25} />
        <circle r={11} fill={col} stroke={C.text} strokeWidth={4} />
      </g>
      {showPortrait && (
        <foreignObject x={endX + 22} y={endY - 48} width={96} height={96} style={{ opacity: endIn }}>
          <Img src={staticFile(`champions/${champ}.jpg`)} style={{ width: 96, height: 96, borderRadius: 20, border: `4px solid ${col}`, boxShadow: `0 0 30px ${col}99`, objectFit: 'cover', display: 'block' }} />
        </foreignObject>
      )}
      <g opacity={endIn} transform={`translate(${Math.min(endX, padL + w - 160)} ${Math.max(padT - 10, endY - 64)})`}>
        <rect x={-150} y={-36} width={150} height={44} rx={10} fill={C.bg0} fillOpacity={0.85} stroke={col} strokeWidth={2} />
        <text x={-75} y={-5} textAnchor="middle" fontFamily={TITLE} fontWeight={900} fontSize={26} fill={C.text}>{last.v.toFixed(1)}%</text>
      </g>
      {delta != null && (
        <g opacity={endIn} transform={`translate(${padL} ${padT - 22})`}>
          <text fontFamily={BODY} fontWeight={800} fontSize={26} fill={delta >= 0 ? C.up : C.down}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} pts <tspan fill={C.muted} fontWeight={600}>{label || `win rate · ${deltaLabel}`}</tspan></text>
        </g>
      )}
      <text x={padL} y={height - 8} fontFamily={BODY} fontWeight={600} fontSize={20} fill={C.muted} opacity={ramp(f, delay, delay + 14)}>{pts[0].d.slice(5).replace('-', '/')}</text>
      <text x={padL + w} y={height - 8} textAnchor="end" fontFamily={BODY} fontWeight={600} fontSize={20} fill={C.muted} opacity={ramp(f, delay, delay + 14)}>{last.d.slice(5).replace('-', '/')}</text>
    </svg>
  );
};
