import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';
import data from '../../data/draft.json';
import { BODY, C, ROLE_SUB, TITLE, weekLabel } from '../../theme';
import { Background, Flash } from '../../fx/Background';
import { CountUp, GoldText, Kicker, Pill, RevealWords, useShine } from '../../fx/Text';
import { Outro, ProgressBar, TopBar, DropBadge, Watermark } from '../../fx/Chrome';
import { ChampCard } from '../../fx/Card';
import { CreatorPanel } from '../../fx/Video';
import { Sparkline } from '../../fx/Sparkline';
import { ease, ramp, useSceneInOut, useSpring } from '../../fx/util';
import * as T from './timeline';

export const DURATION = T.TOTAL;
const week = weekLabel(data.week);
const faced = data.mostFaced, picked = data.mostPicked, pairs = data.topPairs;
const top = faced[0];
const follow = Math.round((data.recoFollow.inTop3 / data.recoFollow.selfPicks) * 100);
const FLAG: Record<string, string> = { BR: '🇧🇷', VN: '🇻🇳', PH: '🇵🇭', FR: '🇫🇷', US: '🇺🇸', ID: '🇮🇩', TR: '🇹🇷', ES: '🇪🇸', MX: '🇲🇽', DE: '🇩🇪', GB: '🇬🇧' };
const SURF: Record<string, string> = { web: 'Web', android: 'Android', ios: 'iOS' };

// ── Intro : le compteur qui grimpe, puis surfaces et pays ───────────────────
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const shine = useShine(44, 74);
  const s = useSpring(2, { damping: 14 });
  const sub = ramp(f, 50, 62);
  const total = data.bySurface.reduce((a, b) => a + b.n, 0);
  return (
    <AbsoluteFill style={useSceneInOut(T.INTRO, 1, 8)}>
      <CreatorPanel champ={top.key} top={0} height={1920} delay={0} durationFrames={T.INTRO} dim={0.7} badgeBottom={330} />
      <Flash at={50} strength={0.6} />
      <div style={{ position: 'absolute', top: 480, left: 0, right: 0, textAlign: 'center', opacity: s }}>
        <Kicker>Draft report · last {data.windowDays} days</Kicker>
        <div style={{ marginTop: 16, fontFamily: TITLE, fontWeight: 900, fontSize: 230, lineHeight: 1, textShadow: '0 20px 80px #000' }}>
          <GoldText shine={shine}><CountUp value={data.drafts} decimals={0} from={6} to={50} style={{ fontVariantNumeric: 'tabular-nums' }} /></GoldText>
        </div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 76, color: C.text, letterSpacing: 6 }}><RevealWords text="DRAFTS" delay={8} /></div>
        <div style={{ marginTop: 14, fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.muted, opacity: ramp(f, 20, 32) }}>run through our draft engine, site and app</div>
      </div>
      <div style={{ position: 'absolute', top: 1180, left: 90, right: 90, opacity: sub, transform: `translateY(${(1 - sub) * 30}px)` }}>
        <div style={{ display: 'flex', height: 22, borderRadius: 11, overflow: 'hidden', gap: 4 }}>
          {data.bySurface.map((sf, i) => <div key={sf.surface} style={{ width: `${(sf.n / total) * 100 * ramp(f, 56, 80)}%`, background: [C.cyan, C.gold, C.up][i % 3] }} />)}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.text }}>
          {data.bySurface.map((sf, i) => <span key={sf.surface}><span style={{ color: [C.cyan, C.gold, C.up][i % 3] }}>●</span> {SURF[sf.surface] || sf.surface} <span style={{ color: C.muted }}>{Math.round((sf.n / total) * 100)}%</span></span>)}
        </div>
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          {data.byCountry.map((c, i) => <Pill key={c.country} size={26} outline bg={C.cyan} style={{ opacity: ramp(f, 60 + i * 4, 70 + i * 4) }}>{FLAG[c.country] || ''} {c.country} · {c.n}</Pill>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── L'ennemi que vous affrontez : n° 1 en grand avec clip, les 4 autres en barres ─
const Faced: React.FC = () => {
  const f = useCurrentFrame();
  const max = faced[0].n;
  return (
    <AbsoluteFill style={useSceneInOut(T.FACED)}>
      <CreatorPanel champ={top.key} top={300} height={470} delay={0} durationFrames={T.FACED} badgeBottom={20} dim={0.15} />
      <div style={{ position: 'absolute', top: 236, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 70, lineHeight: 1 }}><RevealWords text="THE ENEMY YOU FACE" gold delay={0} stagger={3} /></div>
      </div>
      <div style={{ position: 'absolute', top: 760, left: 70, display: 'flex', alignItems: 'center', gap: 26 }}>
        <ChampCard c={top} size={210} delay={12} showStats={false} tier={top.tier} rank={1} />
        <div style={{ opacity: ramp(f, 22, 34) }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.muted, letterSpacing: 4, textTransform: 'uppercase' }}>{ROLE_SUB[top.role]} · faced</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 120, lineHeight: 1, color: C.text, textShadow: '0 8px 40px #000' }}><CountUp value={top.n} decimals={0} from={24} to={50} /></div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.text }}>times · <span style={{ color: C.up }}>{top.winRate.toFixed(1)}%</span> WR</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1090, left: 70, right: 70, display: 'grid', gap: 16 }}>
        {faced.slice(1).map((c, i) => {
          const at = 46 + i * 8;
          const s = ramp(f, at, at + 14, ease.back);
          const bar = ramp(f, at + 6, at + 34);
          return (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, s), transform: `translateX(${(1 - s) * -160}px)` }}>
              <span style={{ width: 50, fontFamily: TITLE, fontWeight: 900, fontSize: 36, color: C.gold }}>#{i + 2}</span>
              <ChampCard c={c} size={92} delay={at} showStats={false} showName={false} style={{ width: 100 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.text }}><span>{c.name} <span style={{ color: C.muted, fontSize: 24 }}>{ROLE_SUB[c.role]}</span></span><span style={{ fontVariantNumeric: 'tabular-nums' }}><CountUp value={c.n} decimals={0} from={at + 6} to={at + 34} /></span></div>
                <div style={{ marginTop: 6, height: 14, borderRadius: 7, background: '#ffffff14' }}><div style={{ width: `${(c.n / max) * 100 * bar}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${(c.palette?.[0] as string) || C.cyan}, ${(c.palette?.[1] as string) || C.gold})` }} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Ce que vous jouez : 5 cartes classées, puis la part qui suit la reco ─────
const Picked: React.FC = () => {
  const f = useCurrentFrame();
  const stat = useSpring(60, { damping: 11, stiffness: 160 });
  return (
    <AbsoluteFill style={useSceneInOut(T.PICKED)}>
      <Watermark text="PICKS" top={1500} />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker>Your side of the draft</Kicker>
        <div style={{ marginTop: 6, fontFamily: TITLE, fontWeight: 900, fontSize: 110, lineHeight: 1 }}><RevealWords text="WHAT YOU PICK" delay={0} stagger={3} /></div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 30, right: 30, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 10 }}>
        {picked.map((c, i) => (
          <div key={c.key} style={{ textAlign: 'center' }}>
            <ChampCard c={c} size={i === 0 ? 230 : 170} delay={10 + i * 7} showStats={false} rank={i + 1} tier={c.tier} sweepAt={30 + i * 6} />
            <div style={{ marginTop: 6, fontFamily: TITLE, fontWeight: 900, fontSize: i === 0 ? 44 : 34, color: C.gold2, opacity: ramp(f, 22 + i * 7, 34 + i * 7), fontVariantNumeric: 'tabular-nums' }}><CountUp value={c.n} decimals={0} from={22 + i * 7} to={50 + i * 7} /></div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 1080, left: 90, right: 90, textAlign: 'center', transform: `scale(${stat})`, opacity: Math.min(1, stat) }}>
        <div style={{ background: '#05060dcc', border: `2px solid ${C.gold}55`, borderRadius: 30, padding: '34px 40px' }}>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 150, lineHeight: 1 }}><GoldText><CountUp value={follow} decimals={0} from={62} to={90} suffix="%" /></GoldText></div>
          <div style={{ marginTop: 10, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.text, lineHeight: 1.3 }}>of your picks were in our <span style={{ color: C.cyan2 }}>top 3 recommendations</span></div>
          <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.muted }}>{data.recoFollow.inTop3.toLocaleString('en-US')} of {data.recoFollow.selfPicks.toLocaleString('en-US')} picks</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Le duel du mois : les deux cartes se percutent, compteur, puis les deux autres paires ─
const Pairs: React.FC = () => {
  const f = useCurrentFrame();
  const [p0, ...rest] = pairs;
  const a = faced.find((c) => c.key === p0.pick) || picked.find((c) => c.key === p0.pick) || { key: p0.pick, name: p0.pickName };
  const b = faced.find((c) => c.key === p0.versus) || picked.find((c) => c.key === p0.versus) || { key: p0.versus, name: p0.versusName };
  const slam = useSpring(8, { damping: 10, stiffness: 140 });
  const vs = useSpring(30, { damping: 9, stiffness: 240 });
  return (
    <AbsoluteFill style={useSceneInOut(T.PAIRS)}>
      <Flash at={30} strength={0.7} />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker>{ROLE_SUB[p0.role]} · most drafted pair</Kicker>
        <div style={{ marginTop: 6, fontFamily: TITLE, fontWeight: 900, fontSize: 96, lineHeight: 1 }}><RevealWords text="MATCHUP OF THE MONTH" gold delay={0} stagger={3} /></div>
      </div>
      <div style={{ position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
        <div style={{ transform: `translateX(${(1 - slam) * -500}px)` }}><ChampCard c={a} size={300} delay={8} showStats={false} /></div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 120, lineHeight: 1, transform: `scale(${vs}) rotate(${(1 - vs) * 30}deg)`, opacity: Math.min(1, vs) }}><GoldText>VS</GoldText></div>
        <div style={{ transform: `translateX(${(1 - slam) * 500}px)` }}><ChampCard c={b} size={300} delay={8} showStats={false} /></div>
      </div>
      <div style={{ position: 'absolute', top: 1060, left: 0, right: 0, textAlign: 'center', opacity: ramp(f, 36, 48) }}>
        <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 130, color: C.text, lineHeight: 1 }}><CountUp value={p0.n} decimals={0} from={36} to={60} /></span>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.muted, letterSpacing: 4, textTransform: 'uppercase' }}>drafts this month</div>
      </div>
      <div style={{ position: 'absolute', top: 1330, left: 90, right: 90, display: 'grid', gap: 14 }}>
        {rest.map((p, i) => {
          const s = ramp(f, 60 + i * 10, 74 + i * 10, ease.back);
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#05060dcc', border: `1px solid ${C.line}`, borderRadius: 20, padding: '18px 30px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 200}px)`, fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.text }}>
              <span>{p.pickName} <span style={{ color: C.gold }}>vs</span> {p.versusName} <span style={{ color: C.muted, fontSize: 24 }}>· {ROLE_SUB[p.role]}</span></span>
              <DropBadge delay={62 + i * 10} size={34}>{p.n}</DropBadge>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const DraftReport: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <Audio src={staticFile('audio/draft-report.wav')} />
      <Background accent={(top.palette?.[0] as string) || C.cyan} accent2={top.palette?.[1] as string} pulse={f >= T.PAIRS_START ? 1 : 0} />
      <Sequence durationInFrames={T.INTRO}><Intro /></Sequence>
      <Sequence from={T.FACED_START} durationInFrames={T.FACED}><Faced /></Sequence>
      <Sequence from={T.PICKED_START} durationInFrames={T.PICKED}><Picked /></Sequence>
      <Sequence from={T.PAIRS_START} durationInFrames={T.PAIRS}><Pairs /></Sequence>
      <Sequence from={T.OUTRO_START} durationInFrames={T.OUTRO}><Outro cta="Draft with the engine — free, web and app" url="/en/draft" sub={`Draft report · ${week}`} /></Sequence>
      <TopBar right={`Patch ${data.patch} · ${week.toUpperCase()}`} />
      <ProgressBar marks={T.timeline.scenes.map((s) => s.start)} />
    </AbsoluteFill>
  );
};
