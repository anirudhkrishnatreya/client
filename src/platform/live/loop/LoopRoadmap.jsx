import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { loopApi, useLoop, messageFor, TYPE_LABEL, TYPE_TONE, fmtMinutes } from './loopApi';

/** The whole roadmap for the student's career, with what they have done ticked and their goal's stages highlighted. */
export default function LoopRoadmapPage() {
  const { loop, loading, closed, error } = useLoop();
  const [roadmap, setRoadmap] = useState(null);
  const [rerr, setRerr] = useState(null);
  const slug = loop && loop.goal ? loop.goal.careerSlug : null;
  useEffect(() => { if (slug) loopApi.roadmap(slug).then(({ data }) => setRoadmap(data.roadmap)).catch(setRerr); }, [slug]);
  const head = <PageHead eyebrow="Roadmap" title={roadmap ? roadmap.title : 'Your roadmap'} actions={<Link className="pf-btn sm ghost" to="..">This week</Link>}>{roadmap ? roadmap.summary : 'Every step from where you are to where you want to be.'}</PageHead>;
  if (loading) return <>{head}<p role="status">Loading…</p></>;
  if (closed) return <>{head}<Card><Empty icon="sparkles" title="Coming soon">Career roadmaps are not open yet.</Empty></Card></>;
  if (error || rerr) return <>{head}<p role="alert">{messageFor(error || rerr)}</p></>;
  if (!loop.goal) return <>{head}<Card><Empty icon="target" title="Set your goal first" /><p style={{ textAlign: 'center' }}><Link className="pf-btn sm" to="../../goal">Set my goal</Link></p></Card></>;
  if (!roadmap) return <>{head}<p role="status">Loading the roadmap…</p></>;
  const status = loop.progress.unitStatus || {};
  const ids = loop.stages.map(s => s.id);
  const inGoal = id => ids.indexOf(id) >= ids.indexOf(loop.goal.startStage) && ids.indexOf(id) <= ids.indexOf(loop.goal.targetStage);
  return (
    <>
      {head}
      {roadmap.reviewStatus === 'draft' && <div className="pf-note" role="note" style={{ marginBottom: 14 }}><Icon name="info" size={15} /> {roadmap.reviewNote}</div>}
      {roadmap.stages.map(st => (
        <Card key={st.id} style={{ marginBottom: 14, opacity: inGoal(st.id) ? 1 : 0.6 }}>
          <div className="pf-row pf-wrap" style={{ gap: 8 }}><h3 className="pf-grow" style={{ margin: 0 }}>{st.title}</h3><span className="pf-small pf-muted">{st.forWho}</span>{inGoal(st.id) && <Pill tone="gold">Your goal</Pill>}</div>
          <p className="pf-small pf-muted">{st.summary}</p>
          {st.milestones.map(m => (
            <details key={m.id} className="pf-milestone" open={inGoal(st.id) && m.skills.some(sk => sk.units.some(u => !status[u.id]))}>
              <summary><b>{m.title}</b> <span className="pf-small pf-muted">· {m.outcome}</span></summary>
              {m.skills.map(sk => (
                <div key={sk.id} style={{ margin: '10px 0 0 6px' }}>
                  <div className="pf-small"><b>{sk.title}</b> <span className="pf-muted">· {sk.why}</span></div>
                  <ul className="pf-list" style={{ marginTop: 4 }}>{sk.units.map(u => (
                    <li key={u.id}>
                      <span className={`pf-dot ${status[u.id] || 'todo'}`} aria-hidden="true">{status[u.id] === 'done' ? <Icon name="check" size={12} stroke={3} /> : null}</span>
                      <span className="pf-grow">{u.title}</span>
                      <Pill tone={TYPE_TONE[u.type]}>{TYPE_LABEL[u.type]}</Pill>
                      <span className="pf-small pf-muted">{fmtMinutes(u.minutes)}</span>
                      <span className="pf-sr">{status[u.id] ? (status[u.id] === 'done' ? 'done' : 'skipped') : 'not done yet'}</span>
                    </li>
                  ))}</ul>
                </div>
              ))}
            </details>
          ))}
        </Card>
      ))}
    </>
  );
}
