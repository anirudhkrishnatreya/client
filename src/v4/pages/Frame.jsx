import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeRouteFor } from '../../utils/homeRoute';
import logoImg from '../../assets/landing/logo.png';
import '../v4.css';

// Common page frame for v4 screens: logo, who is signed in, sign out.
export default function Frame({ children, title, narrow = false, bare = false }) {
  const nav = useNavigate();
  const auth = useAuth();
  const user = auth && auth.user;
  return (
    <div className="v4-shell">
      <header className="v4-top">
        <Link to={user ? homeRouteFor(user) : '/'} aria-label="iMenteo home"><img src={logoImg} alt="iMenteo" /></Link>
        {user && (
          <div className="v4-row" style={{ gap: 12 }}>
            <Link className="v4-btn secondary" style={{ padding: '6px 14px', minHeight: 36 }} to={homeRouteFor(user)}>Dashboard</Link>
            <span className="v4-muted v4-hide-sm">{user.fullName}</span>
            <button className="v4-btn secondary" style={{ padding: '6px 14px', minHeight: 36 }} onClick={() => { auth.clearSession(); nav('/login'); }}>Sign out</button>
          </div>
        )}
      </header>
      <main className="v4-main" style={bare ? { maxWidth: 'none', padding: 0 } : narrow ? { maxWidth: 560 } : undefined}>
        {title && <h1 className="v4-h1">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
