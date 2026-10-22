import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, Icon, PageHead, Pill } from '../../ui/kit';
import { loopApi, messageFor, BAND } from './loopApi';
import { PageSkeleton } from './Loader';
import AuthImage from './AuthImage';

/** One piece of work: the brief, what they made, and the feedback. */
function Piece({ it, onRemove }) {
  return (
    <Card>
      <div className="pf-portfolio-item">
        <div className="pf-row pf-wrap" style={{ gap: 8 }}>
          {it.source === 'levelup' ? <Pill tone="leaf" icon="award">Level-up proof · {it.levelTitle}</Pill> : <Pill tone="sky">Week {it.weekNumber} · {it.levelTitle}</Pill>}
          {it.band && BAND[it.band] && <Pill tone={BAND[it.band][1]}>{BAND[it.band][0]}</Pill>}
        </div>
        <p className="pf-small pf-muted" style={{ margin: 0 }}><b>The brief:</b> {it.brief}</p>
        {it.text && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{it.text}</p>}
        {it.photos.length > 0 && <div className="pf-row pf-wrap" style={{ gap: 8 }}>{it.photos.map((path, k) => <AuthImage key={path} path={path} alt={`Photo ${k + 1}`} />)}</div>}
        {it.link && <p className="pf-small" style={{ margin: 0 }}><Icon name="link" size={13} /> <a href={it.link} target="_blank" rel="noopener noreferrer">{it.link}</a>{it.linkPublic ? '' : ' (may not be public)'}</p>}
        {it.feedback && <p className="pf-small" style={{ margin: 0 }}><b>Feedback:</b> {it.feedback}</p>}
        <div><button type="button" className="pf-btn sm ghost" onClick={() => onRemove(it)}>Remove from portfolio</button></div>
      </div>
    </Card>
  );
}

export default function LoopPortfolioPage() {
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const run = async fn => { setErr(''); try { const r = await fn(); setP(r.data.portfolio); } catch (e) { setErr(messageFor(e)); } };
  useEffect(() => { run(() => loopApi.portfolio()); }, []);
  const head = <PageHead eyebrow="My portfolio" title="Proof of what you can do">Work you chose to keep: level-up proofs and pieces judged “Strong” or “Getting there”, with the brief and the feedback.</PageHead>;
  if (!p) return err ? <>{head}<p role="alert">{err}</p></> : <PageSkeleton label="Loading your portfolio" cards={2} />;
  const copy = async () => { try { await navigator.clipboard.writeText(p.share.url); setCopied(true); } catch { setCopied(false); } };
  return (
    <>
      {head}
      {err && <div className="pf-note" role="alert" style={{ marginBottom: 12 }}>{err}</div>}
      <Card style={{ marginBottom: 14 }}>
        <div className="pf-row pf-wrap" style={{ gap: 10 }}>
          <Icon name="link" size={16} />
          <b className="pf-grow">Share your portfolio</b>
          {p.share.allowed
            ? <label className="pf-row" style={{ gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={p.share.public} onChange={() => run(() => loopApi.sharePortfolio(!p.share.public))} />Anyone with the link can see it</label>
            : <span className="pf-small pf-muted">Public sharing is not available for students under 18 yet.</span>}
        </div>
        {p.share.public && p.share.url && (
          <div className="pf-row pf-wrap" style={{ gap: 8, marginTop: 10 }}>
            <input className="pf-input pf-grow" readOnly value={p.share.url} aria-label="Your portfolio link" />
            <button type="button" className="pf-btn sm" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
        )}
        <p className="pf-small pf-muted" style={{ margin: '8px 0 0' }}>The link shows your first name, your goal and the work below. Nothing else.</p>
      </Card>
      {p.items.length === 0
        ? <Card><Empty icon="award" title="Nothing here yet">When your weekly assessment is judged “Strong” or “Getting there”, or you pass a level-up, add it from your <Link to="../plan">weekly plan</Link>.</Empty></Card>
        : <div style={{ display: 'grid', gap: 14 }}>{p.items.map(it => <Piece key={it.id} it={it} onRemove={x => { if (window.confirm('Remove this from your portfolio?')) run(() => loopApi.removeFromPortfolio(x.id)); }} />)}</div>}
    </>
  );
}
