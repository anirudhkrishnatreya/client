import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_URL } from '../api';

const BAND = { strong: 'Strong', 'getting-there': 'Getting there', 'not-yet': 'Not yet' };

/** A student's shared portfolio, for anyone with the link: first name, goal, and the work they chose. */
export default function PublicPortfolio() {
  const { token } = useParams();
  const [p, setP] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => { api.get(`/v2/portfolio/${encodeURIComponent(token)}`).then(r => setP(r.data.portfolio)).catch(() => setMissing(true)); }, [token]);
  const shell = children => <main style={{ minHeight: '100vh', background: '#f5f6fa', padding: '32px 16px', fontFamily: 'inherit' }}><div style={{ maxWidth: 760, margin: '0 auto' }}>{children}</div></main>;
  if (missing) return shell(<div role="status" style={{ background: '#fff', borderRadius: 16, padding: 28, textAlign: 'center' }}><h1 style={{ fontSize: 22 }}>This portfolio is not shared</h1><p style={{ color: '#667085' }}>The link may be old, or its owner stopped sharing it.</p></div>);
  if (!p) return shell(<p role="status">Loading…</p>);
  return shell(
    <>
      <p style={{ color: '#667085', fontSize: 13, margin: 0 }}>iMenteo portfolio</p>
      <h1 style={{ fontSize: 28, margin: '4px 0 6px' }}>{p.name}’s work</h1>
      {p.goal && <p style={{ margin: '0 0 20px', color: '#344054' }}>Working towards: <b>{p.goal}</b></p>}
      {p.items.length === 0 && <p style={{ color: '#667085' }}>Nothing here yet.</p>}
      <div style={{ display: 'grid', gap: 14 }}>
        {p.items.map((it, k) => (
          <article key={k} style={{ background: '#fff', border: '1px solid #e6e9f0', borderRadius: 14, padding: 18 }}>
            <p style={{ fontSize: 12, color: '#667085', margin: '0 0 6px' }}>{it.source === 'levelup' ? `Level-up proof · ${it.levelTitle}` : it.levelTitle}{it.band ? ` · ${BAND[it.band]}` : ''}</p>
            <p style={{ fontSize: 14, color: '#475467', margin: '0 0 8px' }}><b>The brief:</b> {it.brief}</p>
            {it.text && <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 8px' }}>{it.text}</p>}
            {it.photos.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 8px' }}>{it.photos.map((path, j) => <a key={path} href={`${API_URL}${path}`} target="_blank" rel="noopener noreferrer"><img src={`${API_URL}${path}`} alt={`Photo ${j + 1}`} style={{ width: 200, height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #e6e9f0' }} /></a>)}</div>}
            {it.link && <p style={{ fontSize: 14, margin: '0 0 8px' }}><a href={it.link} target="_blank" rel="noopener noreferrer nofollow">{it.link}</a></p>}
            {it.feedback && <p style={{ fontSize: 13, color: '#475467', margin: 0 }}><b>Reviewer’s feedback:</b> {it.feedback}</p>}
          </article>
        ))}
      </div>
    </>
  );
}
