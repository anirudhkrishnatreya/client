import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatform } from '../data/store';
import { Card, CardHead, Check, Drawer, Icon, PageHead, Pill } from '../ui/kit';
import { fmtDate, hm, TYPE_LABEL } from '../ui/format';
import { iso } from '../data/mock';

const DAY = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mins = b => { const [h1, m1] = b.start.split(':').map(Number), [h2, m2] = b.end.split(':').map(Number); return h2 * 60 + m2 - (h1 * 60 + m1); };

export default function Plan() {
  const { data, actions } = usePlatform();
  const [open, setOpen] = useState(null);
  const todayIso = iso(new Date());
  const block = data.week.find(b => b.id === open);
  const res = block && block.resource ? data.library.find(l => l.id === block.resource) : null;
  const total = data.week.filter(b => b.type !== 'rest').reduce((n, b) => n + mins(b), 0);
  const done = data.week.filter(b => b.done).reduce((n, b) => n + mins(b), 0);
  const by = type => data.week.filter(b => b.type === type).reduce((n, b) => n + mins(b), 0);

  return (
    <>
      <PageHead eyebrow={`Week of ${fmtDate(data.aiPlan.week)}`} title="Your weekly plan" actions={<Link to="../coach" className="pf-btn gold"><Icon name="sparkles" size={16} />Adjust with AI</Link>}>Planned for you from your goal, your last quiz and the time you have. Tap any block to see what to study and why.</PageHead>
      <div className="pf-grid g-main" style={{ marginBottom: 18 }}>
        <Card>
          <div className="pf-row pf-between pf-wrap"><div><div className="pf-small pf-muted">Planned this week</div><b style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, color: 'var(--indigo)' }}>{hm(total)}</b></div>
            <div><div className="pf-small pf-muted">Done so far</div><b style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, color: 'var(--leaf)' }}>{hm(done)}</b></div>
            <div className="pf-row pf-wrap">{['learn', 'practice', 'project', 'revise', 'assess'].map(t => by(t) > 0 && <Pill key={t} tone={{ learn: 'sky', practice: 'leaf', assess: 'coral', project: 'gold', revise: '' }[t]}>{TYPE_LABEL[t]} {hm(by(t))}</Pill>)}</div></div>
        </Card>
        <Card ai><span className="tag"><Icon name="sparkles" size={14} />Why this plan</span><p style={{ margin: '6px 0 0', fontSize: 14 }}>{data.aiPlan.why[0].text}</p></Card>
      </div>
      <div className="pf-week" role="list" aria-label="Weekly plan">
        {DAY.map((d, i) => {
          const blocks = data.week.filter(b => b.day === i);
          const date = blocks[0] ? blocks[0].date : null;
          const isToday = date === todayIso;
          return (
            <div key={d} role="listitem" className={`pf-day${isToday ? ' today' : ''}`}>
              <h5><span>{d}</span><b>{date ? date.slice(8) : ''}</b></h5>
              {blocks.length === 0 && <div className="pf-small pf-faint">Free day</div>}
              {blocks.map(b => (
                <button type="button" key={b.id} className={`pf-block ${b.type}${b.done ? ' done' : ''}`} onClick={() => setOpen(b.id)}>
                  <b style={{ display: 'block', fontSize: 13 }}>{b.title}</b><small>{b.start}–{b.end} · {b.subject}</small>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <Drawer open={!!block} title={block ? block.title : ''} onClose={() => setOpen(null)}>
        {block && (
          <>
            <div className="pf-row pf-wrap" style={{ marginBottom: 14 }}><Pill tone="sky" icon="calendar">{fmtDate(block.date)}</Pill><Pill icon="clock">{block.start}–{block.end}</Pill><Pill tone="gold">{TYPE_LABEL[block.type]}</Pill></div>
            {block.why && <div className="pf-ai pf-card" style={{ marginBottom: 14 }}><span className="tag"><Icon name="sparkles" size={14} />Why this block</span><p style={{ margin: '6px 0 0' }}>{block.why}</p></div>}
            {res ? (
              <Card style={{ marginBottom: 14 }}><div className="pf-eyebrow">Study from</div><h4 style={{ fontSize: 18, margin: '4px 0' }}>{res.title}</h4><div className="pf-small pf-muted">{res.provider} · {res.kind}{res.free ? ' · free' : ''}</div><p className="pf-small" style={{ marginTop: 8 }}>{res.why}</p>
                {res.url && <a className="pf-btn sm" href={res.url} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} />Open {res.provider}</a>}</Card>
            ) : <div className="pf-note" style={{ marginBottom: 14 }}>No outside source for this block. It uses what you have already learned.</div>}
            {block.type === 'assess' ? <Link to="../assessments" className="pf-btn gold">Go to assessments</Link> : <button type="button" className="pf-btn" onClick={() => actions.toggleBlock(block.id)}><Icon name="check" size={16} />{block.done ? 'Mark as not done' : 'Mark as done'}</button>}
          </>
        )}
      </Drawer>
    </>
  );
}
