import type { PictureKey } from '../data/types.ts';
import { LionFace } from './Anbessa.tsx';
import { Orange } from './Tota.tsx';

// Small square pictures used on word cards, game buttons and the map. viewBox 0 0 200 200.

function Paw({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-14} y={-6} width={28} height={50} rx={14} fill="#F4B740" />
      <ellipse cx={0} cy={-8} rx={20} ry={18} fill="#F4B740" />
      <g fill="#F7A9A0">
        <ellipse cx={0} cy={-4} rx={9} ry={7} />
        <circle cx={-11} cy={-17} r={4} /><circle cx={0} cy={-21} r={4} /><circle cx={11} cy={-17} r={4} />
      </g>
    </g>
  );
}

function Motion({ x, y }: { x: number; y: number }) {
  return (
    <g stroke="#fff" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.9}>
      <path d={`M${x} ${y} q12 -10 0 -22`} />
      <path d={`M${x + 14} ${y + 6} q16 -16 0 -34`} />
    </g>
  );
}

function Jebena() {
  // the clay coffee pot
  return (
    <g transform="translate(130 60)">
      <ellipse cx={0} cy={78} rx={34} ry={36} fill="#3C2A22" />
      <rect x={-9} y={10} width={18} height={44} rx={6} fill="#3C2A22" />
      <path d="M20 66 q34 -10 30 -44" stroke="#3C2A22" strokeWidth={8} fill="none" strokeLinecap="round" />
      <path d="M-24 50 q-26 10 -18 40" stroke="#3C2A22" strokeWidth={7} fill="none" strokeLinecap="round" />
      <ellipse cx={-10} cy={66} rx={8} ry={14} fill="#fff" opacity={0.18} />
      <path d="M-14 104 q14 8 28 0" stroke="#E8B65A" strokeWidth={4} fill="none" />
    </g>
  );
}

const BG: Record<PictureKey, string> = {
  hello: '#FFE27A',
  myname: '#BDE7FF',
  thanks: '#FFD3C2',
  bye: '#FFB68A',
  orange: '#D9F2C7',
  family: '#FFD6E8',
  numbers: '#D7E4FF',
  colors: '#FFF0B3',
  animals: '#D6F5E3',
  food: '#FFE2C2',
  body: '#E8DDFF',
  count10: '#CDEFF5',
};

export function Picture({ k, title }: { k: PictureKey; title?: string }) {
  return (
    <svg viewBox="0 0 200 200" className="picture" role="img" aria-label={title ?? k}>
      <defs><clipPath id="pic-circle"><circle cx={100} cy={100} r={96} /></clipPath></defs>
      <circle cx={100} cy={100} r={96} fill={BG[k]} />
      <g clipPath={k === 'bye' ? 'url(#pic-circle)' : undefined}>
      {k === 'hello' && (
        <g>
          <g transform="translate(-6 28) scale(0.78)"><LionFace happy /></g>
          <g className="wave-paw" style={{ transformOrigin: '150px 150px' }}><Paw x={152} y={110} rot={20} s={0.9} /></g>
          <Motion x={172} y={74} />
        </g>
      )}
      {k === 'myname' && (
        <g>
          <path d="M100 22 v26" stroke="#7B5132" strokeWidth={5} />
          <rect x={30} y={46} width={140} height={118} rx={18} fill="#E8453C" />
          <rect x={30} y={46} width={140} height={34} rx={18} fill="#C9332B" />
          <rect x={30} y={66} width={140} height={14} fill="#C9332B" />
          <text x={100} y={71} textAnchor="middle" fontSize={20} fill="#fff" fontFamily="Fredoka, sans-serif" fontWeight={600}>HELLO</text>
          <rect x={42} y={88} width={116} height={64} rx={10} fill="#fff" />
          <text x={100} y={132} textAnchor="middle" fontSize={34} fill="#2B2B52" fontFamily="'Noto Sans Ethiopic', sans-serif" fontWeight={700}>ስሜ</text>
        </g>
      )}
      {k === 'thanks' && (
        <g>
          <Orange x={88} y={112} r={44} />
          <path d="M150 58 c-10 -20 -40 -8 -26 14 l26 24 l26 -24 c14 -22 -16 -34 -26 -14z" fill="#E8453C" className="beat" style={{ transformOrigin: '150px 75px' }} />
        </g>
      )}
      {k === 'bye' && (
        <g>
          <path d="M8 130 A92 92 0 0 0 192 130Z" fill="#7BBE48" />
          <circle cx={100} cy={128} r={44} fill="#FF8A3D" />
          <rect x={0} y={128} width={200} height={70} fill="#7BBE48" />
          <path d="M8 128 h184" stroke="#5FA63F" strokeWidth={4} />
          <circle cx={150} cy={50} r={16} fill="#FFF3C4" /><circle cx={158} cy={45} r={14} fill={BG.bye} />
          <g className="wave-paw" style={{ transformOrigin: '70px 160px' }}><Paw x={70} y={106} rot={-15} /></g>
          <Motion x={96} y={62} />
        </g>
      )}
      {k === 'orange' && <Orange x={100} y={110} r={56} />}
      {k === 'family' && (
        <g>
          <circle cx={62} cy={80} r={28} fill="#8B5A3C" /><circle cx={138} cy={80} r={28} fill="#A86E48" />
          <path d="M28 168 q34 -70 68 0z" fill="#3A8FD6" /><path d="M104 168 q34 -70 68 0z" fill="#E8453C" />
          <circle cx={100} cy={122} r={20} fill="#C48558" /><path d="M76 172 q24 -48 48 0z" fill="#FFC531" />
        </g>
      )}
      {k === 'numbers' && (
        <g fontFamily="Fredoka, sans-serif" fontWeight={700} fontSize={44} textAnchor="middle" fill="#fff">
          <rect x={24} y={98} width={50} height={50} rx={10} fill="#E8453C" /><text x={49} y={139}>1</text>
          <rect x={76} y={72} width={50} height={50} rx={10} fill="#3A8FD6" /><text x={101} y={113}>2</text>
          <rect x={128} y={98} width={50} height={50} rx={10} fill="#2FA05A" /><text x={153} y={139}>3</text>
        </g>
      )}
      {k === 'colors' && (
        <g>
          <path d="M100 36 c50 0 76 34 70 70 c-4 22 -30 18 -38 30 c-10 16 6 34 -24 34 c-44 0 -76 -30 -76 -66 c0 -38 30 -68 68 -68z" fill="#F5E2C0" />
          <circle cx={66} cy={80} r={14} fill="#E8453C" /><circle cx={104} cy={64} r={14} fill="#FFC531" />
          <circle cx={140} cy={84} r={14} fill="#2FA05A" /><circle cx={70} cy={122} r={14} fill="#3A8FD6" />
        </g>
      )}
      {k === 'animals' && (
        <g fill="#5A3A28">
          <ellipse cx={100} cy={122} rx={32} ry={28} />
          <ellipse cx={58} cy={88} rx={13} ry={17} /><ellipse cx={84} cy={64} rx={13} ry={17} />
          <ellipse cx={116} cy={64} rx={13} ry={17} /><ellipse cx={142} cy={88} rx={13} ry={17} />
        </g>
      )}
      {k === 'food' && (
        <g>
          <ellipse cx={80} cy={130} rx={62} ry={30} fill="#D9C7A0" />
          <ellipse cx={80} cy={124} rx={56} ry={24} fill="#EADBB9" />
          {Array.from({ length: 18 }, (_, i) => (
            <circle key={i} cx={40 + ((i * 23) % 80)} cy={114 + ((i * 7) % 20)} r={2} fill="#B9A276" />
          ))}
          <circle cx={66} cy={120} r={10} fill="#C0452B" /><circle cx={92} cy={128} r={9} fill="#E2A73B" />
          <Jebena />
        </g>
      )}
      {k === 'body' && (
        <g fill="#C48558">
          <rect x={64} y={88} width={72} height={76} rx={30} />
          <rect x={60} y={44} width={18} height={60} rx={9} transform="rotate(-14 69 74)" />
          <rect x={82} y={30} width={18} height={66} rx={9} />
          <rect x={104} y={30} width={18} height={66} rx={9} />
          <rect x={124} y={44} width={18} height={58} rx={9} transform="rotate(12 133 74)" />
          <rect x={130} y={98} width={18} height={50} rx={9} transform="rotate(48 139 123)" />
        </g>
      )}
      {k === 'count10' && (
        <g>
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={44 + (i % 5) * 28} cy={i < 5 ? 82 : 122} r={12} fill={['#E8453C', '#FFC531', '#2FA05A', '#3A8FD6', '#A65BD6'][i % 5]} />
          ))}
        </g>
      )}
      </g>
    </svg>
  );
}

/** Round sticker earned at the end of a lesson */
export function Sticker({ id }: { id: string }) {
  if (id === 'l1-selam') {
    return (
      <svg viewBox="0 0 200 200" className="sticker" role="img" aria-label="Selam sticker">
        <circle cx={100} cy={100} r={96} fill="#fff" />
        <circle cx={100} cy={100} r={86} fill="#FFE27A" />
        <path d="M100 14 a86 86 0 0 1 0 172" fill="#FFD145" opacity={0.6} />
        <g transform="translate(14 6) scale(0.86)"><LionFace happy /></g>
        <g className="wave-paw" style={{ transformOrigin: '52px 150px' }}>
          <Paw x={52} y={140} rot={-20} s={0.52} />
        </g>
        <rect x={42} y={140} width={116} height={40} rx={20} fill="#2FA05A" />
        <text x={100} y={170} textAnchor="middle" fontSize={28} fill="#fff" fontFamily="'Noto Sans Ethiopic', sans-serif" fontWeight={700}>ሰላም</text>
      </svg>
    );
  }
  return null;
}
