import { useEffect, useState } from 'react';
import { Card, CardHead, Icon, Pill } from '../../ui/kit';
import { observeApi, mentorApi, errMessage } from '../liveApi';
import { Sections } from './parts';

// The AI analyst: the evidence-backed brief, questions about the student, session prep, turning session notes into a write-up,
// tasks and plan changes, and the weekly and monthly (parent) reports, to edit and share.
function Brief({ id }) {
  const [r, setR] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => { setBusy(true); setErr(''); try { setR((await observeApi.brief(id)).report); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  return (
    <Card ai>
      <div className="pf-row pf-between pf-wrap" style={{ gap: 8 }}><span className="tag"><Icon name="sparkles" size={14} />AI brief</span><button type="button" className="pf-btn sm" disabled={busy} onClick={go}>{busy ? 'Reading the data…' : r ? 'Write it again' : 'Write the brief'}</button></div>
      {!r && !busy && <p className="pf-small" style={{ margin: '8px 0 0' }}>What they did, what is going well, what is going wrong and what to do next, each backed by facts you can check (tap the F numbers).</p>}
      {r && <><p style={{ margin: '10px 0' }}><b>{r.headline}</b></p><Sections sections={r.sections} facts={r.facts} /></>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

function Ask({ id, name }) {
  const [log, setLog] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async text => {
    const t = (text || q).trim(); if (!t) return;
    setBusy(true); setErr(''); setQ('');
    try { const r = await observeApi.ask(id, t, log.map(x => ({ role: x.role, text: x.text }))); setLog(l => [...l, { role: 'mentor', text: t }, { role: 'analyst', text: r.answer, evidence: r.evidence, followups: r.followups }]); }
    catch (x) { setErr(errMessage(x)); setQ(t); } finally { setBusy(false); }
  };
  const last = log[log.length - 1];
  return (
    <Card><CardHead title={`Ask about ${name}`} icon="message" />
      {log.length === 0 && <div className="pf-chip-row" style={{ marginBottom: 8 }}>{['Why has their study time changed?', 'What should I focus on in our next session?', 'Which topics need the most help?', 'Are they overloaded this week?'].map(x => <button key={x} type="button" className="pf-chip" disabled={busy} onClick={() => send(x)}>{x}</button>)}</div>}
      <div className="pf-o-ask">{log.map((m, i) => <div key={i} className={`pf-cmsg ${m.role === 'mentor' ? 'me' : 'coach'}`}><div className="pf-cbub">{m.text}
        {m.evidence && m.evidence.length > 0 && <ul className="pf-evlist">{m.evidence.map(f => <li key={f.key}><b>{f.key}</b> {f.text}</li>)}</ul>}</div></div>)}</div>
      {last && last.followups && last.followups.length > 0 && <div className="pf-chip-row" style={{ margin: '6px 0' }}>{last.followups.map(f => <button key={f} type="button" className="pf-chip" disabled={busy} onClick={() => send(f)}>{f}</button>)}</div>}
      <form className="pf-row" style={{ gap: 6 }} onSubmit={e => { e.preventDefault(); send(); }}>
        <label className="pf-sr" htmlFor="ask-q">Your question</label>
        <input id="ask-q" className="pf-input" value={q} maxLength={600} onChange={e => setQ(e.target.value)} placeholder="e.g. Why did their quiz drop?" />
        <button type="submit" className="pf-btn sm" disabled={busy || !q.trim()}>{busy ? 'Thinking…' : 'Ask'}</button>
      </form>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      <p className="pf-small pf-faint" style={{ margin: '6px 0 0' }}>Answers come only from this student’s data, with the facts they used.</p>
    </Card>
  );
}

function Prep({ id }) {
  const [p, setP] = useState(null);
  useEffect(() => { observeApi.prep(id).then(r => setP(r.prep)).catch(() => setP(false)); }, [id]);
  if (!p) return null;
  return (
    <Card><CardHead title={p.session ? `Prepare: ${p.session.when}` : 'Prepare for your next session'} icon="users" />
      <div className="pf-grid g3 pf-o-prep">
        <div><h5>Wins to praise</h5><ul className="pf-small">{p.wins.length ? p.wins.map(x => <li key={x}>{x}</li>) : <li className="pf-muted">Ask what they are proud of.</li>}</ul></div>
        <div><h5>Talk about</h5><ul className="pf-small">{p.talk.length ? p.talk.map(x => <li key={x}>{x}</li>) : <li className="pf-muted">Nothing worrying.</li>}</ul></div>
        <div><h5>Good questions</h5><ul className="pf-small">{p.questions.map(x => <li key={x}>{x}</li>)}</ul></div>
      </div>
      {p.session && p.session.agenda.length > 0 && <p className="pf-small" style={{ margin: '8px 0 0' }}><b>On the agenda:</b> {p.session.agenda.map(a => a.text).join(' · ')}</p>}
    </Card>
  );
}

function Capture({ id, onChanged }) {
  const [notes, setNotes] = useState('');
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState([]);
  const [err, setErr] = useState('');
  const run = async (key, fn) => { setErr(''); try { await fn(); setDone(d => [...d, key]); await onChanged(); } catch (x) { setErr(errMessage(x)); } };
  const go = async e => { e.preventDefault(); setBusy(true); setErr(''); try { setOut((await observeApi.capture(id, notes)).capture); setDone([]); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const due = new Date(Date.now() + 5.5 * 3600000 + 3 * 86400000).toISOString().slice(0, 10);
  return (
    <Card><CardHead title="After a session: notes to actions" icon="edit" />
      <form onSubmit={go}><label className="pf-sr" htmlFor="cap">Your notes</label>
        <textarea id="cap" className="pf-input" rows={4} maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Rough notes are fine: what you talked about, what they will do, anything to change in their plan." />
        <button type="submit" className="pf-btn sm" style={{ marginTop: 8 }} disabled={busy || notes.trim().length < 10}>{busy ? 'Working…' : 'Turn into a write-up and actions'}</button></form>
      {out && <div className="pf-o-cap">
        <h5>Write-up</h5><p className="pf-small" style={{ whiteSpace: 'pre-wrap' }}>{out.summary}</p>
        <button type="button" className="pf-btn sm ghost" disabled={done.includes('note')} onClick={() => run('note', () => mentorApi.addNote(id, { kind: 'summary', title: 'Session summary', text: out.summary, sharedWithStudent: true, sharedWithParent: true }))}>{done.includes('note') ? 'Shared ✓' : 'Share with the student and parent'}</button>
        {out.nextSteps.length > 0 && <><h5>Next steps as tasks (due in 3 days)</h5><ul className="pf-small">{out.nextSteps.map(x => <li key={x}>{x}</li>)}</ul>
          <button type="button" className="pf-btn sm ghost" disabled={done.includes('tasks')} onClick={() => run('tasks', async () => { for (const t of out.nextSteps) await mentorApi.assignTask(id, { title: t, due, priority: 'medium', subject: 'From your session' }); })}>{done.includes('tasks') ? 'Added ✓' : `Add ${out.nextSteps.length} tasks`}</button></>}
        {out.plan.lines.length > 0 && <><h5>Plan changes</h5><ul className="pf-small">{out.plan.lines.map(x => <li key={x}>{x}</li>)}</ul>
          <button type="button" className="pf-btn sm ghost" disabled={done.includes('plan')} onClick={() => run('plan', () => observeApi.apply(id, out.plan.requests, 'From our session'))}>{done.includes('plan') ? 'Changed ✓' : 'Make these changes'}</button></>}
        {out.plan.problems.length > 0 && <p className="pf-small pf-muted">Could not: {out.plan.problems.join(' ')}</p>}
      </div>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </Card>
  );
}

function Reports({ id, canEdit }) {
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState(null);
  const [err, setErr] = useState('');
  const load = () => observeApi.reports(id).then(r => setList(r.reports)).catch(e => setErr(errMessage(e)));
  useEffect(() => { load(); }, [id]);                          // reload when the student changes
  const make = async kind => { setErr(''); try { const r = kind === 'weekly' ? await observeApi.weeklyNow(id) : await observeApi.parentReport(id); await load(); setOpen(r.report.id); setDraft(JSON.parse(JSON.stringify(r.report))); } catch (x) { setErr(errMessage(x)); } };
  const share = async to => { setErr(''); try { await observeApi.shareReport(id, draft.id, { sections: draft.sections, headline: draft.headline, with: to }); await load(); setOpen(null); } catch (x) { setErr(errMessage(x)); } };
  const setItem = (si, ii, text) => setDraft(d => { const n = JSON.parse(JSON.stringify(d)); n.sections[si].items[ii].text = text; return n; });
  return (
    <Card><div className="pf-row pf-between pf-wrap" style={{ gap: 8 }}><h3 style={{ margin: 0, fontSize: 17 }}>Reports</h3>
      {canEdit && <div className="pf-row" style={{ gap: 6 }}><button type="button" className="pf-btn sm ghost" onClick={() => make('weekly')}>This week’s report</button><button type="button" className="pf-btn sm ghost" onClick={() => make('parent')}>Monthly report for the parent</button></div>}</div>
      {err && <p className="pf-small" role="alert">{err}</p>}
      {!list ? <p className="pf-small pf-muted" role="status">Loading…</p> : list.length === 0 ? <p className="pf-small pf-muted">Weekly reports are made every Sunday evening. You can make one now.</p> :
        <ul className="pf-list" style={{ marginTop: 8 }}>{list.map(r => <li key={r.id} style={{ display: 'block' }}>
          <div className="pf-row pf-wrap" style={{ gap: 6 }}><b className="pf-grow">{r.headline}</b><Pill tone="grey">{r.kind === 'parent' ? 'For the parent' : r.kind === 'brief' ? 'AI brief' : 'Weekly'}</Pill>{r.sharedWith.length > 0 && <Pill tone="leaf">Shared with {r.sharedWith.join(' and ')}</Pill>}
            <button type="button" className="pf-btn sm ghost" onClick={() => { setOpen(open === r.id ? null : r.id); setDraft(JSON.parse(JSON.stringify(r))); }}>{open === r.id ? 'Close' : canEdit ? 'Open and edit' : 'Open'}</button></div>
          {open === r.id && draft && <div className="pf-o-report">
            {canEdit ? <><label className="pf-label" htmlFor={`h-${r.id}`}>Headline</label><input id={`h-${r.id}`} className="pf-input" value={draft.headline} onChange={e => setDraft({ ...draft, headline: e.target.value })} />
              {draft.sections.map((s, si) => <div key={s.key}><h5>{s.title}</h5>{s.items.map((it, ii) => <textarea key={ii} className="pf-input" rows={2} aria-label={`${s.title} ${ii + 1}`} value={it.text} onChange={e => setItem(si, ii, e.target.value)} />)}</div>)}
              <div className="pf-row pf-wrap" style={{ gap: 6, marginTop: 8 }}><button type="button" className="pf-btn sm" onClick={() => share(['student'])}>Share with the student</button><button type="button" className="pf-btn sm" onClick={() => share(['parent'])}>Share with the parent</button><button type="button" className="pf-btn sm ghost" onClick={() => share(['student', 'parent'])}>Share with both</button><button type="button" className="pf-btn sm ghost" onClick={() => window.print()}>Print or save as PDF</button></div></>
              : <Sections sections={draft.sections} facts={draft.facts} />}
          </div>}
        </li>)}</ul>}
    </Card>
  );
}

export default function Analyst({ p, onChanged }) {
  const id = p.header.id;
  const mentor = p.as === 'mentor';
  return (
    <div className="pf-grid" style={{ gap: 18 }}>
      <div className="pf-grid g-main" style={{ alignItems: 'start' }}><Brief id={id} /><Ask id={id} name={p.header.name.split(' ')[0]} /></div>
      {mentor && <Prep id={id} />}
      {mentor && <Capture id={id} onChanged={onChanged} />}
      <Reports id={id} canEdit={mentor} />
    </div>
  );
}
