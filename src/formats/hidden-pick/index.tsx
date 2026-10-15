import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import data from '../../data/hidden.json';
import tl from '../../data/tierlist.json';
import { BODY, C, ROLE_SUB, TITLE, pct, tierLabel, weekLabel } from '../../theme';
import { Background, Flash } from '../../fx/Background';
import { CountUp, GoldText, Kicker, Pill, RevealWords, useShine } from '../../fx/Text';
import { Outro, ProgressBar, TopBar, DropBadge } from '../../fx/Chrome';
import { ChampCard } from '../../fx/Card';
import { CreatorPanel, SpellPanel, SplashPanel, creatorClip } from '../../fx/Video';
import { Sparkline } from '../../fx/Sparkline';
import { ramp, useSceneInOut, useSpring } from '../../fx/util';
import * as T from './timeline';

export const DURATION = T.TOTAL;
const week = weekLabel(data.week);
const P = data.pick;
const pal = (P.palette?.[0] as string) || C.cyan;
const spell = (tl.clips as Record<string, { src: string; start: number }>)[`${P.key}-R`];

// ── Accroche : silhouette floutée qui se révèle, « NOBODY PLAYS HIM » ────────
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const reveal = ramp(f, 30, 66);
  const t1 = useSpring(4, { damping: 14 });
  return (
    <AbsoluteFill style={useSceneInOut(T.HOOK, 1, 8)}>
      <SplashPanel champ={P.key} top={0} height={1920} delay={0} durationFrames={T.HOOK} dim={0.35} />
      <AbsoluteFill style={{ backdropFilter: `blur(${(1 - reveal) * 40}px)`, WebkitBackdropFilter: `blur(${(1 - reveal) * 40}px)`, background: `rgba(5,6,13,${0.55 * (1 - reveal)})` }} />
      <div style={{ position: 'absolute', top: 420, left: 0, right: 0, textAlign: 'center', opacity: t1 }}>
        <Kicker>Hidden pick · {ROLE_SUB[P.role]}</Kicker>
        <div style={{ marginTop: 20, fontFamily: TITLE, fontWeight: 900, fontSize: 118, lineHeight: 1.05, textShadow: '0 10px 50px #000' }}>
          <RevealWords text="NOBODY" delay={6} /><br /><RevealWords text="PLAYS THIS" delay={14} /><br /><RevealWords text="PICK" gold delay={24} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 340, left: 0, right: 0, textAlign: 'center', opacity: reveal }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 80, color: C.text, letterSpacing: 4, textShadow: '0 8px 40px #000' }}>{P.name.toUpperCase()}</div>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.gold2, letterSpacing: 4, textTransform: 'uppercase' }}>they should</div>
      </div>
    </AbsoluteFill>
  );
};

// ── Les chiffres : WR qui monte en vert, PR minuscule en gris, écart en évidence ─
const Numbers: React.FC = () => {
  const f = useCurrentFrame();
  const s1 = useSpring(10), s2 = useSpring(46), s3 = useSpring(86, { damping: 10, stiffness: 200 });
  return (
    <AbsoluteFill style={useSceneInOut(T.NUMBERS)}>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}><ChampCard c={P} size={240} delay={0} showStats={false} tier={P.tier} star /></div>
      <div style={{ position: 'absolute', top: 640, left: 90, right: 90, display: 'grid', gap: 28 }}>
        <div style={{ background: `linear-gradient(90deg, ${C.up}22, transparent)`, borderLeft: `8px solid ${C.up}`, borderRadius: 24, padding: '28px 36px', opacity: s1, transform: `translateX(${(1 - s1) * -120}px)` }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.muted, letterSpacing: 4, textTransform: 'uppercase' }}>Win rate · {data.rank}</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 150, lineHeight: 1, color: C.up, textShadow: `0 0 50px ${C.up}66` }}><CountUp value={P.winRate || 0} from={12} to={44} suffix="%" start={45} /></div>
        </div>
        <div style={{ background: `linear-gradient(90deg, ${C.muted}22, transparent)`, borderLeft: `8px solid ${C.muted}`, borderRadius: 24, padding: '28px 36px', opacity: s2, transform: `translateX(${(1 - s2) * 120}px)` }}>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.muted, letterSpacing: 4, textTransform: 'uppercase' }}>Pick rate</div>
          <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 150, lineHeight: 1, color: C.text }}><CountUp value={P.pickRate || 0} from={48} to={80} suffix="%" start={9} /></div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 330, left: 0, right: 0, textAlign: 'center', transform: `scale(${s3})`, opacity: Math.min(1, s3) }}>
        <Pill size={40} bg={C.gold}>1 game in {Math.round(100 / (P.pickRate || 1))} has a {P.name}</Pill>
      </div>
    </AbsoluteFill>
  );
};

// ── Preuve : clip en action + courbe 30 jours ────────────────────────────────
const Proof: React.FC = () => {
  const f = useCurrentFrame();
  const hasCreator = !!creatorClip(P.key);
  const sparkIn = ramp(f, 44, 56);
  return (
    <AbsoluteFill style={useSceneInOut(T.PROOF)}>
      {hasCreator || !spell ? (
        <CreatorPanel champ={P.key} top={300} height={860} delay={0} durationFrames={T.PROOF} badgeBottom={40} />
      ) : (
        <SpellPanel src={spell.src} start={spell.start} name={P.name} spell="R" top={300} height={860} delay={0} durationFrames={T.PROOF} />
      )}
      <div style={{ position: 'absolute', top: 236, left: 90, display: 'flex', alignItems: 'center', gap: 18 }}>
        <DropBadge delay={4} size={40}>{tierLabel(P.tier || 'A')}</DropBadge>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.text, letterSpacing: 2, textTransform: 'uppercase', opacity: ramp(f, 6, 16) }}>on our {ROLE_SUB[P.role]} tier list</div>
      </div>
      <div style={{ position: 'absolute', left: 90, top: 1200, opacity: sparkIn, transform: `translateY(${(1 - sparkIn) * 30}px)` }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, color: C.muted, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 8 }}>Not a fluke · win rate, last 30 days</div>
        <Sparkline spark={P.spark} champ={P.key} width={900} height={300} delay={48} drawFrames={48} palette={P.palette as [string, string] | null} />
      </div>
    </AbsoluteFill>
  );
};

// ── Essaie-le : titre + les deux autres sous le radar ────────────────────────
const Try: React.FC = () => {
  const f = useCurrentFrame();
  const sub = ramp(f, 24, 36);
  return (
    <AbsoluteFill style={useSceneInOut(T.TRY)}>
      <Flash at={0} strength={0.6} />
      <div style={{ position: 'absolute', top: 380, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 124, lineHeight: 1.05 }}><RevealWords text="TRY IT" gold delay={2} /><br /><RevealWords text="THIS WEEK" delay={10} /></div>
        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}><ChampCard c={P} size={220} delay={14} tier={P.tier} star /></div>
      </div>
      {data.others.length > 0 && (
        <div style={{ position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', opacity: sub }}>
          <Kicker color={C.muted} style={{ fontSize: 28 }}>Also under the radar</Kicker>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 40 }}>
            {data.others.map((o, i) => (
              <div key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ChampCard c={o} size={130} delay={30 + i * 6} showStats={false} tier={o.tier} />
                <div style={{ textAlign: 'left', fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.muted, lineHeight: 1.3 }}>{o.role}<br /><span style={{ color: C.up }}>{pct(o.winRate)}</span> WR<br /><span style={{ color: C.text }}>{pct(o.pickRate)}</span> PR</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export const HiddenPick: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <Audio src={staticFile('audio/hidden-pick.wav')} />
      <Background accent={pal} accent2={P.palette?.[1] as string} pulse={f >= T.TRY_START ? 1 : 0} />
      <Sequence durationInFrames={T.HOOK}><Hook /></Sequence>
      <Sequence from={T.NUMBERS_START} durationInFrames={T.NUMBERS}><Numbers /></Sequence>
      <Sequence from={T.PROOF_START} durationInFrames={T.PROOF}><Proof /></Sequence>
      <Sequence from={T.TRY_START} durationInFrames={T.TRY}><Try /></Sequence>
      <Sequence from={T.OUTRO_START} durationInFrames={T.OUTRO}><Outro cta={`${P.name} build, runes and matchups`} url={`/en/champions/${P.key}/`} sub={`Hidden pick · ${week}`} /></Sequence>
      <TopBar right={`Patch ${data.patch} · ${week.toUpperCase()}`} />
      <ProgressBar marks={T.timeline.scenes.map((s) => s.start)} />
    </AbsoluteFill>
  );
};
