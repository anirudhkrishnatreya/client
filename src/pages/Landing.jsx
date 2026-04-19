import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/imenteo_logo.png';
import groupImg from '../assets/Group.png';
import './Landing.css';

export default function Landing() {
  const nav = useNavigate();
  const { isLoggedIn } = useAuth();

  const handleActionClick = () => {
    if (isLoggedIn) {
      nav('/dashboard');
    } else {
      nav('/login');
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-auto flex flex-col items-center text-center bg-gradient-to-b from-[#F8C8BD] via-[#fae3df] to-[#FFFFFF] relative">

      {/* Top Logo */}
      <div className="mt-[6vh] lg:mt-[8vh] flex-shrink-0 relative z-10">
        <img src={logoImg} alt="Menteo Logo" className="h-14 md:h-16 lg:h-20 w-auto" />
      </div>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 w-full px-5 relative z-10 max-w-4xl">
        <div className="mt-[2vh] md:mt-[4vh]">
          <h1 className="font-['Syne',sans-serif] text-[38px] md:text-[50px] lg:text-[60px] font-bold leading-none uppercase text-black mb-8 md:mb-12">
            COMING <span className="text-[#2B64F1]">SOON...</span>
          </h1>

          <p className="font-['DM_Sans',sans-serif] text-[15px] md:text-base font-normal leading-relaxed text-black/70 max-w-[637px] mx-auto px-2 mb-10 md:mb-14">
            Embark on a Transformative Journey: Cultivate Your Talents and Expand Your Horizons
            with the Guidance of Seasoned Mentors and State of the art AI Engine, Unleashing your Full Potential.
          </p>

          <div className="btn-container mt-6 md:mt-8" onClick={handleActionClick} role="button" tabIndex={0}>
            <div className="btn-drawer transition-top">Free Tool</div>
            <div className="btn-drawer transition-bottom">~15 Mins</div>

            <button className="btn">
              <span className="btn-text">Try Free Career Assessment Test</span>
            </button>

            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
              <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
            </svg>
            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
              <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
            </svg>
            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
              <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
            </svg>
            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
              <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
            </svg>
          </div>

          <div className="mt-6 md:mt-8 text-[13px] md:text-sm text-black/60 font-['DM_Sans',sans-serif]">
            {/* {!isLoggedIn && (
              <span>
                Already registered? <Link to="/login" className="text-[#2B64F1] font-bold no-underline ml-1">Sign in →</Link>
              </span>
            )} */}
          </div>

          <div className="mt-4 md:mt-6">
            {/* <button onClick={() => nav('/admin/login')} className="bg-transparent border-none text-black/40 text-xs cursor-pointer hover:underline font-['DM_Sans',sans-serif]">
                Admin Portal →
            </button> */}
          </div>
        </div>
      </main>

      {/* Bottom Full-Width Image */}
      <div className="w-full flex-shrink-0 flex items-end justify-center pointer-events-none">
        <img
          src={groupImg}
          alt="Community Photos"
          className="w-full h-auto max-h-[35vh] md:max-h-[45vh] lg:max-h-[50vh] object-cover object-bottom"
        />
      </div>
    </div>
  );
}
