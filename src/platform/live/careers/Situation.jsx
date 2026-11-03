import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api';
import { Card, CardHead, Icon, PageHead, Pill } from '../../ui/kit';
import { rec, messageFor } from './recApi';
import { useLoad } from './hooks';
import { Closed, Problem } from './bits';
import { Working } from '../loop/Loader';

const BUDGET = [['', 'Prefer not to say'], ['low', 'Lower cost matters a lot'], ['medium', 'Some flexibility'], ['high', 'Cost is not a limit']];
const MARKS = [['', 'Prefer not to say'], ['below-60', 'Below 60%'], ['60-75', '60 to 75%'], ['75-90', '75 to 90%'], ['90-plus', 'Above 90%']];
const MOVE = [['', 'Not sure yet'], ['no', 'I want to stay in my city'], ['within-state', 'Within my state'], ['anywhere-india', 'Anywhere in India'], ['abroad', 'Open to studying abroad']];
const STREAMS = ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities', 'Vocational', 'Not chosen yet'];
const BOARDS = ['CBSE', 'ICSE / ISC', 'State board', 'IB', 'Cambridge (IGCSE)', 'NIOS'];
const EMPTY = { state: '', city: '', board: '', stream: '', marks: '', relocate: '', languages: '', earnEarly: false, needScholarship: false, familyView: '', hoursPerWeek: null, worries: '' };
const sit = { get: () => api.get('/v2/me/situation'), save: b => api.put('/v2/me/situation', b), plan: () => api.post('/v2/me/situation/plan') };
const PLAN_STEPS = ['Reading your situation and your shortlist…', 'Checking the routes and exams for each career…', 'Writing your plan, stage by stage…'];

/** The drafted plan: stages in order, the exams from the routes, money, fallbacks, and what to ask a mentor. */
function Plan({ d }) {
  return (
    <div className="pf-sitplan">
      <p style={{ margin: '0 0 10px', fontSize: 16 }}>{d.summary}</p>
      <div className="pf-row pf-wrap" style={{ gap: 6, marginBottom: 14 }}>{d.careers.map(c => <Pill key={c} tone="sky">{c}</Pill>)}</div>
      <ol className="pf-stages">{d.stages.map(st => (
        <li key={st.when}><div className="pf-stage-when">{st.when}</div><div><b>{st.focus}</b><ul>{st.steps.map(x => <li key={x}>{x}</li>)}</ul></div></li>
      ))}</ol>
      <div className="pf-grid g2" style={{ marginTop: 14 }}>
        {d.exams.length > 0 && <Card><CardHead title="Exams on the way" icon="clipboard" /><ul className="pf-list">{d.exams.map(e => <li key={e.name}><span className="pf-grow"><b>{e.name}</b><br /><span className="pf-small pf-muted">{e.forWhat}{e.when ? ` · ${e.when}` : ''}</span></span></li>)}</ul></Card>}
        {d.money.length > 0 && <Card><CardHead title="Cost and support" icon="shield" /><ul className="pf-small" style={{ margin: 0, paddingLeft: 18 }}>{d.money.map(m => <li key={m} style={{ marginBottom: 4 }}>{m}</li>)}</ul></Card>}
        {d.backups.length > 0 && <Card><CardHead title="Close alternatives" icon="layers" /><ul className="pf-list">{d.backups.map(b => <li key={b.title}><span className="pf-grow"><b>{b.title}</b><br /><span className="pf-small pf-muted">{b.why}</span></span></li>)}</ul></Card>}
        {d.askMentor.length > 0 && <Card><CardHead title="Ask your mentor" icon="message" /><ul className="pf-small" style={{ margin: 0, paddingLeft: 18 }}>{d.askMentor.map(q => <li key={q} style={{ marginBottom: 4 }}>{q}</li>)}</ul></Card>}
      </div>
      <p className="pf-small pf-faint" style={{ marginTop: 12 }}>A draft to talk through with your mentor and family, not a decision. Exam dates, eligibility and fees change every year: check them on the official websites.</p>
    </div>
  );
}

/** What the student chooses to tell us, all optional, and the full plan drafted from it with their shortlist. */
export default function Situation() {
  const ctx = useLoad(() => rec.context(), []);
  const meta = useLoad(() => rec.meta(), []);
  const mine = useLoad(() => sit.get(), []);
  const [budget, setBudget] = useState('');
  const [exams, setExams] = useState('');
  const [skip, setSkip] = useState([]);
  const [about, setAbout] = useState(EMPTY);
  const [draft, setDraft] = useState(null);
  const [state, setState] = useState('');     // '' | 'saving' | 'saved' | error text
  const [planning, setPlanning] = useState(false);
  const [planErr, setPlanErr] = useState('');
  useEffect(() => {
    if (!ctx.data) return;
    const c = ctx.data.context;
    setBudget(c.budgetBand || ''); setExams(c.exams.join(', ')); setSkip(c.notInterested.filter(x => !x.startsWith('occ.')));
  }, [ctx.data]);
  useEffect(() => { if (mine.data && mine.data.situation) { setAbout({ ...EMPTY, ...mine.data.situation.about }); setDraft(mine.data.situation.draft); } }, [mine.data]);

  const head = <PageHead eyebrow="Careers" title="My situation">Optional, and only for you and your mentor. Tell us about your circumstances and we draft a full plan, from where you are now to the careers you are considering.</PageHead>;
  if (ctx.closed) return <>{head}<Closed /></>;
  if (ctx.loading || meta.loading || mine.loading) return <>{head}<p role="status">Loading…</p></>;
  if (ctx.error) return <>{head}<Problem>{messageFor(ctx.error)}</Problem></>;

  const set = k => e => { setAbout(a => ({ ...a, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })); setState(''); };
  const toggle = id => { setSkip(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id])); setState(''); };
  const saveAll = async () => {
    const kept = ctx.data.context.notInterested.filter(x => x.startsWith('occ.'));
    const examList = [...new Set(exams.split(',').map(x => x.trim()).filter(Boolean))];
    const hours = about.hoursPerWeek === '' || about.hoursPerWeek === null ? null : Number(about.hoursPerWeek);
    await rec.saveContext({ budgetBand: budget || null, exams: examList, notInterested: [...skip, ...kept] });
    await sit.save({ ...about, hoursPerWeek: Number.isInteger(hours) ? hours : null });
  };
  const save = async e => {
    e.preventDefault(); setState('saving');
    try { await saveAll(); setState('saved'); }
    catch (err) { const d = err && err.response && err.response.data; setState(d && d.code === 'VALIDATION_FAILED' ? (d.details && Object.values(d.details)[0] ? `Please check: ${Object.values(d.details)[0]}` : 'Please check what you entered: up to 10 exams, each under 60 letters.') : messageFor(err)); }
  };
  const makePlan = async () => {
    setPlanning(true); setPlanErr('');
    try { await saveAll(); const r = await sit.plan(); setDraft(r.data.situation.draft); setState(''); }
    catch (err) { const d = err && err.response && err.response.data; setPlanErr(d && d.code === 'NEED_CAREER' ? 'need-career' : d && d.code === 'AI_DAILY_LIMIT' ? 'You have used today’s AI. It comes back tomorrow morning.' : messageFor(err)); }
    finally { setPlanning(false); }
  };

  return (
    <>
      {head}
      <form onSubmit={save}>
        <Card><CardHead title="Where you are" icon="pin" />
          <div className="pf-grid g3">
            <div className="pf-field"><label className="pf-label" htmlFor="st">State</label><input id="st" className="pf-input" maxLength={60} value={about.state} onChange={set('state')} placeholder="e.g. Rajasthan" /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="ci">City or town</label><input id="ci" className="pf-input" maxLength={60} value={about.city} onChange={set('city')} /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="lg">Languages you are comfortable in</label><input id="lg" className="pf-input" maxLength={120} value={about.languages} onChange={set('languages')} placeholder="e.g. Hindi, English" /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="bd">School board</label><input id="bd" className="pf-input" list="boards" maxLength={40} value={about.board} onChange={set('board')} /><datalist id="boards">{BOARDS.map(b => <option key={b} value={b} />)}</datalist></div>
            <div className="pf-field"><label className="pf-label" htmlFor="sm">Stream</label><input id="sm" className="pf-input" list="streams" maxLength={40} value={about.stream} onChange={set('stream')} /><datalist id="streams">{STREAMS.map(b => <option key={b} value={b} />)}</datalist></div>
            <div className="pf-field"><label className="pf-label" htmlFor="mk">Recent marks</label><select id="mk" className="pf-select" value={about.marks} onChange={set('marks')}>{MARKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
        </Card>
        <Card style={{ marginTop: 16 }}><CardHead title="What shapes your choices" icon="shield" />
          <div className="pf-grid g3">
            <div className="pf-field"><label className="pf-label" htmlFor="budget">Cost of study</label><select id="budget" className="pf-select" value={budget} onChange={e => { setBudget(e.target.value); setState(''); }}>{BUDGET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="pf-field"><label className="pf-label" htmlFor="mv">Moving away to study</label><select id="mv" className="pf-select" value={about.relocate} onChange={set('relocate')}>{MOVE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <div className="pf-field"><label className="pf-label" htmlFor="hw">Free hours a week for your goal</label><input id="hw" className="pf-input" type="number" min={0} max={80} value={about.hoursPerWeek === null ? '' : about.hoursPerWeek} onChange={set('hoursPerWeek')} /></div>
          </div>
          <div className="pf-row pf-wrap" style={{ gap: 18, margin: '4px 0 12px' }}>
            <label className="pf-row" style={{ gap: 8 }}><input type="checkbox" checked={about.needScholarship} onChange={set('needScholarship')} />I will need a scholarship or low-cost options</label>
            <label className="pf-row" style={{ gap: 8 }}><input type="checkbox" checked={about.earnEarly} onChange={set('earnEarly')} />I need to start earning early</label>
          </div>
          <div className="pf-field"><label className="pf-label" htmlFor="exams">Exams you are preparing for</label>
            <input id="exams" className="pf-input" value={exams} maxLength={300} onChange={e => { setExams(e.target.value); setState(''); }} placeholder="For example: JEE Main, NEET UG" />
            <span className="pf-small pf-muted">Separate with commas.</span></div>
          <div className="pf-grid g2">
            <div className="pf-field"><label className="pf-label" htmlFor="fv">What your family thinks</label><textarea id="fv" className="pf-textarea" rows={3} maxLength={400} value={about.familyView} onChange={set('familyView')} placeholder="e.g. They would like engineering but are open to design." /></div>
            <div className="pf-field"><label className="pf-label" htmlFor="wr">Anything you are worried about</label><textarea id="wr" className="pf-textarea" rows={3} maxLength={600} value={about.worries} onChange={set('worries')} placeholder="e.g. I am not sure I can clear a tough entrance exam." /></div>
          </div>
        </Card>
        <Card style={{ marginTop: 16 }}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: 8 }}>Areas you are not interested in</legend>
            <p className="pf-small pf-muted" style={{ marginBottom: 8 }}>We will leave these out of your suggestions. You can still browse them in Explore.</p>
            <div className="pf-grid g3" style={{ gap: 2 }}>{meta.data.clusters.map(c => <label key={c.id} className="pf-row" style={{ gap: 8, padding: '4px 0' }}><input type="checkbox" checked={skip.includes(c.id)} onChange={() => toggle(c.id)} />{c.label}</label>)}</div>
          </fieldset>
        </Card>
        <div className="pf-row" style={{ gap: 12, marginTop: 16 }}>
          <button type="submit" className="pf-btn" disabled={state === 'saving'}>{state === 'saving' ? 'Saving…' : 'Save'}</button>
          {state === 'saved' && <span role="status">Saved. Your suggestions will use this, and so will your full plan.</span>}
          {state && state !== 'saved' && state !== 'saving' && <span role="alert" style={{ color: '#b4442e' }}>{state}</span>}
        </div>
      </form>

      <Card ai style={{ marginTop: 22 }}>
        <div className="pf-row pf-wrap" style={{ gap: 10 }}>
          <span className="tag"><Icon name="flag" size={14} />Your full plan</span>
          <span className="pf-grow" />
          {draft && <span className="pf-small pf-muted">Drafted {new Date(draft.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
          <button type="button" className="pf-btn sm" onClick={makePlan} disabled={planning}><Icon name="sparkles" size={14} />{planning ? 'Drafting…' : draft ? 'Draft it again' : 'Draft my full plan'}</button>
        </div>
        {planning ? <div style={{ marginTop: 12 }}><Working compact title="Drafting your plan" steps={PLAN_STEPS} /></div>
          : draft ? <div style={{ marginTop: 14 }}><Plan d={draft} /></div>
            : <p style={{ margin: '10px 0 0' }}>From what you tell us above and the careers on your shortlist, we draft a plan stage by stage: what to do this month, this year and after school, the exams on the way, cost and scholarships, and close alternatives. Your mentor can see it too.</p>}
        {planErr === 'need-career' ? <p className="pf-small" role="alert" style={{ margin: '10px 0 0' }}>First save a career or two to <Link to="/platform/student/shortlist">your shortlist</Link> (from <Link to="/platform/student/explore">Explore careers</Link>), or set a goal in <Link to="/platform/student/goal">My goal</Link>.</p>
          : planErr && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: '10px 0 0' }}>{planErr}</p>}
      </Card>
    </>
  );
}
