import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, Drawer, Pill } from '../../ui/kit';
import { usePlatform } from '../../data/store';
import { educationApi, errMessage } from '../liveApi';
import EducationForm from './EducationForm';

const STATUS = { confirmed: ['Confirmed', 'leaf'], stated: ['From their profile', 'sky'], inferred: ['Not confirmed', 'gold'], unknown: ['Not set', 'coral'] };
const NEEDS = { unknown: 'Not set yet.', year: 'The year is missing.', stale: 'Out of date: a new academic year has started.', conflict: 'Sources disagree.', unsure: 'Not sure.' };

/**
 * Where the student is in their studies, on the 360 view: what we know, where it came from and what is still to settle.
 * A mentor, or the school's admin, can correct it; the student is told when they do. Everyone else (and the student) only looks.
 */
export default function EducationCard({ h, as, onChanged }) {
  const ed = h.education;
  const ctx = usePlatform();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!ed) return null;
  const canEdit = as === 'mentor' || (as === 'school' && Boolean(ctx && ctx.data && ctx.data.school && ctx.data.school.admin));
  const [statusText, tone] = STATUS[ed.status] || STATUS.unknown;
  const openIt = async () => { setErr(''); setOpen(true); if (!d) { try { setD(await educationApi.of(h.id)); } catch (x) { setErr(errMessage(x)); } } };
  const save = async patch => { setBusy(true); setErr(''); try { setD(await educationApi.correct(h.id, patch)); setOpen(false); if (onChanged) await onChanged(); } catch (x) { setErr(errMessage(x)); } finally { setBusy(false); } };
  return (
    <Card><CardHead title="Education" icon="cap" />
      <div className="pf-row pf-wrap" style={{ gap: 6 }}><b>{ed.label || 'Not set'}</b><Pill tone={tone}>{statusText}</Pill>{ed.stale && <Pill tone="gold">Out of date</Pill>}</div>
      <p className="pf-small pf-muted" style={{ margin: '4px 0 0' }}>{[ed.programme, ed.field, ed.stream].filter(Boolean).join(' · ') || 'No course or stream recorded.'}{ed.sourceWord ? ` Set by ${ed.sourceWord}.` : ''}</p>
      {ed.switching && <p className="pf-small" style={{ margin: '6px 0 0' }}>Wants to change course: entrance exams for the new route are open to them.</p>}
      {ed.needs.length > 0 && <ul className="pf-small pf-o-list" style={{ marginTop: 6 }}>{ed.needs.map(n => <li key={n}>{NEEDS[n]}</li>)}</ul>}
      {ed.conflicts.filter(c => c.field === 'stage').map((c, i) => <p key={i} className="pf-small" style={{ margin: '6px 0 0', color: '#8A5A07' }}>{c.other.sourceWord || c.other.source} said {c.other.label}.</p>)}
      {as === 'self' && <Link className="pf-btn sm ghost" style={{ marginTop: 10 }} to="/platform/student/about">Change it</Link>}
      {canEdit && <button type="button" className="pf-btn sm ghost" style={{ marginTop: 10 }} onClick={openIt}>Correct this</button>}
      <Drawer open={open} title="Correct their education details" onClose={() => setOpen(false)}>
        {open && (d ? <><p className="pf-small pf-muted" style={{ marginTop: 0 }}>The student is told, and can change it back. Plans and exams they see follow this.</p>
          <EducationForm options={d.options} education={d.context.education} onSave={save} busy={busy} error={err} submitLabel="Save and tell them" /></>
          : <p className="pf-small" role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p>)}
      </Drawer>
    </Card>
  );
}
