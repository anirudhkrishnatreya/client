import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../platform/theme/platform.css';
import logo from '../assets/imenteo_logo.png';
import { Icon, Pill } from '../platform/ui/kit';
import { adminApi, storedAdmin, ROLE, can } from './adminApi';

const NAV = [
  { section: 'Watch', items: [{ to: '', label: 'Overview', icon: 'grid', end: true }, { to: 'ai', label: 'AI usage', icon: 'sparkles' }, { to: 'loop', label: 'Learning loop', icon: 'target' }] },
  { section: 'People', items: [{ to: 'users', label: 'Accounts', icon: 'users' }, { to: 'schools', label: 'Schools', icon: 'cap', href: '/admin/orgs', manage: true }] },
  { section: 'Control', items: [{ to: 'admins', label: 'Admins', icon: 'shield', manage: true }, { to: 'audit', label: 'Audit log', icon: 'file' }, { to: 'settings', label: 'Settings', icon: 'settings' }] }
];

/** The console's frame: the sidebar (what this admin's role may open), who is signed in, and the page. */
export default function AdminShell() {
  const nav = useNavigate();
  const loc = useLocation();
  const [me, setMe] = useState(storedAdmin());
  const [open, setOpen] = useState(false);
  useEffect(() => { adminApi.me().then(r => { setMe(r.data.admin); localStorage.setItem('im_admin', JSON.stringify(r.data.admin)); }).catch(() => {}); }, []);
  useEffect(() => setOpen(false), [loc.pathname]);
  const signOut = () => { localStorage.removeItem('im_admin_token'); localStorage.removeItem('im_admin'); nav('/admin/login', { replace: true }); };
  const items = NAV.flatMap(s => s.items);
  const current = items.find(i => (i.to ? loc.pathname.startsWith(`/admin/${i.to}`) : loc.pathname === '/admin' || loc.pathname === '/admin/')) || items[0];
  return (
    <div className="pf">
      <div className={`pf-shell${open ? ' open' : ''}`}>
        <aside className="pf-side" aria-label="Admin navigation">
          <div className="pf-brand"><Link to="/admin" className="chip" aria-label="Admin home"><img src={logo} alt="iMenteo" /></Link></div>
          <div className="pf-roleswitch"><span>Admin console</span></div>
          <nav className="pf-nav">
            {NAV.map(sec => {
              const shown = sec.items.filter(i => !i.manage || can(me, 'manage'));
              return shown.length ? (
                <div key={sec.section}>
                  <h6>{sec.section}</h6>
                  {shown.map(i => i.href
                    ? <Link key={i.label} to={i.href} className="pf-link" title={i.label}><Icon name={i.icon} /><span>{i.label}</span></Link>
                    : <NavLink key={i.label} to={i.to ? `/admin/${i.to}` : '/admin'} end={i.end} className={({ isActive }) => `pf-link${isActive ? ' active' : ''}`} title={i.label}><Icon name={i.icon} /><span>{i.label}</span></NavLink>)}
                </div>
              ) : null;
            })}
          </nav>
          <div className="pf-user" style={{ marginTop: 'auto' }}>
            <div className="who"><b>{me ? me.username : '…'}</b><small>{me ? `${ROLE[me.role] || me.role} · ${me.email}` : ''}</small></div>
          </div>
          <button type="button" className="pf-btn sm ghost" style={{ margin: '8px 6px 0' }} onClick={signOut}><Icon name="logout" size={15} />Sign out</button>
        </aside>
        <div className="pf-scrim" onClick={() => setOpen(false)} />
        <div className="pf-main">
          <header className="pf-top">
            <button type="button" className="pf-iconbtn pf-menu-btn" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}><Icon name={open ? 'x' : 'menu'} /></button>
            <div><div className="crumb">Admin</div><h1>{current.label}</h1></div>
            <div className="pf-grow" />
            {me && <Pill tone={me.role === 'superadmin' ? 'coral' : me.role === 'admin' ? 'gold' : 'sky'} icon="shield">{ROLE[me.role] || me.role}</Pill>}
          </header>
          <main className="pf-content"><Outlet context={{ me }} /></main>
        </div>
      </div>
    </div>
  );
}
