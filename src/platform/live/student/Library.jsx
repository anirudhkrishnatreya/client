import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, Icon, PageHead, Pill, Tabs } from '../../ui/kit';
import { loopApi, messageFor, codeOf, fmtShort, weekdayOf, TYPE_LABEL } from '../loop/loopApi';
import { Revision } from '../loop/Notes';
import { PageSkeleton } from '../loop/Loader';
import Locked from '../../../pay/Locked';

const STATUS = { done: ['leaf', 'Done'], skipped: ['grey', 'Skipped'], todo: ['sky', 'To do'] };

/** Every lesson video from the student's weeks, newest week first, each with its step, day and whether they have notes. */
function Videos({ videos }) {
  const weeks = [...new Set(videos.map(v => v.weekNumber))];
  if (!videos.length) return <Card><Empty icon="video" title="No lesson videos yet">The videos chosen for your weekly plan collect here, so you can come back to any of them.</Empty></Card>;
  return weeks.map(n => (
    <section key={n} style={{ marginBottom: 22 }} aria-label={`Week ${n}`}>
      <h3 style={{ fontSize: 18, margin: '0 0 10px' }}>Week {n}{videos.find(v => v.weekNumber === n).current ? <Pill tone="sky">This week</Pill> : null}</h3>
      <div className="pf-libgrid">{videos.filter(v => v.weekNumber === n).map(v => (
        <article key={`${v.unitId}-${v.video.videoId}`} className="pf-libvid">
          <a href={v.video.watchUrl} target="_blank" rel="noopener noreferrer" className="pf-libvid-thumb" aria-label={`Watch on YouTube: ${v.video.title}`}><img src={v.video.thumb} alt="" loading="lazy" /><span className="pf-play" aria-hidden="true"><Icon name="play" size={20} /></span>{v.video.minutes ? <span className="pf-libvid-len">{v.video.minutes} min</span> : null}</a>
          <div className="pf-libvid-body">
            <b>{v.video.title}</b>
            <span className="pf-small pf-muted">{v.video.channel}</span>
            <span className="pf-small">{weekdayOf(v.date)}, {fmtShort(v.date)} · {TYPE_LABEL[v.type] || 'Learn'}: {v.step}</span>
            <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 4 }}>
              <Pill tone={STATUS[v.status][0]}>{STATUS[v.status][1]}</Pill>
              {v.hasNotes && <Pill tone="sky" icon="edit">Your notes</Pill>}
              {v.hasRevision && <Pill tone="leaf" icon="book">Revision notes</Pill>}
              {v.rating ? <Pill tone="gold">{'★'.repeat(v.rating)}</Pill> : null}
            </div>
            {v.current && <Link className="pf-small" to={`../plan/day/${v.date}`}>Open the day <Icon name="chevronRight" size={12} /></Link>}
          </div>
        </article>))}
      </div>
    </section>
  ));
}

/** All the notes the student has written and the revision notes made for them, searchable, newest first. */
function Notes({ notes }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const words = q.trim().toLowerCase();
  const shown = notes.filter(n => !words || [n.title, n.text, n.video && n.video.title, n.revision && n.revision.recap, ...(n.revision ? n.revision.points : [])].filter(Boolean).join(' ').toLowerCase().includes(words));
  if (!notes.length) return <Card><Empty icon="edit" title="No notes yet">On any day of your plan, use “Take notes” under a lesson. Everything you write, and any revision notes you make, collects here.</Empty></Card>;
  return (
    <>
      <div style={{ marginBottom: 12 }}><input className="pf-input" type="search" style={{ maxWidth: 360 }} placeholder="Search your notes" aria-label="Search your notes" value={q} onChange={e => setQ(e.target.value)} /></div>
      {shown.length === 0 && <p className="pf-muted">No notes match “{q}”.</p>}
      <div className="pf-grid">{shown.map(n => {
        const isOpen = open === n.unitId;
        return (
          <Card key={n.unitId} className="pf-notecard">
            <button type="button" className="pf-notecard-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : n.unitId)}>
              <span className="pf-grow" style={{ textAlign: 'left' }}><b>{n.title}</b><br /><span className="pf-small pf-muted">{n.goal ? `${n.goal} · ` : ''}week {n.weekNumber} · {weekdayOf(n.date)}, {fmtShort(n.date)}{n.video ? ` · ${n.video.title}` : ''}</span></span>
              {n.text && <Pill tone="sky">Notes</Pill>}{n.revision && <Pill tone="leaf">Revision</Pill>}<Icon name="chevronDown" size={16} />
            </button>
            {!isOpen && n.text && <p className="pf-small" style={{ margin: '8px 0 0', color: 'var(--ink2)' }}>{n.text.slice(0, 160)}{n.text.length > 160 ? '…' : ''}</p>}
            {isOpen && <div className="pf-notes-grid" style={{ marginTop: 12 }}>
              <div><div className="pf-eyebrow">My notes</div>{n.text ? <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{n.text}</p> : <p className="pf-small pf-muted">You did not write notes for this one.</p>}
                {n.video && <a className="pf-btn sm ghost" style={{ marginTop: 10 }} href={n.video.watchUrl} target="_blank" rel="noopener noreferrer"><Icon name="play" size={14} />Watch again</a>}</div>
              <div><div className="pf-eyebrow">Revision notes</div>{n.revision ? <Revision r={n.revision} /> : <p className="pf-small pf-muted">None made. Open the day in your plan to make them.</p>}</div>
            </div>}
          </Card>);
      })}</div>
    </>
  );
}

/** Checked practice sites: the ones from the student's steps, and more for the topics of their current level. */
function Places({ places, more }) {
  const Row = ({ p }) => (
    <li>
      <a href={p.url} target="_blank" rel="noopener noreferrer"><b>{p.provider}</b>: {p.title}</a>{p.login && <span className="pf-small pf-muted"> · free account</span>}
      {p.what && <div className="pf-small">{p.what}</div>}
      <div className="pf-small pf-muted">For: {p.topics.join(', ')}</div>
    </li>
  );
  return (
    <div className="pf-grid g2">
      <Card><h3 style={{ fontSize: 18, margin: '0 0 8px' }}>From your plan</h3>{places.length ? <ul className="pf-places-list">{places.map(p => <Row key={p.id} p={p} />)}</ul> : <p className="pf-small pf-muted">The practice sites chosen for your steps will appear here.</p>}</Card>
      <Card><h3 style={{ fontSize: 18, margin: '0 0 8px' }}>More for your level</h3>{more.length ? <ul className="pf-places-list">{more.map(p => <Row key={p.id} p={p} />)}</ul> : <p className="pf-small pf-muted">Nothing extra matched your level’s topics yet.</p>}</Card>
    </div>
  );
}

/** The Learning library: what the student has learned from (videos), what they wrote (notes) and where to practise. */
export default function LiveLibrary() {
  const [s, setS] = useState({ lib: null, loading: true, err: null, locked: null });
  const [tab, setTab] = useState('videos');
  useEffect(() => {
    loopApi.library().then(({ data }) => setS({ lib: data.library, loading: false, err: null, locked: null }))
      .catch(e => setS({ lib: null, loading: false, err: e, locked: ['PAYMENT_REQUIRED', 'PLAN_ENDED'].includes(codeOf(e)) ? { product: e.response.data.product, state: e.response.data.state, endsAt: e.response.data.endsAt } : null }));
  }, []);
  const counts = useMemo(() => (s.lib ? { videos: s.lib.videos.length, notes: s.lib.notes.length, places: s.lib.places.length + s.lib.more.length } : {}), [s.lib]);
  if (s.loading) return <PageSkeleton label="Loading your library" cards={2} />;
  if (s.locked) return <Locked {...s.locked} />;
  const head = <PageHead eyebrow="Learning library" title="Everything you have learned from">Your lesson videos week by week, your notes and revision notes, and checked places to practise. Come back to any of it, any time.</PageHead>;
  if (s.err) return <>{head}<p role="alert">{messageFor(s.err)}</p></>;
  const L = s.lib;
  return (
    <>
      {head}
      {!L.goal && <Card ai style={{ marginBottom: 16 }}><span className="tag"><Icon name="target" size={14} />No goal yet</span><p style={{ margin: '8px 0 0' }}>Set a goal in <Link to="../goal">My goal</Link>. Your weekly plan’s videos and practice sites will then collect here.</p></Card>}
      {L.goal && <p className="pf-small pf-muted" style={{ marginTop: -6 }}>Goal: <b>{L.goal.title}</b> · now on {L.goal.level}</p>}
      <Tabs label="Library sections" value={tab} onChange={setTab} tabs={[{ id: 'videos', label: 'Lesson videos', icon: 'video', count: counts.videos || undefined }, { id: 'notes', label: 'My notes', icon: 'edit', count: counts.notes || undefined }, { id: 'places', label: 'Practice places', icon: 'code', count: counts.places || undefined }]} />
      {tab === 'videos' && <Videos videos={L.videos} />}
      {tab === 'notes' && <Notes notes={L.notes} />}
      {tab === 'places' && <Places places={L.places} more={L.more} />}
      <p className="pf-small pf-faint" style={{ marginTop: 18 }}>Videos and practice sites belong to their creators. iMenteo does not run them, and their availability can change.</p>
    </>
  );
}
