import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { loadFont as loadOrbitron } from '@remotion/google-fonts/Orbitron';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import data from './data/tierlist.json';
import TL from './timeline.json';

const { fontFamily: TITLE } = loadOrbitron('normal', { weights: ['700', '900'], subsets: ['latin'] });
const { fontFamily: BODY } = loadInter('normal', { weights: ['500', '700', '800'], subsets: ['latin'] });

// Couleurs reprises des jetons du site (ssg-tierlist.css).
const C = {
  bg0: '#05060d',
  bg1: '#0b0d1a',
  bg2: '#11152a',
  gold: '#d8b673',
  gold2: '#f0d79a',
  cyan: '#42b7ff',
  cyan2: '#7dd4ff',
  text: '#eef2ff',
  muted: '#9ea8c7',
  up: '#4ade80',
  down: '#f87171',
};

// Anglais uniquement (CLAUDE.md du dépôt) : pas de dictionnaire multilingue.
const fmtDay = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const weekLabel = (() => {
  const [a, b] = [fmtDay(data.week.start), fmtDay(data.week.end)];
  // « Oct 12 – 18 » si même mois, sinon « Sep 29 – Oct 5 »
  return a.split(' ')[0] === b.split(' ')[0] ? `${a} – ${b.split(' ')[1]}` : `${a} – ${b}`;
})();
const T = {
  kicker: 'Wild Rift · Master+',
  title: 'TIER LIST',
  week: `Meta of the week · ${weekLabel}`,
  sub: 'The S+ champions of every role',
  role: { TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', ADC: 'ADC', SUPPORT: 'SUPPORT' },
  roleSub: { TOP: 'Baron lane', JUNGLE: 'Jungle', MID: 'Mid lane', ADC: 'Dragon lane', SUPPORT: 'Support' },
  wr: 'win rate',
  movesTitle: 'ON THE MOVE',
  movesSub: (d: string) => `Latest shifts · ${d}`,
  ups: 'Rising',
  downs: 'Falling',
  cta: 'Full tier list\nwith the reason for every tier',
  ctaWeek: 'Updated every week',
  date: fmtDay,
  pct: (n: number) => `${n.toFixed(1)}%`,
} as const;

// Texte imposé par la politique fan-content de Riot : il ne se traduit pas (cf. scripts/lib/footer.mjs du site).
const RIOT_NOTICE =
  'Wild Rift Core was created under Riot Games\' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.';

const tierLabel = (t: string) => (t === 'S_PLUS' ? 'S+' : t);

// ── Timeline (30 fps) ─────────────────────────────────────────────────────────
const { intro: INTRO, role: ROLE, moves: MOVES, outro: OUTRO } = TL;
const ROLES_START = INTRO;
const MOVES_START = ROLES_START + ROLE * data.roles.length;
const OUTRO_START = MOVES_START + MOVES;
export const TIERLIST_PATCH_FRAMES = OUTRO_START + OUTRO;

// Entrée/sortie d'une scène : glissement + fondu sur `edge` images.
const useSceneFade = (duration: number, edge = 8) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [duration - edge, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return { opacity: 1 - out, transform: `translateX(${-out * 120}px)` };
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(f, [0, durationInFrames], [0, 1]);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg1} 0%, ${C.bg0} 55%, ${C.bg2} 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${30 + drift * 40}% ${18 + drift * 10}%, ${C.cyan}33, transparent 70%),
                       radial-gradient(800px 800px at ${80 - drift * 30}% ${85 - drift * 15}%, ${C.gold}2a, transparent 70%)`,
        }}
      />
      {/* trame diagonale discrète */}
      <AbsoluteFill
        style={{
          opacity: 0.08,
          backgroundImage: `repeating-linear-gradient(135deg, ${C.text} 0 1px, transparent 1px 46px)`,
          transform: `translateY(${-drift * 46}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

const TopBar: React.FC<{ patch: string }> = ({ patch }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute', top: 110, left: 90, right: 90, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', opacity: o,
      }}
    >
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: C.text }}>
        WILD RIFT <span style={{ color: C.gold }}>CORE</span>
      </div>
      <div
        style={{
          fontFamily: BODY, fontWeight: 800, fontSize: 26, color: C.bg0, background: C.cyan,
          padding: '10px 22px', borderRadius: 999, letterSpacing: 1, whiteSpace: 'nowrap',
        }}
      >
        PATCH {patch} · {weekLabel.toUpperCase()}
      </div>
    </div>
  );
};

const ProgressBar: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 190, height: 6, borderRadius: 3, background: '#ffffff14' }}>
      <div
        style={{
          width: `${(f / (durationInFrames - 1)) * 100}%`, height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${C.cyan}, ${C.gold})`,
        }}
      />
    </div>
  );
};

// `shine` (0-100) : position d'un reflet blanc qui traverse le lettrage, découpé par le texte.
const GoldText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; shine?: number }> = ({ children, style, shine }) => (
  <span
    style={{
      backgroundImage: [
        shine == null ? null : `linear-gradient(105deg, transparent ${shine - 12}%, #fffbe8ee ${shine}%, transparent ${shine + 12}%)`,
        `linear-gradient(180deg, ${C.gold2} 0%, ${C.gold} 60%, #a8844a 100%)`,
      ].filter(Boolean).join(', '),
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', ...style,
    }}
  >
    {children}
  </span>
);

// ── Scènes ────────────────────────────────────────────────────────────────────
const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T;
  const heroIn = spring({ frame: f, fps, config: { damping: 18, mass: 0.9 } });
  const titleIn = spring({ frame: f - 8, fps, config: { damping: 14 } });
  const subIn = interpolate(f, [24, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shine = interpolate(f, [18, 54], [-15, 115], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const heroFade = 'linear-gradient(180deg, transparent 0%, #000 28%, #000 78%, transparent 100%)';
  const heroName = data.roles.flatMap((r) => r.splus).find((c) => c.key === data.hero)?.name;
  return (
    <AbsoluteFill style={useSceneFade(INTRO)}>
      {data.hero && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: 860, height: 1060, overflow: 'hidden',
            opacity: heroIn, maskImage: heroFade, WebkitMaskImage: heroFade,
          }}
        >
          <Img
            src={staticFile(`hero-${data.hero}.jpg`)}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: `translateY(${(1 - heroIn) * 120}px) scale(${1.12 - interpolate(f, [0, INTRO], [0, 0.08])})`,
            }}
          />
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 300, textAlign: 'center', fontFamily: BODY, fontWeight: 800,
              fontSize: 36, color: C.text, letterSpacing: 4, textShadow: '0 4px 20px #000', opacity: subIn,
            }}
          >
            #1 · {heroName?.toUpperCase()}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.cyan2, letterSpacing: 8, opacity: subIn, textTransform: 'uppercase' }}>
          {t.kicker}
        </div>
        <div
          style={{
            position: 'relative', marginTop: 18, fontFamily: TITLE, fontWeight: 900, fontSize: 168, lineHeight: 1,
            transform: `scale(${0.7 + titleIn * 0.3})`, opacity: titleIn,
          }}
        >
          <GoldText shine={shine}>{t.title}</GoldText>
        </div>
        <div style={{ marginTop: 26, fontFamily: TITLE, fontWeight: 700, fontSize: 92, color: C.text, opacity: titleIn }}>
          {data.patch}
        </div>
        <div
          style={{
            display: 'inline-block', marginTop: 30, padding: '14px 34px', borderRadius: 999,
            border: `3px solid ${C.cyan}`, background: `${C.cyan}1f`, fontFamily: BODY, fontWeight: 800,
            fontSize: 40, color: C.cyan2, letterSpacing: 2, textTransform: 'uppercase',
            opacity: subIn, transform: `scale(${0.9 + subIn * 0.1})`,
          }}
        >
          {t.week}
        </div>
        <div style={{ marginTop: 30, fontFamily: BODY, fontWeight: 600, fontSize: 44, color: C.muted, opacity: subIn }}>
          {t.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type Champ = (typeof data.roles)[number]['splus'][number];

const ChampCard: React.FC<{ c: Champ; i: number; size: number; star: boolean }> = ({ c, i, size, star }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - TL.cardDelay - i * TL.cardStagger, fps, config: { damping: 13, mass: 0.7 } });
  const wrIn = interpolate(f, [22 + i * 5, 34 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ width: size + 24, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - s) * 80}px) scale(${0.6 + s * 0.4})`, opacity: s }}>
      <div
        style={{
          width: size, height: size, borderRadius: size * 0.14, padding: 5,
          background: star ? `linear-gradient(140deg, ${C.cyan2}, ${C.cyan} 50%, ${C.gold})` : `linear-gradient(140deg, ${C.gold2}, ${C.gold} 45%, ${C.cyan})`,
          boxShadow: `0 18px 50px #000a, 0 0 ${star ? 60 : 36}px ${star ? C.cyan : C.gold}55`,
        }}
      >
        <Img src={staticFile(`champions/${c.key}.jpg`)} style={{ width: '100%', height: '100%', borderRadius: size * 0.14 - 5, display: 'block' }} />
      </div>
      <div style={{ marginTop: 14, fontFamily: BODY, fontWeight: 800, fontSize: Math.max(28, Math.round(size * 0.18)), color: C.text, whiteSpace: 'nowrap' }}>{c.name}</div>
      {c.winRate != null && (
        <div style={{ marginTop: 2, fontFamily: BODY, fontWeight: 700, fontSize: Math.max(22, Math.round(size * 0.13)), color: C.up, opacity: wrIn, whiteSpace: 'nowrap' }}>
          {T.pct(c.winRate)} <span style={{ color: C.muted, fontWeight: 600 }}>WR</span>
        </div>
      )}
    </div>
  );
};

const SPELL_LABEL: Record<string, string> = { R: 'Ultimate', Q: 'Q ability' };

// Clip d'action du champion vedette : aperçu officiel Riot du sort (cf. scripts/sync-data.mjs).
const SpotlightClip: React.FC<{ champ: string; spell: string }> = ({ champ, spell }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clip = (data.clips as Record<string, { src: string; start: number }>)[`${champ}-${spell}`];
  const name = data.roles.flatMap((r) => r.splus).find((c) => c.key === champ)?.name ?? champ;
  const open = spring({ frame: f, fps, config: { damping: 20 } });
  const labelIn = spring({ frame: f - 8, fps, config: { damping: 16 } });
  const fade = 'linear-gradient(180deg, transparent 0%, #000 12%, #000 88%, transparent 100%)';
  if (!clip) return null;
  return (
    <div
      style={{
        position: 'absolute', top: 540, left: 0, right: 0, height: 700, overflow: 'hidden',
        maskImage: fade, WebkitMaskImage: fade, opacity: open, transform: `scaleY(${0.85 + open * 0.15})`,
      }}
    >
      <OffthreadVideo
        src={staticFile(clip.src)}
        startFrom={Math.round(clip.start * fps)}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.32 - interpolate(f, [0, ROLE], [0, 0.08])})` }}
      />
      <div
        style={{
          position: 'absolute', left: 60, bottom: 92, display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 26px', borderRadius: 999, background: '#05060dcc', border: `2px solid ${C.cyan}`,
          fontFamily: BODY, fontWeight: 800, fontSize: 34, color: C.text, letterSpacing: 2, textTransform: 'uppercase',
          transform: `translateX(${(1 - labelIn) * -120}px)`, opacity: labelIn,
        }}
      >
        <span style={{ color: C.cyan2 }}>★ {name}</span>
        <span style={{ color: C.muted, fontWeight: 600 }}>{SPELL_LABEL[spell] ?? spell}</span>
      </div>
    </div>
  );
};

const RoleScene: React.FC<{ role: (typeof data.roles)[number]; index: number }> = ({ role, index }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T;
  const head = spring({ frame: f, fps, config: { damping: 16 } });
  const n = role.splus.length;
  const size = n <= 3 ? 220 : n === 4 ? 190 : 160;
  const key = role.role as keyof typeof t.role;
  return (
    <AbsoluteFill style={useSceneFade(ROLE)}>
      {role.spotlight && <SpotlightClip champ={role.spotlight} spell={role.spotlightSpell ?? 'R'} />}
      <div style={{ position: 'absolute', top: 290, left: 0, right: 0, textAlign: 'center', opacity: head }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.muted, letterSpacing: 6, textTransform: 'uppercase' }}>
          {index + 1} / {data.roles.length} · {t.roleSub[key]}
        </div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
          <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 110, color: C.text }}>{t.role[key]}</span>
          <span
            style={{
              fontFamily: TITLE, fontWeight: 900, fontSize: 60, color: C.bg0, background: `linear-gradient(180deg, ${C.gold2}, ${C.gold})`,
              padding: '6px 24px', borderRadius: 18, transform: `rotate(-4deg) scale(${head})`,
            }}
          >
            S+
          </span>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 1270, left: 40, right: 40, display: 'flex', justifyContent: 'center', columnGap: 10 }}>
        {role.splus.map((c, i) => (
          <ChampCard key={c.key} c={c} i={i} size={size} star={c.key === role.spotlight} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

type Move = (typeof data.moves.ups)[number];

const MoveRow: React.FC<{ m: Move; i: number; up: boolean }> = ({ m, i, up }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - TL.moveDelay - i * TL.moveStagger - (up ? 0 : TL.downsOffset), fps, config: { damping: 15 } });
  const col = up ? C.up : C.down;
  const key = m.role as keyof typeof T['role'];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 26, padding: '18px 26px', borderRadius: 26,
        background: '#ffffff0a', border: `2px solid ${col}40`, opacity: s,
        transform: `translateX(${(1 - s) * (up ? -160 : 160)}px)`,
      }}
    >
      <Img src={staticFile(`champions/${m.key}.jpg`)} style={{ width: 110, height: 110, borderRadius: 20 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, color: C.text }}>{m.name}</div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 28, color: C.muted, letterSpacing: 3 }}>{T.role[key]}</div>
      </div>
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 50, color: C.text, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: C.muted }}>{tierLabel(m.from)}</span>
        <span style={{ color: col, fontSize: 40 }}>{up ? '▲' : '▼'}</span>
        <span style={{ color: col }}>{tierLabel(m.to)}</span>
      </div>
    </div>
  );
};

const MovesScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T;
  const head = spring({ frame: f, fps, config: { damping: 16 } });
  const label = (txt: string, col: string) => (
    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 34, color: col, letterSpacing: 6, textTransform: 'uppercase', margin: '10px 0 4px 8px' }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={useSceneFade(MOVES)}>
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: head, transform: `scale(${0.85 + head * 0.15})` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 112 }}><GoldText>{t.movesTitle}</GoldText></div>
        <div style={{ marginTop: 8, fontFamily: BODY, fontWeight: 600, fontSize: 38, color: C.muted }}>{t.movesSub(t.date(data.moves.date))}</div>
      </div>
      <div style={{ position: 'absolute', top: 560, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {label(t.ups, C.up)}
        {data.moves.ups.map((m, i) => <MoveRow key={m.key} m={m} i={i} up />)}
        <div style={{ height: 24 }} />
        {label(t.downs, C.down)}
        {data.moves.downs.map((m, i) => <MoveRow key={m.key} m={m} i={i} up={false} />)}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T;
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  const url = 'wildriftcore.com/en/tierlist';
  const pulse = 1 + Math.sin((f / fps) * Math.PI * 2) * 0.02;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 90px' }}>
      <div style={{ opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 76, letterSpacing: 4, color: C.text, whiteSpace: 'nowrap' }}>
          WILD RIFT <GoldText>CORE</GoldText>
        </div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 700, fontSize: 52, color: C.text, whiteSpace: 'pre-line', lineHeight: 1.25 }}>{t.cta}</div>
        <div style={{ marginTop: 22, fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.gold2, letterSpacing: 4, textTransform: 'uppercase' }}>
          {t.ctaWeek} · {weekLabel}
        </div>
        <div
          style={{
            marginTop: 56, display: 'inline-block', fontFamily: BODY, fontWeight: 800, fontSize: 50, color: C.bg0,
            background: `linear-gradient(90deg, ${C.cyan}, ${C.cyan2})`, padding: '24px 46px', borderRadius: 999,
            transform: `scale(${pulse})`, boxShadow: `0 0 60px ${C.cyan}66`,
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 330, left: 120, right: 120, fontFamily: BODY, fontWeight: 500, fontSize: 22, lineHeight: 1.4, color: '#9ea8c7aa', opacity: s }}>
        {RIOT_NOTICE}
      </div>
    </AbsoluteFill>
  );
};

export const TierListPatch: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
    {/* synthétisée par scripts/synth-audio.mjs, calée sur src/timeline.json */}
    <Audio src={staticFile('audio/soundtrack.wav')} />
    <Background />
    <Sequence durationInFrames={INTRO}>
      <Intro />
    </Sequence>
    {data.roles.map((role, i) => (
      <Sequence key={role.role} from={ROLES_START + i * ROLE} durationInFrames={ROLE}>
        <RoleScene role={role} index={i} />
      </Sequence>
    ))}
    <Sequence from={MOVES_START} durationInFrames={MOVES}>
      <MovesScene />
    </Sequence>
    <Sequence from={OUTRO_START} durationInFrames={OUTRO}>
      <Outro />
    </Sequence>
    <TopBar patch={data.patch} />
    <ProgressBar />
  </AbsoluteFill>
);
