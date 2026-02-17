import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Navbar from "./Navbar";

function Result() {
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
  const accentB  = isDefect ? "rgba(255,68,85,0.22)" : "rgba(0,255,120,0.15)";
  const accentBo = isDefect ? "rgba(255,68,85,0.35)" : "rgba(0,255,120,0.3)";
  const accentGl = isDefect ? "rgba(255,50,60,0.07)" : "rgba(0,255,120,0.05)";

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!revealed) return;
    let c = 0;
    const id = setInterval(() => {
      c += 1.8;
      if (c >= targetConf) { setConf(targetConf); clearInterval(id); }
      else setConf(Math.round(c));
    }, 18);
    analysis.forEach((item, i) => {
      setTimeout(() => {
        setBarWidths((prev) => { const next = [...prev]; next[i] = item.bar; return next; });
      }, 500 + i * 180);
    });
    return () => clearInterval(id);
  }, [revealed]);

  useEffect(() => {
    setTimeout(() => { setGlitch(true); setTimeout(() => setGlitch(false), 350); }, 600);
    setTimeout(() => { setGlitch(true); setTimeout(() => setGlitch(false), 200); }, 1200);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || analysis.length === 0) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = 180;
    const H = canvas.height = 180;
    const cx = W / 2, cy = H / 2, R = 70;
    let angle = 0, animId;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      [1, 0.66, 0.33].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${isDefect ? "255,68,85" : "0,255,120"},0.12)`;
        ctx.lineWidth = 1; ctx.stroke();
      });
      for (let i = 0; i < analysis.length; i++) {
        const a = (Math.PI * 2 * i) / analysis.length - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
        ctx.strokeStyle = `rgba(${isDefect ? "255,68,85" : "0,255,120"},0.18)`;
        ctx.lineWidth = 1; ctx.stroke();
        const lx = cx + (R + 16) * Math.cos(a);
        const ly = cy + (R + 16) * Math.sin(a);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "7px 'Share Tech Mono'";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(analysis[i].label.split(" ")[0].toUpperCase(), lx, ly);
      }
      ctx.beginPath();
      analysis.forEach((item, i) => {
        const a = (Math.PI * 2 * i) / analysis.length - Math.PI / 2;
        const r = R * (item.bar / 100);
        i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      });
      ctx.closePath();
      ctx.fillStyle = `rgba(${isDefect ? "255,68,85" : "0,255,120"},0.12)`; ctx.fill();
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, angle, angle + 0.6);
      ctx.closePath();
      ctx.fillStyle = `rgba(${isDefect ? "255,68,85" : "0,255,120"},0.08)`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = `rgba(${isDefect ? "255,68,85" : "0,255,120"},0.5)`;
      ctx.lineWidth = 1.5; ctx.stroke();
      angle += 0.025;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [revealed, analysis, isDefect]);

  const levelColor = (lvl) => {
    if (lvl === "HIGH")      return "#ff4455";
    if (lvl === "MEDIUM")    return "#ffaa00";
    if (lvl === "LOW")       return "#ffdd44";
    if (lvl === "EXCELLENT") return "#00ff78";
    return "#00c8ff";
  };

  return (
    <div style={S.root}>
      <div style={S.hexGrid} />
      <div style={S.vignette} />
      <div style={S.noise} />
      <div style={{ ...S.ambientGlow, background: `radial-gradient(circle, ${accentGl} 0%, transparent 70%)` }} />

      {/* ── SHARED NAVBAR — accent adapts to result ── */}
      <Navbar accent={accent} />

      {/* Main */}
      <main style={{ ...S.main, opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(18px)", transition: "all 0.9s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* ══ LEFT COL ══ */}
        <div style={S.leftCol}>
          <div style={S.sectionTag}>
            <span style={{ ...S.tagDot, background: accent }} />
            // DETECTION OUTPUT
          </div>

          <div style={{ ...S.verdictCard, borderColor: accentBo, background: accentB }}>
            <div style={S.verdictIconWrap}>
              {glitch && <span style={{ ...S.verdictGlitchR, color: isDefect ? "rgba(255,0,60,0.5)" : "rgba(0,200,255,0.4)" }} aria-hidden>{isDefect ? "⚠" : "✓"}</span>}
              {glitch && <span style={{ ...S.verdictGlitchB, color: isDefect ? "rgba(0,200,255,0.4)" : "rgba(255,0,100,0.3)" }} aria-hidden>{isDefect ? "⚠" : "✓"}</span>}
              <span style={{ ...S.verdictIcon, color: accent }}>{isDefect ? "⚠" : "✓"}</span>
            </div>
            <div style={{ ...S.verdictLabel, color: accent }}>
              {isDefect ? "DEFECT DETECTED" : "BOARD PASSED"}
            </div>
            <div style={S.verdictSub}>
              {isDefect
                ? "Manufacturing defects identified. Board requires inspection and rework before deployment."
                : "No defects detected. Board meets all quality control standards. Ready for next stage."}
            </div>
            <div style={S.ringWrap}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - conf / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 6px ${accent})` }}
                />
              </svg>
              <div style={S.ringInner}>
                <span style={{ ...S.ringVal, color: accent }}>{conf}%</span>
                <span style={S.ringLabel}>CONFIDENCE</span>
              </div>
            </div>
          </div>

          <div style={S.metaTable}>
            <div style={S.metaHeader}>
              <span style={S.metaHeaderTxt}>◈ SCAN METADATA</span>
            </div>
            {[
              { k: "BOARD ID",      v: boardId,      acc: false },
              { k: "FILE",          v: fileName,     acc: false },
              { k: "SCAN TIME",     v: `${scanTime}s`, acc: false },
              { k: "RESULT",        v: isDefect ? "FAIL" : "PASS", acc: true },
              { k: "DEFECT COUNT",  v: String(defectCount), acc: isDefect },
              { k: "AFFECTED AREA", v: affectedArea, acc: isDefect },
              { k: "TIMESTAMP",     v: new Date().toLocaleTimeString(), acc: false },
            ].map(({ k, v, acc }) => (
              <div key={k} style={S.metaRow}>
                <span style={S.metaKey}>{k}</span>
                <span style={{ ...S.metaVal, color: acc ? accent : "rgba(255,255,255,0.65)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={S.actions}>
            <button
              style={{ ...S.btnPrimary, borderColor: accentBo, color: accent }}
              onClick={() => navigate("/detect")}
              onMouseEnter={(e) => { e.currentTarget.style.background = accentB; e.currentTarget.style.boxShadow = `0 0 40px ${isDefect ? "rgba(255,68,85,0.35)" : "rgba(0,255,120,0.35)"}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
            >
              ↺ SCAN ANOTHER
            </button>
            <button
              style={S.btnSecondary}
              onClick={() => navigate("/")}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              ⌂ HOME
            </button>
          </div>
        </div>

        {/* ══ RIGHT COL ══ */}
        <div style={S.rightCol}>
          <div style={S.sectionTag}>
            <span style={{ ...S.tagDot, background: accent }} />
            // ANALYSIS BREAKDOWN
          </div>

          <div style={S.analysisTop}>
            <div style={{ ...S.radarWrap, borderColor: accentBo }}>
              <div style={S.radarLabel}>PATTERN MAP</div>
              <canvas ref={canvasRef} style={S.radarCanvas} />
              <div style={{ ...S.radarStatus, color: accent }}>
                <span style={{ ...S.statusDot, background: accent, width: 5, height: 5 }} />
                {isDefect ? "ANOMALY DETECTED" : "NOMINAL"}
              </div>
            </div>

            <div style={S.barsWrap}>
              {analysis.map((item, i) => (
                <div key={i} style={{ ...S.barItem, opacity: revealed ? 1 : 0, transform: revealed ? "translateX(0)" : "translateX(20px)", transition: `all 0.55s ease ${0.3 + i * 0.12}s` }}>
                  <div style={S.barTop}>
                    <div style={S.barLeft}>
                      <span style={S.barIcon}>{item.icon}</span>
                      <span style={S.barName}>{item.label}</span>
                    </div>
                    <div style={S.barRight}>
                      <span style={{ ...S.barLevel, color: levelColor(item.level), borderColor: levelColor(item.level) + "44", background: levelColor(item.level) + "12" }}>
                        {item.level}
                      </span>
                      <span style={{ ...S.barPct, color: accent }}>{item.bar}%</span>
                    </div>
                  </div>
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width: `${barWidths[i] || 0}%`, background: `linear-gradient(90deg, ${accent}, ${isDefect ? "#ff8800" : "#00c8ff"})`, boxShadow: `0 0 8px ${accent}88`, transition: `width 1.1s cubic-bezier(0.4,0,0.2,1) ${0.5 + i * 0.18}s` }}>
                      <div style={{ ...S.barHead, background: accent, boxShadow: `0 0 10px ${accent}` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.divRow}>
            <div style={{ ...S.divLine, background: `linear-gradient(90deg, transparent, ${accentBo})` }} />
            <div style={{ ...S.divNode, background: accent, boxShadow: `0 0 8px ${accent}` }} />
            <div style={{ ...S.divLine, background: `linear-gradient(90deg, ${accentBo}, transparent)` }} />
          </div>

          <div style={{ ...S.recCard, borderColor: accentBo, background: `linear-gradient(135deg, ${accentB}, rgba(0,0,0,0.2))` }}>
            <div style={S.recHeader}>
              <span style={{ ...S.recIcon, color: accent }}>⟡</span>
              <span style={S.recTitle}>ENGINEERING RECOMMENDATION</span>
              <div style={{ ...S.recBadge, borderColor: accentBo, color: accent }}>
                {isDefect ? "ACTION REQUIRED" : "APPROVED"}
              </div>
            </div>
            <p style={S.recText}>
              {isDefect
                ? `Board ${boardId} has been flagged with ${defectCount} defect${defectCount > 1 ? "s" : ""} across ${affectedArea} of the scan area. Remove from production line immediately. Perform visual inspection under 10× magnification. Minor defects may be reworked; critical trace failures require full board replacement. Log incident in QC system.`
                : `Board ${boardId} has successfully passed all automated quality checks with ${targetConf}% confidence. Zero defects detected across all inspection layers. Cleared for progression to the next manufacturing stage. Log approval in QC system for full traceability.`}
            </p>
          </div>

          <div style={S.bottomStats}>
            {[
              { label: "SCAN ENGINE", val: "CNN-RESNET-48L" },
              { label: "DATASET", val: "14,200 SAMPLES" },
              { label: "SCAN DURATION", val: `${scanTime}s` },
              { label: "LAYERS CHECKED", val: "6 LAYERS" },
            ].map((s) => (
              <div key={s.label} style={S.bStat}>
                <span style={S.bStatVal}>{s.val}</span>
                <span style={S.bStatLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');
  * { box-sizing: border-box; }
  @keyframes pdot { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:0.5} }
  @keyframes noise { 0%,100%{background-position:0 0}10%{background-position:-5% -10%}30%{background-position:7% -25%}50%{background-position:-15% 10%}70%{background-position:0% 15%}90%{background-position:-10% 10%} }
  @keyframes blinkDot { 0%,100%{opacity:1}50%{opacity:0.3} }
`;

const S = {
  root: { minHeight:"100vh", background:"radial-gradient(ellipse at 20% 50%, #051510 0%, #020c10 45%, #010508 100%)", fontFamily:"'Share Tech Mono',monospace", color:"#fff", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" },
  hexGrid: { position:"fixed", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(0,255,120,0.022) 1px, transparent 1px),linear-gradient(90deg, rgba(0,255,120,0.022) 1px, transparent 1px)", backgroundSize:"44px 44px" },
  vignette: { position:"fixed", inset:0, zIndex:1, pointerEvents:"none", background:"radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.9) 100%)" },
  noise: { position:"fixed", inset:0, zIndex:2, opacity:0.022, pointerEvents:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"120px 120px", animation:"noise 0.4s steps(1) infinite" },
  ambientGlow: { position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:900, height:900, borderRadius:"50%", zIndex:1, pointerEvents:"none" },

  main: { position:"relative", zIndex:10, flex:1, display:"flex", gap:0, maxWidth:1300, margin:"0 auto", padding:"44px 40px 36px", width:"100%" },

  leftCol: { flex:"0 0 380px", paddingRight:52, display:"flex", flexDirection:"column", gap:20 },
  rightCol: { flex:1, paddingLeft:52, borderLeft:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:20 },

  sectionTag: { display:"flex", alignItems:"center", gap:8, fontSize:10, letterSpacing:"2px", color:"rgba(255,255,255,0.22)" },
  tagDot: { width:5, height:5, borderRadius:"50%", display:"inline-block" },

  verdictCard: { border:"1px solid", padding:"28px 24px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:10, position:"relative", overflow:"hidden" },
  verdictIconWrap: { position:"relative", display:"inline-block" },
  verdictGlitchR: { position:"absolute", top:0, left:"2px", fontSize:44, lineHeight:1, pointerEvents:"none", userSelect:"none" },
  verdictGlitchB: { position:"absolute", top:0, left:"-2px", fontSize:44, lineHeight:1, pointerEvents:"none", userSelect:"none" },
  verdictIcon: { fontSize:44, lineHeight:1, display:"block", position:"relative", zIndex:1 },
  verdictLabel: { fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, letterSpacing:"3px" },
  verdictSub: { fontFamily:"'Rajdhani',sans-serif", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.7, maxWidth:260 },

  ringWrap: { position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center", marginTop:4 },
  ringInner: { position:"absolute", display:"flex", flexDirection:"column", alignItems:"center", gap:2 },
  ringVal: { fontFamily:"'Orbitron',sans-serif", fontSize:24, fontWeight:700, lineHeight:1 },
  ringLabel: { fontSize:8, letterSpacing:"2px", color:"rgba(255,255,255,0.3)", textTransform:"uppercase" },

  metaTable: { border:"1px solid rgba(255,255,255,0.07)", background:"rgba(0,0,0,0.35)", overflow:"hidden" },
  metaHeader: { padding:"8px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" },
  metaHeaderTxt: { fontSize:9, letterSpacing:"2px", color:"rgba(255,255,255,0.2)" },
  metaRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)", fontSize:10 },
  metaKey: { color:"rgba(255,255,255,0.22)", letterSpacing:"1.5px" },
  metaVal: { textAlign:"right", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },

  actions: { display:"flex", gap:12, marginTop:4 },
  btnPrimary: { flex:1, fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"2px", background:"transparent", border:"1px solid", padding:"15px", cursor:"pointer", transition:"all 0.3s ease", clipPath:"polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)" },
  btnSecondary: { fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"2px", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.35)", padding:"15px 24px", cursor:"pointer", transition:"all 0.3s ease" },

  analysisTop: { display:"flex", gap:24, alignItems:"flex-start" },
  radarWrap: { flex:"0 0 200px", border:"1px solid", padding:"14px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, background:"rgba(0,0,0,0.35)" },
  radarLabel: { fontSize:9, letterSpacing:"2px", color:"rgba(255,255,255,0.22)" },
  radarCanvas: { display:"block" },
  radarStatus: { fontSize:9, letterSpacing:"2px", display:"flex", alignItems:"center", gap:6 },
  statusDot: { width:6, height:6, borderRadius:"50%", display:"inline-block", animation:"blinkDot 1.2s infinite" },

  barsWrap: { flex:1, display:"flex", flexDirection:"column", gap:14 },
  barItem: { padding:"14px 16px", border:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.25)", position:"relative" },
  barTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  barLeft: { display:"flex", alignItems:"center", gap:8 },
  barIcon: { fontSize:12, color:"rgba(255,255,255,0.3)" },
  barName: { fontSize:11, color:"rgba(255,255,255,0.7)", letterSpacing:"0.5px" },
  barRight: { display:"flex", alignItems:"center", gap:10 },
  barLevel: { fontSize:8, letterSpacing:"1.5px", border:"1px solid", padding:"2px 8px" },
  barPct: { fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:700 },
  barTrack: { height:4, background:"rgba(255,255,255,0.05)", position:"relative", overflow:"hidden" },
  barFill: { height:"100%", position:"relative", borderRadius:2 },
  barHead: { position:"absolute", right:-1, top:-2, width:3, height:8, borderRadius:2 },

  divRow: { display:"flex", alignItems:"center", gap:0 },
  divLine: { flex:1, height:1 },
  divNode: { width:6, height:6, borderRadius:"50%", flexShrink:0 },

  recCard: { border:"1px solid", padding:"18px 20px" },
  recHeader: { display:"flex", alignItems:"center", gap:10, marginBottom:12 },
  recIcon: { fontSize:14 },
  recTitle: { fontSize:9, letterSpacing:"2px", color:"rgba(255,255,255,0.3)", flex:1 },
  recBadge: { fontSize:8, letterSpacing:"2px", border:"1px solid", padding:"3px 10px" },
  recText: { fontFamily:"'Rajdhani',sans-serif", fontWeight:300, fontSize:13, color:"rgba(255,255,255,0.45)", lineHeight:1.85, margin:0 },

  bottomStats: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" },
  bStat: { padding:"12px 14px", background:"rgba(0,0,0,0.4)", display:"flex", flexDirection:"column", gap:4 },
  bStatVal: { fontFamily:"'Orbitron',sans-serif", fontSize:11, color:"rgba(255,255,255,0.65)", letterSpacing:"1px" },
  bStatLabel: { fontSize:8, letterSpacing:"2px", color:"rgba(255,255,255,0.2)", textTransform:"uppercase" },
};

export default Result;