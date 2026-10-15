import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import data from '../../data/tierlist.json';
import { BODY, C, ROLE_SUB, TITLE, pct, weekLabel } from '../../theme';
import { Background, Flash } from '../../fx/Background';
import { CountUp, GoldText, Kicker, Pill, RevealWords, useShine } from '../../fx/Text';
import { Outro, ProgressBar, SceneHead, TopBar, Watermark, DropBadge } from '../../fx/Chrome';
import { CardRow, MoveRow, TierBoard } from '../../fx/Card';
import { CreatorPanel, SpellPanel, creatorClip } from '../../fx/Video';
import { Sparkline } from '../../fx/Sparkline';
import { ease, ramp, useSceneInOut, useSpring } from '../../fx/util';
import * as T from './timeline';

export const DURATION = T.TOTAL;
const week = weekLabel(data.week);
type Role = (typeof data.roles)[number];
type Clip = { src: string; start: number };
const clips = data.clips as Record<string, Clip>;
const findChamp = (key: string) => data.roles.flatMap((r) => r.splus).find((c) => c.key === key);

// ── Intro : clip du n° 1 plein cadre, titre doré, semaine ─────────────────────
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const hero = findChamp(data.hero);
  const titleIn = useSpring(6, { damping: 13 });
  const shine = useShine(16, 50);
  const sub = ramp(f, 24, 40);
  return (
    <AbsoluteFill style={useSceneInOut(T.INTRO, 1, 8)}>
      <CreatorPanel champ={data.hero} top={0} height={1920} delay={0} durationFrames={T.INTRO} dim={0.45} badgeBottom={400} />
      <Flash at={2} />
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker delay={10}>Wild Rift · {data.rank}</Kicker>
        <div style={{ marginTop: 18, fontFamily: TITLE, fontWeight: 900, fontSize: 168, lineHeight: 1, transform: `scale(${0.7 + titleIn * 0.3})`, opacity: titleIn, textShadow: '0 20px 60px #000' }}>
          <GoldText shine={shine}>TIER LIST</GoldText>
        </div>
        <div style={{ marginTop: 20, fontFamily: TITLE, fontWeight: 700, fontSize: 92, color: C.text, opacity: titleIn, textShadow: '0 6px 30px #000' }}>{data.patch}</div>
        <div style={{ marginTop: 26, opacity: sub, transform: `scale(${0.9 + sub * 0.1})` }}>
          <Pill outline bg={C.cyan} size={38}>Meta of the week · {week}</Pill>
        </div>
      </div>
      {hero && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 300, textAlign: 'center', opacity: sub }}>
          <DropBadge delay={30} size={46}>#1</DropBadge>
          <div style={{ marginTop: 14, fontFamily: TITLE, fontWeight: 900, fontSize: 64, color: C.text, letterSpacing: 4, textShadow: '0 6px 30px #000' }}>{hero.name.toUpperCase()}</div>
          <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 32, color: C.up }}>{pct(hero.winRate)} <span style={{ color: C.muted }}>win rate · {hero.role}</span></div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── Rôle : en-tête, clip du n° 1 (créateur, sinon sort Riot), cartes S+, courbe de tendance ──
const RoleScene: React.FC<{ role: Role; index: number }> = ({ role, index }) => {
  const f = useCurrentFrame();
  const star = role.splus.find((c) => c.key === role.spotlight) || role.splus[0];
  const n = role.splus.length;
  const size = n <= 3 ? 210 : n === 4 ? 185 : 160;
  const spell = clips[`${role.spotlight}-${(role as { spotlightSpell?: string }).spotlightSpell || 'R'}`];
  const useCreator = !!creatorClip(role.spotlight || '');
  const sparkIn = ramp(f, 40, 52);
  const reasonIn = ramp(f, 64, 78);
  return (
    <AbsoluteFill style={useSceneInOut(T.ROLE)}>
      <Watermark text={role.role} top={1500} />
      {useCreator || !spell ? (
        <CreatorPanel champ={role.spotlight || star.key} top={470} height={640} delay={0} durationFrames={T.ROLE} badgeBottom={50} />
      ) : (
        <SpellPanel src={spell.src} start={spell.start} name={star.name} spell={(role as { spotlightSpell?: string }).spotlightSpell || 'R'} top={470} height={640} delay={0} durationFrames={T.ROLE} />
      )}
      <SceneHead kicker={`${index + 1} / ${data.roles.length} · ${ROLE_SUB[role.role]}`} title={role.role} badge="S+" top={280} />
      <CardRow champs={role.splus} size={size} delay={T.CARD_DELAY} stagger={T.CARD_STAGGER} star={role.spotlight} top={1130} sweepAt={T.CARD_DELAY + 30} />
      <div style={{ position: 'absolute', left: 90, top: 1440, opacity: sparkIn, transform: `translateY(${(1 - sparkIn) * 30}px)` }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.muted, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 }}>{star.name} · win rate, last 30 days</div>
        <Sparkline spark={star.spark} champ={star.key} width={900} height={230} delay={44} drawFrames={36} palette={star.palette as [string, string] | null} showPortrait={false} />
      </div>
      {star.reason && (
        <div style={{ position: 'absolute', left: 90, right: 90, top: 1700, fontFamily: BODY, fontWeight: 600, fontSize: 26, lineHeight: 1.3, color: C.text, opacity: reasonIn, transform: `translateY(${(1 - reasonIn) * 20}px)`, background: '#05060dcc', border: `1px solid ${C.line}`, borderRadius: 16, padding: '12px 18px' }}>
          {star.reason.length > 150 ? star.reason.slice(0, 147).replace(/\s\S*$/, '') + '…' : star.reason}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── Tableau : la tier list du rôle qui a bougé, cartes qui se replacent ───────
const BoardScene: React.FC = () => {
  const f = useCurrentFrame();
  const b = data.board;
  const sub = ramp(f, 8, 20);
  const moved = b.moved.length;
  return (
    <AbsoluteFill style={useSceneInOut(T.BOARD)}>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <Kicker delay={0}>Week {week}</Kicker>
        <div style={{ marginTop: 10, fontFamily: TITLE, fontWeight: 900, fontSize: 96, lineHeight: 1 }}><RevealWords text={`${b.role} MOVED`} gold delay={2} stagger={5} /></div>
        <div style={{ marginTop: 14, fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.muted, opacity: sub }}>{moved} champion{moved > 1 ? 's' : ''} changed tier · S+ to B</div>
      </div>
      <div style={{ position: 'absolute', left: 90, top: 560 }}>
        <TierBoard rows={b.rows} fromRows={b.fromRows} delay={T.BOARD_GLIDE} travel={T.BOARD_TRAVEL} cell={88} gap={10} width={900} highlight={b.moved} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 300, textAlign: 'center', fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.gold2, letterSpacing: 4, textTransform: 'uppercase', opacity: ramp(f, T.BOARD_GLIDE + T.BOARD_TRAVEL, T.BOARD_GLIDE + T.BOARD_TRAVEL + 10) }}>
        ▲ rising · ▼ falling
      </div>
    </AbsoluteFill>
  );
};

// ── Liste : qui monte, qui descend (tous rôles) ───────────────────────────────
const ListScene: React.FC = () => {
  const f = useCurrentFrame();
  const sub = ramp(f, 6, 18);
  const label = (txt: string, col: string) => <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, color: col, letterSpacing: 6, textTransform: 'uppercase', margin: '8px 0 2px 8px', textShadow: `0 0 20px ${col}66` }}>{txt}</div>;
  return (
    <AbsoluteFill style={useSceneInOut(T.LIST)}>
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 108, lineHeight: 1 }}><RevealWords text="ON THE MOVE" gold delay={0} stagger={4} /></div>
        <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.muted, opacity: sub }}>Latest shifts · all roles</div>
      </div>
      <div style={{ position: 'absolute', top: 520, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {label('Rising', C.up)}
        {data.moves.ups.map((m, i) => <MoveRow key={m.key} c={m} delay={T.ROW_DELAY + i * T.ROW_STAGGER} up />)}
        <div style={{ height: 18 }} />
        {label('Falling', C.down)}
        {data.moves.downs.map((m, i) => <MoveRow key={m.key} c={m} delay={T.ROW_DELAY + T.DOWNS_OFFSET + i * T.ROW_STAGGER} up={false} />)}
      </div>
    </AbsoluteFill>
  );
};

export const MetaMovers: React.FC = () => {
  const f = useCurrentFrame();
  // L'accent du fond suit le champion à l'écran.
  const roleIdx = Math.floor((f - T.ROLES_START) / T.ROLE);
  const cur = f >= T.ROLES_START && roleIdx < data.roles.length ? data.roles[roleIdx] : null;
  const star = cur ? cur.splus.find((c) => c.key === cur.spotlight) : findChamp(data.hero);
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <Audio src={staticFile('audio/meta-movers.wav')} />
      <Background accent={star?.palette?.[0]} accent2={star?.palette?.[1]} pulse={f >= T.BOARD_START ? 1 : 0} />
      <Sequence durationInFrames={T.INTRO}><Intro /></Sequence>
      {data.roles.map((role, i) => (
        <Sequence key={role.role} from={T.ROLES_START + i * T.ROLE} durationInFrames={T.ROLE}><RoleScene role={role} index={i} /></Sequence>
      ))}
      <Sequence from={T.BOARD_START} durationInFrames={T.BOARD}><BoardScene /></Sequence>
      <Sequence from={T.LIST_START} durationInFrames={T.LIST}><ListScene /></Sequence>
      <Sequence from={T.OUTRO_START} durationInFrames={T.OUTRO}><Outro cta="Full tier list with the reason for every tier" url="/en/tierlist" sub={`Updated every week · ${week}`} /></Sequence>
      <TopBar right={`Patch ${data.patch} · ${week.toUpperCase()}`} />
      <ProgressBar marks={T.timeline.scenes.map((s) => s.start)} />
    </AbsoluteFill>
  );
};
