import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scanPos, setScanPos] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [hoverLink, setHoverLink] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setScanPos(p => (p >= 100 ? 0 : p + 1.2)), 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate("/");
    setMenuOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="nb-root">
      {/* Scan line across bottom */}
      <div className="nb-scanline" style={{ width: `${scanPos}%` }} />

      {/* Corner accents */}
      <div className="nb-corner nb-corner-tl" />
      <div className="nb-corner nb-corner-tr" />

      <div className="nb-inner">

        {/* Logo */}
        <Link to="/" className="nb-logo-link">
          <div className="nb-logo-hex">
            <svg width="28" height="28" viewBox="0 0 30 30">
              <polygon points="15,2 27,8.5 27,21.5 15,28 3,21.5 3,8.5"
                fill="none" stroke="#00ff78" strokeWidth="1.5" />
              <polygon points="15,8 22,11.5 22,18.5 15,22 8,18.5 8,11.5"
                fill="rgba(0,255,120,0.08)" stroke="#00ff78" strokeWidth="0.8" />
            </svg>
            <span className="nb-logo-txt">
              {glitch && <span className="nb-glitch-r">PCB</span>}
              PCB
            </span>
          </div>
          <div className="nb-logo-right">
            <span className="nb-logo-title">DEFECT<span className="nb-logo-accent">DETECT</span></span>
            <span className="nb-logo-ver">v2.4.0</span>
          </div>
        </Link>

        {/* Center — model status */}
        <div className="nb-status">
          <div className="nb-status-dot" />
          <span className="nb-status-model">YOLOv8m</span>
          <span className="nb-status-sep" />
          <span className="nb-status-state">ACTIVE</span>
        </div>

        {/* Right side */}
        <div className="nb-right">
          {user ? (
            <>
              {/* Nav links */}
              {[
                { path: "/detect", label: "DETECT", icon: "⬡" },
              ].map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nb-nav-link${isActive(link.path) ? " nb-nav-active" : ""}`}
                  onMouseEnter={() => setHoverLink(link.path)}
                  onMouseLeave={() => setHoverLink(null)}
                >
                  <span className="nb-nav-icon">{link.icon}</span>
                  <span className="nb-nav-label">{link.label}</span>
                  {(isActive(link.path) || hoverLink === link.path) && (
                    <div className="nb-nav-underline" />
                  )}
                </Link>
              ))}

              {/* User chip */}
              <div className="nb-user-wrap" ref={menuRef}>
                <button onClick={() => setMenuOpen(o => !o)} className="nb-user-btn">
                  <div className="nb-user-avatar">
                    <span className="nb-avatar-letter">{user.name?.[0]?.toUpperCase() || "U"}</span>
                    <div className="nb-avatar-ring" />
                  </div>
                  <span className="nb-user-name">{user.name?.split(" ")[0]}</span>
                  <svg className={`nb-chevron${menuOpen ? " nb-chevron-open" : ""}`} width="10" height="10" viewBox="0 0 10 10">
                    <polyline points="2,3.5 5,6.5 8,3.5" fill="none" stroke="rgba(0,255,120,0.5)" strokeWidth="1.5" />
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="nb-dropdown">
                    <div className="nb-dropdown-scanline" />
                    <div className="nb-dropdown-header">
                      <div className="nb-dropdown-dot" />
                      <div className="nb-dropdown-info">
                        <span className="nb-dropdown-name">{user.name}</span>
                        <span className="nb-dropdown-email">{user.email}</span>
                      </div>
                    </div>
                    <div className="nb-dropdown-sep" />
                    <Link to="/detect" onClick={() => setMenuOpen(false)} className="nb-dropdown-item">
                      <span className="nb-dropdown-item-icon">◈</span>
                      <span>Run Detection</span>
                      <span className="nb-dropdown-arrow">→</span>
                    </Link>
                    <div className="nb-dropdown-sep" />
                    <button onClick={handleLogout} className="nb-dropdown-item nb-dropdown-logout">
                      <span className="nb-dropdown-item-icon">⏻</span>
                      <span>Sign Out</span>
                      <span className="nb-dropdown-arrow">→</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nb-signin">
                <span className="nb-signin-bracket">[</span>
                SIGN IN
                <span className="nb-signin-bracket">]</span>
              </Link>
              <Link to="/register" className="nb-register">
                <span className="nb-register-inner">
                  <span className="nb-register-dot" />
                  REGISTER
                </span>
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600&display=swap');

        @keyframes nb-pulse{0%,100%{box-shadow:0 0 4px #00ff78}50%{box-shadow:0 0 12px #00ff78,0 0 24px rgba(0,255,120,0.3)}}
        @keyframes nb-glow{0%,100%{opacity:0.6}50%{opacity:1}}
        @keyframes nb-slide-in{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}

        .nb-root{
          position:sticky;top:0;z-index:50;
          background:rgba(2,8,6,0.92);
          backdrop-filter:blur(20px);
          border-bottom:1px solid rgba(0,255,120,0.1);
          font-family:'Share Tech Mono',monospace;
          padding:0;
          overflow:visible;
        }
        .nb-scanline{
          position:absolute;bottom:0;left:0;height:1px;
          background:linear-gradient(90deg,transparent,#00ff78 60%,#00c8ff);
          box-shadow:0 0 8px rgba(0,255,120,0.4);
          transition:none;pointer-events:none;z-index:2;
        }
        .nb-corner{position:absolute;width:10px;height:10px;pointer-events:none;z-index:3}
        .nb-corner-tl{top:0;left:0;border-top:1px solid rgba(0,255,120,0.3);border-left:1px solid rgba(0,255,120,0.3)}
        .nb-corner-tr{top:0;right:0;border-top:1px solid rgba(0,255,120,0.3);border-right:1px solid rgba(0,255,120,0.3)}

        .nb-inner{
          max-width:1300px;margin:0 auto;
          padding:10px 16px;
          display:flex;align-items:center;justify-content:space-between;gap:12px;
        }

        /* Logo */
        .nb-logo-link{display:flex;align-items:center;gap:10px;text-decoration:none;-webkit-tap-highlight-color:transparent}
        .nb-logo-hex{position:relative;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .nb-logo-txt{
          position:absolute;
          font-family:'Orbitron',sans-serif;font-size:7px;font-weight:900;
          color:#00ff78;letter-spacing:1.5px;
        }
        .nb-glitch-r{
          position:absolute;top:0;left:0;
          color:rgba(255,0,80,0.5);
          transform:translate(1px,-1px);
          clip-path:inset(20% 0 50% 0);
          pointer-events:none;
        }
        .nb-logo-right{display:flex;flex-direction:column;gap:1px}
        .nb-logo-title{
          font-family:'Orbitron',sans-serif;font-size:11px;font-weight:700;
          color:#fff;letter-spacing:2px;line-height:1;
        }
        .nb-logo-accent{
          background:linear-gradient(90deg,#00ff78,#00c8ff);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .nb-logo-ver{font-size:7px;color:rgba(0,255,120,0.25);letter-spacing:1.5px}
        @media(max-width:480px){.nb-logo-right{display:none}}

        /* Status chip */
        .nb-status{
          display:none;align-items:center;gap:8px;
          border:1px solid rgba(0,255,120,0.15);
          background:rgba(0,255,120,0.03);
          padding:5px 14px;
        }
        @media(min-width:768px){.nb-status{display:flex}}
        .nb-status-dot{
          width:5px;height:5px;border-radius:50%;background:#00ff78;
          animation:nb-pulse 2s ease-in-out infinite;
        }
        .nb-status-model{font-size:9px;letter-spacing:1.5px;color:rgba(0,200,255,0.7)}
        .nb-status-sep{width:1px;height:10px;background:rgba(0,255,120,0.2)}
        .nb-status-state{font-size:8px;letter-spacing:2px;color:rgba(0,255,120,0.6)}

        /* Right */
        .nb-right{display:flex;align-items:center;gap:6px}

        /* Nav links */
        .nb-nav-link{
          display:none;align-items:center;gap:6px;
          text-decoration:none;
          padding:6px 14px;position:relative;
          transition:all 0.2s ease;
          -webkit-tap-highlight-color:transparent;
        }
        @media(min-width:640px){.nb-nav-link{display:flex}}
        .nb-nav-icon{font-size:10px;color:rgba(0,255,120,0.3)}
        .nb-nav-label{font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.35);transition:color 0.2s}
        .nb-nav-link:hover .nb-nav-label{color:rgba(255,255,255,0.8)}
        .nb-nav-active .nb-nav-label{color:#00ff78}
        .nb-nav-active .nb-nav-icon{color:#00ff78}
        .nb-nav-underline{
          position:absolute;bottom:0;left:14px;right:14px;height:1px;
          background:linear-gradient(90deg,transparent,#00ff78,transparent);
          box-shadow:0 0 6px rgba(0,255,120,0.4);
        }

        /* User */
        .nb-user-wrap{position:relative}
        .nb-user-btn{
          display:flex;align-items:center;gap:8px;
          background:rgba(0,255,120,0.04);
          border:1px solid rgba(0,255,120,0.15);
          padding:4px 12px 4px 4px;
          cursor:pointer;
          font-family:'Share Tech Mono',monospace;
          transition:all 0.2s ease;
          -webkit-tap-highlight-color:transparent;
        }
        .nb-user-btn:hover{border-color:rgba(0,255,120,0.35);background:rgba(0,255,120,0.07)}
        .nb-user-avatar{
          width:26px;height:26px;position:relative;
          display:flex;align-items:center;justify-content:center;
        }
        .nb-avatar-letter{
          font-family:'Orbitron',sans-serif;font-size:10px;font-weight:700;
          color:#00ff78;position:relative;z-index:1;
        }
        .nb-avatar-ring{
          position:absolute;inset:0;
          border:1px solid rgba(0,255,120,0.4);
          clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
        }
        .nb-user-name{
          font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,0.5);
          max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          display:none;
        }
        @media(min-width:640px){.nb-user-name{display:block}}
        .nb-chevron{transition:transform 0.2s ease}
        .nb-chevron-open{transform:rotate(180deg)}

        /* Dropdown */
        .nb-dropdown{
          position:absolute;right:0;top:calc(100% + 8px);
          width:220px;
          background:rgba(4,12,10,0.96);
          border:1px solid rgba(0,255,120,0.18);
          box-shadow:0 12px 40px rgba(0,0,0,0.6),0 0 30px rgba(0,255,120,0.06);
          backdrop-filter:blur(16px);
          overflow:hidden;
          animation:nb-slide-in 0.2s ease-out;
          z-index:60;
        }
        .nb-dropdown-scanline{
          position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,#00ff78,transparent);
        }
        .nb-dropdown-header{
          display:flex;align-items:center;gap:10px;
          padding:14px 16px;
        }
        .nb-dropdown-dot{
          width:8px;height:8px;border-radius:50%;
          background:#00ff78;flex-shrink:0;
          box-shadow:0 0 8px rgba(0,255,120,0.5);
        }
        .nb-dropdown-info{display:flex;flex-direction:column;gap:2px;min-width:0}
        .nb-dropdown-name{font-size:11px;color:rgba(255,255,255,0.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .nb-dropdown-email{font-size:9px;color:rgba(255,255,255,0.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .nb-dropdown-sep{height:1px;background:rgba(0,255,120,0.08)}
        .nb-dropdown-item{
          display:flex;align-items:center;gap:10px;
          padding:11px 16px;
          font-family:'Share Tech Mono',monospace;
          font-size:10px;letter-spacing:1.5px;
          color:rgba(255,255,255,0.4);
          cursor:pointer;text-decoration:none;
          transition:all 0.15s ease;
          background:none;border:none;width:100%;text-align:left;
          -webkit-tap-highlight-color:transparent;
        }
        .nb-dropdown-item:hover{background:rgba(0,255,120,0.06);color:#00ff78}
        .nb-dropdown-item-icon{font-size:11px;color:rgba(0,255,120,0.4);flex-shrink:0}
        .nb-dropdown-arrow{margin-left:auto;font-size:10px;opacity:0;transition:opacity 0.15s}
        .nb-dropdown-item:hover .nb-dropdown-arrow{opacity:0.5}
        .nb-dropdown-logout{color:rgba(255,80,80,0.6)}
        .nb-dropdown-logout:hover{color:#ff5050;background:rgba(255,50,50,0.06)}
        .nb-dropdown-logout .nb-dropdown-item-icon{color:rgba(255,80,80,0.5)}

        /* Sign in / Register (logged out) */
        .nb-signin{
          display:flex;align-items:center;gap:4px;
          text-decoration:none;
          font-size:9px;letter-spacing:2px;
          color:rgba(255,255,255,0.35);
          padding:7px 10px;
          transition:all 0.2s ease;
          -webkit-tap-highlight-color:transparent;
        }
        .nb-signin:hover{color:rgba(255,255,255,0.7)}
        .nb-signin-bracket{color:rgba(0,255,120,0.25);font-size:11px}
        .nb-signin:hover .nb-signin-bracket{color:rgba(0,255,120,0.6)}

        .nb-register{
          text-decoration:none;
          border:1px solid rgba(0,255,120,0.35);
          background:rgba(0,255,120,0.06);
          padding:7px 16px;
          transition:all 0.25s ease;
          clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
          -webkit-tap-highlight-color:transparent;
        }
        .nb-register:hover{
          background:rgba(0,255,120,0.12);
          border-color:rgba(0,255,120,0.6);
          box-shadow:0 0 20px rgba(0,255,120,0.15);
        }
        .nb-register-inner{
          display:flex;align-items:center;gap:7px;
          font-size:9px;letter-spacing:2.5px;
          color:#00ff78;font-weight:700;
          font-family:'Orbitron',sans-serif;
        }
        .nb-register-dot{
          width:4px;height:4px;border-radius:50%;
          background:#00ff78;
          box-shadow:0 0 6px #00ff78;
        }
      `}</style>
    </header>
  );
}