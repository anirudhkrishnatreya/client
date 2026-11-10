import { useCallback, useEffect, useState } from 'react';
import { Card, CardHead, PageHead, Pill } from '../../ui/kit';
import { educationApi, errMessage } from '../liveApi';
import EducationForm from '../education/EducationForm';

const STATUS = { confirmed: ['Confirmed', 'leaf'], stated: ['From your profile', 'sky'], inferred: ['Not confirmed', 'gold'], unknown: ['Not set', 'coral'] };
const WHO = { roster: 'Your school’s class list', school: 'Your school', mentor: 'Your mentor', student: 'You', signup: 'When you signed up', chat: 'What your guide understood' };
const when = at => new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Where the student is in their studies, as the whole system understands it: what we know, where each part came from, and the way to correct it. */
export default function AboutMe() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => educationApi.me().then(setD).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { load(); }, [load]);
  if (!d) return <><PageHead eyebrow="About me" title="Where you are in your studies" /><p role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p></>;
  const e = d.context.education;
  const label = id => (d.options.stages.find(s => s.id === id) || {}).label || id;
  const prog = e.programme ? (d.options.programmes.find(p => p.id === e.programme) || {}).label : null;
  const stream = e.stream ? (d.options.streams.find(s => s.id === e.stream) || {}).label : null;
  const [statusText, tone] = STATUS[e.status] || STATUS.unknown;
  const save = async patch => { setBusy(true); setErr(''); setMsg(''); try { setD(await educationApi.save(patch)); setMsg('Saved. Your plans and suggestions now use this.'); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const confirm = async () => { setBusy(true); setErr(''); setMsg(''); try { setD(await educationApi.confirm()); setMsg('Thank you. We will keep using this.'); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  return (
    <>
      <PageHead eyebrow="About me" title="Where you are in your studies">Your weekly plan, the exams we mention and the careers we suggest are all based on this. Keep it right and everything else follows.</PageHead>
      <div className="pf-grid g-main" style={{ alignItems: 'start' }}>
        <div className="pf-grid">
          <Card>
            <div className="pf-row pf-wrap" style={{ gap: 8 }}><h2 style={{ margin: 0, fontSize: 26 }}>{e.label || 'Not set yet'}</h2><Pill tone={tone}>{statusText}</Pill>{e.stale && <Pill tone="gold">New academic year: please confirm</Pill>}</div>
            <p className="pf-muted" style={{ margin: '6px 0 0' }}>{[prog, e.field, stream].filter(Boolean).join(' · ') || 'No course or stream added.'}</p>
            {e.source && <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>Set by: {WHO[e.source].toLowerCase()}.</p>}
            {e.stage && (e.status !== 'confirmed' || e.stale || e.needs.length > 0) && <button type="button" className="pf-btn" style={{ marginTop: 12 }} disabled={busy} onClick={confirm}>Yes, that is right</button>}
            {e.conflicts.filter(c => c.field === 'stage').map((c, i) => <p key={i} className="pf-small" style={{ margin: '10px 0 0', color: '#8A5A07' }}>{WHO[c.other.source]} said {label(c.other.stage)}. If that is the right one, choose it below.</p>)}
            {d.context.intent.switching && <p className="pf-small" style={{ margin: '10px 0 0' }}>You told us you want to change course, so entrance exams for the new route count for you again.</p>}
            {msg && <p className="pf-small" role="status" style={{ color: 'var(--leaf)' }}>{msg}</p>}
          </Card>
          <Card><CardHead title="Change it" icon="edit" />
            <EducationForm key={`${e.stage}-${e.programme}-${e.stream}-${d.context.intent.switching}`} options={d.options} education={e} switching={d.context.intent.switching} canSwitch onSave={save} busy={busy} error={err} /></Card>
        </div>
        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card><CardHead title="What we have heard" icon="info" />
            {e.sources.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nothing yet.</p> :
              <ul className="pf-list">{e.sources.map((s, i) => <li key={i}><span className="pf-grow"><b>{WHO[s.source]}</b><br /><span className="pf-small pf-muted">{when(s.at)}</span></span><span className="pf-small">{label(s.stage)}</span></li>)}</ul>}
            <p className="pf-small pf-faint" style={{ margin: '8px 0 0' }}>If these disagree, the school’s list comes first, then your mentor, then what you tell us, then sign-up, then the chat.</p></Card>
          <Card><CardHead title="Changes" icon="clock" />
            {d.log.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>No changes yet.</p> :
              <ul className="pf-list">{d.log.map((l, i) => <li key={i}><span className="pf-grow pf-small"><b>{l.role === 'student' ? 'You' : l.name || l.role}</b> · {when(l.at)}<br />{l.change}</span></li>)}</ul>}</Card>
        </div>
      </div>
    </>
  );
}
