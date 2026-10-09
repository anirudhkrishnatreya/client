import { Link } from 'react-router-dom';
import logo from '../assets/landing/logo.png';
import hero2 from '../assets/landing/hero-2-shape.png';
import hero3 from '../assets/landing/hero-3.png';
import hero4 from '../assets/landing/hero-4-shape.png';
import hero6 from '../assets/landing/hero-6-photo.png';
import hero7 from '../assets/landing/hero-7.png';
import './auth.css';

/**
 * Sign-in, sign-up and parent-link pages share this look: the landing page's soft pink panel, shaped photos and Syne
 * headline on the left, the form on the right. On a phone the panel is hidden and only the form shows.
 */
export default function AuthLayout({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className="au">
      <aside className="au-side" aria-hidden="true">
        <div className="au-side-in">
          <h2 className="au-h">Grow your future<br />&amp; skills<br />with <i>mentors</i></h2>
          <ul className="au-ticks">
            <li>A career assessment that shows what fits you</li>
            <li>A mentor who meets you every week</li>
            <li>Progress your parents can follow too</li>
          </ul>
        </div>
        <div className="au-photos">
          <img src={hero3} alt="" className="a" />
          <img src={hero4} alt="" className="b" />
          <div className="c"><img src={hero6} alt="" /></div>
          <img src={hero2} alt="" className="d" />
          <img src={hero7} alt="" className="e" />
        </div>
      </aside>
      <main className="au-main">
        <div className={`au-card${wide ? ' wide' : ''}`}>
          <Link to="/" className="au-logo" aria-label="iMenteo home"><img src={logo} alt="iMenteo" /></Link>
          {title && <h1 className="au-title">{title}</h1>}
          {subtitle && <p className="au-sub">{subtitle}</p>}
          <div className="au-body">{children}</div>
          {footer && <p className="au-foot">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
