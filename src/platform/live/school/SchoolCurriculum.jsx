import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHead, Drawer, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { schoolApi, errMessage, saveFile } from '../liveApi';
import { useDashboard } from './SchoolHome';

// The school's own study plan: import it (a CSV, or pasted text of any layout that AI reads), check and correct the preview,
// save it, and assign it to classes. Every student in those classes then gets a weekly plan that follows what is taught in class.
const fmt = d => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { timeZone: 'UTC', day: 'numeric', month: 'short' }) : '–');

/** The plan as an editable outline: subjects, units, topics with their teaching dates. */
function Outline({ c, onChange, readOnly = false }) {
  const setTopic = (si, ui, ti, patch) => { const n = JSON.parse(JSON.stringify(c)); Object.assign(n.subjects[si].units[ui].topics[ti], patch); onChange(n); };
  const dropTopic = (si, ui, ti) => { const n = JSON.parse(JSON.stringify(c)); n.subjects[si].units[ui].topics.splice(ti, 1); n.subjects[si].units = n.subjects[si].units.filter(u => u.topics.length); n.subjects = n.subjects.filter(s => s.units.length); onChange(n); };
  return (
    <div className="pf-cur">
      {c.subjects.map((s, si) => (
        <details key={s.id || si} open={si === 0}>
          <summary><b>{s.name}</b> <span className="pf-small pf-muted">· {s.units.reduce((a, u) => a + u.topics.length, 0)} topics</span></summary>
          {s.units.map((u, ui) => (
            <div key={u.id || ui} className="pf-cur-unit"><div className="pf-small pf-muted">{u.title}</div>
              {u.topics.map((t, ti) => (
                <div key={t.id || ti} className="pf-cur-topic">
                  {readOnly ? <span className="pf-grow">{t.title}</span> : <input className="pf-input" aria-label="Topic" value={t.title} onChange={e => setTopic(si, ui, ti, { title: e.target.value })} />}
                  {readOnly ? <span className="pf-small pf-muted">{fmt(t.starts)} – {fmt(t.ends)}</span> : <>
                    <input type="date" className="pf-input" aria-label={`${t.title} starts`} value={t.starts || ''} onChange={e => setTopic(si, ui, ti, { starts: e.target.value })} />
                    <input type="date" className="pf-input" aria-label={`${t.title} ends`} value={t.ends || ''} onChange={e => setTopic(si, ui, ti, { ends: e.target.value })} />
                    <button type="button" className="pf-iconbtn" aria-label={`Remove ${t.title}`} onClick={() => dropTopic(si, ui, ti)}><Icon name="x" size={13} /></button></>}
                </div>))}
            </div>))}
        </details>))}
      {(c.exams.length > 0 || c.holidays.length > 0) && <p className="pf-small" style={{ margin: '8px 0 0' }}>{c.exams.length > 0 && <>Exams: {c.exams.map(e => `${e.title} (${fmt(e.date)})`).join(', ')}. </>}{c.holidays.length > 0 && <>Holidays: {c.holidays.map(h => `${h.title} (${fmt(h.from)}–${fmt(h.to)})`).join(', ')}.</>}</p>}
    </div>
  );
}

function ImportWizard({ onSaved }) {
  const [format, setFormat] = useState('csv');
  const [text, setText] = useState('');
  const [meta, setMeta] = useState({ name: '', board: '', grade: '', academicYear: '', starts: '', ends: '', weeklyMinutes: 420 });
  const [pv, setPv] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const file = async e => { const f = e.target.files && e.target.files[0]; if (f) { setText(await f.text()); setPv(null); } };
  const preview = async () => { setBusy(true); setErr(''); try { setPv(await schoolApi.previewCurriculum({ format, text, ...meta })); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const save = async () => { setBusy(true); setErr(''); try { const r = await schoolApi.saveCurriculum({ curriculum: { ...pv.curriculum, name: meta.name || pv.curriculum.name }, weeklyMinutes: meta.weeklyMinutes }); onSaved(r.curriculum); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  const m = k => e => setMeta({ ...meta, [k]: e.target.value });
  return (
    <div>
      <div className="pf-row" style={{ gap: 6 }} role="radiogroup" aria-label="How to import">{[['csv', 'A CSV file'], ['text', 'Paste any text (AI reads it)']].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={format === v} className={`pf-choice${format === v ? ' on' : ''}`} onClick={() => { setFormat(v); setPv(null); }}>{l}</button>)}</div>
      <div className="pf-grid g2" style={{ marginTop: 10 }}>
        <div className="pf-field"><label className="pf-label" htmlFor="cn">Name</label><input id="cn" className="pf-input" value={meta.name} onChange={m('name')} placeholder="e.g. Class 10 · 2026–27" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="cb">Board</label><input id="cb" className="pf-input" value={meta.board} onChange={m('board')} placeholder="CBSE, ICSE, State board…" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="cg">Class</label><input id="cg" className="pf-input" value={meta.grade} onChange={m('grade')} placeholder="10" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="cy">Academic year</label><input id="cy" className="pf-input" value={meta.academicYear} onChange={m('academicYear')} placeholder="2026–27" /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="cs">Starts</label><input id="cs" type="date" className="pf-input" value={meta.starts} onChange={m('starts')} /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="ce">Ends</label><input id="ce" type="date" className="pf-input" value={meta.ends} onChange={m('ends')} /></div>
        <div className="pf-field"><label className="pf-label" htmlFor="cw">Home study a week (minutes)</label><input id="cw" type="number" min={60} max={3000} className="pf-input" value={meta.weeklyMinutes} onChange={m('weeklyMinutes')} /></div>
      </div>
      {format === 'csv' ? <>
        <p className="pf-small" style={{ margin: '6px 0' }}>One row per topic: <b>subject, unit, topic, starts, ends</b> (dates optional: undated topics are spread over the year in order), plus rows of type <b>exam</b> or <b>holiday</b>.</p>
        <div className="pf-row pf-wrap" style={{ gap: 8 }}><label className="pf-btn sm ghost" style={{ cursor: 'pointer' }}><Icon name="file" size={14} />Choose a CSV<input type="file" accept=".csv,text/csv" onChange={file} style={{ display: 'none' }} /></label><button type="button" className="pf-btn sm ghost" onClick={async () => saveFile(await schoolApi.curriculumTemplate(), 'study-plan-template.csv')}><Icon name="download" size={14} />Template</button></div>
      </> : <p className="pf-small" style={{ margin: '6px 0' }}>Paste your syllabus, scheme of work or topic timetable, in any layout. AI reads it into subjects, units and topics; you check it before anything is saved.</p>}
      <label className="pf-sr" htmlFor="ct">The study plan</label>
      <textarea id="ct" className="pf-input" rows={8} value={text} onChange={e => { setText(e.target.value); setPv(null); }} placeholder={format === 'csv' ? 'subject,unit,topic,starts,ends\nPhysics,Motion,Speed,2026-06-15,2026-06-21' : 'Physics — Unit 1: Motion. June: distance and displacement, speed…'} style={{ marginTop: 8 }} />
      <div className="pf-row" style={{ gap: 6, marginTop: 10 }}><button type="button" className="pf-btn sm" disabled={busy || text.trim().length < 10} onClick={preview}>{busy && !pv ? 'Reading…' : 'Preview'}</button>{pv && <button type="button" className="pf-btn sm" disabled={busy} onClick={save}>Save this plan</button>}</div>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      {pv && <div style={{ marginTop: 12 }}>
        <p className="pf-small"><b>{pv.curriculum.subjects.length}</b> subjects, <b>{pv.curriculum.subjects.reduce((a, s) => a + s.units.reduce((b, u) => b + u.topics.length, 0), 0)}</b> topics, {fmt(pv.curriculum.starts)} to {fmt(pv.curriculum.ends)}. Correct anything below before saving.</p>
        {pv.problems.length > 0 && <ul className="pf-small" style={{ color: '#8A5A07' }}>{pv.problems.map(p => <li key={p}>{p}</li>)}</ul>}
        <Outline c={pv.curriculum} onChange={c => setPv({ ...pv, curriculum: c })} />
      </div>}
    </div>
  );
}

function Assign({ c, cohorts, onDone }) {
  const [pick, setPick] = useState(c.cohortIds || []);
  const [replace, setReplace] = useState(false);
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => { setBusy(true); setErr(''); try { const r = await schoolApi.assignCurriculum(c.id, { cohortIds: pick, replace }); setOut(r); await onDone(); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  return (
    <div className="pf-o-cap">
      <b>Give this plan to classes</b>
      <div className="pf-chip-row" style={{ margin: '8px 0' }}>{cohorts.map(k => <button key={k.id} type="button" className="pf-chip" aria-pressed={pick.includes(k.id)} onClick={() => setPick(p => (p.includes(k.id) ? p.filter(x => x !== k.id) : [...p, k.id]))}>{k.name} ({k.students})</button>)}</div>
      <label className="pf-small pf-row" style={{ gap: 6 }}><input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} />Also replace the goal of students who set their own (their progress is kept)</label>
      <button type="button" className="pf-btn sm" style={{ marginTop: 8 }} disabled={busy || !pick.length} onClick={go}>{busy ? 'Setting up every student…' : 'Assign'}</button>
      {out && <p className="pf-small" role="status">{out.started} student{out.started === 1 ? '' : 's'} started on this plan{out.kept ? `; ${out.kept} kept their own goal` : ''}{out.already ? `; ${out.already} already on it` : ''}. Their first week is ready.</p>}
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
    </div>
  );
}

export default function SchoolCurriculum() {
  const { d, load: reloadDash } = useDashboard();
  const [sp, setSp] = useSearchParams();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => schoolApi.curricula().then(r => setList(r.curricula)).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { load(); }, [load]);
  const admin = d && d.school.admin;
  const saveEdit = async () => { setErr(''); try { await schoolApi.updateCurriculum(edit.id, edit); setEdit(null); await load(); } catch (x) { setErr(errMessage(x)); } };
  return (
    <>
      <PageHead eyebrow="Study plans" title="Your school’s study plans" actions={admin ? <button type="button" className="pf-btn" onClick={() => setSp({ import: '1' })}><Icon name="plus" size={15} />Import a study plan</button> : null}>
        Bring your own scheme of work. Each student’s week then follows what is taught in class: a learn and a practise step for this week’s topics, revision of last week’s, and revision-only exam weeks. The next week comes by itself.
      </PageHead>
      {err && <p className="pf-small" role="alert" style={{ color: 'var(--coral)' }}>{err}</p>}
      {!list ? <p role="status">Loading…</p> : list.length === 0 ? <Card><Empty icon="book" title="No study plan yet">Import one from a CSV or by pasting your syllabus.</Empty></Card> :
        <div className="pf-grid">{list.map(c => (
          <Card key={c.id}>
            <div className="pf-row pf-wrap" style={{ gap: 8 }}><b className="pf-grow" style={{ fontSize: 17 }}>{c.name}</b><Pill tone={c.status === 'active' ? 'leaf' : 'grey'}>{c.status === 'active' ? 'In use' : 'Draft'}</Pill>
              <span className="pf-small pf-muted">{[c.board, c.grade && `Class ${c.grade}`, c.academicYear].filter(Boolean).join(' · ')} · {c.counts.subjects} subjects, {c.counts.topics} topics · {fmt(c.starts)}–{fmt(c.ends)}</span>
              <button type="button" className="pf-btn sm ghost" onClick={() => setOpen(open === c.id ? null : c.id)}>{open === c.id ? 'Close' : 'Open'}</button>
              {admin && <button type="button" className="pf-btn sm ghost" onClick={() => setEdit(JSON.parse(JSON.stringify(c)))}>Edit</button>}</div>
            {open === c.id && <><Outline c={c} readOnly onChange={() => {}} />{admin && d && <Assign c={c} cohorts={d.cohorts} onDone={async () => { await load(); await reloadDash(); }} />}</>}
          </Card>))}</div>}
      <Drawer open={sp.get('import') === '1'} title="Import a study plan" onClose={() => setSp({})}>{sp.get('import') === '1' && <ImportWizard onSaved={async c => { setSp({}); await load(); setOpen(c.id); }} />}</Drawer>
      <Drawer open={!!edit} title={edit ? `Edit: ${edit.name}` : ''} onClose={() => setEdit(null)}>{edit && <><Outline c={edit} onChange={setEdit} /><div className="pf-row" style={{ gap: 6, marginTop: 10 }}><button type="button" className="pf-btn" onClick={saveEdit}>Save changes</button></div><p className="pf-small pf-faint">Changes shape the coming weeks; weeks already built stay as they are.</p></>}</Drawer>
    </>
  );
}
