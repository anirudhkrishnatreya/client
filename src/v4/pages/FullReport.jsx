// The finished report, rendered from the server's report document (GET /v2/report/:id/full). Every word comes from the
// document; this component only lays it out. The PDF is made from the same document.
const BAND = { developing: 'Developing', moderate: 'Moderate', strong: 'Strong' };

const Bar = ({ label, stanine, band }) => (
  <div className="v4-bar" role="img" aria-label={`${label}: ${stanine} out of 9, ${BAND[band]}`}><div style={{ width: `${(stanine / 9) * 100}%` }} /></div>
);
const bandOf = s => (s <= 3 ? 'developing' : s <= 6 ? 'moderate' : 'strong');

function Plan({ plan }) {
  if (!plan || !plan.length) return null;
  return <div className="v4-plan"><h4 className="v4-muted">How to grow this</h4><ul style={{ marginLeft: 18 }}>{plan.map(b => <li key={b.title}><strong>{b.title}.</strong> {b.text}</li>)}</ul></div>;
}

function ScaleCard({ s }) {
  return (
    <article className="v4-card" aria-label={s.label} style={s.dominant ? { borderColor: 'var(--navy)' } : undefined}>
      <div className="v4-bar-row" style={{ gridTemplateColumns: '1fr 140px 52px' }}>
        <strong>{s.label}{s.dominant && <span className="v4-pill" style={{ marginLeft: 8 }}>Strongest</span>}</strong>
        <Bar label={s.label} stanine={s.stanine} band={s.band} />
        <span className="v4-muted">{BAND[s.band]}</span>
      </div>
      <p className="v4-muted" style={{ margin: '6px 0' }}>{s.meaning}</p>
      <p>{s.analysis}</p>
      <Plan plan={s.plan} />
    </article>
  );
}

function Orientation({ sec }) {
  if (!sec.available) return null;
  return (
    <section aria-label={sec.title}>
      <h2 className="v4-h2">{sec.title}</h2>
      <div className="v4-card">
        <div className="v4-bars">
          {sec.poles.map(p => (
            <div key={p.pole}>
              <div className="v4-bar-row"><span>{p.label}</span><Bar label={p.label} stanine={p.stanine} band={bandOf(p.stanine)} /><strong>{p.stanine}</strong></div>
              <p className="v4-muted" style={{ margin: '2px 0 8px' }}>{p.meaning}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="v4-card"><h3>{sec.dominant.label}: your strongest pull</h3><p>{sec.dominant.text}</p></div>
      <div className="v4-card"><h3>{sec.secondary.label}: your second pull</h3><p>{sec.secondary.text}</p></div>
    </section>
  );
}

function Scales({ sec }) {
  const h = sec.holland;
  return (
    <section aria-label={sec.title}>
      <h2 className="v4-h2">{sec.title}</h2>
      {h && h.available && h.code && (
        <div className="v4-card">
          <h3>Your interest code: <span style={{ letterSpacing: 3 }}>{h.code}</span></h3>
          {h.letters.map(l => <p key={l.letter}><strong>{l.label}.</strong> <span className="v4-muted">{l.text}</span></p>)}
        </div>
      )}
      {h && h.available && !h.code && <div className="v4-card"><p className="v4-muted">Your interests were spread fairly evenly, so there is no single leading pattern. That is normal.</p></div>}
      {sec.scales.map(s => <ScaleCard key={s.id} s={s} />)}
      {sec.notScored && sec.notScored.length > 0 && <p className="v4-muted">Not scored, because too many questions were left unanswered: {sec.notScored.map(n => n.label).join(', ')}.</p>}
    </section>
  );
}

function List({ title, items }) {
  return items && items.length ? <div><h4>{title}</h4><ul style={{ marginLeft: 18 }}>{items.map(x => <li key={x}>{x}</li>)}</ul></div> : null;
}

function FieldCard({ f }) {
  const p = f.page;
  return (
    <article className="v4-card" aria-label={f.label}>
      <div className="v4-row"><strong className="v4-grow">{f.rank}. {f.label}</strong>{f.overall != null && <span className="v4-pill">{f.overall}% match</span>}</div>
      {p && (
        <>
          <p style={{ margin: '8px 0' }}>{p.summary}</p>
          <div className="v4-cols"><List title="Ways to study" items={p.studyPaths} /><List title="Entrance exams" items={p.exams} /></div>
          <List title="Jobs people do" items={p.roles} />
          <p className="v4-muted" style={{ fontSize: 12, marginTop: 6 }}>Sources: {p.sources.join('; ')}. {p.lastReviewedAt ? `Checked ${p.lastReviewedAt}.` : 'Not yet checked by a reviewer: please confirm the details before you decide.'}</p>
        </>
      )}
      {f.gaps && f.gaps.length > 0 && (
        <div><h4>Skills to build for this field</h4>{f.gaps.map(g => <div key={g.scale} className="v4-plan"><strong>{g.label}</strong> <span className="v4-muted">(you: {g.student}, usual need: {g.need})</span><Plan plan={g.plan} /></div>)}</div>
      )}
    </article>
  );
}

function Matches({ sec }) {
  if (!sec.available) return null;
  if (sec.kind === 'explore') {
    return (
      <section aria-label={sec.title}>
        <h2 className="v4-h2">{sec.title}</h2>
        {sec.areas.length ? sec.areas.map(a => <div key={a.id} className="v4-card"><h3>{a.label}</h3><p className="v4-muted">{a.family}</p><p>{a.text}</p></div>) : <div className="v4-card"><p className="v4-muted">No area stood out strongly yet. That is normal at your age: try many things.</p></div>}
        {sec.strengths.length > 0 && <div className="v4-card"><h3>Your strongest thinking skills</h3><ul style={{ marginLeft: 18 }}>{sec.strengths.map(s => <li key={s.id}>{s.label}</li>)}</ul></div>}
        <p className="v4-muted">{sec.note}</p>
      </section>
    );
  }
  return (
    <section aria-label={sec.title}>
      <h2 className="v4-h2">{sec.title}</h2>
      <p className="v4-muted">Match shows how closely your whole profile fits what each field usually asks for. It is a guide for exploring, not a prediction.</p>
      {sec.streams && <><h3>Subject streams</h3>{sec.streams.map(f => <FieldCard key={f.id} f={f} />)}</>}
      <h3>Fields</h3>
      {sec.fields.filter(f => f.page).map(f => <FieldCard key={f.id} f={f} />)}
      {sec.fields.some(f => !f.page) && (
        <div className="v4-card"><h4>Other fields, in order</h4><ol style={{ marginLeft: 18 }}>{sec.fields.filter(f => !f.page).map(f => <li key={f.id}>{f.label} <span className="v4-muted">{f.overall != null ? `${f.overall}%` : ''}</span></li>)}</ol></div>
      )}
    </section>
  );
}

export default function FullReport({ report }) {
  const { notices, sections, status, student } = report;
  const section = id => sections.find(s => s.id === id);
  const intro = section('intro'), next = section('nextSteps');
  return (
    <>
      {notices.filter(n => n.text).map(n => <div key={n.kind} className={`v4-alert ${n.kind === 'invalid' ? 'error' : n.kind === 'guide' ? 'ok' : 'info'}`} role={n.kind === 'invalid' ? 'alert' : 'note'}>{n.text}</div>)}
      {status.contentStatus === 'draft' && <div className="v4-alert info" role="note"><strong>Draft wording.</strong> This is a pilot version of the report: the text is still being reviewed.</div>}
      <section className="v4-card" aria-label={intro.title}><h2 className="v4-h2">{intro.title}</h2>{intro.blocks.map(b => <p key={b.id}>{b.text}</p>)}</section>
      {section('orientation') && <Orientation sec={section('orientation')} />}
      {['interests', 'personality', 'aptitude', 'ei', 'values'].map(id => section(id) && <Scales key={id} sec={section(id)} />)}
      {section('matches') && <Matches sec={section('matches')} />}
      <section className="v4-card" aria-label={next.title}><h2 className="v4-h2">{next.title}</h2>{next.blocks.map(b => <p key={b.id}>{b.text}</p>)}</section>
      <p className="v4-muted" style={{ fontSize: 12 }}>Report for {student.name || 'student'} · version {report.hash.slice(0, 8)}</p>
    </>
  );
}
