import type {CSSProperties} from 'react';
import Link from 'next/link';
import {MotionLabel} from './motion-label';
import {ArrowUpRight, WifiOff} from 'lucide-react';

const width = 1440;
const height = 460;
const cell = 9;
const center = {x: width / 2, y: -176};
const glyphs = 'PRUMO/0123456789+:.#';
const phrases = [
  'PRUMO / SEU DINHEIRO NO EIXO / ',
  'REGISTRE / ORGANIZE / PLANEJE / DECIDA / ',
  'PRUMO / UM PASSO DE CADA VEZ / ',
];

function noise(column: number, row: number) {
  return ((Math.imul(column + 17, 374761393) ^ Math.imul(row + 23, 668265263)) >>> 0) / 4294967296;
}

// Snap the silhouette and its scattered characters to the same grid.
const columns = Array.from({length: width / cell}, (_, column) => {
  const x = column * cell;
  const wave = 282 + 28 * Math.sin(x / 137) + 20 * Math.cos(x / 54);
  const edge = cell * Math.round((wave + 28 * (noise(column, 0) - .5)) / cell);
  return {column, x, edge};
});
const boundary = columns.map(({x, edge}) => `V${edge}H${x + cell}`).join('');
const opening = `M${center.x - 224} ${center.y}a224 224 0 1 0 448 0a224 224 0 1 0 -448 0Z`;
const silhouette = `M0 0${boundary}V0Z${opening}`;
const rings = Array.from({length: 24}, (_, index) => {
  const radius = 248 + 34 * index;
  return {
    id: `prumo-footer-ring-${index}`,
    path: `M${center.x - radius} ${center.y}a${radius} ${radius} 0 0 0 ${2 * radius} 0`,
    index,
  };
});
const particles = columns.flatMap(({column, x, edge}) =>
  Array.from({length: 17}, (_, index) => index - 5).flatMap(row => {
    const density = .72 * Math.exp(-Math.abs(row) / 3.5);
    const sample = noise(column, row + 19);
    if (sample > density) return [];
    return [{
      x, y: edge + row * cell, dark: row < 0,
      glyph: glyphs[(column * 7 + row + glyphs.length) % glyphs.length],
      tile: noise(column, row + 53) < .26,
      opacity: Math.max(.22, .85 - Math.abs(row) * .065),
    }];
  }),
);

function FooterArtwork() {
  return (
    <svg className="prumo-footer-art" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="prumo-footer-silhouette">
          <path d={silhouette} clipRule="evenodd" />
        </clipPath>
        {rings.map(({id, path}) => <path key={id} id={id} d={path} />)}
      </defs>
      <g clipPath="url(#prumo-footer-silhouette)">
        <rect width={width} height={height} fill="#101b14" />
        <g className="prumo-footer-ring-field">
          {rings.map(({id, index}) => index % 3 === 1 ? (
            <text key={id} className="prumo-footer-ring" style={{'--orbit-duration': `${12 + index % 7 * 2}s`, '--orbit-delay': `${-index * 1.6}s`} as CSSProperties} fill="#d3e6d5" fontSize={19 + (index % 4)} letterSpacing="2" opacity={index % 2 === 0 ? '.88' : '.68'}>
              <textPath href={`#${id}`} startOffset={`${(index * 7) % 13}%`}>
                {phrases[Math.floor(index / 3) % phrases.length].repeat(9)}
              </textPath>
            </text>
          ) : (
            <use key={id} href={`#${id}`} fill="none" stroke="#a4c1ac" strokeWidth="1.2" strokeDasharray=".5 15" strokeLinecap="round" opacity=".47" />
          ))}
        </g>
      </g>
      <g fontSize="8" textAnchor="middle">
        {Array.from({length: 5}, (_, band) => (
          <g key={band} className="prumo-footer-spark" style={{'--spark-delay': `${-band * 2.1}s`} as CSSProperties}>
            {particles.filter((_, index) => index % 5 === band).map(({x, y, dark, glyph, tile, opacity}) => (
              <g key={`${x}-${y}`} opacity={opacity}>
                {tile && <rect x={x} y={y} width={cell} height={cell} fill={dark ? '#e8ede5' : '#101b14'} />}
                <text x={x + cell / 2} y={y + 7} fill={dark !== tile ? '#c2d7c6' : '#405648'}>{glyph}</text>
              </g>
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="prumo-footer">
      <FooterArtwork />
      <div className="prumo-footer-inner">
        <div className="prumo-footer-index">
          <div className="prumo-footer-brand">
            <Link href="/" className="ref-logo">
              <img src="/logo.svg" alt="" width="38" height="38" />
              <MotionLabel>prumo.</MotionLabel>
            </Link>
            <p className="prumo-footer-tagline">O seu dinheiro, no eixo.</p>
            <p className="prumo-footer-note">Ferramenta de organização financeira.<br />Não realiza pagamentos ou movimentações bancárias.</p>
            <Link href="/app" className="prumo-footer-cta"><MotionLabel>Abrir meu espaço</MotionLabel> <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <nav className="prumo-footer-nav" aria-label="Navegação de rodapé">
            <div>
              <p>Explore</p>
              <a href="#camadas"><MotionLabel>Como funciona</MotionLabel></a>
              <a href="#recursos"><MotionLabel>Recursos</MotionLabel></a>
              <a href="#conselheiro"><MotionLabel>Conselheiro</MotionLabel></a>
            </div>
            <div>
              <p>Seu Prumo</p>
              <a href="#instalar"><MotionLabel>Instalar PWA</MotionLabel></a>
              <a href="#conteudo"><MotionLabel>Voltar ao início</MotionLabel> <ArrowUpRight size={13} aria-hidden="true" /></a>
            </div>
          </nav>
        </div>
        <div className="prumo-footer-bottom">
          <span>© Prumo · Um passo de cada vez.</span>
          <span><WifiOff size={14} aria-hidden="true" /> Com uma cópia local após abrir com internet.</span>
          <span className="prumo-footer-credit">powered by <a href="https://enex.studio" target="_blank" rel="noopener noreferrer"><MotionLabel>NX Studio.</MotionLabel><ArrowUpRight size={13} aria-hidden="true" /></a></span>
        </div>
      </div>
    </footer>
  );
}
