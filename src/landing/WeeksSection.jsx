import { useEffect, useRef } from 'react';
import { DELTA, LINE_ICONS, WEEKS } from './weeks';
import { useMedia, useViewport } from './useFit';
import Icon from '../platform/ui/Icon';
import Shaped from './Shaped';
import ring28 from '../assets/landing/ring-28.png';
import ring29 from '../assets/landing/ring-29.png';
import ring30 from '../assets/landing/ring-30.png';
import ring31 from '../assets/landing/ring-31.png';
import ring32 from '../assets/landing/ring-32.png';
import ring33 from '../assets/landing/ring-33.png';
import ring34 from '../assets/landing/ring-34.png';
import ring35 from '../assets/landing/ring-35.png';
import burstRed from '../assets/landing/burst-red.svg';
import emojiBg from '../assets/landing/emoji-bg.svg';
import starRed from '../assets/landing/star-red.svg';
import dot from '../assets/landing/dot.svg';
import burst1 from '../assets/landing/burst-1.svg';
import burst2 from '../assets/landing/burst-2.svg';
import burst3 from '../assets/landing/burst-3.svg';
import burst4 from '../assets/landing/burst-4.svg';
import burst5 from '../assets/landing/burst-5.svg';
import burst6 from '../assets/landing/burst-6.svg';
import burst7 from '../assets/landing/burst-7.svg';
import burst8 from '../assets/landing/burst-8.svg';

// The design is a 1280 x 714 frame. The "sun" the planets orbit is at the right, at (1400, 340).
const W = 1280, H = 714, CX = 1400, CY = 340;
const RINGS = [[ring28, 1339.5, 339.5, 75, 0.45], [ring29, 1399.5, 339.5, 0, 0.55], [ring30, 1459.5, 339.5, 0, 0.65], [ring31, 1519.5, 339.5, 0, 0.75], [ring32, 1579.5, 339.5, 0, 0.85], [ring33, 1639.5, 339.5, 0, 0.95], [ring34, 1699.5, 339.5, 0, 1.05], [ring35, 1759.5, 339.5, 0, 1.15]];
const EMOJI_AT = [[871, 31], [983, 213], [1050, 459], [1186, 131], [1210, 316], [852, 354], [1018, 653]];
const DOT_AT = [[950, 30], [983, 676], [1025, 545], [1063, 163], [1173, 54], [1107, 425], [1233, 475]];
// the small blue starburst is eight thin pieces; each is placed by its inset (percent of the frame) from the design
const BURST = [[burst1, 46.08, 27.67, 50.24, 72.23], [burst2, 47.83, 26.7, 51.99, 71.25], [burst3, 46.55, 26.96, 50.72, 71.52], [burst4, 46.55, 26.96, 50.72, 71.52], [burst5, 47.14, 26.75, 51.3, 71.31], [burst6, 46.18, 27.29, 50.34, 71.84], [burst7, 47.15, 26.75, 51.31, 71.31], [burst8, 46.18, 27.29, 50.34, 71.85]];
const BURST_BOX = { x: 912, y: 329, w: 26, h: 26 };

const BADGE_TONES = ['#0f3ee4', '#d9654a', '#c98a14', '#3f8a64'];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
/** Scroll progress 0..1 -> how far through the weeks we are (0 = week 1, 2 = week 3), with a rest at each week. */
export function weekAt(p) {
  const stops = [[0, 0.14, 0, 0], [0.14, 0.44, 0, 1], [0.44, 0.64, 1, 1], [0.64, 0.92, 1, 2], [0.92, 1, 2, 2]];
  for (const [a, b, from, to] of stops) if (p <= b) return from + (to - from) * smooth(clamp((p - a) / (b - a || 1)));
  return 2;
}
/** Writes the animation state onto the scene as CSS variables. Cheap: no React re-render per scroll event. */
export function applyWeek(el, w) {
  el.style.setProperty('--g', String(w * DELTA));
  WEEKS.forEach((_, k) => {
    const d = Math.abs(w - k);
    el.style.setProperty(`--to${k}`, String(clamp(1 - d * 2.6)));
    el.style.setProperty(`--ty${k}`, `${((k - w) * 46).toFixed(1)}px`);
    el.style.setProperty(`--co${k}`, String(Math.max(0.004, clamp(1.0 - d * 1.7))));
  });
}

function LineIcon({ name }) {
  return <svg width="38" height="38" viewBox="0 0 38 38" fill="none" stroke="#2b2b2b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={LINE_ICONS[name].d} /></svg>;
}
const RowIcon = ({ item }) => (item.img ? <img src={item.img} alt="" className="lp-rowicon-img" /> : <LineIcon name={item.icon} />);

/** One week's planets: two photo cards, a blob photo, a rounded photo, emoji badges, dots, stars. They turn about the sun and stay upright. */
function Cluster({ week, k }) {
  const a = week.art;
  const place = (dx, dy, tilt = 0) => ({ transform: `translate(${dx}px, ${dy}px) rotate(calc(var(--a) * -1)) translate(-50%, -50%) rotate(${tilt}deg)` });
  const bx = BURST_BOX.x + BURST_BOX.w / 2 - CX, by = BURST_BOX.y + BURST_BOX.h / 2 - CY;
  return (
    <div className="lp-cl" style={{ '--a': `calc(var(--g) * 1deg - ${k * DELTA}deg)`, opacity: `var(--co${k}, 0)` }} aria-hidden="true">
      <div className="lp-it lp-card" style={{ ...place(856 - CX, 204 - CY), width: 212, height: 234 }}><img src={a.cardA} alt="" /><p>{a.captionA}</p></div>
      <div className="lp-it lp-card blue" style={{ ...place(906 - CX, 524 - CY), width: 212, height: 234 }}><img src={a.cardB} alt="" /><p>{a.captionB}</p></div>
      {a.blobPhoto ? <Shaped className="lp-it" photo={a.blobPhoto} mask={a.blobMask} style={{ ...place(1117 - CX, 322 - CY, 4.12), width: a.blobSize[0], height: a.blobSize[1] }} /> : <img className="lp-it" src={a.blob} alt="" style={{ ...place(1117 - CX, 322 - CY, 4.12), width: a.blobSize[0], height: a.blobSize[1] }} />}
      <div className="lp-it lp-round" style={{ ...place(1185.4 - CX, 600.4 - CY, -8), width: 160, height: 160 }}><img src={a.round} alt="" style={{ width: '100%', left: 0, objectFit: 'cover' }} /></div>
      {EMOJI_AT.map(([x, y], i) => (
        <div key={`e${i}`} className="lp-it lp-emoji" style={{ ...place(x + 16 - CX, y + 16 - CY) }}><img src={emojiBg} alt="" /><span style={{ color: BADGE_TONES[i % 4] }}><Icon name={week.emojis[i]} size={17} stroke={2} /></span></div>
      ))}
      {DOT_AT.map(([x, y], i) => <img key={`d${i}`} className="lp-it" src={dot} alt="" style={{ ...place(x + 8.5 - CX, y + 8.5 - CY), width: 17, height: 17 }} />)}
      <img className="lp-it" src={starRed} alt="" style={{ ...place(792 + 13 - CX, 348 + 13 - CY), width: 26, height: 26 }} />
      <div className="lp-it" style={{ ...place(bx, by), width: BURST_BOX.w, height: BURST_BOX.h }}>
        {BURST.map(([src, t, r, b, l], i) => <img key={i} src={src} alt="" className="lp-burstpart" style={{ left: (l / 100) * W - BURST_BOX.x, top: (t / 100) * H - BURST_BOX.y, width: ((100 - r - l) / 100) * W, height: ((100 - t - b) / 100) * H }} />)}
      </div>
    </div>
  );
}

/** The dashed orbit lines and every week's planets. Driven entirely by --g (and the --co vars) set on a parent. */
function OrbitArt() {
  return (
    <>
      {RINGS.map(([src, x, y, base, f], i) => (
        <img key={i} src={src} alt="" aria-hidden="true" className="lp-ring" style={{ left: x - 534.5, top: y - 534.5, transform: `rotate(calc(${base}deg + var(--g) * ${f}deg))` }} />
      ))}
      {WEEKS.map((wk, k) => <Cluster key={k} week={wk} k={k} />)}
    </>
  );
}

/** Week text laid out as in the design (desktop). */
function WeekTextAbs({ week, k }) {
  return (
    <div className="lp-wt" style={{ opacity: `var(--to${k}, 0)`, transform: `translateY(var(--ty${k}, 0px))` }}>
      <h2 className="lp-wk"><span>Week </span><b>{week.n}</b></h2>
      <p className="lp-wsub">{week.title}</p>
      {week.items.map((it, i) => (
        <div key={i} className="lp-row" style={{ top: 230 + i * 120 }}>
          <div className="lp-rowbox"><RowIcon item={it} /></div>
          <h3>{it.title}</h3><p style={{ width: [445, 445, 454][i] }}>{it.text}</p>
        </div>
      ))}
    </div>
  );
}

/** Keeps every picture decoded before it is needed, so nothing hitches the first time a week comes into view. */
function useWarmImages() {
  useEffect(() => {
    const srcs = new Set();
    WEEKS.forEach(w => { const a = w.art; [a.cardA, a.cardB, a.blob || a.blobPhoto, a.round].forEach(x => srcs.add(x)); });
    RINGS.forEach(r => srcs.add(r[0]));
    srcs.forEach(src => { const im = new Image(); im.src = src; if (im.decode) im.decode().catch(() => {}); });
  }, []);
}

/**
 * Drives a scene from the page scroll. The scroll position only sets a target; the picture glides to it
 * (exponential easing, about a tenth of a second), so a notched mouse wheel or a trackpad flick never makes the orbit jump.
 */
function useScroll(sectionRef, sceneRef, enabled, offset = 0) {
  useWarmImages();
  useEffect(() => {
    if (!enabled) return undefined;
    const st = { target: 0, cur: 0, raf: 0, last: 0, primed: false };
    const frame = now => {
      const el = sceneRef.current; if (!el) { st.raf = 0; return; }
      const dt = Math.min(64, now - st.last); st.last = now;
      st.cur += (st.target - st.cur) * (1 - Math.exp(-dt / 95));
      if (Math.abs(st.target - st.cur) < 0.0006) st.cur = st.target;
      applyWeek(el, st.cur);
      st.raf = st.cur === st.target ? 0 : requestAnimationFrame(frame);
    };
    const read = () => {
      const s = sectionRef.current; if (!s) return;
      const r = s.getBoundingClientRect(), span = r.height - (window.innerHeight - offset);
      st.target = weekAt(span > 0 ? clamp((offset - r.top) / span) : 0);
      if (!st.primed) { st.primed = true; st.cur = st.target; if (sceneRef.current) applyWeek(sceneRef.current, st.cur); return; }
      if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(frame); }
    };
    read(); window.addEventListener('scroll', read, { passive: true }); window.addEventListener('resize', read);
    return () => { window.removeEventListener('scroll', read); window.removeEventListener('resize', read); if (st.raf) cancelAnimationFrame(st.raf); };
  }, [sectionRef, sceneRef, enabled, offset]);
}

function staticVars(k) {
  const o = { '--g': String(k * DELTA) };
  WEEKS.forEach((_, j) => { o[`--to${j}`] = j === k ? '1' : '0'; o[`--ty${j}`] = '0px'; o[`--co${j}`] = j === k ? '1' : '0'; });
  return o;
}

/** Desktop: the 1280 x 714 design, scaled to fit, pinned while the orbit turns. */
function Desktop({ reduced, offset }) {
  const sec = useRef(null), scene = useRef(null);
  const { w: vw, h: vh } = useViewport();
  const s = Math.min(vw / W, (vh - offset) / H, 1);
  useScroll(sec, scene, !reduced, offset);
  const stage = k => (
    <div className="lp-fitbox" style={{ width: W * s, height: H * s }}>
      <div className="lp-stage lp-wstage" ref={k === undefined ? scene : undefined} style={{ transform: `scale(${s})`, ...(k === undefined ? {} : staticVars(k)) }}>
        <img className="lp-redburst" src={burstRed} alt="" aria-hidden="true" />
        {WEEKS.map((wk, i) => (k === undefined || k === i) && <WeekTextAbs key={i} week={wk} k={i} />)}
        <OrbitArt />
      </div>
    </div>
  );
  if (reduced) return <section className="lp-weeks static" id="how-it-works" aria-label="Your first three weeks">{WEEKS.map((_, k) => <div key={k} className="lp-pin static">{stage(k)}</div>)}</section>;
  return <section className="lp-weeks" id="how-it-works" ref={sec} style={{ height: '380vh' }} aria-label="Your first three weeks"><div className="lp-pin" style={{ top: offset, height: `calc(100vh - ${offset}px)` }}>{stage()}</div></section>;
}

/** Phone and tablet: text on top, the orbit (cropped to its right-hand side) underneath, still pinned and still turning. */
function Mobile({ reduced, offset }) {
  const sec = useRef(null), scene = useRef(null);
  const { w: vw, h: vh } = useViewport();
  const avail = Math.max(280, vh - 330 - offset);
  const width = Math.min(vw, 560);
  const s = Math.min(width / 580, avail / H);
  const seen = width / s;                                  // how much of the design's width is shown
  useScroll(sec, scene, !reduced, offset);
  const body = k => (
    <div className="lp-mwrap" ref={k === undefined ? scene : undefined} style={k === undefined ? undefined : staticVars(k)}>
      <div className="lp-mtext">
        {WEEKS.map((wk, i) => (k === undefined || k === i) && (
          <div key={i} className="lp-mt" style={{ opacity: `var(--to${i}, 0)`, transform: `translateY(var(--ty${i}, 0px))` }}>
            <h2 className="lp-wk"><span>Week </span><b>{wk.n}</b></h2>
            <p className="lp-wsub">{wk.title}</p>
            {wk.items.map((it, j) => <div key={j} className="lp-mrow"><div className="lp-rowbox"><RowIcon item={it} /></div><div><h3>{it.title}</h3><p>{it.text}</p></div></div>)}
          </div>
        ))}
      </div>
      <div className="lp-mart" style={{ width, height: H * s }}>
        <div className="lp-stage" style={{ width: W, height: H, transform: `translateX(${-(W - seen) * s}px) scale(${s})` }}><OrbitArt /></div>
      </div>
    </div>
  );
  if (reduced) return <section className="lp-weeks static m" id="how-it-works" aria-label="Your first three weeks">{WEEKS.map((_, k) => <div key={k} className="lp-pin static">{body(k)}</div>)}</section>;
  return <section className="lp-weeks m" id="how-it-works" ref={sec} style={{ height: '360vh' }} aria-label="Your first three weeks"><div className="lp-pin" style={{ top: offset, height: `calc(100vh - ${offset}px)` }}>{body()}</div></section>;
}

export default function WeeksSection({ offset = 0 }) {
  const wide = useMedia('(min-width: 1024px)', true);
  const reduced = useMedia('(prefers-reduced-motion: reduce)', false);
  return wide ? <Desktop reduced={reduced} offset={offset} /> : <Mobile reduced={reduced} offset={offset} />;
}
