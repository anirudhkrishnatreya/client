// The finished report, laid out from the server's report document (GET /v2/report/:id/full). Every word comes from the
// document; this component only lays it out, in the same look as the printed PDF.
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/400-italic.css';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/600.css';
import '@fontsource/newsreader/400-italic.css';
import '../report.css';
import { ScaleTrack, Hexagon, Compass, CoverArt, Squiggle, BarChart, PartsBars, BandPill, IconTile } from '../charts';

const DIM_COLOR = { interests: '#F2A93B', personality: '#2C3566', aptitude: '#4C8C6B', ei: '#6F8FC0', values: '#D9654A' };
const Tiles = ({ items }) => (items.length ? <div className="rp-tiles">{items.map(s => <div className="rp-tile" key={s.id}><IconTile id={s.id} /><span>{s.label}</span></div>)}</div> : null);

const BAND = { developing: 'Still growing', moderate: 'Steady', strong: 'Strong' };
const TRACK = { junior: 'Class 6–9', senior: 'Class 10–12', college: 'College' };
const NOTE_LABEL = { provisional: 'Early results', invalid: 'Worth knowing', caution: 'A small note', interim: 'Who has read this', guide: 'One more thing' };
const COLORS = ['#F2A93B', '#4C8C6B', '#6F8FC0', '#D9654A'];

const Badge = ({ band }) => <span className={`rp-badge ${band}`}>{BAND[band]}</span>;

function Plan({ plan, heading = 'Try this' }) {
  if (!plan || !plan.length) return null;
  return <div className="rp-plan"><h4>{heading}</h4><ol>{plan.map(b => <li key={b.title}><b>{b.title}.</b> {b.text}</li>)}</ol></div>;
}

function ScaleRow({ s }) {
  return (
    <article className="rp-scale" aria-label={s.label}>
      <div className="rp-scale-top">
        <span className="name">{s.label}{s.dominant && <span className="rp-star">one of your strongest</span>}</span>
        <ScaleTrack stanine={s.stanine} label={s.label} /><Badge band={s.band} />
      </div>
      <p className="rp-meaning">{s.meaning}</p>
      <p>{s.analysis}</p>
      <Plan plan={s.plan} />
    </article>
  );
}

function Chapter({ id, no, title, lede, color, children }) {
  return (
    <section className="rp-chapter" id={`chapter-${id}`} aria-label={title}>
      <div className="rp-head"><span className="no">{typeof no === 'number' ? `Chapter ${no}` : no}</span><h2>{title}</h2><Squiggle color={color} /></div>
      {lede && <p className="rp-lede">{lede}</p>}
      {children}
    </section>
  );
}

function Orientation({ sec }) {
  if (!sec.available) return <p className="rp-muted">Your answers were spread evenly, so no one kind of work stood out. That happens, and it is a perfectly good result.</p>;
  return (
    <>
      <Tiles items={[{ id: `orient.${sec.dominant.pole}`, label: sec.dominant.label }, { id: `orient.${sec.secondary.pole}`, label: sec.secondary.label }]} />
      <div className="rp-grid">
        <div className="rp-panel"><Compass x={sec.coordinates.x} y={sec.coordinates.y} /></div>
        <div className="rp-panel rp-poles">
          {sec.poles.map(p => (
            <div key={p.pole}>
              <div className="rp-pole"><b>{p.label}</b><ScaleTrack stanine={p.stanine} label={p.label} width={200} /></div>
              <p className="rp-muted" style={{ fontSize: 15, margin: '0 0 8px' }}>{p.meaning}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rp-panel tint" style={{ marginBottom: 14 }}><div className="rp-eyebrow">Pulls at you most</div><h3>{sec.dominant.label}</h3><p>{sec.dominant.text}</p></div>
      <div className="rp-panel"><div className="rp-eyebrow" style={{ color: 'var(--sky)' }}>And then</div><h3>{sec.secondary.label}</h3><p>{sec.secondary.text}</p></div>
    </>
  );
}

const ChartPanel = ({ sec }) => (sec.chart && sec.chart.length ? <div className="rp-panel rp-chartpanel"><BarChart rows={sec.chart} color={DIM_COLOR[sec.id]} /></div> : null);

function Interests({ sec }) {
  const h = sec.holland;
  const strong = sec.scales.filter(s => s.dominant), rest = sec.scales.filter(s => !s.dominant);
  return (
    <>
      {h && h.available && (
        <div className="rp-panel" style={{ marginBottom: 12 }}>
          <div className="rp-holland">
            <Hexagon types={h.types} />
            {h.code
              ? <div><div className="rp-eyebrow">Your interest code</div><div className="rp-code">{h.code}</div>
                  <div className="rp-letters">{h.letters.map(l => <div key={l.letter}><b>{l.letter}</b><span><strong style={{ fontFamily: 'Fraunces, Georgia, serif', color: 'var(--indigo)' }}>{l.label}.</strong> {l.text}</span></div>)}</div></div>
              : <div><h3>Your interests are spread out</h3><p className="rp-muted">No single pattern leads, and that is fine. It means a lot of paths could suit you.</p></div>}
          </div>
        </div>
      )}
      {strong.length > 0 && <><h3 className="rp-sub">Your standouts</h3><Tiles items={strong.slice(0, 5)} /></>}
      <ChartPanel sec={sec} />
      {strong.map(s => <ScaleRow key={s.id} s={s} />)}
      {rest.length > 0 && (
        <>
          <h3 style={{ fontSize: 24, fontWeight: 400, margin: '26px 0 10px' }}>The rest of the list</h3>
          <div className="rp-mini">{rest.map(s => <div className="it" key={s.id}><div className="top"><span className="name">{s.label}</span><ScaleTrack stanine={s.stanine} label={s.label} width={130} /></div><p>{s.analysis}</p></div>)}</div>
        </>
      )}
    </>
  );
}

function FieldCard({ f }) {
  const p = f.page;
  return (
    <article className="rp-field" aria-label={f.label}>
      <div className="hd"><span className="no">{f.rank}</span><h3>{f.label}</h3><BandPill band={f.band} label={f.bandLabel} /></div>
      {p && <p>{p.summary}</p>}
      {((f.parts && f.parts.length) || (f.strengths && f.strengths.length)) && (
        <div className="rp-fit2">
          <div>{f.parts && f.parts.length > 0 && <><h4>How it adds up</h4><PartsBars parts={f.parts} /></>}</div>
          <div>{f.strengths && f.strengths.length > 0 && <><h4>Why it fits you</h4><div className="rp-chips">{f.strengths.map(x => <span key={x.scale} className="rp-chip">{x.label}</span>)}</div></>}</div>
        </div>
      )}
      {p && (
        <>
          <div className="rp-cols">
            <List title="How to get there" items={p.studyPaths} /><List title="Exams on the way" items={p.exams} /><List title="What people do" items={p.roles} />
          </div>
          {((p.employers && p.employers.length) || (p.trending && p.trending.length)) > 0 && <div className="rp-cols"><List title="Where people work" items={p.employers} /><List title="Worth exploring" items={p.trending} /></div>}
          <p className="rp-sources">Sources: {p.sources.join('; ')}. {p.lastReviewedAt ? `Checked internally ${p.lastReviewedAt}.` : 'Not yet checked by a reviewer: please confirm the details before you decide.'}</p>
        </>
      )}
      {f.gaps && f.gaps.length > 0 && (
        <div className="rp-gaps"><h4>Worth building for this one</h4>{f.gaps.map(g => <div key={g.scale} className="rp-gap"><b>{g.label}</b> <span className="rp-muted">(you: {g.student} of 9, usually needed: {g.need})</span><Plan plan={g.plan} /></div>)}</div>
      )}
    </article>
  );
}
const List = ({ title, items }) => (items && items.length ? <div><h4>{title}</h4><ul>{items.map(x => <li key={x}>{x}</li>)}</ul></div> : null);

function Matches({ sec }) {
  if (!sec.available) return null;
  if (sec.kind === 'explore') {
    return (
      <>
        {sec.areas.length
          ? sec.areas.map((a, i) => <article key={a.id} className="rp-field"><div className="hd"><span className="no">{i + 1}</span><h3>{a.label}</h3></div><p className="rp-muted">{a.family}</p><p>{a.text}</p></article>)
          : <div className="rp-panel"><p className="rp-muted">Nothing has stood out strongly yet, and that is normal at your age. Try lots of things.</p></div>}
        {sec.strengths.length > 0 && <div className="rp-panel"><h3>What your mind does best</h3><div className="rp-chips">{sec.strengths.map(s => <span key={s.id} className="rp-chip cool">{s.label}</span>)}</div></div>}
        <p className="rp-muted" style={{ marginTop: 12 }}>{sec.note}</p>
      </>
    );
  }
  return (
    <>
      <p className="rp-lede">{sec.note}</p>
      {sec.fields.length > 0 && (
        <>
          <div className="rp-panel" style={{ marginBottom: 18 }}>
            {sec.fields.map(f => <div className="rp-fitrow" key={f.id}><span className="no">{f.rank}</span><span className="t">{f.label}</span><BandPill band={f.band} label={f.bandLabel} /></div>)}
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 10px' }}>Up close</h3>
          {sec.fields.filter(f => f.page).map(f => <FieldCard key={f.id} f={f} />)}
        </>
      )}
      {sec.streams && sec.streams.length > 0 && <><h3 style={{ fontSize: 24, fontWeight: 400, margin: '24px 0 10px' }}>Which stream suits you</h3>{sec.streams.map(f => <FieldCard key={f.id} f={f} />)}</>}
    </>
  );
}

function Glance({ sections }) {
  const sec = id => sections.find(s => s.id === id);
  const inter = sec('interests'), orient = sec('orientation'), match = sec('matches');
  if (!inter) return null;
  const strongest = (id, n = 5) => (sec(id) ? sec(id).scales.filter(s => s.dominant).slice(0, n) : []);
  const Row = ({ title, items }) => <div><h3>{title}</h3>{items.length ? <Tiles items={items} /> : <p className="rp-muted">Nothing stood out strongly this time.</p>}</div>;
  const h = inter.holland;
  const top = match && match.available && match.kind === 'fields' ? match.fields.slice(0, 3).map(f => ({ n: f.rank, t: f.label, band: f.band, bandLabel: f.bandLabel }))
    : match && match.available && match.kind === 'explore' ? match.areas.slice(0, 3).map((a, i) => ({ n: i + 1, t: a.label })) : [];
  return (
    <Chapter id="glance" no="The short version" title="You, on one page" color="#D9654A">
      <div className="rp-grid">
        {h && h.available && <div className="rp-panel"><div className="rp-eyebrow">Your interest code</div>{h.code && <div className="rp-code">{h.code}</div>}<Hexagon types={h.types} /></div>}
        {orient && orient.available && <div className="rp-panel"><div className="rp-eyebrow">Where your energy points</div><h3>{orient.dominant.label} first, then {orient.secondary.label}</h3><Compass x={orient.coordinates.x} y={orient.coordinates.y} /></div>}
      </div>
      <div className="rp-panel tint rp-glgrid">
        <Row title="What you are drawn to" items={strongest('interests')} />
        <Row title="Where your energy points" items={orient && orient.available ? [{ id: `orient.${orient.dominant.pole}`, label: orient.dominant.label }, { id: `orient.${orient.secondary.pole}`, label: orient.secondary.label }] : []} />
        <Row title="Your strengths as a person" items={strongest('personality', 4)} />
        <Row title="What your mind does well" items={strongest('aptitude', 4)} />
        <Row title="Your feelings toolkit" items={strongest('ei', 4)} />
        {top.length > 0 && <div><h3>{match.kind === 'fields' ? 'Where this points first' : 'Good places to start exploring'}</h3>{top.map(r => <div className="rp-rowline" key={r.n}><span className="n">{r.n}</span><span className="t">{r.t}</span><BandPill band={r.band} label={r.bandLabel} /></div>)}</div>}
      </div>
    </Chapter>
  );
}

function DevPlan({ sec }) {
  return sec.items.map(it => (
    <div className="rp-panel rp-devplan" key={it.scale} style={{ marginBottom: 14 }}>
      <div className="rp-scale-top"><span className="name">{it.label}</span><ScaleTrack stanine={it.student} label={it.label} /></div>
      <p className="rp-muted">You: {it.student} of 9. The fields at the top of your list usually ask for {it.need} or more. It matters for {it.fields.join(', ')}.</p>
      <Plan plan={it.plan} />
    </div>
  ));
}

function Talk({ sec }) {
  return (
    <>
      <div className="rp-closing">{sec.blocks.map(b => <p key={b.id}>{b.text}</p>)}</div>
      {sec.contacts && sec.contacts.length > 0 && <div className="rp-panel tint rp-contact"><h3>{sec.school || 'Your school'}</h3>{sec.contacts.map(c => <p key={c.email || c.name} style={{ margin: '0 0 4px' }}><b>{c.name}</b>{c.email ? `, ${c.email}` : ''}</p>)}</div>}
    </>
  );
}

export default function FullReport({ report }) {
  const { notices, sections, status, student } = report;
  const section = id => sections.find(s => s.id === id);
  const intro = section('intro'), next = section('nextSteps');
  const first = String(student.name || '').trim().split(/\s+/)[0];
  const stamp = status.contentStatus === 'draft' ? 'Draft wording · pilot version' : status.contentStatus === 'interim' ? 'Interim edition · expert review in progress' : '';
  let n = 0;
  const numbered = id => { const sec = section(id); if (!sec) return null; n += 1; return { sec, no: n, color: COLORS[n % COLORS.length] }; };
  const orient = numbered('orientation'), inter = numbered('interests'), pers = numbered('personality'), apt = numbered('aptitude'), ei = numbered('ei'), val = numbered('values'), mat = numbered('matches'), plan = numbered('developmentPlan');
  const last = (n += 1), talkNo = (n += 1);
  const talk = section('talkItThrough');
  const nav = [['letter', 'Before you start'], ['glance', 'On one page'], ...[orient, inter, pers, apt, ei, val, mat, plan].filter(Boolean).map(c => [c.sec.id, c.sec.title]), ['nextSteps', next.title], ...(talk ? [['talkItThrough', talk.title]] : [])];
  const scaleChapter = c => c && (
    <Chapter key={c.sec.id} id={c.sec.id} no={c.no} title={c.sec.title} lede={c.sec.about} color={c.color}>
      <Tiles items={c.sec.scales.filter(s => s.dominant).slice(0, 5)} />
      <ChartPanel sec={c.sec} />
      <h3 className="rp-sub">In detail</h3>
      {c.sec.scales.map(s => <ScaleRow key={s.id} s={s} />)}
      {c.sec.notScored && c.sec.notScored.length > 0 && <p className="rp-muted">We could not score {c.sec.notScored.map(x => x.label).join(', ')}, because too many questions were left blank.</p>}
    </Chapter>
  );
  return (
    <div className="rp">
      <header className="rp-hero">
        <CoverArt />
        <div className="rp-hero-in">
          <div className="rp-eyebrow" style={{ marginBottom: 14 }}>Career Discovery Report</div>
          <h1>Who you are, and <em>where it could go</em></h1>
          <div className="who">{student.name || 'Student'}</div>
          <div className="meta">{TRACK[student.track]}{student.grade ? `, grade ${student.grade}` : ''}{student.school ? `, ${student.school}` : ''}</div>
          {stamp && <div className="rp-stamp">{stamp}</div>}
        </div>
      </header>
      <nav className="rp-nav" aria-label="Report chapters"><ul>{nav.map(([id, label]) => <li key={id}><a href={`#chapter-${id}`} onClick={e => { e.preventDefault(); const el = document.getElementById(`chapter-${id}`); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>{label}</a></li>)}</ul></nav>
      <div className="rp-body">
        <section className="rp-chapter" id="chapter-letter" aria-label="Before you start">
          <div className="rp-head"><span className="no">Before you start</span><h2>{first ? `Hi ${first}, a quick word` : 'A quick word'}</h2><Squiggle /></div>
          <div className="rp-letter">{intro.blocks.map(b => <p key={b.id}>{b.text}</p>)}<div className="rp-sign">The iMenteo team</div></div>
          <div className="rp-notes">{notices.filter(x => x.text).map(x => <div key={x.kind} className={`rp-note ${x.kind}`} role={x.kind === 'invalid' ? 'alert' : 'note'}><b>{NOTE_LABEL[x.kind] || 'Note'}</b>{x.text}</div>)}</div>
        </section>
        <Glance sections={sections} />
        {orient && <Chapter id="orientation" no={orient.no} title={orient.sec.title} lede={orient.sec.about || 'This map shows the kind of work that tends to pull you in.'} color={orient.color}><Orientation sec={orient.sec} /></Chapter>}
        {inter && <Chapter id="interests" no={inter.no} title={inter.sec.title} lede={inter.sec.about} color={inter.color}><Interests sec={inter.sec} /></Chapter>}
        {scaleChapter(pers)}{scaleChapter(apt)}{scaleChapter(ei)}{scaleChapter(val)}
        {mat && <Chapter id="matches" no={mat.no} title={mat.sec.title} color={mat.color}><Matches sec={mat.sec} /></Chapter>}
        {plan && <Chapter id="developmentPlan" no={plan.no} title={plan.sec.title} lede={plan.sec.about} color={plan.color}><DevPlan sec={plan.sec} /></Chapter>}
        <Chapter id="nextSteps" no={last} title={next.title} color="#4C8C6B"><div className="rp-closing">{next.blocks.map(b => <p key={b.id}>{b.text}</p>)}</div></Chapter>
        {talk && <Chapter id="talkItThrough" no={talkNo} title={talk.title} color="#6F8FC0"><Talk sec={talk} /></Chapter>}
        <p className="rp-foot">Made for {student.name || 'you'} · version {report.hash.slice(0, 8)}</p>
      </div>
    </div>
  );
}
