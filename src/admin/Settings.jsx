import { useEffect, useState } from 'react';
import { Card, CardHead, Pill } from '../platform/ui/kit';
import { adminApi, errOf, money, num } from './adminApi';

const OnOff = ({ on }) => (on ? <Pill tone="leaf">On</Pill> : <Pill tone="grey">Off</Pill>);
const Row = ({ k, children, hint }) => <li><span className="pf-grow">{k}{hint && <div className="pf-small pf-muted">{hint}</div>}</span><span>{children}</span></li>;

/** How the app is switched and capped (read-only: changed on the host), and the admin's own password. */
export default function Settings() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { adminApi.settings().then(r => setS(r.data)).catch(e => setErr(errOf(e))); }, []);
  const change = async e => {
    e.preventDefault(); setMsg('');
    if (pw.next !== pw.again) { setMsg('The two new passwords do not match.'); return; }
    try { const r = await adminApi.changePassword(pw.current, pw.next); localStorage.setItem('im_admin_token', r.data.token); setPw({ current: '', next: '', again: '' }); setMsg('Password changed. Your other sessions have been signed out.'); }
    catch (x) { setMsg(errOf(x)); }
  };
  return (
    <>
      {err && <p role="alert">{err}</p>}
      {s && (
        <div className="pf-grid g2" style={{ marginBottom: 14 }}>
          <Card><CardHead title="Switches" icon="settings" /><ul className="pf-list">
            <Row k="AI features" hint="LLM_ENABLED: the kill switch for every AI call"><OnOff on={s.switches.LLM_ENABLED} /></Row>
            <Row k="Weekly plans" hint="LEARNING_LOOP"><OnOff on={s.switches.LEARNING_LOOP} /></Row>
            <Row k="Student reminder emails" hint="LOOP_NUDGES"><OnOff on={s.switches.LOOP_NUDGES} /></Row>
            <Row k="Parent weekly digest" hint="PARENT_DIGEST"><OnOff on={s.switches.PARENT_DIGEST} /></Row>
            <Row k="PDF reports" hint="PDF_REPORTS"><OnOff on={s.switches.PDF_REPORTS} /></Row>
            <Row k="Recommendation engine" hint="REC_ENGINE">{s.switches.REC_ENGINE || '—'}</Row>
          </ul></Card>
          <Card><CardHead title="AI caps" icon="sparkles" /><ul className="pf-list">
            <Row k="Daily spend cap" hint="LLM_DAILY_USD_CAP">{money(s.ai.caps.dailyUsd)}</Row>
            <Row k="Monthly spend cap" hint="LLM_MONTHLY_USD_CAP">{money(s.ai.caps.monthlyUsd)}</Row>
            <Row k="Calls per student per day" hint="LLM_STUDENT_DAILY_CALLS">{s.ai.caps.studentDailyCalls}</Row>
            <Row k="Spend alert email">{s.ai.alertEmail ? 'Set' : <Pill tone="gold">Not set</Pill>}</Row>
            <Row k="Providers">{[s.ai.providers.openai && 'OpenAI', s.ai.providers.anthropic && 'Anthropic'].filter(Boolean).join(', ') || 'None'}</Row>
            <Row k="Models">{s.ai.models.openai.small} · {s.ai.models.openai.large}</Row>
          </ul></Card>
          <Card><CardHead title="Services" icon="layers" /><ul className="pf-list">
            <Row k="Email delivery">{s.services.email ? <Pill tone="leaf">Set up</Pill> : <Pill tone="coral">Not set up</Pill>}</Row>
            <Row k="Emails come from">{s.services.mailFrom || '—'}</Row>
            <Row k="YouTube video search">{s.services.youtube ? <Pill tone="leaf">Set up</Pill> : <Pill tone="gold">No key</Pill>}</Row>
            <Row k="YouTube daily units">{num(s.services.youtubeDailyUnits)}</Row>
          </ul></Card>
          <Card><CardHead title="Server" icon="code" /><ul className="pf-list">
            <Row k="Version">{s.runtime.commit || '—'}</Row>
            <Row k="Running for">{s.runtime.uptimeSeconds > 86400 ? `${Math.round(s.runtime.uptimeSeconds / 86400)} days` : `${Math.round(s.runtime.uptimeSeconds / 3600)} hours`}</Row>
            <Row k="Node">{s.runtime.node}</Row>
            <Row k="Admin sessions last">{s.runtime.adminSessionHours}</Row>
          </ul></Card>
        </div>
      )}
      <p className="pf-small pf-muted" style={{ marginBottom: 14 }}>These are set on the host (Render) and shown here read-only. Keys are never shown.</p>
      <Card>
        <CardHead title="Your password" icon="lock" />
        <form onSubmit={change} className="pf-grid g2" style={{ gap: 12, maxWidth: 720 }}>
          <div className="pf-field"><label className="pf-label" htmlFor="pw-cur">Current password</label><input id="pw-cur" className="pf-input" type="password" autoComplete="current-password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} /></div>
          <div />
          <div className="pf-field"><label className="pf-label" htmlFor="pw-new">New password</label><input id="pw-new" className="pf-input" type="password" autoComplete="new-password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} /></div>
          <div className="pf-field"><label className="pf-label" htmlFor="pw-again">New password again</label><input id="pw-again" className="pf-input" type="password" autoComplete="new-password" value={pw.again} onChange={e => setPw(p => ({ ...p, again: e.target.value }))} /></div>
          <div><button type="submit" className="pf-btn sm" disabled={!pw.current || pw.next.length < 12}>Change password</button><span className="pf-small pf-muted" style={{ marginLeft: 8 }}>At least 12 characters, with upper and lower case and a number.</span></div>
        </form>
        {msg && <p className="pf-small" role="status" style={{ marginTop: 8 }}>{msg}</p>}
      </Card>
    </>
  );
}
