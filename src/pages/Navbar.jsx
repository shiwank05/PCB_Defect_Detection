import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function PCBLogo({ accent = "#00ff78", size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.7" />
      <rect x="16" y="18" width="16" height="12" rx="1" stroke={accent} strokeWidth="1.2" fill={`${accent}15`} />
      <line x1="4" y1="21" x2="16" y2="21" stroke={accent} strokeWidth="1.2" opacity="0.8" />
      <line x1="4" y1="27" x2="16" y2="27" stroke={accent} strokeWidth="1.2" opacity="0.8" />
      <line x1="32" y1="21" x2="44" y2="21" stroke={accent} strokeWidth="1.2" opacity="0.8" />
      <line x1="32" y1="27" x2="44" y2="27" stroke={accent} strokeWidth="1.2" opacity="0.8" />
      <circle cx="24" cy="24" r="3" fill={accent} opacity="0.9" />
    </svg>
  );
}

const ROUTE_META = {
  "/":       { label: "HOME",   crumbs: [] },
  "/detect": { label: "DETECT", crumbs: ["HOME"] },
  "/result": { label: "RESULT", crumbs: ["HOME", "DETECT"] },
};
const CRUMB_PATHS = { HOME: "/", DETECT: "/detect" };

export default function Navbar({ accent = "#00ff78" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scanX, setScanX] = useState(0);
  const path = location.pathname;
  const meta = ROUTE_META[path] || ROUTE_META["/"];
  const rgb = accent === "#00ff78" ? "0,255,120" : "255,68,85";

  useEffect(() => {
    const id = setInterval(() => setScanX(x => (x + 1.5) % 102), 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setOpen(false); }, [path]);

  const links = [
    { path: "/", label: "HOME", icon: "⌂" },
    { path: "/detect", label: "DETECT", icon: "◎" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
        @keyframes nb-blink{0%,100%{opacity:1}50%{opacity:0.15}}
        @keyframes nb-glow{0%,100%{box-shadow:0 0 5px ${accent}}50%{box-shadow:0 0 15px ${accent},0 0 30px rgba(${rgb},0.4)}}

        *{box-sizing:border-box}

        .nb{
          position:relative;z-index:200;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 16px;height:56px;
          background:rgba(2,8,6,0.95);
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          border-bottom:1px solid rgba(${rgb},0.15);
          flex-shrink:0;overflow:visible;
        }
        .nb-scan{position:absolute;top:0;left:0;right:0;height:1px;pointer-events:none;z-index:5}

        .nb-logo{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;flex-shrink:0;min-width:0}
        .nb-logo-icon{
          width:32px;height:32px;display:flex;align-items:center;justify-content:center;
          border:1px solid rgba(${rgb},0.4);border-radius:3px;background:rgba(0,0,0,0.6);
          flex-shrink:0;animation:nb-glow 2.5s ease-in-out infinite
        }
        .nb-logo-words{display:flex;align-items:center;flex-shrink:1;min-width:0;overflow:hidden}
        .nb-logo-pcb{font-family:'Orbitron',sans-serif;font-size:13px;font-weight:900;color:#fff;letter-spacing:2px;white-space:nowrap}
        .nb-logo-sep{color:${accent};font-size:14px;margin:0 1px}
        .nb-logo-inspect{font-family:'Orbitron',sans-serif;font-size:12px;font-weight:400;color:rgba(255,255,255,0.45);letter-spacing:1.5px;white-space:nowrap}
        .nb-ai{
          flex-shrink:0;display:flex;align-items:center;gap:3px;margin-left:6px;
          padding:2px 6px;border:1px solid rgba(255,255,255,0.1);border-radius:1px
        }
        .nb-ai-dot{width:4px;height:4px;border-radius:50%;background:${accent};display:inline-block;animation:nb-blink 1.6s ease-in-out infinite}
        .nb-ai-txt{font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:1.5px;color:${accent}}

        @media(max-width:340px){.nb-logo-inspect{display:none}}

        .nb-center{display:none;flex-direction:column;align-items:center;gap:5px;flex:1;max-width:280px}
        .nb-crumbs{display:flex;align-items:center;gap:5px;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:2px}
        .nb-crumb-link{color:rgba(255,255,255,0.2);cursor:pointer;transition:color 0.2s}
        .nb-crumb-link:hover{color:rgba(255,255,255,0.55)}
        .nb-crumb-sep{color:rgba(255,255,255,0.1)}
        .nb-crumb-active{color:${accent}}
        .nb-chip{
          display:flex;align-items:center;gap:6px;padding:3px 10px;
          border:1px solid rgba(${rgb},0.2);background:rgba(${rgb},0.04);
          font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:1.5px
        }
        .nb-chip-dot{width:5px;height:5px;border-radius:50%;background:${accent};animation:nb-blink 1.2s ease-in-out infinite}
        .nb-chip-txt{color:rgba(${rgb},0.7)}
        .nb-chip-sep{width:1px;height:10px;background:rgba(255,255,255,0.1)}
        .nb-chip-model{color:rgba(255,255,255,0.18)}

        .nb-nav{display:none;align-items:center;gap:24px}
        .nb-nav-link{
          display:flex;align-items:center;gap:6px;cursor:pointer;
          position:relative;padding-bottom:4px;
          font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2.5px;
          transition:color 0.25s
        }
        .nb-nav-link:hover{color:${accent}!important}
        .nb-nav-link:hover .nb-nav-line{width:100%!important}
        .nb-nav-icon{font-size:11px;opacity:0.5}
        .nb-nav-line{position:absolute;bottom:-2px;left:0;height:1px;transition:width 0.3s ease}
        .nb-nav-dot{position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);width:3px;height:3px;border-radius:50%;background:${accent};box-shadow:0 0 5px ${accent}}
        .nb-sep{width:1px;height:18px;background:rgba(${rgb},0.15)}

        .nb-burger{
          display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center;
          width:44px;height:44px;cursor:pointer;background:none;border:none;padding:0;
          flex-shrink:0
        }
        .nb-burger-bar{width:22px;height:1.5px;background:rgba(${rgb},0.8);border-radius:1px;transition:all 0.3s ease;display:block}
        .nb-burger.open .nb-burger-bar:nth-child(1){transform:translateY(6.5px) rotate(45deg)}
        .nb-burger.open .nb-burger-bar:nth-child(2){opacity:0;transform:scaleX(0)}
        .nb-burger.open .nb-burger-bar:nth-child(3){transform:translateY(-6.5px) rotate(-45deg)}

        .nb-drawer{
          position:fixed;top:56px;left:0;right:0;
          background:rgba(1,5,4,0.98);
          border-bottom:1px solid rgba(${rgb},0.2);
          z-index:199;
          max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.4,0,0.2,1)
        }
        .nb-drawer.open{max-height:400px}
        .nb-drawer-inner{padding:6px 0 20px}
        .nb-drawer-link{
          display:flex;align-items:center;gap:14px;
          padding:18px 24px;cursor:pointer;
          font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;
          color:rgba(255,255,255,0.38);
          border-bottom:1px solid rgba(255,255,255,0.04);
          transition:all 0.2s;min-height:60px
        }
        .nb-drawer-link:hover{background:rgba(${rgb},0.05);color:${accent}}
        .nb-drawer-link.active{color:${accent};background:rgba(${rgb},0.04)}
        .nb-drawer-icon{font-size:16px;width:24px;text-align:center}
        .nb-drawer-badge{margin-left:auto;font-size:8px;letter-spacing:2px;color:${accent};opacity:0.7}
        .nb-drawer-status{
          margin:14px 20px 0;padding:10px 16px;
          border:1px solid rgba(${rgb},0.12);background:rgba(${rgb},0.03);
          display:flex;align-items:center;gap:8px;
          font-family:'Share Tech Mono',monospace;font-size:9px;
          color:rgba(255,255,255,0.25);letter-spacing:1.5px
        }
        .nb-drawer-status-dot{width:5px;height:5px;border-radius:50%;background:${accent};flex-shrink:0;animation:nb-blink 1.2s ease-in-out infinite}

        @media(min-width:768px){
          .nb{padding:0 32px;height:62px}
          .nb-center{display:flex}
          .nb-nav{display:flex}
          .nb-burger{display:none}
          .nb-drawer{display:none}
        }
      `}</style>

      <header className="nb">
        <div className="nb-scan" style={{
          background: `linear-gradient(90deg,transparent ${scanX - 10}%,rgba(${rgb},0) ${scanX - 8}%,rgba(${rgb},0.9) ${scanX}%,rgba(${rgb},0) ${scanX + 8}%,transparent ${scanX + 10}%)`
        }} />

        <div className="nb-logo" onClick={() => navigate("/")} role="button" tabIndex={0}>
          <div className="nb-logo-icon"><PCBLogo accent={accent} size={20} /></div>
          <div className="nb-logo-words">
            <span className="nb-logo-pcb">PCB</span>
            <span className="nb-logo-sep">·</span>
            <span className="nb-logo-inspect">INSPECT</span>
          </div>
          <div className="nb-ai">
            <span className="nb-ai-dot" />
            <span className="nb-ai-txt">AI</span>
          </div>
        </div>

        <div className="nb-center">
          <div className="nb-crumbs">
            {meta.crumbs.map(c => (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="nb-crumb-link" onClick={() => navigate(CRUMB_PATHS[c])}>{c}</span>
                <span className="nb-crumb-sep">›</span>
              </span>
            ))}
            <span className="nb-crumb-active">{meta.label}</span>
          </div>
          <div className="nb-chip">
            <span className="nb-chip-dot" />
            <span className="nb-chip-txt">ONLINE</span>
            <span className="nb-chip-sep" />
            {/* ✅ Updated: CNN-48L → YOLOv8m */}
            <span className="nb-chip-model">YOLOv8m</span>
          </div>
        </div>

        <nav className="nb-nav">
          {links.map(l => {
            const active = path === l.path;
            return (
              <div key={l.path} className="nb-nav-link" onClick={() => navigate(l.path)}
                style={{ color: active ? accent : "rgba(255,255,255,0.3)" }}>
                <span className="nb-nav-icon">{l.icon}</span>
                <span>{l.label}</span>
                <div className="nb-nav-line" style={{
                  width: active ? "100%" : "0%",
                  background: `linear-gradient(90deg,transparent,${accent},transparent)`,
                  boxShadow: active ? `0 0 6px ${accent}` : "none"
                }} />
                {active && <div className="nb-nav-dot" />}
              </div>
            );
          })}
          <div className="nb-sep" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18 }}>
            {[1, 0.6, 0.3].map((h, i) => (
              <div key={i} style={{ width: 3, height: `${8 + h * 10}px`, borderRadius: 1, background: accent, opacity: 0.2 + h * 0.7 }} />
            ))}
          </div>
        </nav>

        <button className={`nb-burger${open ? " open" : ""}`} onClick={() => setOpen(o => !o)} aria-label="Menu">
          <span className="nb-burger-bar" />
          <span className="nb-burger-bar" />
          <span className="nb-burger-bar" />
        </button>
      </header>

      <div className={`nb-drawer${open ? " open" : ""}`}>
        <div className="nb-drawer-inner">
          {links.map(l => (
            <div key={l.path} className={`nb-drawer-link${path === l.path ? " active" : ""}`}
              onClick={() => navigate(l.path)}>
              <span className="nb-drawer-icon">{l.icon}</span>
              <span>{l.label}</span>
              {path === l.path && <span className="nb-drawer-badge">● ACTIVE</span>}
            </div>
          ))}
          {/* ✅ Updated: CNN-48L → YOLOv8m, 98.6% ACC → 93.6% mAP */}
          <div className="nb-drawer-status">
            <span className="nb-drawer-status-dot" />
            <span>SYSTEM ONLINE · YOLOv8m · 93.6% mAP</span>
          </div>
        </div>
      </div>
    </>
  );
}