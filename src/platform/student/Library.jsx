import { useState } from 'react';
import { usePlatform } from '../data/store';
import { Card, Icon, PageHead, Pill, Progress } from '../ui/kit';

const KIND_ICON = { Course: 'cap', 'Video series': 'video', Practice: 'code', Book: 'book', Project: 'bolt' };

export default function Library() {
  const { data } = usePlatform();
  const topics = ['All', ...new Set(data.library.map(l => l.topic))];
  const [topic, setTopic] = useState('All');
  const shown = data.library.filter(l => topic === 'All' || l.topic === topic);
  return (
    <>
      <PageHead eyebrow="Learning library" title="Where to learn from">Free, well-known sources chosen for your goal and your level, with the reason each one is here.</PageHead>
      <div className="pf-chip-row" style={{ marginBottom: 18 }} role="group" aria-label="Filter by topic">{topics.map(t => <button key={t} type="button" className="pf-chip" aria-pressed={topic === t} style={topic === t ? { background: 'var(--indigo)', color: '#fff', borderColor: 'var(--indigo)' } : undefined} onClick={() => setTopic(t)}>{t}</button>)}</div>
      <div className="pf-grid g3">
        {shown.map(l => (
          <Card key={l.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="pf-row"><span className="pf-pill" style={{ width: 40, height: 40, borderRadius: 12, padding: 0, justifyContent: 'center' }}><Icon name={KIND_ICON[l.kind] || 'book'} size={20} /></span><div className="pf-grow"><Pill tone="sky">{l.kind}</Pill></div>{l.free && <Pill tone="leaf">Free</Pill>}</div>
            <h4 style={{ fontSize: 18, margin: '12px 0 2px', lineHeight: 1.25 }}>{l.title}</h4>
            <div className="pf-small pf-muted">{l.provider} · {l.level} · about {l.hours} h</div>
            <p className="pf-small" style={{ margin: '10px 0 12px', flex: 1 }}>{l.why}</p>
            <div className="pf-row pf-between pf-small" style={{ marginBottom: 5 }}><span className="pf-muted">Your progress</span><b className="pf-num">{l.progress}%</b></div><Progress value={l.progress} tone={l.progress === 100 ? 'leaf' : ''} label={`${l.title} progress`} />
            {l.url ? <a className="pf-btn sm ghost" style={{ marginTop: 14 }} href={l.url} target="_blank" rel="noopener noreferrer"><Icon name="link" size={14} />Open {l.provider}</a> : <span className="pf-small pf-faint" style={{ marginTop: 14 }}>Set up with your mentor</span>}
          </Card>
        ))}
      </div>
      <p className="pf-small pf-faint" style={{ marginTop: 18 }}>These are third-party sites. iMenteo does not run them, and their availability and terms can change. Check each site for current details.</p>
    </>
  );
}
