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
