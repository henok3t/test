import type { Pose } from '../data/types.ts';

// Anbessa (አንበሳ = lion): a little lion cub. Pure SVG; poses animate through CSS classes in styles.css.

const GOLD = '#F4B740';
const GOLD_DARK = '#E39B2A';
const BELLY = '#FCE0A2';
const MANE = '#D66A26';
const MANE_IN = '#EE8B36';
const BROWN = '#5A2F17';

/** Ring of rounded mane tufts */
function Mane({ cx, cy, r, tuft, color, n }: { cx: number; cy: number; r: number; tuft: number; color: string; n: number }) {
  return (
    <g fill={color}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={tuft} />;
      })}
      <circle cx={cx} cy={cy} r={r} />
    </g>
  );
}

export function LionFace({ happy = false, talking = false }: { happy?: boolean; talking?: boolean }) {
  // centred on (100, 82)
  return (
    <g>
      <Mane cx={100} cy={84} r={56} tuft={20} color={MANE} n={16} />
      <Mane cx={100} cy={84} r={50} tuft={14} color={MANE_IN} n={16} />
      {/* ears */}
      <circle cx={60} cy={44} r={15} fill={GOLD} />
      <circle cx={60} cy={44} r={8} fill="#F7A9A0" />
      <circle cx={140} cy={44} r={15} fill={GOLD} />
      <circle cx={140} cy={44} r={8} fill="#F7A9A0" />
      {/* head */}
      <ellipse cx={100} cy={86} rx={46} ry={43} fill={GOLD} />
      <path d="M88 44 q6 -12 12 -2 q6 -12 12 2" fill={GOLD_DARK} />
      {/* cheeks */}
      <ellipse cx={68} cy={100} rx={9} ry={6} fill="#F59A8B" opacity={0.6} />
      <ellipse cx={132} cy={100} rx={9} ry={6} fill="#F59A8B" opacity={0.6} />
      {/* eyes */}
      {happy ? (
        <g stroke={BROWN} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d="M70 84 q9 -11 18 0" />
          <path d="M112 84 q9 -11 18 0" />
        </g>
      ) : (
        <g className="blink">
          <ellipse cx={80} cy={82} rx={9} ry={11} fill={BROWN} />
          <ellipse cx={120} cy={82} rx={9} ry={11} fill={BROWN} />
          <circle cx={83} cy={78} r={3.6} fill="#fff" />
          <circle cx={123} cy={78} r={3.6} fill="#fff" />
          <circle cx={77.5} cy={86} r={1.8} fill="#fff" />
          <circle cx={117.5} cy={86} r={1.8} fill="#fff" />
        </g>
      )}
      {/* muzzle */}
      <ellipse cx={90} cy={106} rx={14} ry={11} fill="#FFF3D6" />
      <ellipse cx={110} cy={106} rx={14} ry={11} fill="#FFF3D6" />
      <path d="M92 96 q8 -4 16 0 q-2 8 -8 9 q-6 -1 -8 -9z" fill={BROWN} />
      <ellipse cx={97} cy={97} rx={2.5} ry={1.4} fill="#fff" opacity={0.5} />
      {talking || happy ? (
        <path className={talking ? 'mouth-talk' : undefined} d="M90 110 q10 16 20 0 z" fill="#7A2E1F" stroke={BROWN} strokeWidth={2} strokeLinejoin="round" />
      ) : (
        <path d="M100 105 v4 M100 109 q-5 5 -10 1 M100 109 q5 5 10 1" stroke={BROWN} strokeWidth={2.6} strokeLinecap="round" fill="none" />
      )}
      {/* whisker dots */}
      <g fill={GOLD_DARK}>
        <circle cx={82} cy={104} r={1.4} /><circle cx={86} cy={109} r={1.4} />
        <circle cx={118} cy={104} r={1.4} /><circle cx={114} cy={109} r={1.4} />
      </g>
    </g>
  );
}

function Arm({ side, className }: { side: 'l' | 'r'; className?: string }) {
  const x = side === 'l' ? 66 : 134;
  return (
    <g className={className} style={{ transformOrigin: `${x}px 146px` }}>
      <rect x={x - 11} y={142} width={22} height={44} rx={11} fill={GOLD} />
      <ellipse cx={x} cy={184} rx={13} ry={10} fill={GOLD} />
      <path d={`M${x - 5} 188 v-5 M${x + 5} 188 v-5`} stroke={GOLD_DARK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Anbessa({ pose = 'idle', talking = false }: { pose?: Pose; talking?: boolean }) {
  const happy = pose === 'happy';
  const armR = pose === 'wave' ? 'arm-wave-r' : happy ? 'arm-up-r' : pose === 'give' ? 'arm-give-r' : 'arm-rest';
  const armL = happy ? 'arm-up-l' : pose === 'give' ? 'arm-give-l' : 'arm-rest';
  return (
    <svg viewBox="0 0 200 230" className={`character pose-${pose}`} aria-label="Anbessa the lion cub" role="img">
      <ellipse cx={100} cy={222} rx={58} ry={7} fill="#000" opacity={0.12} className="shadow" />
      <g className="char-body">
        {/* tail */}
        <g className="tail lion-tail">
          <path d="M60 196 q-40 4 -38 -28 q1 -14 -8 -20" stroke={GOLD_DARK} strokeWidth={8} fill="none" strokeLinecap="round" />
          <circle cx={13} cy={146} r={10} fill={MANE} />
        </g>
        {/* body */}
        <path d="M60 210 q-8 -60 40 -78 q48 18 40 78 z" fill={GOLD} />
        <ellipse cx={100} cy={186} rx={24} ry={26} fill={BELLY} />
        {/* feet */}
        <ellipse cx={76} cy={212} rx={20} ry={11} fill={GOLD} />
        <ellipse cx={124} cy={212} rx={20} ry={11} fill={GOLD} />
        <path d="M70 214 v-5 M78 215 v-5 M118 215 v-5 M126 214 v-5" stroke={GOLD_DARK} strokeWidth={2} strokeLinecap="round" />
        {armL === 'arm-rest' && <Arm side="l" className={armL} />}
        {armR === 'arm-rest' && <Arm side="r" className={armR} />}
        <g className="char-head">
          <LionFace happy={happy} talking={talking} />
        </g>
        {/* raised arms go in front of the mane so the wave can be seen */}
        {armL !== 'arm-rest' && <Arm side="l" className={armL} />}
        {armR !== 'arm-rest' && <Arm side="r" className={armR} />}
      </g>
    </svg>
  );
}
