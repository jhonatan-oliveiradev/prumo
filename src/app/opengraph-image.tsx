import {ImageResponse} from 'next/og';

export const alt = 'Prumo — Seu dinheiro, no eixo. Controle financeiro pessoal de contas, cartões, gastos e metas.';
export const size = {width: 1200, height: 630};
export const contentType = 'image/png';

// A deterministic, original editorial visual inspired by Prumo's landing ASCII field.
// No external images, network fetches or fabricated dashboard values.
const characters = ' /+01x:.';
const ascii = Array.from({length: 25}, (_, row) =>
  Array.from({length: 36}, (_, column) =>
    characters[(column * 11 + row * 7 + ((column * row) % 9)) % characters.length]
  ).join(' ')
);

function BrandMark() {
  return <svg width="58" height="58" viewBox="0 0 65 65" fill="none" aria-hidden="true">
    <rect width="65" height="65" rx="18" fill="#274A37"/>
    <path d="M19 46V16H34.5C45 16 50 19 50 28S44 37 34.5 37H29"
      stroke="#B8E5A1" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="46" cy="46" r="3.25" fill="#B8E5A1"/>
  </svg>;
}

/** Generated as a 1200×630 PNG at build time using Next's native ImageResponse. */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: '100%', height: '100%', display: 'flex', position: 'relative',
      overflow: 'hidden', color: '#F0F5F0',
      background: 'linear-gradient(128deg, #030504 0%, #07130B 62%, #0E2415 100%)',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Right-side forest-green glow and precise architectural circles. */}
      <div style={{
        position: 'absolute', right: -215, top: -185, width: 820, height: 820,
        display: 'flex', borderRadius: 820,
        background: 'radial-gradient(circle, #28513B99 0%, #14291D55 38%, #03050400 75%)',
      }}/>
      <div style={{
        position: 'absolute', top: 12, right: -48, width: 635, height: 635,
        border: '1px solid #91B59C33', borderRadius: 635, display: 'flex',
      }}/>
      <div style={{
        position: 'absolute', top: 71, right: 11, width: 515, height: 515,
        border: '1px solid #91B59C30', borderRadius: 515, display: 'flex',
      }}/>
      <div style={{
        position: 'absolute', top: 143, right: 84, width: 370, height: 370,
        border: '1px solid #B8E5A155', borderRadius: 370, display: 'flex',
      }}/>
      <div style={{
        position: 'absolute', top: 0, right: 0, display: 'flex',
        flexDirection: 'column', width: 554, height: 630, overflow: 'hidden',
        opacity: 0.17, transform: 'rotate(-5deg)',
      }}>
        {ascii.map((line, index) => <div key={index} style={{
          display: 'flex', fontFamily: 'monospace', fontSize: 14,
          lineHeight: '22px', letterSpacing: 1.8, color: '#B8E5A1',
          whiteSpace: 'pre',
        }}>{line}</div>)}
      </div>
      <div style={{
        position: 'absolute', right: 205, top: 282, display: 'flex',
        width: 180, height: 70, alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 76, letterSpacing: -12,
        color: '#D9EBD8', opacity: 0.72,
      }}>/ 01</div>
      <div style={{
        position: 'absolute', right: 57, top: 58, display: 'flex',
        fontSize: 11, fontFamily: 'monospace',
        letterSpacing: 2.2, color: '#B8D0BB',
      }}>VISÃO / CONTROLE / CLAREZA</div>

      {/* Editorial copy with generous spacing and legible type at thumbnail size. */}
      <div style={{
        position: 'relative', zIndex: 2, padding: '64px 68px 45px',
        display: 'flex', flexDirection: 'column', width: '100%', height: '100%',
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <BrandMark/>
          <div style={{
            display: 'flex', fontSize: 37, fontWeight: 700,
            letterSpacing: -1.8, color: '#F0F5F0',
          }}>prumo.</div>
        </div>

        <div style={{
          display: 'flex', marginTop: 82, fontFamily: 'monospace',
          fontSize: 13, color: '#AACDB0', letterSpacing: 2.6,
        }}>CONTROLE FINANCEIRO PESSOAL</div>
        <div style={{
          display: 'flex', flexDirection: 'column', marginTop: 24,
          fontSize: 74, fontWeight: 700, lineHeight: 1.02,
          letterSpacing: -4.2, maxWidth: 685,
        }}>
          <div style={{display: 'flex'}}>Seu dinheiro,</div>
          <div style={{display: 'flex', color: '#B8E5A1'}}>no eixo.</div>
        </div>
        <div style={{
          display: 'flex', marginTop: 30, maxWidth: 568,
          color: '#BDCEC1', fontSize: 24, lineHeight: 1.4,
        }}>Contas, cartões, gastos e metas em um só lugar.</div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', borderTop: '1px solid #5C846855', paddingTop: 24,
          color: '#A2C2AA', fontFamily: 'monospace', fontSize: 13,
          letterSpacing: 1.2,
        }}>
          <div style={{display: 'flex'}}>MAIS CLAREZA. MENOS COMPLICAÇÃO.</div>
          <div style={{display: 'flex'}}>PRUMO / 2026</div>
        </div>
      </div>
    </div>,
    {...size},
  );
}
