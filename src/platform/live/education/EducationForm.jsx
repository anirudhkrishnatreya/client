import { useState } from 'react';

const SCHOOL_STREAM_STAGES = ['school.11', 'school.12', 'gap'];
const FIELD_GROUPS = ['College', 'Diploma', 'Postgraduate', 'After college', 'Work'];
const PROGRAMME_LEVELS = { College: ['ug'], Diploma: ['diploma'], Postgraduate: ['pg', 'doctoral'], 'After college': ['ug', 'pg', 'doctoral'], Work: ['ug', 'pg', 'doctoral', 'diploma'] };

/**
 * Class or year, the course, a school stream and a field, from the choices the server offers. Used by students for their own
 * details and by mentors and school staff to correct them. Sends only what changed.
 */
export default function EducationForm({ options, education, switching = false, canSwitch = false, onSave, busy = false, error = '', submitLabel = 'Save' }) {
  const [stage, setStage] = useState(education.stage || '');
  const [programme, setProgramme] = useState(education.programme || '');
  const [stream, setStream] = useState(education.stream || '');
  const [field, setField] = useState(education.field || '');
  const [change, setChange] = useState(switching);
  const [note, setNote] = useState('');
  const [none, setNone] = useState(false);
  const st = options.stages.find(s => s.id === stage);
  const groups = [...new Set(options.stages.map(s => s.group))];
  const showProgramme = st && FIELD_GROUPS.includes(st.group);
  const programmes = showProgramme ? options.programmes.filter(p => PROGRAMME_LEVELS[st.group].includes(p.level)) : [];
  const submit = e => {
    e.preventDefault();
    const patch = {};
    if (stage && stage !== (education.stage || '')) patch.stage = stage;
    if (showProgramme && programme && programme !== (education.programme || '')) patch.programme = programme;
    if (SCHOOL_STREAM_STAGES.includes(stage) && stream && stream !== (education.stream || '')) patch.stream = stream;
    if (showProgramme && field.trim() && field.trim() !== (education.field || '')) patch.field = field.trim();
    if (canSwitch && change !== switching) { patch.switching = change; if (change && note.trim()) patch.note = note.trim(); }
    if (!Object.keys(patch).length) { setNone(true); return; }
    setNone(false);
    onSave(patch);
  };
  return (
    <form className="pf-grid" onSubmit={submit}>
      <div className="pf-field"><label className="pf-label" htmlFor="edu-stage">Class or year</label>
        <select id="edu-stage" className="pf-input" value={stage} onChange={e => { setStage(e.target.value); setNone(false); }}>
          <option value="">Choose…</option>
          {groups.map(g => <optgroup key={g} label={g}>{options.stages.filter(s => s.group === g).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</optgroup>)}
        </select></div>
      {showProgramme && <div className="pf-field"><label className="pf-label" htmlFor="edu-prog">Course</label>
        <select id="edu-prog" className="pf-input" value={programme} onChange={e => setProgramme(e.target.value)}>
          <option value="">Not listed or not sure</option>
          {programmes.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select></div>}
      {showProgramme && <div className="pf-field"><label className="pf-label" htmlFor="edu-field">Subject or specialisation (optional)</label>
        <input id="edu-field" className="pf-input" maxLength={100} value={field} onChange={e => setField(e.target.value)} placeholder="e.g. Computer Science" /></div>}
      {SCHOOL_STREAM_STAGES.includes(stage) && <div className="pf-field"><label className="pf-label" htmlFor="edu-stream">Stream</label>
        <select id="edu-stream" className="pf-input" value={stream} onChange={e => setStream(e.target.value)}>
          <option value="">Not chosen yet</option>
          {options.streams.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select></div>}
      {canSwitch && <div className="pf-field">
        <label className="pf-small pf-row" style={{ gap: 6 }}><input type="checkbox" checked={change} onChange={e => setChange(e.target.checked)} />I want to change course or field (for example, from engineering to medicine)</label>
        {change && !switching && <><label className="pf-sr" htmlFor="edu-note">What are you thinking of?</label><input id="edu-note" className="pf-input" maxLength={200} value={note} onChange={e => setNote(e.target.value)} placeholder="What are you thinking of?" style={{ marginTop: 6 }} /></>}
        <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>Entrance exams for the new route then count for you again.</p>
      </div>}
      <div className="pf-row" style={{ gap: 8 }}><button type="submit" className="pf-btn" disabled={busy || !stage}>{busy ? 'Saving…' : submitLabel}</button>{none && <span className="pf-small pf-muted" role="status">Nothing to change.</span>}</div>
      {error && <p className="pf-small" role="alert" style={{ color: 'var(--coral)', margin: 0 }}>{error}</p>}
    </form>
  );
}
