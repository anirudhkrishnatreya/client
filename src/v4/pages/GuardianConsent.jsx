import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v2 as defaultApi, errorCode } from '../api';
import Frame from './Frame';

// Opened from the link in the guardian's email. No sign-in: the single-use link is the credential.
export default function GuardianConsent({ api = defaultApi }) {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [state, setState] = useState('loading');           // loading | ready | granted | declined | invalid | error
  const [agree, setAgree] = useState(false);
  const [share, setShare] = useState(false);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.guardianLookup(token).then(({ data }) => { setInfo(data); setState('ready'); })
      .catch(e => setState(errorCode(e) === 'LINK_INVALID_OR_EXPIRED' ? 'invalid' : 'error'));
  }, [api, token]);

  const act = async fn => {
    setBusy(true);
    try { await fn(); } catch (e) { setState(errorCode(e) === 'LINK_INVALID_OR_EXPIRED' ? 'invalid' : 'error'); } finally { setBusy(false); }
  };

  if (state === 'loading') return <Frame><p role="status">Loading…</p></Frame>;
  if (state === 'invalid') return <Frame title="This link has expired or was already used"><p>Ask your child to request a new link from their iMenteo dashboard.</p></Frame>;
  if (state === 'error') return <Frame title="Something went wrong"><p>Please check your connection and try the link again.</p></Frame>;
  if (state === 'granted') return <Frame title="Thank you"><div className="v4-alert ok" role="status">You have confirmed. {info.student.firstName} can now take the assessment.</div></Frame>;
  if (state === 'declined') return <Frame title="Understood"><div className="v4-alert info" role="status">We have recorded that you do not agree. {info.student.firstName} will not be able to take the assessment and their information will be removed.</div></Frame>;

  return (
    <Frame title={`Please confirm for ${info.student.firstName}`} narrow>
      <div className="v4-card">
        <p style={{ marginBottom: 12 }}>Hello {info.guardianName}. {info.student.firstName} would like to take the iMenteo career assessment. Because they are under 18, we need your agreement first.</p>
        <h2 className="v4-h2">What we collect</h2>
        <ul style={{ margin: '0 0 12px 18px', fontSize: 14 }}>{info.collects.map(c => <li key={c}>{c}</li>)}</ul>
        <h2 className="v4-h2">What it is for</h2>
        <p style={{ fontSize: 14, marginBottom: 12 }}>Only to give {info.student.firstName} a career guidance report. We do not sell it or use it for advertising. You can withdraw and ask for it to be deleted at any time.</p>
        <label className="v4-check" style={{ marginBottom: 12 }}>
          <input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} />
          <span><strong>Optional:</strong> let {info.student.firstName}'s school counsellor see their individual report. If you leave this unticked, the school only sees whether they have finished, and anonymous summaries of the whole class.</span>
        </label>
        <label className="v4-check" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
          <span>I am {info.student.firstName}'s parent or guardian, and I agree to the above.</span>
        </label>
        <div className="v4-row">
          <button className="v4-btn" disabled={!agree || busy} onClick={() => act(async () => { await api.guardianConfirm(token, { agree: true, shareWithSchool: share }); setState('granted'); })}>Confirm</button>
          {!confirmDecline
            ? <button className="v4-btn secondary" disabled={busy} onClick={() => setConfirmDecline(true)}>I do not agree</button>
            : <button className="v4-btn danger" disabled={busy} onClick={() => act(async () => { await api.guardianDecline(token); setState('declined'); })}>Yes, I do not agree</button>}
        </div>
      </div>
    </Frame>
  );
}
