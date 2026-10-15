import React from 'react';
import {
  AbsoluteFill,
  Img,
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

type Lang = 'fr' | 'en';
const T = {
  fr: {
    kicker: 'Wild Rift · Master+',
    title: 'TIER LIST',
    sub: 'Les champions S+ de chaque rôle',
    role: { TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', ADC: 'ADC', SUPPORT: 'SUPPORT' },
    roleSub: { TOP: 'Baron lane', JUNGLE: 'Jungle', MID: 'Mid lane', ADC: 'Dragon lane', SUPPORT: 'Support' },
    wr: 'victoires',
    movesTitle: 'ÇA BOUGE',
    movesSub: (d: string) => `Derniers mouvements · ${d}`,
    ups: 'Montent',
    downs: 'Descendent',
    cta: 'Tier list complète\net raisons de chaque tier',
    date: (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    pct: (n: number) => `${n.toFixed(1).replace('.', ',')} %`,
  },
  en: {
    kicker: 'Wild Rift · Master+',
    title: 'TIER LIST',
    sub: 'The S+ champions of every role',
    role: { TOP: 'TOP', JUNGLE: 'JUNGLE', MID: 'MID', ADC: 'ADC', SUPPORT: 'SUPPORT' },
    roleSub: { TOP: 'Baron lane', JUNGLE: 'Jungle', MID: 'Mid lane', ADC: 'Dragon lane', SUPPORT: 'Support' },
    wr: 'win rate',
    movesTitle: 'ON THE MOVE',
    movesSub: (d: string) => `Latest shifts · ${d}`,
    ups: 'Rising',
    downs: 'Falling',
    cta: 'Full tier list\nwith the reason for every tier',
    date: (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pct: (n: number) => `${n.toFixed(1)}%`,
  },
} as const;

// Texte imposé par la politique fan-content de Riot : il ne se traduit pas (cf. scripts/lib/footer.mjs du site).
const RIOT_NOTICE =
  'Wild Rift Core was created under Riot Games\' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.';

const tierLabel = (t: string) => (t === 'S_PLUS' ? 'S+' : t);

// ── Timeline (30 fps) ─────────────────────────────────────────────────────────
const INTRO = 90;
const ROLE = 72;
const MOVES = 96;
const OUTRO = 72;
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
          fontFamily: BODY, fontWeight: 800, fontSize: 30, color: C.bg0, background: C.cyan,
          padding: '10px 22px', borderRadius: 999, letterSpacing: 1,
        }}
      >
        PATCH {patch}
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
const Intro: React.FC<{ lang: Lang }> = ({ lang }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T[lang];
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
        <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 600, fontSize: 44, color: C.muted, opacity: subIn }}>
          {t.sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};

type Champ = (typeof data.roles)[number]['splus'][number];

const ChampCard: React.FC<{ c: Champ; i: number; lang: Lang; size: number }> = ({ c, i, lang, size }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 10 - i * 5, fps, config: { damping: 13, mass: 0.7 } });
  const wrIn = interpolate(f, [22 + i * 5, 34 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ width: size + 40, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - s) * 80}px) scale(${0.6 + s * 0.4})`, opacity: s }}>
      <div
        style={{
          width: size, height: size, borderRadius: 34, padding: 6,
          background: `linear-gradient(140deg, ${C.gold2}, ${C.gold} 45%, ${C.cyan})`,
          boxShadow: `0 18px 50px #000a, 0 0 40px ${C.gold}40`,
        }}
      >
        <Img src={staticFile(`champions/${c.key}.jpg`)} style={{ width: '100%', height: '100%', borderRadius: 28, display: 'block' }} />
      </div>
      <div style={{ marginTop: 18, fontFamily: BODY, fontWeight: 800, fontSize: 42, color: C.text, whiteSpace: 'nowrap' }}>{c.name}</div>
      {c.winRate != null && (
        <div style={{ marginTop: 4, fontFamily: BODY, fontWeight: 600, fontSize: 30, color: C.up, opacity: wrIn }}>
          {T[lang].pct(c.winRate)} <span style={{ color: C.muted }}>{T[lang].wr}</span>
        </div>
      )}
    </div>
  );
};

const RoleScene: React.FC<{ role: (typeof data.roles)[number]; index: number; lang: Lang }> = ({ role, index, lang }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T[lang];
  const head = spring({ frame: f, fps, config: { damping: 16 } });
  const n = role.splus.length;
  const size = n <= 2 ? 360 : n <= 4 ? 300 : 260;
  const key = role.role as keyof typeof t.role;
  return (
    <AbsoluteFill style={useSceneFade(ROLE)}>
      {/* Lettrage géant en filigrane */}
      <div
        style={{
          position: 'absolute', top: 1560, left: -200, right: -200, textAlign: 'center', fontFamily: TITLE, fontWeight: 900,
          fontSize: 300, color: 'transparent', WebkitTextStroke: `3px ${C.cyan}38`, letterSpacing: 10, whiteSpace: 'nowrap',
          transform: `translateX(${(1 - head) * 200}px)`,
        }}
      >
        {t.role[key]}
      </div>
      <div style={{ position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', opacity: head }}>
        <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 34, color: C.muted, letterSpacing: 6, textTransform: 'uppercase' }}>
          {index + 1} / {data.roles.length} · {t.roleSub[key]}
        </div>
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
          <span style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 120, color: C.text }}>{t.role[key]}</span>
          <span
            style={{
              fontFamily: TITLE, fontWeight: 900, fontSize: 64, color: C.bg0, background: `linear-gradient(180deg, ${C.gold2}, ${C.gold})`,
              padding: '6px 24px', borderRadius: 18, transform: `rotate(-4deg) scale(${head})`,
            }}
          >
            S+
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute', top: 640, left: 60, right: 60, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', rowGap: 56, columnGap: 20,
        }}
      >
        {role.splus.map((c, i) => (
          <ChampCard key={c.key} c={c} i={i} lang={lang} size={size} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

type Move = (typeof data.moves.ups)[number];

const MoveRow: React.FC<{ m: Move; i: number; up: boolean; lang: Lang }> = ({ m, i, up, lang }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - 14 - i * 6 - (up ? 0 : 18), fps, config: { damping: 15 } });
  const col = up ? C.up : C.down;
  const key = m.role as keyof (typeof T)['fr']['role'];
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
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 28, color: C.muted, letterSpacing: 3 }}>{T[lang].role[key]}</div>
      </div>
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 50, color: C.text, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: C.muted }}>{tierLabel(m.from)}</span>
        <span style={{ color: col, fontSize: 40 }}>{up ? '▲' : '▼'}</span>
        <span style={{ color: col }}>{tierLabel(m.to)}</span>
      </div>
    </div>
  );
};

const MovesScene: React.FC<{ lang: Lang }> = ({ lang }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T[lang];
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
        {data.moves.ups.map((m, i) => <MoveRow key={m.key} m={m} i={i} up lang={lang} />)}
        <div style={{ height: 24 }} />
        {label(t.downs, C.down)}
        {data.moves.downs.map((m, i) => <MoveRow key={m.key} m={m} i={i} up={false} lang={lang} />)}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ lang: Lang }> = ({ lang }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = T[lang];
  const s = spring({ frame: f, fps, config: { damping: 14 } });
  const url = lang === 'fr' ? 'wildriftcore.com/tierlist' : 'wildriftcore.com/en/tierlist';
  const pulse = 1 + Math.sin((f / fps) * Math.PI * 2) * 0.02;
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 90px' }}>
      <div style={{ opacity: s, transform: `translateY(${(1 - s) * 60}px)` }}>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 76, letterSpacing: 4, color: C.text, whiteSpace: 'nowrap' }}>
          WILD RIFT <GoldText>CORE</GoldText>
        </div>
        <div style={{ marginTop: 40, fontFamily: BODY, fontWeight: 700, fontSize: 52, color: C.text, whiteSpace: 'pre-line', lineHeight: 1.25 }}>{t.cta}</div>
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

export const TierListPatch: React.FC<{ lang: Lang }> = ({ lang }) => (
  <AbsoluteFill style={{ backgroundColor: C.bg0 }}>
    <Background />
    <Sequence durationInFrames={INTRO}>
      <Intro lang={lang} />
    </Sequence>
    {data.roles.map((role, i) => (
      <Sequence key={role.role} from={ROLES_START + i * ROLE} durationInFrames={ROLE}>
        <RoleScene role={role} index={i} lang={lang} />
      </Sequence>
    ))}
    <Sequence from={MOVES_START} durationInFrames={MOVES}>
      <MovesScene lang={lang} />
    </Sequence>
    <Sequence from={OUTRO_START} durationInFrames={OUTRO}>
      <Outro lang={lang} />
    </Sequence>
    <TopBar patch={data.patch} />
    <ProgressBar />
  </AbsoluteFill>
);
