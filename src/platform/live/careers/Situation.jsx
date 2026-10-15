import { useEffect, useState } from 'react';
import { Card, PageHead } from '../../ui/kit';
import { rec, messageFor } from './recApi';
import { useLoad } from './hooks';
import { Closed, Problem } from './bits';

const BUDGET = [['', 'Prefer not to say'], ['low', 'Lower cost matters a lot'], ['medium', 'Some flexibility'], ['high', 'Cost is not a limit']];

/** What the student chooses to tell us. It only adds notes and can hide areas they are not interested in; it never removes a career. */
export default function Situation() {
  const ctx = useLoad(() => rec.context(), []);
  const meta = useLoad(() => rec.meta(), []);
  const [budget, setBudget] = useState('');
  const [exams, setExams] = useState('');
  const [skip, setSkip] = useState([]);
  const [state, setState] = useState('');     // '' | 'saving' | 'saved' | error text
  useEffect(() => {
    if (!ctx.data) return;
    const c = ctx.data.context;
    setBudget(c.budgetBand || ''); setExams(c.exams.join(', ')); setSkip(c.notInterested.filter(x => !x.startsWith('occ.')));
  }, [ctx.data]);

  const head = <PageHead eyebrow="Careers" title="My situation">Optional. Tell us what matters so your suggestions can say more. You can change this any time, and you are never required to fill it in.</PageHead>;
  if (ctx.closed) return <>{head}<Closed /></>;
  if (ctx.loading || meta.loading) return <>{head}<p role="status">Loading…</p></>;
  if (ctx.error) return <>{head}<Problem>{messageFor(ctx.error)}</Problem></>;

  const toggle = id => { setSkip(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])); setState(''); };
  const save = async e => {
    e.preventDefault(); setState('saving');
    const kept = ctx.data.context.notInterested.filter(x => x.startsWith('occ.'));
    const examList = [...new Set(exams.split(',').map(x => x.trim()).filter(Boolean))];
    try { await rec.saveContext({ budgetBand: budget || null, exams: examList, notInterested: [...skip, ...kept] }); setState('saved'); }
    catch (err) { setState(err && err.response && err.response.data && err.response.data.code === 'VALIDATION_FAILED' ? 'Please check what you entered: up to 10 exams, each under 60 letters.' : messageFor(err)); }
  };
  return (
    <>
      {head}
      <form onSubmit={save}>
        <Card>
          <div className="pf-field"><label className="pf-label" htmlFor="budget">Cost of study</label>
            <select id="budget" className="pf-select" value={budget} onChange={e => { setBudget(e.target.value); setState(''); }}>{BUDGET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div className="pf-field" style={{ marginTop: 14 }}><label className="pf-label" htmlFor="exams">Exams you are preparing for</label>
            <input id="exams" className="pf-input" value={exams} maxLength={300} onChange={e => { setExams(e.target.value); setState(''); }} placeholder="For example: JEE Main, NEET UG" />
            <span className="pf-small pf-muted">Separate with commas.</span></div>
        </Card>
        <Card style={{ marginTop: 16 }}>
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: 8 }}>Areas you are not interested in</legend>
            <p className="pf-small pf-muted" style={{ marginBottom: 8 }}>We will leave these out of your suggestions. You can still browse them in Explore.</p>
            {meta.data.clusters.map(c => <label key={c.id} className="pf-row" style={{ gap: 8, padding: '4px 0' }}><input type="checkbox" checked={skip.includes(c.id)} onChange={() => toggle(c.id)} />{c.label}</label>)}
          </fieldset>
        </Card>
        <div className="pf-row" style={{ gap: 12, marginTop: 16 }}>
          <button type="submit" className="pf-btn" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save'}</button>
          {state === 'saved' && <span role="status">Saved. Your suggestions will use this.</span>}
          {state && state !== 'saved' && state !== 'saving' && <span role="alert" style={{ color: '#b4442e' }}>{state}</span>}
        </div>
      </form>
    </>
  );
}
