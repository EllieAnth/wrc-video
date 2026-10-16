import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BODY, C, SITE, TIER_COLOR, TITLE, tierLabel } from '../../theme';
import { Background, Flash } from '../../fx/Background';
import { GoldText, Kicker, Pill, RevealWords, ScanTitle, useShine } from '../../fx/Text';
import { ProgressBar, TopBar, DropBadge, SceneHead } from '../../fx/Chrome';
import { SpellPanel, SplashPanel } from '../../fx/Video';
import { ease, ramp, useSceneInOut, useSpring } from '../../fx/util';
import * as T from './timeline';
import type { ChampionData, ChampionLines, ChampionProps } from './types';

export const DURATION = T.TOTAL;
const LEFT = 70, RIGHT = 70; // marges : 940 px utiles — les budgets de lines-contract.mjs en découlent
const SPELL_COLOR: Record<string, string> = { P: C.muted, Q: '#4ab7ff', W: '#9b7fff', E: '#50dc78', R: '#ffb347' };

/** Aperçu Riot d'un sort s'il existe, sinon le splash : jamais une scène vide. */
const Preview: React.FC<{ d: ChampionData; spell: string; top: number; height: number; len: number; dim?: number }> = ({ d, spell, top, height, len, dim = 0.1 }) => {
  const key = d.media.previews[spell] ? spell : d.media.previews.R ? 'R' : null;
  if (!key) return <SplashPanel champ={d.slug} top={top} height={height} durationFrames={len} dim={dim + 0.2} />;
  const name = d.spells.find((s) => s.key === key)?.name || key;
  return <SpellPanel src={d.media.previews[key]} start={0.4} name={name} spell={key} top={top} height={height} durationFrames={len} />;
};

const SpellIcon: React.FC<{ d: ChampionData; k: string; size?: number; delay?: number }> = ({ d, k, size = 64, delay = 0 }) => {
  const s = useSpring(delay, { damping: 12, stiffness: 160 });
  const src = d.media.spellIcons[k];
  return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: 14, overflow: 'hidden', border: `3px solid ${SPELL_COLOR[k] || C.line}`, background: '#0b0d1a', transform: `scale(${s})`, flex: 'none' }}>
      {src ? <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: size * 0.5, color: SPELL_COLOR[k] || C.text }}>{k}</span>}
    </span>
  );
};

// ── 1. Hook (3 s) : splash, rôle, nom, tier + win rate contextualisés, accroche ─────────────
const Hook: React.FC<{ d: ChampionData; l: ChampionLines }> = ({ d, l }) => {
  const f = useCurrentFrame();
  const shine = useShine(20, 60);
  const nameSize = Math.min(118, Math.floor(940 / (0.78 * d.name.length)));
  const st = d.stats;
  return (
    <AbsoluteFill style={useSceneInOut(T.HOOK, 1, 8)}>
      <SplashPanel champ={d.slug} top={0} height={1920} durationFrames={T.HOOK} dim={0.3} />
      <Flash at={2} strength={0.6} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1100, background: 'linear-gradient(180deg, transparent, #05060d 55%)' }} />
      <div style={{ position: 'absolute', top: 960, left: LEFT, right: RIGHT, textAlign: 'center' }}>
        <Kicker>{d.roleLabel} · Wild Rift</Kicker>
        <div style={{ marginTop: 14 }}><ScanTitle size={nameSize} delay={4}><GoldText shine={shine}>{d.name.toUpperCase()}</GoldText></ScanTitle></div>
        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, opacity: ramp(f, 22, 34) }}>
          {st?.tier && <DropBadge delay={18} size={74} bg={TIER_COLOR[st.tier] || C.gold}>{tierLabel(st.tier)}</DropBadge>}
          {st?.winRate != null
            ? <Pill size={30} outline bg={C.cyan2}>{st.winRate.toFixed(1)}% WR · {d.rank} · {d.patchLabel.replace(/^Patch /, '')}</Pill>
            : <Pill size={30} outline bg={C.muted}>{d.patchLabel} · {d.rank}</Pill>}
        </div>
        <div style={{ marginTop: 36, fontFamily: BODY, fontWeight: 800, fontSize: 54, lineHeight: 1.15, color: C.text }}>
          <RevealWords text={l.lines.tagline.text} delay={30} stagger={3} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 2. La décision clé (5 s) : aperçu du sort qui la porte, titre, pourquoi ────────────────
const Decision: React.FC<{ d: ChampionData; l: ChampionLines }> = ({ d, l }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={useSceneInOut(T.DECISION)}>
      <Preview d={d} spell={l.lines.decision.spell || 'R'} top={0} height={1010} len={T.DECISION} />
      <div style={{ position: 'absolute', top: 1040, left: LEFT, right: RIGHT, textAlign: 'center' }}>
        <Kicker color={C.gold2} delay={6}>The key decision</Kicker>
        <div style={{ marginTop: 18, fontFamily: TITLE, fontWeight: 900, fontSize: 68, lineHeight: 1.1, color: C.text, textShadow: `0 0 40px ${C.cyan}44` }}>
          <RevealWords text={l.lines.decision.title.text} delay={10} stagger={3} />
        </div>
        <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 600, fontSize: 42, lineHeight: 1.3, color: C.muted, opacity: ramp(f, 40, 56), transform: `translateY(${(1 - ramp(f, 40, 56)) * 20}px)` }}>
          {l.lines.decision.sub.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 3. Build (7 s) : six objets qui tombent, rune clé, priorité des sorts, pic de puissance ──
const Build: React.FC<{ d: ChampionData }> = ({ d }) => {
  const f = useCurrentFrame();
  const items = d.build.items.slice(0, 6);
  const prio = d.skill?.priority?.split(/\s*>\s*/).filter((k) => /^[QWER]$/.test(k)) || [];
  const spike = d.build.spikes.find((s) => s.level >= 5) || d.build.spikes[0];
  return (
    <AbsoluteFill style={useSceneInOut(T.BUILD)}>
      <SceneHead kicker={`Core build · ${d.patchLabel}`} title="BUILD" top={270} size={100} />
      <div style={{ position: 'absolute', top: 470, left: LEFT, right: RIGHT, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
        {items.map((it, i) => {
          const at = 16 + i * T.ITEM_EVERY;
          const s = ramp(f, at, at + 14, ease.back);
          return (
            <div key={it.slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '22px 10px 18px', background: '#05060dcc', border: `1px solid ${C.line}`, borderRadius: 24, opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 60}px) scale(${0.7 + s * 0.3})` }}>
              <div style={{ width: 190, height: 190, borderRadius: 26, overflow: 'hidden', border: `4px solid ${i === items.length - 1 ? C.muted : C.gold}`, boxShadow: `0 0 30px ${C.gold}44`, background: '#0b0d1a' }}>
                {it.icon ? <Img src={staticFile(it.icon)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 28, lineHeight: 1.15, color: C.text, textAlign: 'center', minHeight: 66 }}>{it.name}</div>
              <Pill size={18} outline bg={i === items.length - 1 ? C.muted : C.gold}>{i === items.length - 1 ? 'BOOTS' : `#${i + 1}`}</Pill>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', top: 1230, left: LEFT, right: RIGHT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30, opacity: ramp(f, 96, 110) }}>
        {prio.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.muted, letterSpacing: 4, textTransform: 'uppercase' }}>Max</span>
            {prio.map((k, i) => (
              <React.Fragment key={k}>
                {i > 0 && <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 40, color: C.muted }}>›</span>}
                <SpellIcon d={d} k={k} size={96} delay={98 + i * 6} />
              </React.Fragment>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {d.build.keystone && <Pill size={30} bg={C.cyan}>★ {d.build.keystone}</Pill>}
          {spike && <Pill size={30} outline bg={C.gold2}>Spike · {spike.label}</Pill>}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 4. Exécution (10 s) : aperçu du sort du combo, touches qui s'enchaînent, pourquoi ───────
const Execution: React.FC<{ d: ChampionData; l: ChampionLines }> = ({ d, l }) => {
  const f = useCurrentFrame();
  const combo = l.lines.combo || (d.combos[0] ? { name: d.combos[0].name, inputs: d.combos[0].inputs } : null);
  // Sans combo dans les données (12 champions le 16/10) : la scène montre l'ultime seul, le « pourquoi » l'explique.
  const ult = d.spells.find((s) => s.key === 'R');
  // Les données écrivent parfois « (E) → (W) » : la parenthèse autour d'une touche seule n'apporte rien à l'écran.
  const chips = (combo ? combo.inputs.split(/\s*(?:→|->|>)\s*/).filter(Boolean) : ult ? [`R ${ult.name}`] : []).map((c) => c.replace(/^\((AA|[QWER]\d?)\)/, '$1'));
  const spell = l.lines.execution.spell || chips.map((c) => c.match(/^([QWER])\b/)?.[1]).find(Boolean) || 'R';
  return (
    <AbsoluteFill style={useSceneInOut(T.EXECUTION)}>
      <Preview d={d} spell={spell} top={0} height={900} len={T.EXECUTION} />
      <div style={{ position: 'absolute', top: 930, left: LEFT, right: RIGHT, textAlign: 'center' }}>
        <Kicker color={C.gold2} delay={4}>{combo?.name ? `Execution · ${combo.name}` : 'Execution'}</Kicker>
        <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 14, minHeight: 190 }}>
          {chips.map((chip, i) => {
            const at = 36 + i * T.CHIP_EVERY;
            const s = ramp(f, at, at + 12, ease.back);
            const k = chip.match(/^([QWER])\b/)?.[1];
            return (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 34, color: C.muted, opacity: Math.min(1, s) }}>→</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 22px 10px 12px', borderRadius: 999, background: '#05060dcc', border: `3px solid ${k ? SPELL_COLOR[k] : C.line}`, opacity: Math.min(1, s), transform: `scale(${0.6 + s * 0.4})` }}>
                  {k && <SpellIcon d={d} k={k} size={54} delay={at} />}
                  <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, color: C.text, whiteSpace: 'nowrap' }}>{chip}</span>
                </span>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 600, fontSize: 40, lineHeight: 1.3, color: C.text, opacity: ramp(f, 150, 166) }}>
          {l.lines.execution.why.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 5. Plan de partie (7 s) : early / mid / late, puis le matchup à surveiller ───────────────
const Plan: React.FC<{ d: ChampionData; l: ChampionLines }> = ({ d, l }) => {
  const f = useCurrentFrame();
  const rows = [['Early', l.lines.plan.early.text], ['Mid', l.lines.plan.mid.text], ['Late', l.lines.plan.late.text]];
  const vs = l.lines.matchup?.vs ? d.matchups.hard.find((m) => m.vs === l.lines.matchup?.vs) : null;
  const mIn = ramp(f, 118, 134, ease.back);
  return (
    <AbsoluteFill style={useSceneInOut(T.PLAN)}>
      <SceneHead kicker={`${d.name} · ${d.roleLabel}`} title="GAME PLAN" top={270} size={92} />
      <div style={{ position: 'absolute', top: 470, left: LEFT, right: RIGHT, display: 'grid', gap: 20 }}>
        {rows.map(([label, text], i) => {
          const at = 12 + i * 36; const s = ramp(f, at, at + 14, ease.back);
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '20px 28px', background: '#05060dcc', border: `1px solid ${C.line}`, borderLeft: `10px solid ${C.cyan}`, borderRadius: 24, opacity: Math.min(1, s), transform: `translateX(${(1 - s) * -160}px)` }}>
              <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 28, color: C.cyan2, letterSpacing: 3, width: 110, flex: 'none' }}>{label.toUpperCase()}</span>
              <span style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, lineHeight: 1.2, color: C.text }}>{text}</span>
            </div>
          );
        })}
      </div>
      {vs && l.lines.matchup?.line && (
        <div style={{ position: 'absolute', top: 1010, left: LEFT, right: RIGHT, display: 'flex', alignItems: 'center', gap: 26, padding: '24px 28px', background: '#05060de0', border: `1px solid ${C.line}`, borderLeft: `10px solid ${C.down}`, borderRadius: 26, opacity: Math.min(1, mIn), transform: `translateY(${(1 - mIn) * 60}px)` }}>
          <div style={{ width: 150, height: 150, borderRadius: 24, overflow: 'hidden', border: `4px solid ${C.down}`, flex: 'none', background: '#0b0d1a' }}>
            {vs.icon ? <Img src={staticFile(vs.icon)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, color: C.down, letterSpacing: 4, textTransform: 'uppercase' }}>Watch out for</div>
            <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 44, color: C.text, marginTop: 4 }}>{vs.name || vs.vs}</div>
            <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 32, lineHeight: 1.25, color: C.muted }}>{l.lines.matchup.line.text}</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── 6. Outro (3 s) : appel vers la fiche, mention courte (politique Riot § 6 : la notice complète
//    est « conspicuously » sur le site et dans la description de chaque publication). ─────────
const ChampionOutro: React.FC<{ d: ChampionData }> = ({ d }) => {
  const f = useCurrentFrame();
  const s = useSpring(0, { damping: 14 });
  const ring = (f % 36) / 36;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: `0 ${LEFT}px` }}>
      <div style={{ opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 72, letterSpacing: 4, color: C.text, whiteSpace: 'nowrap' }}>WILD RIFT <GoldText>CORE</GoldText></div>
        <div style={{ marginTop: 36, fontFamily: BODY, fontWeight: 700, fontSize: 50, color: C.text, lineHeight: 1.25 }}>
          <RevealWords text={`Full ${d.name} build, counters and guide`} delay={4} stagger={2} />
        </div>
        <div style={{ position: 'relative', marginTop: 52, display: 'inline-block' }}>
          <div style={{ position: 'absolute', inset: -6, borderRadius: 999, border: `3px solid ${C.cyan}`, opacity: 1 - ring, transform: `scale(${1 + ring * 0.25})` }} />
          <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: C.bg0, background: `linear-gradient(90deg, ${C.cyan}, ${C.cyan2})`, padding: '22px 40px', borderRadius: 999, boxShadow: `0 0 60px ${C.cyan}66`, whiteSpace: 'nowrap' }}>
            {SITE}/en/champions/{d.slug}/
          </div>
        </div>
        <div style={{ marginTop: 26, fontFamily: BODY, fontWeight: 700, fontSize: 30, color: C.gold2, letterSpacing: 4, textTransform: 'uppercase' }}>{d.patchLabel} · {d.rank}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 340, left: LEFT, right: RIGHT, fontFamily: BODY, fontWeight: 600, fontSize: 28, lineHeight: 1.4, color: '#9ea8c7cc', opacity: s }}>
        Fan content · not endorsed by Riot Games
      </div>
    </AbsoluteFill>
  );
};

export const Champion35s: React.FC<ChampionProps> = ({ data, lines }) => {
  const f = useCurrentFrame();
  if (!data || !lines) {
    return <AbsoluteFill style={{ backgroundColor: C.bg0, justifyContent: 'center', alignItems: 'center', fontFamily: BODY, color: C.muted, fontSize: 40, textAlign: 'center', padding: 80 }}>champion-35s : passer --props (node scripts/champion-props.mjs --slug=…)</AbsoluteFill>;
  }
  const accent = (data.palette?.[0] as string) || C.gold;
  const accent2 = (data.palette?.[1] as string) || C.cyan;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
      <Audio src={staticFile('audio/champion-35s.wav')} />
      <Background accent={accent} accent2={accent2} pulse={f >= T.EXECUTION_START && f < T.PLAN_START ? 1 : 0} />
      <Sequence durationInFrames={T.HOOK}><Hook d={data} l={lines} /></Sequence>
      <Sequence from={T.DECISION_START} durationInFrames={T.DECISION}><Decision d={data} l={lines} /></Sequence>
      <Sequence from={T.BUILD_START} durationInFrames={T.BUILD}><Build d={data} /></Sequence>
      <Sequence from={T.EXECUTION_START} durationInFrames={T.EXECUTION}><Execution d={data} l={lines} /></Sequence>
      <Sequence from={T.PLAN_START} durationInFrames={T.PLAN}><Plan d={data} l={lines} /></Sequence>
      <Sequence from={T.OUTRO_START} durationInFrames={T.OUTRO}><ChampionOutro d={data} /></Sequence>
      <TopBar right={`${data.name} · ${data.patchLabel.replace(/^Patch /, '')}`} />
      <ProgressBar marks={T.timeline.scenes.map((s) => s.start)} />
    </AbsoluteFill>
  );
};
