import type { Pose } from '../data/types.ts';

// Tota (ጦጣ = monkey): Anbessa's best friend.

const FUR = '#9A6240';
const FUR_DARK = '#7A4A2E';
const FACE = '#F6D2A8';
const BROWN = '#3E2314';

export function Orange({ x, y, r = 16 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#FF9A1F" />
      <circle cx={x} cy={y} r={r} fill="url(#orangeShade)" />
      <ellipse cx={x - r * 0.35} cy={y - r * 0.35} rx={r * 0.28} ry={r * 0.18} fill="#fff" opacity={0.55} />
      <path d={`M${x} ${y - r} q2 -6 0 -9`} stroke="#6B4423" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <path d={`M${x + 1} ${y - r - 5} q10 -8 16 0 q-8 6 -16 0z`} fill="#5BB04A" />
      <defs>
        <radialGradient id="orangeShade" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#B4500A" stopOpacity={0.45} />
        </radialGradient>
      </defs>
    </g>
  );
}

function Arm({ side, className }: { side: 'l' | 'r'; className?: string }) {
  const x = side === 'l' ? 70 : 130;
  return (
    <g className={className} style={{ transformOrigin: `${x}px 140px` }}>
      <rect x={x - 8} y={136} width={16} height={56} rx={8} fill={FUR} />
      <circle cx={x} cy={192} r={10} fill={FACE} />
    </g>
  );
}

export function Tota({ pose = 'idle', talking = false }: { pose?: Pose; talking?: boolean }) {
  const happy = pose === 'happy';
  const give = pose === 'give';
  const armR = pose === 'wave' ? 'arm-wave-r' : happy ? 'arm-up-r' : give ? 'arm-give-r' : 'arm-rest';
  const armL = happy ? 'arm-up-l' : give ? 'arm-give-l' : 'arm-rest';
  return (
    <svg viewBox="0 0 200 230" className={`character pose-${pose}`} aria-label="Tota the monkey" role="img">
      <ellipse cx={100} cy={222} rx={50} ry={7} fill="#000" opacity={0.12} className="shadow" />
      <g className="char-body">
        {/* curly tail */}
        <path d="M128 200 q40 6 42 -30 q2 -26 -20 -24 q-16 2 -12 16 q4 10 14 4" stroke={FUR_DARK} strokeWidth={8} fill="none" strokeLinecap="round" className="tail" />
        {/* body */}
        <ellipse cx={100} cy={182} rx={36} ry={40} fill={FUR} />
        <ellipse cx={100} cy={188} rx={22} ry={26} fill={FACE} />
        {/* feet */}
        <ellipse cx={78} cy={216} rx={16} ry={9} fill={FUR_DARK} />
        <ellipse cx={122} cy={216} rx={16} ry={9} fill={FUR_DARK} />
        <Arm side="l" className={armL} />
        <Arm side="r" className={armR} />
        {give && <Orange x={100} y={178} r={20} />}
        <g className="char-head">
          {/* ears */}
          <circle cx={46} cy={82} r={20} fill={FUR} />
          <circle cx={46} cy={82} r={12} fill={FACE} />
          <circle cx={154} cy={82} r={20} fill={FUR} />
          <circle cx={154} cy={82} r={12} fill={FACE} />
          {/* head */}
          <circle cx={100} cy={80} r={50} fill={FUR} />
          <path d="M92 32 q4 -16 12 -6 q4 -10 10 2" stroke={FUR_DARK} strokeWidth={6} fill="none" strokeLinecap="round" />
          {/* heart-shaped face */}
          <path d="M100 66 q-12 -22 -32 -14 q-20 10 -12 38 q8 30 44 34 q36 -4 44 -34 q8 -28 -12 -38 q-20 -8 -32 14z" fill={FACE} />
          <ellipse cx={70} cy={100} rx={8} ry={5} fill="#F28B7D" opacity={0.55} />
          <ellipse cx={130} cy={100} rx={8} ry={5} fill="#F28B7D" opacity={0.55} />
          {happy ? (
            <g stroke={BROWN} strokeWidth={5} strokeLinecap="round" fill="none">
              <path d="M70 80 q9 -11 18 0" />
              <path d="M112 80 q9 -11 18 0" />
            </g>
          ) : (
            <g className="blink">
              <ellipse cx={80} cy={78} rx={9} ry={11} fill={BROWN} />
              <ellipse cx={120} cy={78} rx={9} ry={11} fill={BROWN} />
              <circle cx={83} cy={74} r={3.6} fill="#fff" />
              <circle cx={123} cy={74} r={3.6} fill="#fff" />
            </g>
          )}
          <ellipse cx={95} cy={96} rx={2.5} ry={2} fill={BROWN} />
          <ellipse cx={105} cy={96} rx={2.5} ry={2} fill={BROWN} />
          {talking || happy ? (
            <path className={talking ? 'mouth-talk' : undefined} d="M86 106 q14 18 28 0 z" fill="#7A2E1F" stroke={BROWN} strokeWidth={2} strokeLinejoin="round" />
          ) : (
            <path d="M86 106 q14 12 28 0" stroke={BROWN} strokeWidth={3} strokeLinecap="round" fill="none" />
          )}
        </g>
      </g>
    </svg>
  );
}
