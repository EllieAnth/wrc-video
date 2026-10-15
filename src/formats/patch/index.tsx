import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import data from '../../data/patch.json';
import { BODY, C, TITLE, weekLabel } from '../../theme';
import { Background, Flash } from '../../fx/Background';
import { CountUp, GoldText, Kicker, Pill, RevealWords, useShine } from '../../fx/Text';
import { Outro, ProgressBar, TopBar, DropBadge, Watermark } from '../../fx/Chrome';
import { ChampCard } from '../../fx/Card';
import { CreatorPanel } from '../../fx/Video';
import { ease, ramp, useSceneInOut, useSpring } from '../../fx/util';
import * as T from './timeline';

export const DURATION = T.TOTAL;
const week = weekLabel(data.week);
type Change = typeof data.buffs[number];
const effects = [...data.effects].sort((a, b) => Math.abs(b.wrDelta) - Math.abs(a.wrDelta)).slice(0, 4);
const headline = effects[0];

// ── Intro : « PATCH 7.3b » tombe, « IN 30 SECONDS » avec un compte 3·2·1 ─────
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const shine = useShine(30, 60);
  const s = useSpring(2, { damping: 11, stiffness: 150 });
  const sub = ramp(f, 18, 30);
  return (
    <AbsoluteFill style={useSceneInOut(T.INTRO, 1, 8)}>
      <CreatorPanel champ={headline.key} top={0} height={1920} delay={0} durationFrames={T.INTRO} dim={0.6} badgeBottom={330} />
      <Flash at={2} strength={0.7} />
      <div style={{ position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker>Wild Rift · {week}</Kicker>
        <div style={{ marginTop: 20, fontFamily: TITLE, fontWeight: 900, fontSize: 92, color: C.text, lineHeight: 1, transform: `scale(${s})`, opacity: s, textShadow: '0 10px 50px #000' }}>PATCH</div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 250, lineHeight: 1, transform: `scale(${s})`, opacity: s, textShadow: '0 20px 80px #000' }}><GoldText shine={shine}>{data.notesVersion}</GoldText></div>
        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: sub }}>
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, color: C.text, letterSpacing: 4 }}>IN</span>
          <DropBadge delay={20} size={80}>30</DropBadge>
          <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 48, color: C.text, letterSpacing: 4 }}>SECONDS</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 420, left: 0, right: 0, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 16, opacity: ramp(f, 40, 52) }}>
        <Pill size={30} bg={C.up}>▲ {data.buffs.length} buffs</Pill>
        <Pill size={30} bg={C.down}>▼ {data.nerfs.length} nerfs</Pill>
        <Pill size={30} bg={C.gold}>{data.items.length} items</Pill>
      </div>
    </AbsoluteFill>
  );
};

// ── Buffs / nerfs : titre, puis une ligne par champion (carte, sorts touchés, résumé) qui glisse à son tour ─
const Changes: React.FC<{ list: Change[]; up: boolean; len: number }> = ({ list, up, len }) => {
  const f = useCurrentFrame();
  const col = up ? C.up : C.down;
  return (
    <AbsoluteFill style={useSceneInOut(len)}>
      <Watermark text={up ? 'BUFF' : 'NERF'} top={1480} />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker color={col}>Patch {data.notesVersion}</Kicker>
        <div style={{ marginTop: 6, fontFamily: TITLE, fontWeight: 900, fontSize: 120, lineHeight: 1 }}><RevealWords text={up ? '▲ BUFFED' : '▼ NERFED'} delay={0} style={{ color: col }} /></div>
      </div>
      <div style={{ position: 'absolute', top: 540, left: 70, right: 70, display: 'grid', gap: 18 }}>
        {list.map((c, i) => {
          const at = 14 + i * 12;
          const s = ramp(f, at, at + 14, ease.back);
          return (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 22, background: '#05060dcc', borderLeft: `8px solid ${col}`, border: `1px solid ${C.line}`, borderLeftWidth: 8, borderLeftColor: col, borderRadius: 24, padding: '16px 24px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * (i % 2 ? 240 : -240)}px)` }}>
              <ChampCard c={c} size={120} delay={at} showStats={false} sweepAt={at + 20} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 40, color: C.text }}>{c.name}</span>
                  {c.abilities.map((a) => <Pill key={a.slot} size={20} outline bg={col}>{a.slot} · {a.name}</Pill>)}
                </div>
                <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 27, lineHeight: 1.3, color: C.text, opacity: ramp(f, at + 10, at + 20) }}>{c.summary}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── Objets : trois lignes qui glissent, nom en or, résumé ───────────────────
const Items: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={useSceneInOut(T.ITEMS)}>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker>Patch {data.notesVersion}</Kicker>
        <div style={{ marginTop: 6, fontFamily: TITLE, fontWeight: 900, fontSize: 120, lineHeight: 1 }}><RevealWords text="ITEMS" gold delay={0} /></div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 90, right: 90, display: 'grid', gap: 26 }}>
        {data.items.map((it, i) => {
          const s = ramp(f, 12 + i * 12, 26 + i * 12, ease.back);
          const col = it.type === 'buff' ? C.up : it.type === 'nerf' ? C.down : C.gold;
          return (
            <div key={it.key} style={{ display: 'flex', gap: 24, alignItems: 'center', background: '#05060dcc', border: `1px solid ${C.line}`, borderLeft: `10px solid ${col}`, borderRadius: 24, padding: '20px 26px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * 200}px)` }}>
              <div style={{ width: 118, height: 118, borderRadius: 22, flex: 'none', overflow: 'hidden', border: `4px solid ${col}`, boxShadow: `0 0 28px ${col}66`, background: '#0b0d1a', display: 'grid', placeItems: 'center' }}>
                {it.image ? <Img src={staticFile(it.image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 44, color: col }}>{it.type === 'buff' ? '▲' : '▼'}</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 40, color: C.text }}>{it.name}</div>
                  <Pill size={24} bg={col}>{it.type === 'buff' ? '▲ BUFF' : it.type === 'nerf' ? '▼ NERF' : '◆ CHANGE'}</Pill>
                </div>
                <div style={{ marginTop: 6, fontFamily: BODY, fontWeight: 600, fontSize: 29, lineHeight: 1.3, color: C.muted }}>{it.summary}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── « Did it work? » : avant → après, une ligne par champion, barres qui se remplissent ─
const Effects: React.FC = () => {
  const f = useCurrentFrame();
  const label: Record<string, string> = { buff: 'buffed', nerf: 'nerfed', adjust: 'adjusted' };
  return (
    <AbsoluteFill style={useSceneInOut(T.EFFECTS)}>
      <CreatorPanel champ={headline.key} top={0} height={1920} delay={0} durationFrames={T.EFFECTS} dim={0.78} badgeBottom={330} />
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker>Patch {data.version} · {effects[0].days} days later · {data.rank}</Kicker>
        <div style={{ marginTop: 6, fontFamily: TITLE, fontWeight: 900, fontSize: 104, lineHeight: 1 }}><RevealWords text="DID IT WORK?" gold delay={0} /></div>
      </div>
      <div style={{ position: 'absolute', top: 540, left: 70, right: 70, display: 'grid', gap: 22 }}>
        {effects.map((e, i) => {
          const at = 16 + i * T.EFFECT_EVERY;
          const s = ramp(f, at, at + 14, ease.back);
          const bar = ramp(f, at + 10, at + 34);
          const col = e.wrDelta >= 0 ? C.up : C.down;
          const worked = (e.type === 'buff' && e.wrDelta > 0.5) || (e.type === 'nerf' && e.wrDelta < -0.5);
          const lo = Math.min(e.wrBefore, e.wrAfter) - 3, hi = Math.max(e.wrBefore, e.wrAfter) + 3;
          const x = (v: number) => ((v - lo) / (hi - lo)) * 100;
          return (
            <div key={e.key} style={{ display: 'flex', alignItems: 'center', gap: 22, background: '#05060de0', border: `1px solid ${C.line}`, borderRadius: 26, padding: '18px 26px', opacity: Math.min(1, s), transform: `translateX(${(1 - s) * (i % 2 ? 240 : -240)}px)` }}>
              <ChampCard c={e} size={130} delay={at} showStats={false} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Pill size={22} bg={e.type === 'buff' ? C.up : e.type === 'nerf' ? C.down : C.gold}>{label[e.type]}</Pill>
                  <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: worked ? C.up : C.warn, letterSpacing: 2, textTransform: 'uppercase', opacity: ramp(f, at + 30, at + 38) }}>{worked ? '✓ it worked' : e.type === 'adjust' ? '~ sideways' : '✗ no effect yet'}</span>
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 18, fontFamily: TITLE, fontWeight: 900 }}>
                  <span style={{ fontSize: 44, color: C.muted }}>{e.wrBefore.toFixed(1)}%</span>
                  <span style={{ fontSize: 34, color: C.muted }}>→</span>
                  <span style={{ fontSize: 60, color: col }}><CountUp value={e.wrAfter} start={e.wrBefore} from={at + 10} to={at + 34} suffix="%" /></span>
                  <span style={{ fontSize: 36, color: col, opacity: ramp(f, at + 26, at + 36) }}>{e.wrDelta > 0 ? '+' : ''}{e.wrDelta.toFixed(1)}</span>
                </div>
                <div style={{ position: 'relative', marginTop: 10, height: 10, borderRadius: 5, background: '#ffffff18' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${Math.min(x(e.wrBefore), x(e.wrBefore) + (x(e.wrAfter) - x(e.wrBefore)) * bar)}%`, width: `${Math.abs(x(e.wrAfter) - x(e.wrBefore)) * bar}%`, borderRadius: 5, background: col, boxShadow: `0 0 14px ${col}` }} />
                  <div style={{ position: 'absolute', top: -5, left: `${x(e.wrBefore)}%`, width: 4, height: 20, background: C.muted, transform: 'translateX(-2px)' }} />
                </div>
                <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 24, color: C.muted, opacity: ramp(f, at + 30, at + 40) }}>pick rate {e.pickBefore.toFixed(1)}% → <span style={{ color: C.text }}>{e.pickAfter.toFixed(1)}%</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Patch: React.FC = () => {
  const f = useCurrentFrame();
  const accent = f < T.NERFS_START ? C.up : f < T.ITEMS_START ? C.down : f < T.EFFECTS_START ? C.gold : (headline.palette?.[0] as string);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <Audio src={staticFile('audio/patch.wav')} />
      <Background accent={accent} pulse={f >= T.EFFECTS_START ? 1 : 0} />
      <Sequence durationInFrames={T.INTRO}><Intro /></Sequence>
      <Sequence from={T.BUFFS_START} durationInFrames={T.BUFFS}><Changes list={data.buffs} up len={T.BUFFS} /></Sequence>
      <Sequence from={T.NERFS_START} durationInFrames={T.NERFS}><Changes list={data.nerfs} up={false} len={T.NERFS} /></Sequence>
      <Sequence from={T.ITEMS_START} durationInFrames={T.ITEMS}><Items /></Sequence>
      <Sequence from={T.EFFECTS_START} durationInFrames={T.EFFECTS}><Effects /></Sequence>
      <Sequence from={T.OUTRO_START} durationInFrames={T.OUTRO}><Outro cta="Full patch notes, and every win rate the day after" url="/en/meta" sub={`Patch ${data.notesVersion} · ${week}`} /></Sequence>
      <TopBar right={`Patch ${data.notesVersion} · ${week.toUpperCase()}`} />
      <ProgressBar marks={T.timeline.scenes.map((s) => s.start)} />
    </AbsoluteFill>
  );
};
