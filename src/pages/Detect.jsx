import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

/* ── Fake data generator ── */
function generateFakeResult(fileName) {
  const isDefect = Math.random() > 0.45;
  const defectTypes = [
    { label: "Solder Bridge", icon: "◈" }, { label: "Missing Component", icon: "◆" },
    { label: "Copper Void", icon: "◉" }, { label: "Open Circuit", icon: "◇" },
    { label: "Short Circuit", icon: "▣" }, { label: "Lifted Pad", icon: "△" },
    { label: "Cold Solder Joint", icon: "◎" }, { label: "Tombstoning", icon: "▲" },
  ];
  const passTypes = [
    { label: "Solder Quality", icon: "◉" }, { label: "Component Placement", icon: "◈" },
    { label: "Trace Integrity", icon: "◆" }, { label: "Pad Alignment", icon: "◎" },
    { label: "Copper Coverage", icon: "△" },
  ];
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  if (isDefect) {
    const picked = shuffle([...defectTypes]).slice(0, 3);
    const primary = randInt(72, 95);
    const bars = [primary, randInt(30, primary - 10), randInt(10, 35)].sort((a, b) => b - a);
    return { result: "defect", confidence: randInt(85, 97), scanTime: (Math.random() * 1.2 + 0.8).toFixed(2), fileName, boardId: `PCB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, analysis: picked.map((d, i) => ({ ...d, bar: bars[i], level: ["HIGH","MEDIUM","LOW"][i] })), defectCount: randInt(1, 4), affectedArea: `${randInt(3, 22)}%` };
  } else {
    const picked = shuffle([...passTypes]).slice(0, 3);
    const bars = [randInt(91, 99), randInt(88, 98), randInt(85, 97)].sort((a, b) => b - a);
    return { result: "pass", confidence: randInt(93, 99), scanTime: (Math.random() * 1.0 + 0.6).toFixed(2), fileName, boardId: `PCB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, analysis: picked.map((d, i) => ({ ...d, bar: bars[i], level: ["EXCELLENT","EXCELLENT","GOOD"][i] })), defectCount: 0, affectedArea: "0%" };
  }
}

function Detect() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scanY, setScanY] = useState(0);
  const fileRef = useRef(null);
  const scanRef = useRef(null);
  const navigate = useNavigate();

  const steps = [
    { label: "PREPROCESSING IMAGE", sub: "Normalizing pixel data..." },
    { label: "RUNNING NEURAL NETWORK", sub: "Forwarding through 48 layers..." },
    { label: "ANALYZING DEFECT PATTERNS", sub: "Comparing against 14,000 samples..." },
    { label: "GENERATING REPORT", sub: "Compiling confidence scores..." },
  ];

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!preview) return;
    let dir = 1, pos = 0;
    scanRef.current = setInterval(() => {
      pos += dir * 1.4;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      setScanY(pos);
    }, 16);
    return () => clearInterval(scanRef.current);
  }, [preview]);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true); setLoadStep(0); setLoadPct(0);
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < steps.length) setLoadStep(step);
      else clearInterval(stepInterval);
    }, 700);
    let pct = 0;
    const pctInterval = setInterval(() => {
      pct += Math.random() * 3.2;
      if (pct >= 94) { pct = 94; clearInterval(pctInterval); }
      setLoadPct(pct);
    }, 80);
    setTimeout(() => {
      clearInterval(stepInterval); clearInterval(pctInterval);
      setLoadPct(100);
      const fakeData = generateFakeResult(image.name);
      setTimeout(() => navigate("/result", { state: fakeData }), 480);
    }, 2800);
  };

  return (
    <div style={S.root}>
      <div style={S.hexGrid} />
      <div style={S.vignette} />
      <div style={S.noise} />
      <div style={{ ...S.glow, top: -200, left: -200, background: "radial-gradient(circle, rgba(0,255,120,0.08) 0%, transparent 65%)", width: 600, height: 600 }} />
      <div style={{ ...S.glow, bottom: -200, right: -200, background: "radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 65%)", width: 700, height: 700 }} />

      {/* ── SHARED NAVBAR ── */}
      <Navbar accent="#00ff78" />

      {/* Main */}
      <main style={{ ...S.main, opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(16px)", transition: "all 0.9s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* LEFT */}
        <div style={S.leftPanel}>
          <div style={S.moduleTag}><span style={S.moduleDot} />// UPLOAD MODULE</div>
          <h2 style={S.heading}>SCAN YOUR<br /><span style={S.headingAccent}>CIRCUIT BOARD</span></h2>
          <p style={S.desc}>Upload a PCB image and our convolutional neural network will analyze every trace, pad, and solder joint for manufacturing defects.</p>
          <div style={S.infoStack}>
            {[
              { icon: "◈", title: "High Resolution", desc: "Min 512×512px recommended", num: "01" },
              { icon: "◉", title: "Clear Focus", desc: "Sharp edges improve accuracy by 23%", num: "02" },
              { icon: "◆", title: "Good Lighting", desc: "Avoid overexposed images", num: "03" },
            ].map((c) => (
              <div key={c.title} style={S.infoCard}>
                <span style={S.infoNum}>{c.num}</span>
                <div style={S.infoIconWrap}><span style={S.infoIcon}>{c.icon}</span></div>
                <div style={S.infoText}>
                  <div style={S.infoTitle}>{c.title}</div>
                  <div style={S.infoDesc}>{c.desc}</div>
                </div>
                <div style={S.infoBar} />
              </div>
            ))}
          </div>
          <div style={S.traceDivider}>
            <div style={S.traceLineL} />
            <div style={S.traceNode} />
            <div style={S.traceLineR} />
          </div>
          <div style={S.formats}>
            <span style={S.formatsLabel}>SUPPORTED FORMATS</span>
            <div style={S.formatPills}>
              {["PNG", "JPG", "WEBP", "BMP", "TIFF"].map((f) => <span key={f} style={S.pill}>{f}</span>)}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={S.rightPanel}>
          <div
            style={{ ...S.dropzone, borderColor: dragging ? "#00ff78" : preview ? "rgba(0,255,120,0.5)" : "rgba(0,255,120,0.18)", background: dragging ? "rgba(0,255,120,0.06)" : preview ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)", boxShadow: dragging ? "0 0 60px rgba(0,255,120,0.2), inset 0 0 40px rgba(0,255,120,0.04)" : preview ? "0 0 40px rgba(0,255,120,0.1)" : "none" }}
            onClick={() => !preview && fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div style={S.previewWrap}>
                <div style={S.imgWrap}>
                  <img src={preview} alt="PCB Preview" style={S.previewImg} />
                  <div style={S.overlay}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: `${scanY}%`, height: 3, background: "linear-gradient(90deg, transparent 0%, rgba(0,255,120,0.1) 10%, rgba(0,255,120,0.9) 50%, rgba(0,255,120,0.1) 90%, transparent 100%)", boxShadow: "0 0 20px rgba(0,255,120,0.8), 0 0 40px rgba(0,255,120,0.3)", transition: "top 0.016s linear", pointerEvents: "none" }} />
                    <div style={S.crossH} /><div style={S.crossV} />
                    {[{ top: 0, left: 0, borderTop: "2px solid #00ff78", borderLeft: "2px solid #00ff78" }, { top: 0, right: 0, borderTop: "2px solid #00ff78", borderRight: "2px solid #00ff78" }, { bottom: 0, left: 0, borderBottom: "2px solid #00ff78", borderLeft: "2px solid #00ff78" }, { bottom: 0, right: 0, borderBottom: "2px solid #00ff78", borderRight: "2px solid #00ff78" }].map((c, i) => <div key={i} style={{ ...S.bigCorner, ...c }} />)}
                    <div style={S.reticle}><div style={S.reticleRing} /><div style={S.reticleDot} /></div>
                    <div style={S.scanBadge}><span style={S.scanBadgeDot} />SCANNING...</div>
                  </div>
                </div>
                <div style={S.metaBar}>
                  <div style={S.metaLeft}>
                    <span style={S.metaCheck}>✓</span>
                    <div>
                      <div style={S.metaName}>{image?.name}</div>
                      <div style={S.metaSize}>{(image?.size / 1024).toFixed(1)} KB · {image?.type?.split("/")[1]?.toUpperCase()}</div>
                    </div>
                  </div>
                  <button style={S.removeBtn} onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }}>✕ REMOVE</button>
                </div>
              </div>
            ) : (
              <div style={S.emptyDrop}>
                <div style={S.hexIcon}>
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="none" stroke="rgba(0,255,120,0.3)" strokeWidth="1.5" />
                    <polygon points="40,14 63,27 63,53 40,66 17,53 17,27" fill="none" stroke="rgba(0,255,120,0.15)" strokeWidth="1" />
                    <text x="40" y="46" textAnchor="middle" fill="rgba(0,255,120,0.5)" fontSize="22" fontFamily="monospace">⬡</text>
                  </svg>
                </div>
                <p style={S.emptyTitle}>DROP IMAGE HERE</p>
                <p style={S.emptySub}>or click anywhere to browse</p>
                <div style={S.emptyHint}><span style={S.emptyHintIcon}>↑</span>Drag & Drop your PCB scan<span style={S.emptyHintIcon}>↑</span></div>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

          {!loading ? (
            <button
              style={{ ...S.analyzeBtn, opacity: image ? 1 : 0.38, cursor: image ? "pointer" : "not-allowed", ...(hoverBtn && image ? S.analyzeBtnHover : {}) }}
              onClick={handleSubmit} disabled={!image}
              onMouseEnter={() => setHoverBtn(true)} onMouseLeave={() => setHoverBtn(false)}
            >
              {["tl", "tr", "bl", "br"].map((c) => (
                <span key={c} style={{ ...S.bCorner, top: c.startsWith("t") ? -1 : "auto", bottom: c.startsWith("b") ? -1 : "auto", left: c.endsWith("l") ? -1 : "auto", right: c.endsWith("r") ? -1 : "auto", borderTopWidth: c.startsWith("t") ? 2 : 0, borderBottomWidth: c.startsWith("b") ? 2 : 0, borderLeftWidth: c.endsWith("l") ? 2 : 0, borderRightWidth: c.endsWith("r") ? 2 : 0, opacity: hoverBtn && image ? 1 : 0.22, transform: hoverBtn && image ? (c === "tl" ? "translate(-4px,-4px)" : c === "tr" ? "translate(4px,-4px)" : c === "bl" ? "translate(-4px,4px)" : "translate(4px,4px)") : "translate(0,0)", transition: "all 0.3s ease" }} />
              ))}
              {hoverBtn && image && <span style={S.shine} />}
              <span style={S.analyzeBtnInner}>
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ opacity: 0.7 }}><polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" fill="none" stroke="#00ff78" strokeWidth="1.5" /></svg>
                RUN DEFECT ANALYSIS
                <span style={{ opacity: 0.5 }}>→</span>
              </span>
            </button>
          ) : (
            <div style={S.loadBox}>
              <div style={S.loadHeader}>
                <div style={S.loadTitle}><span style={S.loadingDot} />ANALYZING...</div>
                <span style={S.loadPctTxt}>{Math.round(loadPct)}%</span>
              </div>
              <div style={S.loadTrack}>
                <div style={{ ...S.loadFill, width: `${loadPct}%` }} />
                <div style={{ position: "absolute", top: -1, bottom: -1, left: `calc(${loadPct}% - 4px)`, width: 8, background: "#00ff78", boxShadow: "0 0 12px #00ff78,0 0 24px rgba(0,255,120,0.5)", borderRadius: 4, transition: "left 0.3s ease" }} />
              </div>
              <div style={S.stepsWrap}>
                {steps.map((step, i) => (
                  <div key={i} style={{ ...S.stepRow, opacity: i > loadStep ? 0.2 : 1, transition: "opacity 0.4s ease" }}>
                    <div style={{ ...S.stepCheck, background: i < loadStep ? "#00ff78" : "transparent", borderColor: i <= loadStep ? "#00ff78" : "rgba(255,255,255,0.15)", boxShadow: i === loadStep ? "0 0 10px rgba(0,255,120,0.6)" : "none" }}>
                      {i < loadStep && <span style={S.stepTick}>✓</span>}
                      {i === loadStep && <span style={S.stepActive} />}
                    </div>
                    <div>
                      <div style={{ ...S.stepLabel, color: i === loadStep ? "#00ff78" : i < loadStep ? "rgba(0,255,120,0.5)" : "rgba(255,255,255,0.2)" }}>{step.label}</div>
                      {i === loadStep && <div style={S.stepSub}>{step.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && (
            <div style={S.bottomHint}>
              <span style={S.hintDash} />
              <span style={S.hintText}>{image ? `Ready · ${image.name} loaded` : "No image selected"}</span>
              <span style={S.hintDash} />
            </div>
          )}
        </div>
      </main>
      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');
  * { box-sizing: border-box; }
  @keyframes pdot    { 0%,100%{box-shadow:0 0 4px #00ff78,0 0 10px #00ff78}50%{box-shadow:0 0 8px #00ff78,0 0 24px #00ff78} }
  @keyframes shimmer { 0%{left:-100%}100%{left:220%} }
  @keyframes reticlePulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.6}50%{transform:translate(-50%,-50%) scale(1.4);opacity:0.2} }
  @keyframes noise { 0%,100%{background-position:0 0}10%{background-position:-5% -10%}30%{background-position:7% -25%}50%{background-position:-15% 10%}70%{background-position:0% 15%}90%{background-position:-10% 10%} }
  @keyframes scanBadgePulse { 0%,100%{opacity:1}50%{opacity:0.4} }
`;

const S = {
  root: { minHeight:"100vh", background:"radial-gradient(ellipse at 15% 40%, #051510 0%, #020c10 45%, #010508 100%)", fontFamily:"'Share Tech Mono',monospace", color:"#fff", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" },
  hexGrid: { position:"fixed", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:"linear-gradient(rgba(0,255,120,0.025) 1px, transparent 1px),linear-gradient(90deg, rgba(0,255,120,0.025) 1px, transparent 1px)", backgroundSize:"44px 44px" },
  vignette: { position:"fixed", inset:0, zIndex:1, pointerEvents:"none", background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.88) 100%)" },
  noise: { position:"fixed", inset:0, zIndex:2, opacity:0.022, pointerEvents:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize:"120px 120px", animation:"noise 0.4s steps(1) infinite" },
  glow: { position:"fixed", borderRadius:"50%", zIndex:1, pointerEvents:"none" },
  main: { position:"relative", zIndex:10, flex:1, display:"flex", gap:0, alignItems:"stretch", maxWidth:1280, margin:"0 auto", padding:"48px 40px 40px", width:"100%" },
  leftPanel: { flex:"0 0 360px", paddingRight:56, display:"flex", flexDirection:"column", justifyContent:"center" },
  moduleTag: { display:"flex", alignItems:"center", gap:8, color:"rgba(0,255,120,0.5)", fontSize:10, letterSpacing:"2px", marginBottom:24 },
  moduleDot: { width:5, height:5, borderRadius:"50%", background:"#00ff78", animation:"pdot 2s ease-in-out infinite" },
  heading: { fontFamily:"'Orbitron',sans-serif", fontSize:"clamp(28px,3.5vw,42px)", fontWeight:900, lineHeight:1.1, margin:"0 0 18px", color:"#fff" },
  headingAccent: { background:"linear-gradient(90deg,#00ff78 0%,#00ffcc 50%,#00c8ff 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", filter:"drop-shadow(0 0 25px rgba(0,255,120,0.5))" },
  desc: { fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:300, color:"rgba(255,255,255,0.35)", lineHeight:1.85, marginBottom:36 },
  infoStack: { display:"flex", flexDirection:"column", gap:10, marginBottom:32 },
  infoCard: { display:"flex", alignItems:"center", gap:12, padding:"12px 16px 12px 14px", border:"1px solid rgba(0,255,120,0.08)", background:"rgba(0,255,120,0.018)", position:"relative", overflow:"hidden" },
  infoNum: { fontFamily:"'Orbitron',sans-serif", fontSize:9, color:"rgba(0,255,120,0.25)", letterSpacing:"1px", minWidth:18 },
  infoIconWrap: { width:28, height:28, border:"1px solid rgba(0,255,120,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, background:"rgba(0,255,120,0.04)" },
  infoIcon: { color:"#00ff78", fontSize:13 },
  infoText: { flex:1 },
  infoTitle: { fontSize:10, fontWeight:700, letterSpacing:"1.5px", color:"rgba(255,255,255,0.8)", textTransform:"uppercase", marginBottom:2 },
  infoDesc: { fontSize:10, color:"rgba(255,255,255,0.3)" },
  infoBar: { position:"absolute", left:0, top:0, bottom:0, width:2, background:"linear-gradient(180deg,transparent,#00ff78,transparent)" },
  traceDivider: { display:"flex", alignItems:"center", gap:0, marginBottom:24 },
  traceLineL: { flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(0,255,120,0.3))" },
  traceNode: { width:6, height:6, borderRadius:"50%", background:"#00ff78", boxShadow:"0 0 8px #00ff78", flexShrink:0 },
  traceLineR: { flex:1, height:1, background:"linear-gradient(90deg,rgba(0,255,120,0.3),transparent)" },
  formats: { display:"flex", flexDirection:"column", gap:10 },
  formatsLabel: { fontSize:9, letterSpacing:"2.5px", color:"rgba(255,255,255,0.2)", textTransform:"uppercase" },
  formatPills: { display:"flex", gap:6, flexWrap:"wrap" },
  pill: { fontSize:9, letterSpacing:"1.5px", border:"1px solid rgba(0,255,120,0.15)", color:"rgba(0,255,120,0.45)", padding:"3px 10px", background:"rgba(0,255,120,0.03)" },
  rightPanel: { flex:1, display:"flex", flexDirection:"column", gap:16, borderLeft:"1px solid rgba(0,255,120,0.08)", paddingLeft:56 },
  dropzone: { flex:1, border:"1px dashed", cursor:"pointer", transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:380, position:"relative", overflow:"hidden" },
  previewWrap: { width:"100%", height:"100%", display:"flex", flexDirection:"column", position:"relative" },
  imgWrap: { flex:1, position:"relative", overflow:"hidden", background:"rgba(0,0,0,0.8)" },
  previewImg: { width:"100%", height:"360px", objectFit:"contain", display:"block", filter:"brightness(0.9) contrast(1.05)" },
  overlay: { position:"absolute", inset:0, pointerEvents:"none" },
  crossH: { position:"absolute", top:"50%", left:0, right:0, height:1, background:"rgba(0,255,120,0.08)", transform:"translateY(-50%)" },
  crossV: { position:"absolute", left:"50%", top:0, bottom:0, width:1, background:"rgba(0,255,120,0.08)", transform:"translateX(-50%)" },
  bigCorner: { position:"absolute", width:22, height:22, borderStyle:"solid", borderColor:"#00ff78", borderWidth:0 },
  reticle: { position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" },
  reticleRing: { width:32, height:32, borderRadius:"50%", border:"1px solid rgba(0,255,120,0.4)", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"reticlePulse 2s ease-in-out infinite" },
  reticleDot: { width:4, height:4, borderRadius:"50%", background:"#00ff78", boxShadow:"0 0 8px #00ff78", position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)" },
  scanBadge: { position:"absolute", top:12, right:12, fontSize:9, letterSpacing:"2px", border:"1px solid rgba(0,255,120,0.3)", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(6px)", color:"#00ff78", padding:"4px 10px", display:"flex", alignItems:"center", gap:6 },
  scanBadgeDot: { width:5, height:5, borderRadius:"50%", background:"#00ff78", display:"inline-block", animation:"scanBadgePulse 0.9s ease-in-out infinite" },
  metaBar: { padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(0,0,0,0.65)", borderTop:"1px solid rgba(0,255,120,0.12)" },
  metaLeft: { display:"flex", alignItems:"center", gap:10 },
  metaCheck: { color:"#00ff78", fontSize:14 },
  metaName: { fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:1 },
  metaSize: { fontSize:9, color:"rgba(0,255,120,0.4)", letterSpacing:"1.5px" },
  removeBtn: { background:"none", border:"1px solid rgba(255,80,80,0.25)", color:"rgba(255,90,90,0.65)", fontSize:9, letterSpacing:"1.5px", padding:"4px 12px", cursor:"pointer", fontFamily:"'Share Tech Mono',monospace" },
  emptyDrop: { display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:40 },
  hexIcon: { marginBottom:8 },
  emptyTitle: { fontFamily:"'Orbitron',sans-serif", fontSize:15, letterSpacing:"4px", color:"rgba(255,255,255,0.5)", margin:0 },
  emptySub: { fontSize:11, color:"rgba(255,255,255,0.2)", margin:0 },
  emptyHint: { marginTop:16, fontSize:9, letterSpacing:"2px", color:"rgba(0,255,120,0.35)", border:"1px solid rgba(0,255,120,0.12)", background:"rgba(0,255,120,0.025)", padding:"6px 16px", display:"flex", alignItems:"center", gap:10 },
  emptyHintIcon: { opacity:0.4 },
  analyzeBtn: { position:"relative", cursor:"pointer", fontFamily:"'Orbitron',sans-serif", fontSize:12, fontWeight:700, color:"#00ff78", background:"rgba(0,255,120,0.05)", border:"1px solid rgba(0,255,120,0.3)", padding:"20px 24px", transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)", boxShadow:"0 0 20px rgba(0,255,120,0.12)", clipPath:"polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)", overflow:"hidden", letterSpacing:"3px" },
  analyzeBtnHover: { background:"rgba(0,255,120,0.1)", borderColor:"rgba(0,255,120,0.6)", boxShadow:"0 0 60px rgba(0,255,120,0.3),0 0 100px rgba(0,255,120,0.08),inset 0 0 40px rgba(0,255,120,0.04)", letterSpacing:"4px" },
  bCorner: { position:"absolute", width:12, height:12, borderColor:"#00ff78", borderStyle:"solid", pointerEvents:"none" },
  shine: { position:"absolute", top:0, left:"-100%", width:"55%", height:"100%", background:"linear-gradient(105deg,transparent 40%,rgba(0,255,120,0.1) 50%,transparent 60%)", animation:"shimmer 0.55s ease forwards", pointerEvents:"none" },
  analyzeBtnInner: { display:"flex", alignItems:"center", justifyContent:"center", gap:14, position:"relative", zIndex:1 },
  loadBox: { padding:"20px 24px", border:"1px solid rgba(0,255,120,0.2)", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(10px)", display:"flex", flexDirection:"column", gap:16 },
  loadHeader: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  loadTitle: { fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:"3px", color:"#00ff78", display:"flex", alignItems:"center", gap:8 },
  loadingDot: { width:6, height:6, borderRadius:"50%", background:"#00ff78", boxShadow:"0 0 10px #00ff78", display:"inline-block", animation:"scanBadgePulse 0.7s ease-in-out infinite" },
  loadPctTxt: { fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:700, color:"#00ff78", textShadow:"0 0 20px rgba(0,255,120,0.6)" },
  loadTrack: { height:6, background:"rgba(0,255,120,0.07)", position:"relative", overflow:"visible" },
  loadFill: { height:"100%", background:"linear-gradient(90deg,rgba(0,255,120,0.4),#00ff78)", transition:"width 0.35s ease", position:"relative" },
  stepsWrap: { display:"flex", flexDirection:"column", gap:12 },
  stepRow: { display:"flex", alignItems:"flex-start", gap:12 },
  stepCheck: { width:18, height:18, borderRadius:"50%", border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1, transition:"all 0.4s ease" },
  stepTick: { fontSize:9, color:"#000" },
  stepActive: { width:6, height:6, borderRadius:"50%", background:"#00ff78", animation:"scanBadgePulse 0.8s ease-in-out infinite" },
  stepLabel: { fontSize:10, letterSpacing:"1.5px", transition:"color 0.4s ease" },
  stepSub: { fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2, letterSpacing:"0.5px" },
  bottomHint: { display:"flex", alignItems:"center", gap:10, justifyContent:"center" },
  hintDash: { flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(0,255,120,0.15))" },
  hintText: { fontSize:9, letterSpacing:"2px", color:"rgba(255,255,255,0.18)", textTransform:"uppercase", whiteSpace:"nowrap" },
};

export default Detect;