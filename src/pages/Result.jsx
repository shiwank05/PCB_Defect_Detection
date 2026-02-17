import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Navbar from "./Navbar";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const isDefect = state.result === "defect";
  const fileName    = state.fileName    || "pcb_sample.jpg";
  const boardId     = state.boardId     || "PCB-UNKNOWN";
  const scanTime    = state.scanTime    || "1.84";
  const defectCount = state.defectCount ?? (isDefect ? 2 : 0);
  const affectedArea = state.affectedArea || (isDefect ? "12%" : "0%");
  const analysis    = state.analysis    || [];
  const targetConf  = state.confidence  || (isDefect ? 89 : 97);

  const [revealed, setRevealed] = useState(false);
  const [conf, setConf] = useState(0);
  const [barWidths, setBarWidths] = useState(analysis.map(() => 0));
  const [glitch, setGlitch] = useState(false);
  const canvasRef = useRef(null);

  const accent   = isDefect ? "#ff4455" : "#00ff78";
  const accentB  = isDefect ? "rgba(255,68,85,0.18)" : "rgba(0,255,120,0.12)";
  const accentBo = isDefect ? "rgba(255,68,85,0.35)" : "rgba(0,255,120,0.3)";
  const accentRgb = isDefect ? "255,68,85" : "0,255,120";

  useEffect(() => { setTimeout(() => setRevealed(true), 250); }, []);

  useEffect(() => {
    if (!revealed) return;
    let c = 0;
    const id = setInterval(() => {
      c += 1.8;
      if (c >= targetConf) { setConf(targetConf); clearInterval(id); }
      else setConf(Math.round(c));
    }, 18);
    analysis.forEach((item, i) => {
      setTimeout(() => setBarWidths(prev => { const n = [...prev]; n[i] = item.bar; return n; }), 500 + i * 180);
    });
    return () => clearInterval(id);
  }, [revealed]);

  useEffect(() => {
    setTimeout(() => { setGlitch(true); setTimeout(() => setGlitch(false), 300); }, 600);
    setTimeout(() => { setGlitch(true); setTimeout(() => setGlitch(false), 200); }, 1100);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analysis.length) return;
    const ctx = canvas.getContext("2d");
    // Responsive canvas size
    const size = Math.min(160, window.innerWidth * 0.38);
    canvas.width = size; canvas.height = size;
    const cx = size / 2, cy = size / 2, R = size * 0.38;
    let angle = 0, animId;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      [1, 0.66, 0.33].forEach(r => {
        ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${accentRgb},0.1)`; ctx.lineWidth = 1; ctx.stroke();
      });
      analysis.forEach((item, i) => {
        const a = (Math.PI * 2 * i) / analysis.length - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
        ctx.strokeStyle = `rgba(${accentRgb},0.15)`; ctx.lineWidth = 1; ctx.stroke();
        const lx = cx + (R + 14) * Math.cos(a), ly = cy + (R + 14) * Math.sin(a);
        ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.font = `6px 'Share Tech Mono'`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(item.label.split(" ")[0].slice(0,5).toUpperCase(), lx, ly);
      });
      ctx.beginPath();
      analysis.forEach((item, i) => {
        const a = (Math.PI * 2 * i) / analysis.length - Math.PI / 2;
        const r = R * (item.bar / 100);
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a)) : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      });
      ctx.closePath();
      ctx.fillStyle = `rgba(${accentRgb},0.1)`; ctx.fill();
      ctx.strokeStyle = accent; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = `rgba(${accentRgb},0.45)`; ctx.lineWidth = 1.2; ctx.stroke();
      angle += 0.025;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [revealed, analysis, isDefect]);

  const levelColor = lvl => {
    if (lvl === "HIGH") return "#ff4455";
    if (lvl === "MEDIUM") return "#ffaa00";
    if (lvl === "LOW") return "#ffdd44";
    if (lvl === "EXCELLENT") return "#00ff78";
    return "#00c8ff";
  };

  return (
    <div className="rs-root">
      <div className="rs-grid" />
      <div className="rs-vignette" />
      <div className="rs-noise" />
      <div className="rs-glow" style={{ background: `radial-gradient(circle,${isDefect ? "rgba(255,50,60,0.06)" : "rgba(0,255,120,0.05)"} 0%,transparent 70%)` }} />

      <Navbar accent={accent} />

      <main className="rs-main" style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(16px)", transition: "all 0.9s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* ── VERDICT CARD (full width on mobile) ── */}
        <div className="rs-verdict-card" style={{ borderColor: accentBo, background: accentB }}>
          <div className="rs-verdict-icon-wrap">
            {glitch && <span className="rs-glitch-r" style={{ color: isDefect ? "rgba(255,0,60,0.45)" : "rgba(0,200,255,0.35)" }}>{isDefect ? "⚠" : "✓"}</span>}
            {glitch && <span className="rs-glitch-b" style={{ color: isDefect ? "rgba(0,200,255,0.35)" : "rgba(255,0,100,0.25)" }}>{isDefect ? "⚠" : "✓"}</span>}
            <span className="rs-verdict-icon" style={{ color: accent }}>{isDefect ? "⚠" : "✓"}</span>
          </div>
          <div className="rs-verdict-row">
            <div>
              <div className="rs-verdict-label" style={{ color: accent }}>{isDefect ? "DEFECT DETECTED" : "BOARD PASSED"}</div>
              <div className="rs-verdict-sub">{isDefect ? "Manufacturing defects identified. Board requires rework before deployment." : "No defects detected. Board meets all quality control standards."}</div>
            </div>
            {/* Ring */}
            <div className="rs-ring-wrap">
              <svg width="100" height="100" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*50}`}
                  strokeDashoffset={`${2*Math.PI*50*(1-conf/100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition:"stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter:`drop-shadow(0 0 5px ${accent})` }}
                />
              </svg>
              <div className="rs-ring-inner">
                <span className="rs-ring-val" style={{ color: accent }}>{conf}%</span>
                <span className="rs-ring-lbl">CONF.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-COL LAYOUT on desktop ── */}
        <div className="rs-cols">

          {/* LEFT COL */}
          <div className="rs-left">
            <div className="rs-section-tag"><span className="rs-tag-dot" style={{ background: accent }} />// SCAN METADATA</div>

            <div className="rs-meta">
              {[
                { k: "BOARD ID",      v: boardId },
                { k: "FILE",          v: fileName },
                { k: "SCAN TIME",     v: `${scanTime}s` },
                { k: "RESULT",        v: isDefect ? "FAIL" : "PASS", highlight: true },
                { k: "DEFECTS",       v: String(defectCount), highlight: isDefect },
                { k: "AFFECTED",      v: affectedArea, highlight: isDefect },
                { k: "TIME",          v: new Date().toLocaleTimeString() },
              ].map(({ k, v, highlight }) => (
                <div key={k} className="rs-meta-row">
                  <span className="rs-meta-key">{k}</span>
                  <span className="rs-meta-val" style={{ color: highlight ? accent : "rgba(255,255,255,0.6)" }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="rs-actions">
              <button className="rs-btn-primary" style={{ borderColor: accentBo, color: accent }}
                onClick={() => navigate("/detect")}
                onMouseEnter={e => { e.currentTarget.style.background = accentB; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >↺ SCAN ANOTHER</button>
              <button className="rs-btn-secondary" onClick={() => navigate("/")}>⌂ HOME</button>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="rs-right">
            <div className="rs-section-tag"><span className="rs-tag-dot" style={{ background: accent }} />// ANALYSIS BREAKDOWN</div>

            {/* Radar + Bars */}
            <div className="rs-analysis-top">
              <div className="rs-radar" style={{ borderColor: accentBo }}>
                <div className="rs-radar-label">PATTERN MAP</div>
                <canvas ref={canvasRef} className="rs-canvas" />
                <div className="rs-radar-status" style={{ color: accent }}>
                  <span className="rs-radar-dot" style={{ background: accent }} />
                  {isDefect ? "ANOMALY" : "NOMINAL"}
                </div>
              </div>

              <div className="rs-bars">
                {analysis.map((item, i) => (
                  <div key={i} className="rs-bar-item" style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateX(0)" : "translateX(16px)", transition: `all 0.5s ease ${0.3+i*0.12}s` }}>
                    <div className="rs-bar-top">
                      <div className="rs-bar-left">
                        <span className="rs-bar-icon">{item.icon}</span>
                        <span className="rs-bar-name">{item.label}</span>
                      </div>
                      <div className="rs-bar-right">
                        <span className="rs-bar-level" style={{ color: levelColor(item.level), borderColor: levelColor(item.level)+"44", background: levelColor(item.level)+"12" }}>{item.level}</span>
                        <span className="rs-bar-pct" style={{ color: accent }}>{item.bar}%</span>
                      </div>
                    </div>
                    <div className="rs-track">
                      <div className="rs-fill" style={{ width: `${barWidths[i]||0}%`, background: `linear-gradient(90deg,${accent},${isDefect?"#ff8800":"#00c8ff"})`, boxShadow: `0 0 8px ${accent}88`, transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${0.5+i*0.18}s` }}>
                        <div className="rs-fill-head" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="rs-divider">
              <div className="rs-div-line" style={{ background: `linear-gradient(90deg,transparent,${accentBo})` }} />
              <div className="rs-div-node" style={{ background: accent, boxShadow: `0 0 7px ${accent}` }} />
              <div className="rs-div-line" style={{ background: `linear-gradient(90deg,${accentBo},transparent)` }} />
            </div>

            {/* Recommendation */}
            <div className="rs-rec" style={{ borderColor: accentBo, background: `linear-gradient(135deg,${accentB},rgba(0,0,0,0.15))` }}>
              <div className="rs-rec-header">
                <span className="rs-rec-icon" style={{ color: accent }}>⟡</span>
                <span className="rs-rec-title">ENGINEERING RECOMMENDATION</span>
                <span className="rs-rec-badge" style={{ borderColor: accentBo, color: accent }}>{isDefect ? "ACTION REQ." : "APPROVED"}</span>
              </div>
              <p className="rs-rec-text">
                {isDefect
                  ? `Board ${boardId} flagged with ${defectCount} defect${defectCount>1?"s":""} across ${affectedArea} of scan area. Remove from production line immediately. Perform visual inspection under 10× magnification. Log incident in QC system.`
                  : `Board ${boardId} passed all automated quality checks with ${targetConf}% confidence. Zero defects across all inspection layers. Cleared for next manufacturing stage. Log approval in QC system.`}
              </p>
            </div>

            {/* Bottom stats */}
            <div className="rs-bottom-stats">
              {[
                { label: "ENGINE", val: "CNN-48L" },
                { label: "DATASET", val: "14,200" },
                { label: "DURATION", val: `${scanTime}s` },
                { label: "LAYERS", val: "6" },
              ].map(s => (
                <div key={s.label} className="rs-bstat">
                  <span className="rs-bstat-val">{s.val}</span>
                  <span className="rs-bstat-lbl">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');
        *{box-sizing:border-box}
        @keyframes rs-blink{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes rs-noise{0%,100%{background-position:0 0}10%{background-position:-5% -10%}50%{background-position:-15% 10%}}

        .rs-root{min-height:100vh;background:radial-gradient(ellipse at 20% 50%,#051510 0%,#020c10 45%,#010508 100%);font-family:'Share Tech Mono',monospace;color:#fff;display:flex;flex-direction:column;position:relative;overflow-x:hidden}
        .rs-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(0,255,120,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,0.02) 1px,transparent 1px);background-size:44px 44px}
        .rs-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,0.9) 100%)}
        .rs-noise{position:fixed;inset:0;z-index:2;opacity:0.02;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:120px 120px;animation:rs-noise 0.4s steps(1) infinite}
        .rs-glow{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:800px;border-radius:50%;z-index:1;pointer-events:none}

        /* MAIN LAYOUT */
        .rs-main{
          position:relative;z-index:10;flex:1;
          display:flex;flex-direction:column;gap:16px;
          padding:20px 16px 36px;width:100%;max-width:1300px;margin:0 auto;
        }
        @media(min-width:900px){.rs-main{padding:36px 40px 36px}}

        /* VERDICT (always full width, horizontal on tablet+) */
        .rs-verdict-card{
          border:1px solid;padding:20px 18px;
          display:flex;flex-direction:column;align-items:flex-start;gap:12px;
          position:relative;overflow:hidden;
        }
        @media(min-width:560px){.rs-verdict-card{flex-direction:row;align-items:center;gap:20px}}
        .rs-verdict-icon-wrap{position:relative;flex-shrink:0}
        .rs-verdict-icon{font-size:36px;line-height:1;display:block;position:relative;z-index:1}
        .rs-glitch-r,.rs-glitch-b{position:absolute;top:0;left:0;font-size:36px;pointer-events:none;user-select:none}
        .rs-glitch-r{transform:translate(2px,-1px);clip-path:inset(25% 0 40% 0)}
        .rs-glitch-b{transform:translate(-2px,1px);clip-path:inset(60% 0 10% 0)}
        .rs-verdict-row{display:flex;align-items:center;justify-content:space-between;gap:16px;flex:1;min-width:0;flex-wrap:wrap}
        .rs-verdict-label{font-family:'Orbitron',sans-serif;font-size:clamp(14px,3.5vw,20px);font-weight:900;letter-spacing:2px;margin-bottom:6px}
        .rs-verdict-sub{font-family:'Rajdhani',sans-serif;font-size:clamp(12px,2vw,13px);color:rgba(255,255,255,0.38);line-height:1.65;max-width:380px}
        .rs-ring-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
        .rs-ring-inner{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px}
        .rs-ring-val{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:700;line-height:1}
        .rs-ring-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.25)}

        /* 2-COL */
        .rs-cols{display:flex;flex-direction:column;gap:20px}
        @media(min-width:900px){
          .rs-cols{flex-direction:row;gap:0}
          .rs-left{flex:0 0 320px;padding-right:40px;border-right:1px solid rgba(255,255,255,0.06)}
          .rs-right{flex:1;padding-left:40px}
        }

        /* LEFT */
        .rs-left{display:flex;flex-direction:column;gap:16px}
        .rs-section-tag{display:flex;align-items:center;gap:8px;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.2)}
        .rs-tag-dot{width:5px;height:5px;border-radius:50%;display:inline-block;animation:rs-blink 1.5s ease-in-out infinite}
        .rs-meta{border:1px solid rgba(255,255,255,0.07);background:rgba(0,0,0,0.35);overflow:hidden}
        .rs-meta-row{display:flex;justify-content:space-between;align-items:center;padding:8px 13px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:10px;gap:8px}
        .rs-meta-key{color:rgba(255,255,255,0.2);letter-spacing:1.5px;white-space:nowrap}
        .rs-meta-val{text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%;font-size:10px}
        .rs-actions{display:flex;gap:10px;flex-wrap:wrap}
        .rs-btn-primary{
          flex:1;min-width:130px;
          font-family:'Orbitron',sans-serif;font-size:clamp(8px,2vw,10px);font-weight:700;
          letter-spacing:1.5px;background:transparent;border:1px solid;
          padding:14px 12px;cursor:pointer;transition:all 0.3s ease;
          clip-path:polygon(7px 0%,100% 0%,calc(100% - 7px) 100%,0% 100%);
          -webkit-tap-highlight-color:transparent;
        }
        .rs-btn-secondary{
          font-family:'Orbitron',sans-serif;font-size:clamp(8px,2vw,10px);font-weight:700;
          letter-spacing:1.5px;background:transparent;
          border:1px solid rgba(255,255,255,0.14);color:rgba(255,255,255,0.35);
          padding:14px 18px;cursor:pointer;transition:all 0.3s ease;
          -webkit-tap-highlight-color:transparent;
        }
        .rs-btn-secondary:hover{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.28)}

        /* RIGHT */
        .rs-right{display:flex;flex-direction:column;gap:16px;min-width:0}
        .rs-analysis-top{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
        .rs-radar{
          flex:0 0 auto;border:1px solid;padding:12px;
          display:flex;flex-direction:column;align-items:center;gap:6px;
          background:rgba(0,0,0,0.35);min-width:0;
        }
        .rs-radar-label{font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.2);white-space:nowrap}
        .rs-canvas{display:block;max-width:100%;height:auto}
        .rs-radar-status{font-size:8px;letter-spacing:1.5px;display:flex;align-items:center;gap:5px;white-space:nowrap}
        .rs-radar-dot{width:5px;height:5px;border-radius:50%;display:inline-block;animation:rs-blink 1.2s infinite}

        .rs-bars{flex:1;display:flex;flex-direction:column;gap:12px;min-width:0;min-width:200px}
        .rs-bar-item{padding:12px 14px;border:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.25)}
        .rs-bar-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:6px;flex-wrap:wrap}
        .rs-bar-left{display:flex;align-items:center;gap:7px;min-width:0}
        .rs-bar-icon{font-size:11px;color:rgba(255,255,255,0.28);flex-shrink:0}
        .rs-bar-name{font-size:10px;color:rgba(255,255,255,0.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .rs-bar-right{display:flex;align-items:center;gap:8px;flex-shrink:0}
        .rs-bar-level{font-size:7px;letter-spacing:1.5px;border:1px solid;padding:2px 7px;white-space:nowrap}
        .rs-bar-pct{font-family:'Orbitron',sans-serif;font-size:13px;font-weight:700}
        .rs-track{height:4px;background:rgba(255,255,255,0.05);position:relative;overflow:hidden}
        .rs-fill{height:100%;position:relative;border-radius:2px}
        .rs-fill-head{position:absolute;right:-1px;top:-2px;width:3px;height:8px;border-radius:2px}

        .rs-divider{display:flex;align-items:center}
        .rs-div-line{flex:1;height:1px}
        .rs-div-node{width:6px;height:6px;border-radius:50%;flex-shrink:0}

        .rs-rec{border:1px solid;padding:16px 18px}
        .rs-rec-header{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
        .rs-rec-icon{font-size:13px}
        .rs-rec-title{font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.26);flex:1}
        .rs-rec-badge{font-size:7px;letter-spacing:2px;border:1px solid;padding:2px 8px;white-space:nowrap}
        .rs-rec-text{font-family:'Rajdhani',sans-serif;font-weight:300;font-size:clamp(12px,2vw,13px);color:rgba(255,255,255,0.42);line-height:1.8}

        .rs-bottom-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);overflow:hidden}
        @media(max-width:400px){.rs-bottom-stats{grid-template-columns:repeat(2,1fr)}}
        .rs-bstat{padding:11px 12px;background:rgba(0,0,0,0.45);display:flex;flex-direction:column;gap:4px}
        .rs-bstat-val{font-family:'Orbitron',sans-serif;font-size:clamp(8px,2vw,10px);color:rgba(255,255,255,0.6);letter-spacing:0.5px;word-break:break-word}
        .rs-bstat-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.18);text-transform:uppercase}
      `}</style>
    </div>
  );
}