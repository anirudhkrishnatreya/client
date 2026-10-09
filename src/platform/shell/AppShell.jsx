import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { Avatar, Drawer, Pill } from '../ui/kit';
import { NAV, ROLE_LABEL } from './nav';
import { usePlatform } from '../data/store';
import logo from '../../assets/imenteo_logo.png';

const stored = () => { try { return localStorage.getItem('imenteo-platform-collapsed') === '1'; } catch { return false; } };

function Notifications({ items, onRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const unread = items.filter(n => n.unread).length;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="pf-iconbtn" aria-label={`Notifications${unread ? `, ${unread} new` : ''}`} aria-expanded={open} onClick={() => setOpen(o => !o)}><Icon name="bell" />{unread > 0 && <span className="dot" />}</button>
      {open && (
        <div role="menu" className="pf-card" style={{ position: 'absolute', right: 0, top: 50, width: 340, zIndex: 50, padding: 8 }}>
          <div className="pf-row pf-between" style={{ padding: '8px 10px' }}><b>Notifications</b>{unread > 0 && <button type="button" className="act" style={{ background: 'none', border: 0, color: 'var(--indigo)', fontWeight: 600 }} onClick={onRead}>Mark all read</button>}</div>
          {items.map(n => (
            <div key={n.id} className="pf-row" style={{ padding: '10px', borderRadius: 12, alignItems: 'flex-start', background: n.unread ? '#F7F8FD' : 'transparent' }}>
              <span className="pf-pill" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', borderRadius: 10 }}><Icon name={n.icon} size={16} /></span>
              <div className="pf-grow"><div style={{ fontSize: 14 }}>{n.text}</div><div className="pf-small pf-faint">{n.time}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ role }) {
  const { data } = usePlatform();
  const nav = useNavigate();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(stored);
  const [open, setOpen] = useState(false);
  const [ai, setAi] = useState(false);
  const [q, setQ] = useState('');
  const { actions } = usePlatform();
  const base = `/platform/${role}`;
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  const toggle = () => setCollapsed(c => { const n = !c; try { localStorage.setItem('imenteo-platform-collapsed', n ? '1' : '0'); } catch { /* ignore */ } return n; });

  const items = useMemo(() => NAV[role].flatMap(s => s.items), [role]);
  const current = items.find(i => (i.end ? loc.pathname === base || loc.pathname === `${base}/` : loc.pathname.startsWith(`${base}/${i.to}`))) || items[0];
  const me = data && data.me;
  const counts = data ? {
    tasks: role === 'student' ? data.tasks.filter(t => t.status !== 'done').length : 0,
    sessions: role === 'mentor' ? data.sessions.filter(s => !s.prepped).length : 0
  } : {};
  const onSearch = e => { e.preventDefault(); const hit = items.find(i => i.label.toLowerCase().includes(q.trim().toLowerCase())); if (hit && q.trim()) { nav(`${base}/${hit.to}`); setQ(''); } };

  return (
    <div className="pf">
      <div className={`pf-shell${collapsed ? ' collapsed' : ''}${open ? ' open' : ''}`}>
        <aside className="pf-side" aria-label="Main navigation">
          <div className="pf-brand"><Link to="/platform" className="chip" aria-label="iMenteo, choose another view"><img src={logo} alt="iMenteo" /></Link></div>
          <div className="pf-roleswitch"><span>{ROLE_LABEL[role]} view</span><Link to="/platform" style={{ color: '#FFC56B', fontSize: 12, textDecoration: 'none' }} title="Switch view"><Icon name="repeat" size={15} /></Link></div>
          <nav className="pf-nav">
            {NAV[role].map(sec => (
              <div key={sec.section}>
                <h6>{sec.section}</h6>
                {sec.items.map(i => (
                  <NavLink key={i.label} to={i.to ? `${base}/${i.to}` : base} end={i.end} className={({ isActive }) => `pf-link${isActive ? ' active' : ''}`} title={i.label}>
                    <Icon name={i.icon} /><span>{i.label}</span>{i.badge && counts[i.badge] > 0 && <span className="badge">{counts[i.badge]}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="pf-user"><Avatar name={me ? me.name : '…'} size={38} /><div className="who"><b>{me ? me.name : 'Loading…'}</b><small>{ROLE_LABEL[role]}{role === 'student' && me ? ` · Class ${me.klass}` : ''}</small></div></div>
          <button type="button" className="pf-collapse" onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={16} /><span style={{ display: collapsed ? 'none' : 'inline' }}>Collapse</span></button>
        </aside>
        <div className="pf-scrim" onClick={() => setOpen(false)} />
        <div className="pf-main">
          <header className="pf-top">
            <button type="button" className="pf-iconbtn pf-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
            <div><div className="crumb">{ROLE_LABEL[role]}{me && role !== 'student' ? '' : ''}</div><h1>{current.label}</h1></div>
            <form className="pf-search" onSubmit={onSearch} role="search"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Jump to a page" aria-label="Jump to a page" /></form>
            {role === 'student'
              ? <button type="button" className="pf-ask" onClick={() => nav(`${base}/coach`)}><Icon name="sparkles" size={18} />Ask AI coach</button>
              : <button type="button" className="pf-ask" onClick={() => setAi(true)}><Icon name="sparkles" size={18} />AI summary</button>}
            {data && <Notifications items={data.notifications || []} onRead={actions.markRead || (() => {})} />}
          </header>
          <main className="pf-content">{data ? <Outlet /> : <div role="status" className="pf-card"><div className="pf-muted">Loading your dashboard…</div></div>}</main>
        </div>
      </div>
      <Drawer open={ai} title="AI summary" onClose={() => setAi(false)}>
        <div className="pf-ai pf-card" style={{ marginBottom: 14 }}><span className="tag"><Icon name="sparkles" size={14} />Sample summary</span>
          <p style={{ marginTop: 8 }}>{role === 'mentor' ? 'Six of your eight students had a steady week. Two need a conversation before their next session: Rohan has been away for nine days, and Kabir missed every study block.' : 'Aarav had a steady week. He finished four of five planned study days, and his Python score is up twelve points. One task is due tomorrow.'}</p></div>
        <p className="pf-small pf-muted">Summaries like this will be written by the platform’s AI from the real activity and scores. This preview shows what they will look like.</p>
      </Drawer>
      <div className="pf-demo" role="note"><Pill tone="gold">Sample data</Pill><span>Preview with made-up students</span>{actions.reset && <button type="button" onClick={actions.reset} style={{ background: 'none', border: 0, color: '#FFC56B', textDecoration: 'underline' }}>Reset</button>}</div>
    </div>
  );
}
