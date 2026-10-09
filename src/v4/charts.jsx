import { GLYPHS, GLYPH_FOR, TINT } from './iconData';
// Report charts as small SVG components. The geometry matches the PDF template (server/engine/v4/report/charts.js),
// so the screen and the printed report look like the same document.
const BAND = { developing: '#F2A93B', moderate: '#6F8FC0', strong: '#4C8C6B' };
export const bandOf = s => (s <= 3 ? 'developing' : s <= 6 ? 'moderate' : 'strong');
const f = n => Number(n.toFixed(1));

export function ScaleTrack({ stanine, label, width = 190 }) {
  const band = bandOf(stanine), pad = 11, usable = width - pad * 2;
  const x = pad + usable * (stanine - 1) / 8;
  return (
    <svg className="rp-track" viewBox={`0 0 ${width} 22`} width={width} height="22" role="img" aria-label={`${label}: ${stanine} out of 9`}>
      <rect x={pad - 6} y="6" width={usable + 12} height="10" rx="5" fill="#E7EBF2" />
      <rect x={pad - 6} y="6" width={f(x - pad + 6)} height="10" rx="5" fill={BAND[band]} />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={f(pad + usable * i / 8)} cy="11" r="1.6" fill={i < stanine ? 'rgba(255,255,255,.75)' : '#BFC8D6'} />)}
      <circle cx={f(x)} cy="11" r="9" fill="#fff" stroke={BAND[band]} strokeWidth="2.4" />
      <text x={f(x)} y="14.4" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#23262F">{stanine}</text>
    </svg>
  );
}

export function Hexagon({ types }) {
  const cx = 150, cy = 140, R = 92;
  const pt = (i, r) => { const a = (-90 + i * 60) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const ring = k => Array.from({ length: 6 }, (_, i) => pt(i, R * k).map(f).join(',')).join(' ');
  const r = t => R * Math.max(0.08, t.stanine / 9);
  return (
    <svg className="rp-chart" viewBox="0 0 300 285" role="img" aria-label={`Interest types: ${types.map(t => `${t.label} ${t.stanine} of 9`).join(', ')}`}>
      <polygon points={ring(1)} fill="#fff" stroke="#DDE2EC" />
      <polygon points={ring(2 / 3)} fill="none" stroke="#DDE2EC" strokeDasharray="2 3" />
      <polygon points={ring(1 / 3)} fill="none" stroke="#DDE2EC" strokeDasharray="2 3" />
      {types.map((t, i) => { const [x, y] = pt(i, R); return <line key={t.letter} x1={cx} y1={cy} x2={f(x)} y2={f(y)} stroke="#DDE2EC" strokeWidth=".8" />; })}
      <polygon points={types.map((t, i) => pt(i, r(t)).map(f).join(',')).join(' ')} fill="rgba(76,140,107,.22)" stroke="#4C8C6B" strokeWidth="2" strokeLinejoin="round" />
      {types.map((t, i) => { const [x, y] = pt(i, r(t)); return <circle key={t.letter} cx={f(x)} cy={f(y)} r="3.6" fill="#4C8C6B" stroke="#fff" strokeWidth="1.5" />; })}
      {types.map((t, i) => { const [x, y] = pt(i, R + 20); return <g key={t.letter} textAnchor="middle"><text x={f(x)} y={f(y - 2)} fontSize="11" fontWeight="700" fill="#2C3566">{t.letter}</text><text x={f(x)} y={f(y + 9)} fontSize="7.5" fill="#5E6575">{t.label}</text></g>; })}
    </svg>
  );
}

export function Compass({ x, y }) {
  const c = 130, h = 92;
  const px = c + Math.max(-1, Math.min(1, x)) * h, py = c - Math.max(-1, Math.min(1, y)) * h;
  const lab = (t, tx, ty, anchor) => <text x={tx} y={ty} textAnchor={anchor} fontSize="10" fontWeight="700" fill="#2C3566" letterSpacing=".06em">{t}</text>;
  return (
    <svg className="rp-chart" viewBox="-18 -4 296 272" role="img" aria-label="Work orientation map">
      <rect x={c - h} y={c - h} width={h * 2} height={h * 2} rx="14" fill="#fff" stroke="#DDE2EC" />
      <rect x={c} y={c - h} width={h} height={h} fill="#FFF1CF" opacity=".9" />
      <rect x={c - h} y={c} width={h} height={h} fill="#E6F0F8" opacity=".9" />
      <line x1={c - h} y1={c} x2={c + h} y2={c} stroke="#DDE2EC" /><line x1={c} y1={c - h} x2={c} y2={c + h} stroke="#DDE2EC" />
      {lab('THINGS', c, c - h - 8, 'middle')}{lab('PEOPLE', c, c + h + 17, 'middle')}{lab('IDEAS', c - h - 8, c + 3, 'end')}{lab('DATA', c + h + 8, c + 3, 'start')}
      <circle cx={f(px)} cy={f(py)} r="15" fill="rgba(217,101,74,.2)" /><circle cx={f(px)} cy={f(py)} r="7" fill="#D9654A" stroke="#fff" strokeWidth="2.2" />
    </svg>
  );
}

export function Ring({ pct, size = 54 }) {
  const r = 20, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct)) / 100 * c;
  return (
    <svg className="rp-ring" viewBox="0 0 54 54" width={size} height={size} role="img" aria-label={`${pct} percent match`}>
      <circle cx="27" cy="27" r={r} fill="none" stroke="#E7EBF2" strokeWidth="5" />
      <circle cx="27" cy="27" r={r} fill="none" stroke="#D9654A" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${f(v)} ${f(c)}`} transform="rotate(-90 27 27)" />
      <text x="27" y="31" textAnchor="middle" fontSize="12" fontWeight="700" fill="#23262F">{pct}</text>
    </svg>
  );
}

export function CoverArt() {
  return (
    <svg className="rp-art" viewBox="0 0 600 600" aria-hidden="true">
      <circle cx="410" cy="170" r="105" fill="#F2A93B" />
      <path d="M110 600 V330 a100 100 0 0 1 200 0 V600 Z" fill="#2C3566" />
      <path d="M150 600 V335 a60 60 0 0 1 120 0 V600 Z" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      <path d="M250 600 C250 470 340 400 470 410 C560 418 600 470 600 600 Z" fill="#4C8C6B" />
      <path d="M395 600 C395 540 440 500 500 500 C560 500 600 540 600 600 Z" fill="#D9654A" />
      <circle cx="548" cy="52" r="30" fill="#D9654A" opacity=".92" />
      <path d="M60 230 q30 -34 60 0 t60 0 t60 0" fill="none" stroke="#2C3566" strokeWidth="3" strokeLinecap="round" />
      <circle cx="520" cy="320" r="9" fill="#fff" /><circle cx="548" cy="296" r="5" fill="#fff" opacity=".8" />
    </svg>
  );
}

export function Squiggle({ color = '#F2A93B', width = 120 }) {
  return <svg className="rp-squig" viewBox={`0 0 ${width} 10`} width={width} height="10" aria-hidden="true"><path d="M2 6 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" /></svg>;
}

// ── icons and charts added for parity with the printed report
const dimensionOf = id => (id.startsWith('orient.') ? 'orientation' : id.startsWith('int.') ? 'interests' : id.startsWith('p.') ? 'personality' : id.startsWith('apt.') ? 'aptitude' : id.startsWith('ei.') ? 'ei' : 'values');

export function IconTile({ id, size = 48 }) {
  const [bg, ink] = TINT[dimensionOf(id)];
  const glyph = GLYPHS[GLYPH_FOR[id]] || GLYPHS.star;
  return (
    <svg className="rp-icon" viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill={bg} />
      {/* the glyph markup is a fixed constant from our own icon set, never student input */}
      <g transform="translate(10 10) scale(1.1667)" fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: glyph }} />
    </svg>
  );
}

export function BarChart({ rows, color = '#F2A93B', width = 520 }) {
  const left = 215, right = 28, h = 22, top = 6, gridW = width - left - right;
  const height = top + rows.length * h + 20;
  const x = v => left + gridW * v / 9;
  return (
    <svg className="rp-barchart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={rows.map(r => `${r.label} ${r.stanine} of 9`).join(', ')}>
      {[3, 6, 9].map(v => <g key={v}><line x1={f(x(v))} y1={top} x2={f(x(v))} y2={top + rows.length * h} stroke="#DDE2EC" strokeDasharray="3 3" /><text x={f(x(v))} y={top + rows.length * h + 13} textAnchor="middle" fontSize="9" fill="#5E6575">{v}</text></g>)}
      {rows.map((r, i) => { const y = top + i * h; return (
        <g key={r.id}>
          <text x={left - 8} y={y + 14} textAnchor="end" fontSize="10.5" fill="#23262F">{r.label}</text>
          <rect x={left} y={y + 4} width={gridW} height="11" rx="5.5" fill="#E7EBF2" />
          <rect x={left} y={y + 4} width={f(Math.max(11, gridW * r.stanine / 9))} height="11" rx="5.5" fill={color} />
          <text x={f(x(r.stanine) + 5)} y={y + 13.5} fontSize="10" fontWeight="600" fill="#23262F">{r.stanine}</text>
        </g>
      ); })}
    </svg>
  );
}

const PART_COLOR = { orientation: '#D9654A', interest: '#F2A93B', aptitude: '#4C8C6B', personality: '#2C3566', ei: '#6F8FC0' };
export function PartsBars({ parts, width = 250 }) {
  const left = 72, right = 34, h = 18, gridW = width - left - right;
  return (
    <svg className="rp-parts" viewBox={`0 0 ${width} ${parts.length * h + 2}`} role="img" aria-label={parts.map(p => `${p.label} ${p.pct} percent`).join(', ')}>
      {parts.map((p, i) => (
        <g key={p.key}>
          <text x={left - 8} y={i * h + 12} textAnchor="end" fontSize="10" fill="#23262F">{p.label}</text>
          <rect x={left} y={i * h + 4} width={gridW} height="9" rx="4.5" fill="#E7EBF2" />
          <rect x={left} y={i * h + 4} width={f(Math.max(9, gridW * p.pct / 100))} height="9" rx="4.5" fill={PART_COLOR[p.key] || '#F2A93B'} />
          <text x={left + gridW + 6} y={i * h + 12} fontSize="9.5" fontWeight="600" fill="#23262F">{p.pct}</text>
        </g>
      ))}
    </svg>
  );
}
