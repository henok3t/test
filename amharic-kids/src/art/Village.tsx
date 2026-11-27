import type { SceneBackground } from '../data/types.ts';

// The village: Ethiopian highland mesas (ambas), round tukul huts, acacia trees and
// yellow Adey Abeba (Meskel daisies). Anchored to the bottom so the ground is always visible.

const SKY: Record<SceneBackground, [string, string, string]> = {
  day: ['#6CC8F2', '#A9E1FA', '#E3F6FF'],
  sunset: ['#F47A6A', '#FFA866', '#FFE1A1'],
  night: ['#141C4A', '#2A3778', '#5163A6'],
};

export function Tukul({ x, y, s = 1, glow }: { x: number; y: number; s?: number; glow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={92} ry={12} fill="#000" opacity={0.12} />
      <path d="M-74 0 v-80 q74 -12 148 0 v80 q-74 10 -148 0z" fill="#D49563" />
      <path d="M-74 -40 q74 -10 148 0" stroke="#B9774A" strokeWidth={4} fill="none" opacity={0.6} />
      <path d="M-74 -60 q74 -10 148 0" stroke="#E7B184" strokeWidth={3} fill="none" opacity={0.7} />
      {/* door */}
      <path d="M-20 2 v-52 q20 -16 40 0 v52z" fill={glow ? '#FFD36B' : '#6B3B22'} />
      {glow && <path d="M-20 2 v-52 q20 -16 40 0 v52z" fill="#FFE59A" opacity={0.5} className="glow" />}
      {/* thatched roof */}
      <path d="M-100 -74 L0 -190 L100 -74 q-100 22 -200 0z" fill="#E0B04F" />
      <path d="M-100 -74 q100 22 200 0 l-6 10 q-94 20 -188 0z" fill="#C8912F" />
      <g stroke="#B98327" strokeWidth={3} opacity={0.7}>
        <path d="M-60 -70 L0 -186" /><path d="M-25 -66 L0 -186" /><path d="M25 -66 L0 -186" /><path d="M60 -70 L0 -186" />
      </g>
      <path d="M0 -190 v-24" stroke="#7A5420" strokeWidth={6} strokeLinecap="round" />
      <circle cx={0} cy={-216} r={7} fill="#E8C35A" />
    </g>
  );
}

export function Acacia({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-6 0 q4 -60 -20 -110 M4 0 q0 -70 30 -120 M0 -60 q20 -20 10 -60" stroke="#7B5132" strokeWidth={12} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={-128} rx={120} ry={30} fill="#5FA63F" />
      <ellipse cx={-40} cy={-140} rx={70} ry={22} fill="#73BA4C" />
      <ellipse cx={50} cy={-138} rx={60} ry={20} fill="#6BB246" />
    </g>
  );
}

export function Daisy({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}><g className="sway">
      <path d="M0 0 q-2 -18 0 -34" stroke="#4E8F33" strokeWidth={3} fill="none" />
      <g transform="translate(0 -38)">
        {Array.from({ length: 10 }, (_, i) => (
          <ellipse key={i} cx={0} cy={-9} rx={4} ry={9} fill="#FFD21F" transform={`rotate(${i * 36})`} />
        ))}
        <circle r={5.5} fill="#E08A00" />
      </g>
    </g></g>
  );
}

function Cloud({ x, y, s = 1, cls }: { x: number; y: number; s?: number; cls: string }) {
  return (
    <g className={cls}>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={0.92}>
        <ellipse cx={0} cy={0} rx={70} ry={30} />
        <circle cx={-30} cy={-18} r={30} />
        <circle cx={18} cy={-30} r={38} />
        <circle cx={52} cy={-8} r={26} />
      </g>
    </g>
  );
}

export function Village({ time = 'day' }: { time?: SceneBackground }) {
  const [a, b, c] = SKY[time];
  const night = time === 'night';
  const sunset = time === 'sunset';
  return (
    <svg className="village" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${time}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#FFF6B0" />
          <stop offset="1" stopColor="#FFF6B0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-400} y={-600} width={2400} height={1700} fill={`url(#sky-${time})`} />

      {/* sun / moon */}
      {time === 'day' && (
        <g transform="translate(1280 170)">
          <circle r={190} fill="url(#sunGlow)" opacity={0.7} />
          <g className="spin-slow">
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={-7} y={-128} width={14} height={34} rx={7} fill="#FFD33D" transform={`rotate(${i * 30})`} />
            ))}
          </g>
          <circle r={78} fill="#FFD33D" />
          <circle r={64} fill="#FFE36E" />
        </g>
      )}
      {sunset && (
        <g transform="translate(1150 560)">
          <circle r={260} fill="url(#sunGlow)" opacity={0.6} />
          <circle r={120} fill="#FF8A3D" />
          <circle r={100} fill="#FFB061" />
        </g>
      )}
      {night && (
        <g>
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={i} className="twinkle" style={{ animationDelay: `${(i % 7) * 0.4}s` }}
              cx={(i * 397) % 1900 - 150} cy={(i * 131) % 420 - 280} r={i % 3 === 0 ? 4 : 2.5} fill="#FFF8D0" />
          ))}
          <g transform="translate(1250 120)">
            <circle r={150} fill="url(#sunGlow)" opacity={0.25} />
            <circle r={62} fill="#FFF3C4" />
            <circle cx={26} cy={-14} r={56} fill="#2A3778" />
          </g>
        </g>
      )}

      {!night && <Cloud x={260} y={150} s={1.1} cls="drift-a" />}
      {!night && <Cloud x={760} y={90} s={0.8} cls="drift-b" />}
      {time === 'day' && <Cloud x={-80} y={300} s={0.7} cls="drift-b" />}

      {time === 'day' && (
        <g className="birds" stroke="#3B4C6B" strokeWidth={4} fill="none" strokeLinecap="round">
          <path d="M520 260 q14 -14 28 0 q14 -14 28 0" />
          <path d="M600 220 q10 -10 20 0 q10 -10 20 0" />
        </g>
      )}

      {/* far ambas (flat-topped mountains) */}
      <path d="M-400 640 L-200 640 L-120 470 L120 460 L200 560 L330 560 L420 420 L640 410 L720 520 L860 520 L940 450 L1140 440 L1240 560 L1400 560 L1470 470 L1700 460 L1800 640 L2000 640 V1000 H-400Z"
        fill={night ? '#26336B' : sunset ? '#C9796E' : '#8CB7C9'} />
      {/* rolling hills */}
      <path d="M-400 700 Q0 560 400 650 T1200 630 T2000 660 V1000 H-400Z" fill={night ? '#1F4A3A' : sunset ? '#8AA049' : '#8FCB5A'} />
      <path d="M-400 760 Q300 660 800 740 T2000 720 V1000 H-400Z" fill={night ? '#235340' : sunset ? '#7E9A3F' : '#7BBE48'} />

      <Acacia x={170} y={760} s={1.1} />
      <Acacia x={1480} y={740} s={0.8} />
      <Tukul x={360} y={790} s={0.85} glow={night || sunset} />
      <Tukul x={1260} y={800} s={1.05} glow={night || sunset} />
      <Tukul x={980} y={730} s={0.5} glow={night} />

      {/* ground and path */}
      <path d="M-400 800 Q800 740 2000 800 V1000 H-400Z" fill={night ? '#2B5E45' : sunset ? '#8DAA44' : '#94D25E'} />
      <path d="M640 1000 Q700 880 800 800 Q900 880 960 1000Z" fill={night ? '#6E6A55' : '#EBCB8E'} opacity={0.9} />
      {[60, 150, 250, 470, 560, 1080, 1160, 1380, 1460, 1540].map((x, i) => (
        <Daisy key={x} x={x} y={880 + ((i * 37) % 90)} s={0.9 + (i % 3) * 0.2} />
      ))}

      {night && <rect x={-400} y={-600} width={2400} height={1700} fill="#0B1540" opacity={0.25} />}
      {sunset && <rect x={-400} y={-600} width={2400} height={1700} fill="#FF7A3D" opacity={0.08} />}
    </svg>
  );
}
