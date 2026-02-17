import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function Detect() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scanY, setScanY] = useState(0);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const scanRef = useRef(null);
  const navigate = useNavigate();

  const steps = [
    { label: "PREPROCESSING IMAGE", sub: "Normalizing pixel data..." },
    { label: "RUNNING NEURAL NETWORK", sub: "Forwarding through YOLOv8m layers..." },
    { label: "ANALYZING DEFECT PATTERNS", sub: "Comparing against 693 training samples..." },
    { label: "GENERATING REPORT", sub: "Compiling confidence scores..." },
  ];

  useEffect(() => { setTimeout(() => setRevealed(true), 120); }, []);

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

  const handleFile = file => {
    if (!file || !file.type.startsWith("image/")) return;
    setError(null);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    setLoadStep(0);
    setLoadPct(0);
    setError(null);

    // Animate steps while waiting for API
    let step = 0;
    const si = setInterval(() => {
      step++;
      if (step < steps.length) setLoadStep(step);
      else clearInterval(si);
    }, 700);

    // Fake progress bar up to 90%
    let pct = 0;
    const pi = setInterval(() => {
      pct += Math.random() * 2.5;
      if (pct >= 90) { pct = 90; clearInterval(pi); }
      setLoadPct(pct);
    }, 80);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("http://localhost:5000/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Detection failed");
      }

      const result = await response.json();

      clearInterval(si);
      clearInterval(pi);
      setLoadPct(100);

      // Pass image URL so Result page can draw bounding boxes
      const imageUrl = URL.createObjectURL(image);

      setTimeout(() => {
        navigate("/result", { state: { ...result, imageUrl } });
      }, 480);

    } catch (err) {
      clearInterval(si);
      clearInterval(pi);
      setLoading(false);
      setLoadPct(0);
      setError(
        err.message.includes("fetch")
          ? "Cannot connect to backend. Make sure Flask is running on port 5000."
          : err.message
      );
    }
  };

  return (
    <div className="dt-root">
      <div className="dt-grid" />
      <div className="dt-vignette" />
      <div className="dt-noise" />

      <Navbar accent="#00ff78" />

      <main className="dt-main" style={{ opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(14px)", transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* LEFT PANEL */}
        <div className="dt-left">
          <div className="dt-tag"><span className="dt-tag-dot" />// UPLOAD MODULE</div>
          <h2 className="dt-heading">SCAN YOUR <span className="dt-heading-accent">CIRCUIT BOARD</span></h2>
          <p className="dt-desc">Upload a PCB image and our YOLOv8m model will analyze every trace, pad, and solder joint for manufacturing defects.</p>

          <div className="dt-cards">
            {[
              { icon: "◈", title: "High Resolution", desc: "Min 512×512px recommended", num: "01" },
              { icon: "◉", title: "Clear Focus", desc: "Sharp edges improve accuracy 23%", num: "02" },
              { icon: "◆", title: "Good Lighting", desc: "Avoid overexposed images", num: "03" },
            ].map(c => (
              <div key={c.title} className="dt-card">
                <span className="dt-card-num">{c.num}</span>
                <div className="dt-card-icon"><span>{c.icon}</span></div>
                <div className="dt-card-text">
                  <div className="dt-card-title">{c.title}</div>
                  <div className="dt-card-desc">{c.desc}</div>
                </div>
                <div className="dt-card-bar" />
              </div>
            ))}
          </div>

          <div className="dt-model-info">
            <div className="dt-model-row">
              <span className="dt-model-key">MODEL</span>
              <span className="dt-model-val" style={{ color: "#00c8ff" }}>YOLOv8m</span>
            </div>
            <div className="dt-model-row">
              <span className="dt-model-key">mAP@0.5</span>
              <span className="dt-model-val" style={{ color: "#00ff78" }}>93.6%</span>
            </div>
            <div className="dt-model-row">
              <span className="dt-model-key">CLASSES</span>
              <span className="dt-model-val">6 DEFECT TYPES</span>
            </div>
            <div className="dt-model-row">
              <span className="dt-model-key">INFERENCE</span>
              <span className="dt-model-val">~14ms / IMAGE</span>
            </div>
          </div>

          <div className="dt-formats">
            <span className="dt-formats-label">SUPPORTED FORMATS</span>
            <div className="dt-pills">
              {["PNG", "JPG", "WEBP", "BMP", "TIFF"].map(f => <span key={f} className="dt-pill">{f}</span>)}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="dt-right">
          <div
            className={`dt-drop${dragging ? " dt-drop-drag" : ""}${preview ? " dt-drop-has" : ""}`}
            onClick={() => !preview && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          >
            {preview ? (
              <div className="dt-preview-wrap">
                <div className="dt-img-wrap">
                  <img src={preview} alt="PCB Preview" className="dt-preview-img" />
                  <div className="dt-scan-overlay">
                    <div className="dt-scan-line" style={{ top: `${scanY}%` }} />
                    <div className="dt-cross-h" /><div className="dt-cross-v" />
                    {[{ top: 0, left: 0, bTop: true, bLeft: true }, { top: 0, right: 0, bTop: true, bRight: true }, { bottom: 0, left: 0, bBot: true, bLeft: true }, { bottom: 0, right: 0, bBot: true, bRight: true }].map((c, i) => (
                      <div key={i} className="dt-corner" style={{ top: c.top, bottom: c.bottom, left: c.left, right: c.right, borderTop: c.bTop ? "2px solid #00ff78" : "none", borderLeft: c.bLeft ? "2px solid #00ff78" : "none", borderBottom: c.bBot ? "2px solid #00ff78" : "none", borderRight: c.bRight ? "2px solid #00ff78" : "none" }} />
                    ))}
                    <div className="dt-badge"><span className="dt-badge-dot" />READY TO SCAN</div>
                  </div>
                </div>
                <div className="dt-meta">
                  <div className="dt-meta-left">
                    <span className="dt-meta-check">✓</span>
                    <div>
                      <div className="dt-meta-name">{image?.name}</div>
                      <div className="dt-meta-size">{(image?.size / 1024).toFixed(1)} KB · {image?.type?.split("/")[1]?.toUpperCase()}</div>
                    </div>
                  </div>
                  <button className="dt-remove" onClick={e => { e.stopPropagation(); setImage(null); setPreview(null); setError(null); }}>✕ REMOVE</button>
                </div>
              </div>
            ) : (
              <div className="dt-empty">
                <svg width="70" height="70" viewBox="0 0 80 80" className="dt-empty-icon">
                  <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="none" stroke="rgba(0,255,120,0.3)" strokeWidth="1.5" />
                  <polygon points="40,14 63,27 63,53 40,66 17,53 17,27" fill="none" stroke="rgba(0,255,120,0.12)" strokeWidth="1" />
                  <text x="40" y="46" textAnchor="middle" fill="rgba(0,255,120,0.4)" fontSize="20" fontFamily="monospace">⬡</text>
                </svg>
                <p className="dt-empty-title">DROP IMAGE HERE</p>
                <p className="dt-empty-sub">or tap to browse files</p>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />

          {/* Error message */}
          {error && (
            <div className="dt-error">
              <span className="dt-error-icon">⚠</span>
              <span className="dt-error-txt">{error}</span>
            </div>
          )}

          {!loading ? (
            <button
              className={`dt-btn${!image ? " dt-btn-disabled" : ""}`}
              onClick={handleSubmit}
              disabled={!image}
            >
              <span className="dt-btn-inner">
                <svg width="13" height="13" viewBox="0 0 14 14" style={{ opacity: 0.7 }}>
                  <polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" fill="none" stroke="#00ff78" strokeWidth="1.5" />
                </svg>
                RUN DEFECT ANALYSIS
                <span className="dt-btn-arrow">→</span>
              </span>
            </button>
          ) : (
            <div className="dt-loading">
              <div className="dt-load-header">
                <div className="dt-load-title"><span className="dt-load-dot" />ANALYZING...</div>
                <span className="dt-load-pct">{Math.round(loadPct)}%</span>
              </div>
              <div className="dt-track">
                <div className="dt-fill" style={{ width: `${loadPct}%` }} />
                <div className="dt-fill-head" style={{ left: `calc(${loadPct}% - 4px)` }} />
              </div>
              <div className="dt-steps">
                {steps.map((step, i) => (
                  <div key={i} className="dt-step" style={{ opacity: i > loadStep ? 0.2 : 1, transition: "opacity 0.4s ease" }}>
                    <div className="dt-step-check" style={{ background: i < loadStep ? "#00ff78" : "transparent", borderColor: i <= loadStep ? "#00ff78" : "rgba(255,255,255,0.15)", boxShadow: i === loadStep ? "0 0 10px rgba(0,255,120,0.6)" : "none" }}>
                      {i < loadStep && <span className="dt-step-tick">✓</span>}
                      {i === loadStep && <span className="dt-step-active" />}
                    </div>
                    <div>
                      <div className="dt-step-label" style={{ color: i === loadStep ? "#00ff78" : i < loadStep ? "rgba(0,255,120,0.5)" : "rgba(255,255,255,0.2)" }}>{step.label}</div>
                      {i === loadStep && <div className="dt-step-sub">{step.sub}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && (
            <div className="dt-hint">
              <div className="dt-hint-line" />
              <span className="dt-hint-txt">{image ? `Ready · ${image.name}` : "No image selected"}</span>
              <div className="dt-hint-line" />
            </div>
          )}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');
        *{box-sizing:border-box}
        @keyframes dt-dot{0%,100%{box-shadow:0 0 4px #00ff78}50%{box-shadow:0 0 10px #00ff78,0 0 20px #00ff78}}
        @keyframes dt-pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes dt-noise{0%,100%{background-position:0 0}10%{background-position:-5% -10%}50%{background-position:-15% 10%}}

        .dt-root{min-height:100vh;background:radial-gradient(ellipse at 15% 40%,#051510 0%,#020c10 45%,#010508 100%);font-family:'Share Tech Mono',monospace;color:#fff;display:flex;flex-direction:column;position:relative;overflow-x:hidden}
        .dt-grid{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(0,255,120,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,0.022) 1px,transparent 1px);background-size:44px 44px}
        .dt-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 30%,rgba(0,0,0,0.88) 100%)}
        .dt-noise{position:fixed;inset:0;z-index:2;opacity:0.022;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:120px 120px;animation:dt-noise 0.4s steps(1) infinite}

        .dt-main{position:relative;z-index:10;flex:1;display:flex;flex-direction:column;gap:28px;padding:24px 16px 40px;width:100%;max-width:1280px;margin:0 auto;}
        @media(min-width:900px){.dt-main{flex-direction:row;align-items:stretch;gap:0;padding:44px 40px 40px}.dt-left{flex:0 0 340px;padding-right:48px;border-right:1px solid rgba(0,255,120,0.08)}.dt-right{flex:1;padding-left:48px}}

        .dt-left{display:flex;flex-direction:column;gap:0}
        .dt-tag{display:flex;align-items:center;gap:8px;color:rgba(0,255,120,0.5);font-size:10px;letter-spacing:2px;margin-bottom:16px}
        .dt-tag-dot{width:5px;height:5px;border-radius:50%;background:#00ff78;animation:dt-dot 2s ease-in-out infinite}
        .dt-heading{font-family:'Orbitron',sans-serif;font-size:clamp(20px,5vw,36px);font-weight:900;line-height:1.15;margin-bottom:14px;color:#fff}
        .dt-heading-accent{background:linear-gradient(90deg,#00ff78,#00ffcc,#00c8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(0,255,120,0.5))}
        .dt-desc{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:300;color:rgba(255,255,255,0.32);line-height:1.8;margin-bottom:24px}

        .dt-cards{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
        @media(max-width:400px){.dt-cards{display:none}}
        .dt-card{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid rgba(0,255,120,0.08);background:rgba(0,255,120,0.015);position:relative;overflow:hidden}
        .dt-card-num{font-family:'Orbitron',sans-serif;font-size:9px;color:rgba(0,255,120,0.22);min-width:18px}
        .dt-card-icon{width:26px;height:26px;border:1px solid rgba(0,255,120,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:rgba(0,255,120,0.04);font-size:12px;color:#00ff78}
        .dt-card-text{flex:1;min-width:0}
        .dt-card-title{font-size:9px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.75);text-transform:uppercase;margin-bottom:2px}
        .dt-card-desc{font-size:9px;color:rgba(255,255,255,0.28)}
        .dt-card-bar{position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,transparent,#00ff78,transparent)}

        .dt-model-info{border:1px solid rgba(0,255,120,0.1);background:rgba(0,255,120,0.02);margin-bottom:20px;overflow:hidden}
        .dt-model-row{display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid rgba(0,255,120,0.06);font-size:9px}
        .dt-model-row:last-child{border-bottom:none}
        .dt-model-key{color:rgba(255,255,255,0.22);letter-spacing:1.5px}
        .dt-model-val{color:rgba(255,255,255,0.6);letter-spacing:1px}

        .dt-formats{display:flex;flex-direction:column;gap:8px}
        .dt-formats-label{font-size:9px;letter-spacing:2.5px;color:rgba(255,255,255,0.18);text-transform:uppercase}
        .dt-pills{display:flex;gap:6px;flex-wrap:wrap}
        .dt-pill{font-size:8px;letter-spacing:1.5px;border:1px solid rgba(0,255,120,0.15);color:rgba(0,255,120,0.4);padding:3px 9px;background:rgba(0,255,120,0.02)}

        .dt-right{display:flex;flex-direction:column;gap:14px}
        .dt-drop{flex:1;border:1px dashed rgba(0,255,120,0.2);background:rgba(0,0,0,0.3);cursor:pointer;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;min-height:280px;position:relative;overflow:hidden;}
        @media(min-width:900px){.dt-drop{min-height:360px}}
        .dt-drop-drag{border-color:#00ff78;background:rgba(0,255,120,0.06);box-shadow:0 0 50px rgba(0,255,120,0.18)}
        .dt-drop-has{border-color:rgba(0,255,120,0.5);background:rgba(0,0,0,0.55)}

        .dt-preview-wrap{width:100%;height:100%;display:flex;flex-direction:column}
        .dt-img-wrap{flex:1;position:relative;overflow:hidden;background:rgba(0,0,0,0.8)}
        .dt-preview-img{width:100%;height:100%;min-height:220px;max-height:340px;object-fit:contain;display:block;filter:brightness(0.9) contrast(1.05)}
        .dt-scan-overlay{position:absolute;inset:0;pointer-events:none}
        .dt-scan-line{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent 0%,rgba(0,255,120,0.9) 50%,transparent 100%);box-shadow:0 0 18px rgba(0,255,120,0.8);transition:top 0.016s linear}
        .dt-cross-h{position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(0,255,120,0.07);transform:translateY(-50%)}
        .dt-cross-v{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(0,255,120,0.07);transform:translateX(-50%)}
        .dt-corner{position:absolute;width:20px;height:20px}
        .dt-badge{position:absolute;top:10px;right:10px;font-size:9px;letter-spacing:2px;border:1px solid rgba(0,255,120,0.3);background:rgba(0,0,0,0.6);color:#00ff78;padding:4px 9px;display:flex;align-items:center;gap:5px}
        .dt-badge-dot{width:5px;height:5px;border-radius:50%;background:#00ff78;display:inline-block;animation:dt-pulse 0.9s ease-in-out infinite}

        .dt-meta{padding:10px 14px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,0.65);border-top:1px solid rgba(0,255,120,0.1);flex-wrap:wrap;gap:8px}
        .dt-meta-left{display:flex;align-items:center;gap:10px}
        .dt-meta-check{color:#00ff78;font-size:14px}
        .dt-meta-name{font-size:11px;color:rgba(255,255,255,0.7);word-break:break-all;max-width:200px}
        .dt-meta-size{font-size:9px;color:rgba(0,255,120,0.4);letter-spacing:1px}
        .dt-remove{background:none;border:1px solid rgba(255,80,80,0.3);color:rgba(255,90,90,0.7);font-size:9px;letter-spacing:1.5px;padding:5px 12px;cursor:pointer;font-family:'Share Tech Mono',monospace;-webkit-tap-highlight-color:transparent}

        .dt-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:36px 20px}
        .dt-empty-icon{margin-bottom:4px}
        .dt-empty-title{font-family:'Orbitron',sans-serif;font-size:clamp(11px,3.5vw,14px);letter-spacing:4px;color:rgba(255,255,255,0.45)}
        .dt-empty-sub{font-size:11px;color:rgba(255,255,255,0.18)}

        .dt-error{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border:1px solid rgba(255,68,85,0.35);background:rgba(255,68,85,0.07);color:rgba(255,100,110,0.9)}
        .dt-error-icon{font-size:14px;flex-shrink:0;margin-top:1px}
        .dt-error-txt{font-size:10px;letter-spacing:0.8px;line-height:1.6}

        .dt-btn{position:relative;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:clamp(9px,2.5vw,11px);font-weight:700;color:#00ff78;background:rgba(0,255,120,0.05);border:1px solid rgba(0,255,120,0.3);padding:18px 20px;width:100%;transition:all 0.3s ease;box-shadow:0 0 16px rgba(0,255,120,0.1);clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);overflow:hidden;letter-spacing:2.5px;-webkit-tap-highlight-color:transparent;}
        .dt-btn:hover,.dt-btn:focus{background:rgba(0,255,120,0.1);border-color:rgba(0,255,120,0.6);box-shadow:0 0 50px rgba(0,255,120,0.28),inset 0 0 30px rgba(0,255,120,0.04)}
        .dt-btn-disabled{opacity:0.35;cursor:not-allowed}
        .dt-btn-inner{display:flex;align-items:center;justify-content:center;gap:12px;position:relative;z-index:1}
        .dt-btn-arrow{opacity:0.5}

        .dt-loading{padding:18px 20px;border:1px solid rgba(0,255,120,0.2);background:rgba(0,0,0,0.5);display:flex;flex-direction:column;gap:14px}
        .dt-load-header{display:flex;justify-content:space-between;align-items:center}
        .dt-load-title{font-family:'Orbitron',sans-serif;font-size:11px;letter-spacing:3px;color:#00ff78;display:flex;align-items:center;gap:8px}
        .dt-load-dot{width:6px;height:6px;border-radius:50%;background:#00ff78;box-shadow:0 0 10px #00ff78;display:inline-block;animation:dt-pulse 0.7s ease-in-out infinite}
        .dt-load-pct{font-family:'Orbitron',sans-serif;font-size:20px;font-weight:700;color:#00ff78;text-shadow:0 0 18px rgba(0,255,120,0.6)}
        .dt-track{height:5px;background:rgba(0,255,120,0.07);position:relative;overflow:visible}
        .dt-fill{height:100%;background:linear-gradient(90deg,rgba(0,255,120,0.4),#00ff78);transition:width 0.3s ease;position:relative}
        .dt-fill-head{position:absolute;top:-2px;bottom:-2px;width:7px;background:#00ff78;box-shadow:0 0 10px #00ff78;border-radius:3px;transition:left 0.3s ease}
        .dt-steps{display:flex;flex-direction:column;gap:10px}
        .dt-step{display:flex;align-items:flex-start;gap:10px}
        .dt-step-check{width:18px;height:18px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;transition:all 0.4s ease}
        .dt-step-tick{font-size:9px;color:#000}
        .dt-step-active{width:6px;height:6px;border-radius:50%;background:#00ff78;animation:dt-pulse 0.8s ease-in-out infinite}
        .dt-step-label{font-size:9px;letter-spacing:1.5px;transition:color 0.4s ease}
        .dt-step-sub{font-size:9px;color:rgba(255,255,255,0.28);margin-top:2px}

        .dt-hint{display:flex;align-items:center;gap:10px}
        .dt-hint-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,120,0.12))}
        .dt-hint-txt{font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,0.16);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}
      `}</style>
    </div>
  );
}