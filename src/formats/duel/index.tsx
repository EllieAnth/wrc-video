import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import data from '../../data/duel.json';
import { BODY, C, ROLE_SUB, TITLE, pct, weekLabel } from '../../theme';
import { Background, Flash } from '../../fx/Background';
import { CountUp, GoldText, Kicker, Pill, RevealWords, ScanTitle, useShine } from '../../fx/Text';
import { Outro, ProgressBar, TopBar, DropBadge } from '../../fx/Chrome';
import { ChampCard } from '../../fx/Card';
import { CreatorPanel, SplashPanel } from '../../fx/Video';
import { Sparkline } from '../../fx/Sparkline';
import { ease, ramp, useSceneInOut, useSpring } from '../../fx/util';
import * as T from './timeline';

export const DURATION = T.TOTAL;
const week = weekLabel(data.week);
const A = data.a, B = data.b;
const winner = data.edge > 0 ? A : B;
const loser = data.edge > 0 ? B : A;
const palA = (A.palette?.[0] as string) || C.cyan, palB = (B.palette?.[0] as string) || C.down;

// ── Intro : deux splashs en biais, VS au centre, noms qui claquent ────────────
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const sa = useSpring(2, { damping: 16 }), sb = useSpring(8, { damping: 16 });
  const vs = useSpring(36, { damping: 9, stiffness: 220 });
  const shine = useShine(40, 70);
  const names = ramp(f, 14, 30);
  const half = (champ: string, side: -1 | 1, s: number) => (
    <div style={{ position: 'absolute', inset: 0, clipPath: side < 0 ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(100% 0, 100% 100%, 0 100%)', transform: `translateX(${(1 - s) * side * 500}px)`, opacity: s }}>
      <Img src={staticFile(`splash/${champ}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.3 - ramp(f, 0, T.INTRO) * 0.08}) translateX(${side * -60}px)`, filter: 'saturate(1.15)' }} />
      <div style={{ position: 'absolute', inset: 0, background: side < 0 ? `linear-gradient(135deg, ${palA}33, #05060d99)` : `linear-gradient(315deg, ${palB}33, #05060d99)` }} />
    </div>
  );
  return (
    <AbsoluteFill style={useSceneInOut(T.INTRO, 1, 8)}>
      {half(A.key, -1, sa)}
      {half(B.key, 1, sb)}
      <div style={{ position: 'absolute', left: -200, right: -200, top: 0, bottom: 0, background: `linear-gradient(135deg, transparent 49.4%, ${C.gold2} 49.6%, ${C.gold2} 50.4%, transparent 50.6%)`, opacity: Math.min(sa, sb) }} />
      <Flash at={36} strength={0.7} />
      <div style={{ position: 'absolute', top: 300, left: 60, textAlign: 'left', opacity: names, transform: `translateX(${(1 - names) * -80}px)` }}>
        <Kicker>{ROLE_SUB[data.role]} · #1</Kicker>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 96, color: C.text, textShadow: '0 10px 40px #000', lineHeight: 1 }}>{A.name.toUpperCase()}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 420, right: 60, textAlign: 'right', opacity: names, transform: `translateX(${(1 - names) * 80}px)` }}>
        <Kicker color={palB}>Popular pick · {pct(B.pickRate)}</Kicker>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 96, color: C.text, textShadow: '0 10px 40px #000', lineHeight: 1 }}>{B.name.toUpperCase()}</div>
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${vs}) rotate(${(1 - vs) * 40}deg)`, fontFamily: TITLE, fontWeight: 900, fontSize: 220, lineHeight: 1, textShadow: '0 20px 80px #000' }}>
        <GoldText shine={shine}>VS</GoldText>
      </div>
      <div style={{ position: 'absolute', bottom: 300, left: 0, right: 0, textAlign: 'center', opacity: ramp(f, 48, 60) }}>
        <Pill outline bg={C.cyan} size={36}>Duel of the week · {week}</Pill>
      </div>
    </AbsoluteFill>
  );
};

// ── Clip d'un champion : plein cadre, carte + chiffres qui montent ────────────
const ClipScene: React.FC<{ c: typeof A; label: string; color: string; len: number }> = ({ c, label, color, len }) => {
  const f = useCurrentFrame();
  const statsIn = ramp(f, 20, 34);
  return (
    <AbsoluteFill style={useSceneInOut(len)}>
      <CreatorPanel champ={c.key} top={0} height={1920} delay={0} durationFrames={len} dim={0.3} badgeBottom={330} />
      <div style={{ position: 'absolute', top: 290, left: 70, display: 'flex', alignItems: 'center', gap: 30 }}>
        <ChampCard c={c} size={200} delay={4} showStats={false} tier={c.tier} />
        <div style={{ opacity: statsIn, transform: `translateX(${(1 - statsIn) * -40}px)` }}>
          <Kicker color={color} style={{ fontSize: 28 }}>{label}</Kicker>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 70, color: C.text, textShadow: '0 6px 30px #000', lineHeight: 1.05 }}>{c.name}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 70, right: 70, display: 'flex', gap: 24 }}>
        {[['Win rate', c.winRate, C.up], ['Pick rate', c.pickRate, C.cyan2], ['Ban rate', c.banRate, C.warn]].map(([k, v, col], i) => (
          <div key={k as string} style={{ flex: 1, background: '#05060dcc', border: `1px solid ${C.line}`, borderRadius: 20, padding: '16px 20px', opacity: ramp(f, 24 + i * 6, 36 + i * 6), transform: `translateY(${(1 - ramp(f, 24 + i * 6, 36 + i * 6)) * 30}px)` }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 24, color: C.muted, letterSpacing: 3, textTransform: 'uppercase' }}>{k as string}</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 56, color: col as string }}><CountUp value={(v as number) || 0} from={26 + i * 6} to={60 + i * 6} suffix="%" /></div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 70, bottom: 480, opacity: ramp(f, 50, 62) }}>
        <Sparkline spark={c.spark} champ={c.key} width={940} height={240} delay={54} drawFrames={36} palette={c.palette as [string, string] | null} showPortrait={false} />
      </div>
    </AbsoluteFill>
  );
};

// ── L'interaction clé : texte révélé, icônes des deux champions, étiquette du type ─
const KeyScene: React.FC = () => {
  const f = useCurrentFrame();
  const s = useSpring(0, { damping: 16 });
  const textIn = ramp(f, 18, 30);
  const tagIn = ramp(f, 70, 82);
  const TYPE: Record<string, string> = { ap_shred: 'Magic damage race', sustain_war: 'Sustain war', skill_check: 'Skill check', scaling_gap: 'Scaling gap', mobility_check: 'Mobility check', attack_speed_slow: 'Attack speed slow' };
  return (
    <AbsoluteFill style={useSceneInOut(T.KEY)}>
      <SplashPanel champ={winner.key} top={0} height={1920} delay={0} durationFrames={T.KEY} dim={0.72} />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', opacity: s }}>
        <Kicker>The key interaction</Kicker>
        <div style={{ marginTop: 10, fontFamily: TITLE, fontWeight: 900, fontSize: 92 }}><RevealWords text="WHY IT'S WON" gold delay={2} stagger={4} /></div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
        <ChampCard c={A} size={170} delay={6} showStats={false} />
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 60, color: C.gold, opacity: s }}>⚔</div>
        <ChampCard c={B} size={170} delay={10} showStats={false} />
      </div>
      <div style={{ position: 'absolute', top: 880, left: 90, right: 90, background: '#05060dd9', border: `2px solid ${C.gold}66`, borderRadius: 28, padding: '36px 40px', opacity: textIn, transform: `translateY(${(1 - textIn) * 40}px)`, boxShadow: `0 30px 80px #000a` }}>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 40, lineHeight: 1.35, color: C.text }}>
          <RevealWords text={data.keyInteraction} delay={20} stagger={1.5} style={{ justifyContent: 'flex-start', columnGap: '0.25em' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 330, left: 0, right: 0, textAlign: 'center', opacity: tagIn, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Pill size={26} bg={C.gold}>{TYPE[data.type] || data.type.replace(/_/g, ' ')}</Pill>
        {data.tags.slice(0, 2).map((t) => <Pill key={t} size={26} outline bg={C.cyan}>{t.replace(/_/g, ' ')}</Pill>)}
      </div>
    </AbsoluteFill>
  );
};

// ── Verdict : le gagnant en grand, l'écart, la confiance ─────────────────────
const VerdictScene: React.FC = () => {
  const f = useCurrentFrame();
  const s = useSpring(0, { damping: 12, stiffness: 180 });
  const edgeIn = useSpring(24, { damping: 10, stiffness: 200 });
  const conf = ramp(f, 40, 60);
  const sideCol = data.edge > 0 ? palA : palB;
  return (
    <AbsoluteFill style={useSceneInOut(T.VERDICT)}>
      <CreatorPanel champ={winner.key} top={0} height={1920} delay={0} durationFrames={T.VERDICT} dim={0.5} badgeBottom={330} />
      <Flash at={0} strength={0.8} />
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker>Verdict</Kicker>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><ChampCard c={winner} size={260} delay={0} showStats={false} star /></div>
        <div style={{ marginTop: 24, fontFamily: TITLE, fontWeight: 900, fontSize: 104, lineHeight: 1, transform: `scale(${s})`, opacity: s, textShadow: '0 10px 50px #000' }}>
          <GoldText>{winner.name.toUpperCase()}</GoldText>
        </div>
        <div style={{ marginTop: 10, fontFamily: BODY, fontWeight: 700, fontSize: 40, color: C.text, opacity: s }}>{Math.abs(data.edge) >= 2 ? 'clearly favored' : 'slightly favored'}</div>
        <div style={{ marginTop: 40, display: 'inline-flex', alignItems: 'center', gap: 20, transform: `scale(${edgeIn})`, opacity: Math.min(1, edgeIn) }}>
          <DropBadge delay={24} size={72} bg={sideCol}>+{Math.abs(data.edge)}</DropBadge>
          <div style={{ textAlign: 'left', fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.muted, lineHeight: 1.2 }}>edge for {winner.name}<br /><span style={{ color: C.text }}>on a 0 … 3 scale</span></div>
        </div>
        <div style={{ marginTop: 36, opacity: conf }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.muted, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>confidence {Math.round(data.confidence * 100)}%</div>
          <div style={{ width: 600, height: 12, margin: '0 auto', borderRadius: 6, background: '#ffffff18' }}><div style={{ width: `${data.confidence * 100 * conf}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})` }} /></div>
        </div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.down, opacity: ramp(f, 64, 76) }}>{loser.name} players: ban it, or dodge the lane.</div>
      </div>
    </AbsoluteFill>
  );
};

export const Duel: React.FC = () => {
  const f = useCurrentFrame();
  const onB = f >= T.CLIP_B_START && f < T.KEY_START;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <Audio src={staticFile('audio/duel.wav')} />
      <Background accent={onB ? palB : palA} accent2={onB ? palA : palB} pulse={f >= T.VERDICT_START ? 1 : 0} />
      <Sequence durationInFrames={T.INTRO}><Intro /></Sequence>
      <Sequence from={T.CLIP_A_START} durationInFrames={T.CLIP_A}><ClipScene c={A} label={`#1 ${ROLE_SUB[data.role]}`} color={C.cyan2} len={T.CLIP_A} /></Sequence>
      <Sequence from={T.CLIP_B_START} durationInFrames={T.CLIP_B}><ClipScene c={B} label="The challenger" color={palB} len={T.CLIP_B} /></Sequence>
      <Sequence from={T.KEY_START} durationInFrames={T.KEY}><KeyScene /></Sequence>
      <Sequence from={T.VERDICT_START} durationInFrames={T.VERDICT}><VerdictScene /></Sequence>
      <Sequence from={T.OUTRO_START} durationInFrames={T.OUTRO}><Outro cta="Every counter, with the key interaction" url="/en/counter-picks" sub={`Duel of the week · ${week}`} /></Sequence>
      <TopBar right={`Patch ${data.patch} · ${week.toUpperCase()}`} />
      <ProgressBar marks={T.timeline.scenes.map((s) => s.start)} />
    </AbsoluteFill>
  );
};
