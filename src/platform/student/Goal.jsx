import { usePlatform } from '../data/store';
import { Card, CardHead, Icon, PageHead, Pill, Progress, Radar, Ring } from '../ui/kit';

export default function Goal() {
  const { data } = usePlatform();
  return (
    <>
      <PageHead eyebrow="Your goal" title={`Becoming an ${data.goal.title}`}>{data.goal.pathway}. Target year {data.goal.targetYear}.</PageHead>
      <div className="pf-grid g-main-r" style={{ marginBottom: 18 }}>
        <Card className="pf-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="pf-eyebrow">Your why</div>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, lineHeight: 1.35, color: '#fff', margin: '8px 0 18px' }}>“{data.goal.why}”</p>
            <div className="pf-row" style={{ gap: 18 }}><Ring value={data.goal.progress} size={104} stroke={11} color="#F2A93B" ink="#fff" sub="done" /><div><b style={{ color: '#fff', fontSize: 18 }}>Phase 1 of 4: {data.roadmap[0].title}</b><div className="pf-small" style={{ color: '#C3CAEA' }}>{data.roadmap[0].note}</div></div></div>
          </div>
        </Card>
        <Card>
          <CardHead title="What you are building" icon="layers" />
          {data.pillars.map(p => <div key={p.id} style={{ marginBottom: 14 }}><div className="pf-row pf-between" style={{ marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{p.label}</span><b className="pf-num">{p.pct}%</b></div><Progress value={p.pct} tone={p.tone} label={p.label} /></div>)}
        </Card>
      </div>

      <div className="pf-grid g-main">
        <Card>
          <CardHead title="Your roadmap" icon="flag" />
          <div className="pf-timeline">
            {data.roadmap.map(ph => (
              <div key={ph.id} className={`step ${ph.status === 'current' ? 'current' : ph.status === 'done' ? 'done' : ''}`}>
                <div className="pf-row pf-wrap"><h4 style={{ fontSize: 19 }}>{ph.title}</h4><Pill tone={ph.status === 'current' ? 'gold' : 'grey'}>{ph.period}</Pill>{ph.status === 'current' && <Pill tone="leaf">You are here</Pill>}</div>
                <p className="pf-muted" style={{ margin: '4px 0 8px' }}>{ph.note}</p>
                <ul className="pf-list" style={{ background: '#FAFBFE', borderRadius: 14, padding: '2px 14px' }}>{ph.items.map(i => <li key={i.t} style={{ padding: '8px 0' }}><span className={`pf-check${i.done ? ' on' : ''}`} style={{ width: 20, height: 20 }}>{i.done && <Icon name="check" size={12} stroke={3} />}</span><span style={{ color: i.done ? 'var(--faint)' : 'var(--ink)' }}>{i.t}</span></li>)}</ul>
              </div>
            ))}
          </div>
        </Card>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="Skills: now and target" icon="target" /><Radar data={data.skills} size={300} /></Card>
          <Card ai><span className="tag"><Icon name="sparkles" size={14} />What the AI suggests next</span>
            <ul className="pf-list" style={{ marginTop: 8 }}>
              <li style={{ borderColor: '#F3E3B8' }}><Icon name="check" size={18} /><span>Finish the Python course before starting machine learning.</span></li>
              <li style={{ borderColor: '#F3E3B8' }}><Icon name="check" size={18} /><span>Build the number-guessing game: it uses loops, functions and input together.</span></li>
              <li style={{ borderColor: '#F3E3B8' }}><Icon name="check" size={18} /><span>Ask your mentor about the Class 12 plan for JEE Main and CUET.</span></li>
            </ul></Card>
        </div>
      </div>
    </>
  );
}
