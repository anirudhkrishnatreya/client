import { useState } from 'react';
import { usePlatform } from '../data/store';
import { QUIZ, markQuiz } from '../data/quiz';
import { Card, CardHead, Drawer, Icon, PageHead, Pill, Progress, Spark, Tabs } from '../ui/kit';
import { dueLabel, fmtDate } from '../ui/format';

function Quiz({ item, onDone, onCancel }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const q = QUIZ.questions[i];
  const last = i === QUIZ.questions.length - 1;
  if (result) {
    return (
      <Card>
        <div className="pf-eyebrow">Your result</div>
        <div className="pf-row" style={{ gap: 24, margin: '8px 0 14px' }}><b style={{ fontFamily: "'Syne', sans-serif", fontSize: 56, color: result.score >= 70 ? 'var(--leaf)' : 'var(--coral)', lineHeight: 1 }}>{result.score}%</b><div><b>{result.right} of {result.total} right</b><div className="pf-muted">{result.feedback.summary}</div></div></div>
        <div className="pf-grid g2">
          <div><h4 style={{ fontSize: 16 }}>What went well</h4><ul className="pf-list">{result.feedback.strengths.map(s => <li key={s}><Icon name="check" size={16} className="pf-faint" />{s}</li>)}</ul></div>
          <div><h4 style={{ fontSize: 16 }}>Worth another look</h4><ul className="pf-list">{result.feedback.gaps.map(s => <li key={s}><Icon name="flag" size={16} className="pf-faint" />{s}</li>)}</ul></div>
        </div>
        <div className="pf-divider" />
        <div className="pf-ai pf-card"><span className="tag"><Icon name="sparkles" size={14} />Your next steps</span><ul className="pf-list" style={{ marginTop: 6 }}>{result.feedback.next.map(s => <li key={s} style={{ borderColor: '#F3E3B8' }}>{s}</li>)}</ul></div>
        <div className="pf-divider" />
        <h4 style={{ fontSize: 16, marginBottom: 6 }}>The answers</h4>
        {QUIZ.questions.map(x => <p key={x.id} className="pf-small" style={{ marginBottom: 8 }}><b>{answers[x.id] === x.answer ? '✓' : '✗'} {x.text}</b><br />{x.explain}</p>)}
        <button type="button" className="pf-btn" onClick={() => onDone(result)}>Save and finish</button>
      </Card>
    );
  }
  return (
    <Card>
      <div className="pf-row pf-between"><div className="pf-eyebrow">{item.title}</div><span className="pf-small pf-muted">Question {i + 1} of {QUIZ.questions.length}</span></div>
      <Progress value={((i + 1) / QUIZ.questions.length) * 100} label="Quiz progress" />
      <h3 style={{ fontSize: 22, fontWeight: 500, margin: '18px 0 12px', fontFamily: 'DM Sans, sans-serif', color: 'var(--ink)' }}>{q.text}</h3>
      <div role="radiogroup" aria-label="Answers" style={{ display: 'grid', gap: 10 }}>
        {q.options.map((o, k) => (
          <label key={o} className="pf-card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', cursor: 'pointer', borderColor: answers[q.id] === k ? 'var(--indigo)' : undefined, background: answers[q.id] === k ? 'var(--indigo-t)' : '#fff', boxShadow: 'none' }}>
            <input type="radio" name={q.id} checked={answers[q.id] === k} onChange={() => setAnswers({ ...answers, [q.id]: k })} /> <span>{o}</span>
          </label>
        ))}
      </div>
      <div className="pf-row pf-between" style={{ marginTop: 18 }}>
        <button type="button" className="pf-btn ghost" onClick={i ? () => setI(i - 1) : onCancel}>{i ? 'Back' : 'Leave quiz'}</button>
        <button type="button" className="pf-btn" disabled={answers[q.id] === undefined} onClick={() => (last ? setResult(markQuiz(answers)) : setI(i + 1))}>{last ? 'Finish and mark' : 'Next'}</button>
      </div>
    </Card>
  );
}

export default function Assessments() {
  const { data, actions } = usePlatform();
  const [tab, setTab] = useState('upcoming');
  const [taking, setTaking] = useState(null);
  const [open, setOpen] = useState(null);
  const past = data.assessments.past, up = data.assessments.upcoming;
  const a = past.find(x => x.id === open);

  if (taking) return <><PageHead eyebrow="Assessment" title="Check-in quiz">Take your time. There is no penalty for a wrong answer, and the feedback tells you exactly what to do next.</PageHead><Quiz item={taking} onCancel={() => setTaking(null)} onDone={r => { actions.finishQuiz(taking.id, { score: r.score, mins: 6, feedback: r.feedback }); setTaking(null); setTab('results'); }} /></>;

  return (
    <>
      <PageHead eyebrow="Assessments" title="Check what has stuck">Short, regular check-ins show what you have learned. Each one is marked straight away, with feedback that shapes your next week.</PageHead>
      <div className="pf-grid g-main-r" style={{ marginBottom: 18 }}>
        <Card><CardHead title="Your scores" icon="trend" /><div className="pf-row" style={{ alignItems: 'flex-end' }}><b style={{ fontFamily: "'Syne', sans-serif", fontSize: 44, color: 'var(--indigo)', lineHeight: 1 }}>{past[0].score}%</b><span className="pf-pill leaf">Latest</span></div><div style={{ marginTop: 10 }}><Spark data={data.scoreTrend} label="Score trend" /></div><div className="pf-small pf-muted">Last {data.scoreTrend.length} check-ins</div></Card>
        <Card ai><span className="tag"><Icon name="sparkles" size={14} />What the feedback is telling the plan</span><p style={{ margin: '8px 0 0' }}>{past[0].feedback.summary}</p><p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>Next: {past[0].feedback.next[0].toLowerCase()}.</p></Card>
      </div>
      <Tabs label="Assessment sections" value={tab} onChange={setTab} tabs={[{ id: 'upcoming', label: 'Upcoming', count: up.length }, { id: 'results', label: 'Results', count: past.length }]} />
      {tab === 'upcoming' ? (
        <div className="pf-grid g2">{up.map((u, i) => (
          <Card key={u.id}><div className="pf-row"><span className="pf-pill gold" style={{ width: 42, height: 42, borderRadius: 13, padding: 0, justifyContent: 'center' }}><Icon name="clipboard" size={20} /></span><div className="pf-grow"><b>{u.title}</b><div className="pf-small pf-muted">{u.topic}</div></div><Pill tone={dueLabel(u.due).tone}>{dueLabel(u.due).text}</Pill></div>
            <div className="pf-row pf-wrap pf-small pf-muted" style={{ margin: '12px 0' }}><span><Icon name="clock" size={14} /> {u.mins} min</span>{u.questions > 0 && <span>{u.questions} questions</span>}<span>{u.kind}</span></div>
            {i === 0 && u.questions > 0 ? <button type="button" className="pf-btn gold" onClick={() => setTaking(u)}><Icon name="play" size={16} />Start now</button> : <span className="pf-small pf-faint">Opens on {fmtDate(u.due)}</span>}</Card>
        ))}{up.length === 0 && <Card><div className="pf-muted">No assessments are waiting. Well done.</div></Card>}</div>
      ) : (
        <Card flush><div className="pf-scroll"><table className="pf-table"><thead><tr><th>Assessment</th><th>Date</th><th>Topic</th><th>Score</th><th /></tr></thead><tbody>
          {past.map(p => <tr key={p.id} className="click" onClick={() => setOpen(p.id)}><td><b>{p.title}</b></td><td>{fmtDate(p.date)}</td><td>{p.topic}</td><td><Pill tone={p.score >= 75 ? 'leaf' : p.score >= 60 ? 'gold' : 'coral'}>{p.score}%</Pill></td><td><Icon name="chevronRight" size={16} className="pf-faint" /></td></tr>)}</tbody></table></div></Card>
      )}
      <Drawer open={!!a} title={a ? a.title : ''} onClose={() => setOpen(null)}>{a && <>
        <div className="pf-row" style={{ gap: 18, marginBottom: 14 }}><b style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, color: a.score >= 70 ? 'var(--leaf)' : 'var(--coral)', lineHeight: 1 }}>{a.score}%</b><div className="pf-small pf-muted">{fmtDate(a.date)} · {a.mins} min · {a.topic}</div></div>
        <p>{a.feedback.summary}</p>
        <h4 style={{ fontSize: 16, margin: '14px 0 6px' }}>What went well</h4><ul className="pf-list">{a.feedback.strengths.map(s => <li key={s}><Icon name="check" size={16} />{s}</li>)}</ul>
        <h4 style={{ fontSize: 16, margin: '14px 0 6px' }}>Worth another look</h4><ul className="pf-list">{a.feedback.gaps.map(s => <li key={s}><Icon name="flag" size={16} />{s}</li>)}</ul>
        <div className="pf-ai pf-card" style={{ marginTop: 14 }}><span className="tag"><Icon name="sparkles" size={14} />Next steps</span><ul className="pf-list" style={{ marginTop: 6 }}>{a.feedback.next.map(s => <li key={s} style={{ borderColor: '#F3E3B8' }}>{s}</li>)}</ul></div></>}
      </Drawer>
    </>
  );
}
