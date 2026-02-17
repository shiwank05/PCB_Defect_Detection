import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "./Navbar";

const BOOT_LINES = [
  "> INITIALIZING PCB-INSPECT AI...",
  "> LOADING NEURAL WEIGHTS [████████] 100%",
  "> RESNET-48 BACKBONE READY",
  "> DEFECT CLASSIFIER ONLINE",
  "> ALL SYSTEMS OPERATIONAL ✓",
];

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const [phase, setPhase] = useState("boot");
  const [bootLines, setBootLines] = useState([]);
  const [bootDone, setBootDone] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [counts, setCounts] = useState({ c1: 0, c2: 0, c3: 0 });
  const [vizBars, setVizBars] = useState(Array(16).fill(0));
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    let i = 0;
    const add = () => {
      if (i >= BOOT_LINES.length) { setTimeout(() => { setBootDone(true); setPhase("title"); }, 400); return; }
      setBootLines(p => [...p, BOOT_LINES[i++]]);
      setTimeout(add, 280 + Math.random() * 180);
    };
    setTimeout(add, 300);
  }, []);

  useEffect(() => {
    if (phase !== "title") return;
    setTimeout(() => setTitleVisible(true), 150);
    setTimeout(() => setStatsVisible(true), 800);
  }, [phase]);

  useEffect(() => {
    if (!statsVisible) return;
    const targets = { c1: 98.6, c2: 2, c3: 12 };
    const ids = Object.keys(targets).map(key => {
      let cur = 0; const step = targets[key] / 55;
      return setInterval(() => {
        cur += step;
        if (cur >= targets[key]) setCounts(p => ({ ...p, [key]: targets[key] }));
        else setCounts(p => ({ ...p, [key]: parseFloat(cur.toFixed(key === "c1" ? 1 : 0)) }));
      }, 22);
    });
    return () => ids.forEach(clearInterval);
  }, [statsVisible]);

  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 180);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setVizBars(p => p.map(v => Math.max(0.05, Math.min(1, v * 0.7 + Math.random() * 0.5))));
    }, 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setScanPos(p => (p + 0.35) % 101), 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = e => { mouse.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }; };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const handleClick = useCallback(e => {
    if (e.target.closest("button") || e.target.closest("header")) return;
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 1400);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId, t = 0;

    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: Math.random(),
      vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
      trail: [], life: Math.random(),
    }));
    const traces = Array.from({ length: 10 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      len: 60 + Math.random() * 140, angle: (Math.floor(Math.random() * 4) * Math.PI) / 2,
      speed: 0.5 + Math.random() * 1.0, progress: Math.random(), width: 1 + Math.random() * 1.2,
    }));

    const draw = () => {
      t += 0.007; ctx.clearRect(0, 0, W, H);
      const mx = mouse.current.x, my = mouse.current.y;
      const vx = W * (0.3 + mx * 0.4), vy = H * (0.35 + my * 0.15);

      for (let i = 0; i <= 14; i++) {
        const xB = W * (i / 14);
        const g = ctx.createLinearGradient(xB, H, vx, vy);
        g.addColorStop(0, "rgba(0,255,120,0.15)"); g.addColorStop(1, "rgba(0,255,120,0)");
        ctx.beginPath(); ctx.moveTo(xB, H); ctx.lineTo(vx, vy);
        ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke();
      }
      for (let j = 0; j < 8; j++) {
        const yf = j / 8, y = vy + (H - vy) * yf * yf;
        const xl = vx - W * 0.6 * (1 - yf), xr = vx + W * 0.6 * (1 - yf);
        const g = ctx.createLinearGradient(xl, y, xr, y);
        g.addColorStop(0, "rgba(0,255,120,0)"); g.addColorStop(0.5, `rgba(0,255,120,${(1-yf)*0.15})`); g.addColorStop(1, "rgba(0,255,120,0)");
        ctx.beginPath(); ctx.moveTo(xl, y); ctx.lineTo(xr, y); ctx.strokeStyle = g; ctx.lineWidth = 0.7; ctx.stroke();
      }
      traces.forEach(tr => {
        tr.progress += tr.speed / tr.len * 0.8;
        if (tr.progress > 1.8) { tr.x = Math.random() * W; tr.y = Math.random() * H; tr.angle = (Math.floor(Math.random() * 4) * Math.PI) / 2; tr.len = 60 + Math.random() * 150; tr.progress = 0; }
        const head = Math.min(tr.progress, 1), tail = Math.max(0, tr.progress - 0.6);
        if (head > tail) {
          const hx = tr.x + Math.cos(tr.angle) * tr.len * head, hy = tr.y + Math.sin(tr.angle) * tr.len * head;
          const tx = tr.x + Math.cos(tr.angle) * tr.len * tail, ty2 = tr.y + Math.sin(tr.angle) * tr.len * tail;
          const g = ctx.createLinearGradient(tx, ty2, hx, hy);
          g.addColorStop(0, "rgba(0,255,120,0)"); g.addColorStop(1, "rgba(0,255,180,0.65)");
          ctx.beginPath(); ctx.moveTo(tx, ty2); ctx.lineTo(hx, hy); ctx.strokeStyle = g; ctx.lineWidth = tr.width; ctx.stroke();
          ctx.shadowBlur = 10; ctx.shadowColor = "#00ff78";
          ctx.beginPath(); ctx.arc(hx, hy, tr.width + 0.5, 0, Math.PI * 2); ctx.fillStyle = "#00ffcc"; ctx.fill(); ctx.shadowBlur = 0;
        }
      });
      pts.forEach(p => {
        const sp = 1 - p.z * 0.6; p.x += p.vx * sp; p.y += p.vy * sp; p.life -= 0.002 * sp;
        if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.x = Math.random() * W; p.y = Math.random() * H; p.vx = (Math.random() - 0.5) * 1.2; p.vy = (Math.random() - 0.5) * 1.2; p.life = 0.7 + Math.random() * 0.3; p.trail = []; }
        p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 18) p.trail.shift();
        if (p.trail.length > 2) {
          ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y); p.trail.forEach(pt => ctx.lineTo(pt.x, pt.y));
          const g = ctx.createLinearGradient(p.trail[0].x, p.trail[0].y, p.x, p.y);
          g.addColorStop(0, "hsla(165,100%,60%,0)"); g.addColorStop(1, `hsla(165,100%,60%,${p.life * 0.5})`);
          ctx.strokeStyle = g; ctx.lineWidth = (1 - p.z) * 2 + 0.2; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.z) * 2.5 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,180,${p.life * 0.7})`; ctx.fill();
      });
      for (let ri = 0; ri < 3; ri++) {
        const rr = ((t * 50 + ri * 130) % Math.hypot(W, H)) * 0.75;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,120,${(1 - rr / Math.hypot(W, H)) * 0.04})`; ctx.lineWidth = 1.2; ctx.stroke();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <div className="hm-root" onClick={handleClick}>
      <canvas ref={canvasRef} className="hm-canvas" />
      <div className="hm-vignette" />
      <div className="hm-noise" />
      <div className="hm-scanline" style={{ top: `${scanPos}%` }} />

      {ripples.map(r => <div key={r.id} className="hm-ripple" style={{ left: r.x, top: r.y }} />)}

      <Navbar accent="#00ff78" />

      {/* BOOT */}
      {phase === "boot" && (
        <div className="hm-terminal-wrap">
          <div className="hm-terminal">
            <div className="hm-term-header">
              <span className="hm-term-dot" style={{ background: "#ff5f57" }} />
              <span className="hm-term-dot" style={{ background: "#febc2e" }} />
              <span className="hm-term-dot" style={{ background: "#28c840" }} />
              <span className="hm-term-title">PCB-INSPECT-AI</span>
            </div>
            <div className="hm-term-body">
              {bootLines.filter(Boolean).map((line, i) => (
                <div key={i} className="hm-term-line" style={{ color: line.includes("✓") ? "#00ff78" : line.includes("100%") ? "#00c8ff" : "rgba(0,255,120,0.7)" }}>{line}</div>
              ))}
              {!bootDone && <span className="hm-cursor">█</span>}
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}
      {phase === "title" && (
        <div className="hm-content" style={{ opacity: titleVisible ? 1 : 0, transform: titleVisible ? "translateY(0)" : "translateY(24px)", transition: "all 1.1s cubic-bezier(0.22,1,0.36,1)" }}>

          <div className="hm-badge">
            <span className="hm-badge-dot" />
            <span className="hm-badge-txt">AI-POWERED INSPECTION</span>
            <span className="hm-badge-sep" />
            <span className="hm-badge-txt" style={{ color: "#00c8ff" }}>v2.4.0</span>
          </div>

          <div className="hm-title-block">
            <div className="hm-deco-row">
              <div className="hm-deco-line" /><div className="hm-deco-sq" /><div className="hm-deco-line" />
            </div>
            <div className="hm-title-row1">
              {glitch && <><span className="hm-glitch hm-glitch-r">PCB DEFECT</span><span className="hm-glitch hm-glitch-b">PCB DEFECT</span></>}
              <h1 className="hm-h1">PCB DEFECT</h1>
            </div>
            <div className="hm-title-row2">
              <span className="hm-h2">DETECTION</span>
              <span className="hm-cursor-blink">_</span>
            </div>
            <div className="hm-deco-row">
              <div className="hm-deco-line hm-deco-line-b" /><div className="hm-deco-sq hm-deco-sq-b" /><div className="hm-deco-line hm-deco-line-b" />
            </div>
          </div>

          <p className="hm-tagline">
            Industrial-grade PCB defect detection powered by deep learning.<br className="hm-br-desktop" />
            Upload. Analyze. Decide — in under 2 seconds.
          </p>

          <div className="hm-stats" style={{ opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0)" : "translateY(12px)", transition: "all 0.8s ease 0.2s" }}>
            {[
              { val: counts.c1 > 0 ? `${counts.c1}%` : "—", label: "Accuracy", sub: "On benchmark dataset", icon: "◉" },
              { val: counts.c2 > 0 ? `<${counts.c2}s` : "—", label: "Scan Speed", sub: "Per board image", icon: "◈" },
              { val: counts.c3 > 0 ? `${counts.c3}+` : "—", label: "Defect Types", sub: "Auto classified", icon: "◆" },
            ].map((s, i) => (
              <div key={i} className="hm-stat-card">
                <div className="hm-stat-top">
                  <span className="hm-stat-icon">{s.icon}</span>
                  <span className="hm-stat-val">{s.val}</span>
                </div>
                <span className="hm-stat-label">{s.label}</span>
                <span className="hm-stat-sub">{s.sub}</span>
                <div className="hm-stat-bar"><div className="hm-stat-bar-fill" style={{ width: counts.c1 > 0 ? "100%" : "0%", transitionDelay: `${0.6 + i * 0.18}s` }} /></div>
                <div className="hm-card-tr" /><div className="hm-card-bl" />
              </div>
            ))}
          </div>

          <div className="hm-cta">
            <button
              className={`hm-btn${hoverBtn ? " hm-btn-hover" : ""}`}
              onClick={() => navigate("/detect")}
              onMouseEnter={() => setHoverBtn(true)}
              onMouseLeave={() => setHoverBtn(false)}
              onTouchStart={() => setHoverBtn(true)}
              onTouchEnd={() => { setHoverBtn(false); navigate("/detect"); }}
            >
              <span className="hm-btn-inner">
                <svg width="16" height="16" viewBox="0 0 18 18" style={{ opacity: 0.7, flexShrink: 0 }}>
                  <polygon points="9,1 17,5.5 17,12.5 9,17 1,12.5 1,5.5" fill="none" stroke="#00ff78" strokeWidth="1.5" />
                  <polygon points="9,5 13,7.5 13,10.5 9,13 5,10.5 5,7.5" fill="rgba(0,255,120,0.15)" stroke="#00ff78" strokeWidth="1" />
                </svg>
                INITIATE SCAN SEQUENCE
                <span style={{ opacity: 0.5 }}>→</span>
              </span>
            </button>
            <div className="hm-cta-note">
              <span>✓ No account</span>
              <span className="hm-note-sep">·</span>
              <span>✓ Instant results</span>
              <span className="hm-note-sep">·</span>
              <span>✓ Secure</span>
            </div>
          </div>

        </div>
      )}

      <div className="hm-btm">
        <div className="hm-btm-l">
          <span className="hm-btm-item">STATUS: <span style={{ color: "#00ff78" }}>ONLINE</span></span>
          <span className="hm-btm-sep" />
          <span className="hm-btm-item hm-btm-model">MODEL: <span style={{ color: "#00c8ff" }}>CNN-48L</span></span>
          <span className="hm-btm-sep hm-btm-sep-model" />
          <span className="hm-btm-item">ACC: <span style={{ color: "#00ff78" }}>98.6%</span></span>
        </div>
        <span className="hm-btm-item hm-btm-copy">© 2025 PCB INSPECT AI</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes hm-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes hm-dot{0%,100%{transform:scale(1);box-shadow:0 0 5px #00ff78}50%{transform:scale(1.4);box-shadow:0 0 14px #00ff78,0 0 30px rgba(0,255,120,0.4)}}
        @keyframes hm-ripple{0%{transform:translate(-50%,-50%) scale(0);opacity:0.5}100%{transform:translate(-50%,-50%) scale(8);opacity:0}}
        @keyframes hm-noise{0%,100%{background-position:0 0}10%{background-position:-5% -10%}50%{background-position:-15% 10%}}
        @keyframes hm-shine{0%{left:-100%}100%{left:230%}}
        @keyframes hm-glow{0%,100%{box-shadow:0 0 30px rgba(0,255,120,0.2)}50%{box-shadow:0 0 80px rgba(0,255,120,0.5),0 0 140px rgba(0,255,120,0.15)}}
        @keyframes hm-cursor{0%,49%{opacity:1}50%,100%{opacity:0}}

        .hm-root{
          min-height:100vh;position:relative;overflow-x:hidden;
          background:radial-gradient(ellipse at 20% 40%,#031410 0%,#010c0a 35%,#010608 65%,#000408 100%);
          font-family:'Share Tech Mono',monospace;
          display:flex;flex-direction:column;align-items:stretch;color:#fff;
        }
        .hm-canvas{position:fixed;inset:0;z-index:0}
        .hm-vignette{position:fixed;inset:0;z-index:2;pointer-events:none;background:radial-gradient(ellipse at center,transparent 20%,rgba(0,0,0,0.88) 100%)}
        .hm-noise{position:fixed;inset:0;z-index:3;opacity:0.025;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:160px 160px;animation:hm-noise 0.35s steps(1) infinite}
        .hm-scanline{position:fixed;left:0;right:0;height:2px;z-index:20;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(0,255,120,0.5) 50%,transparent 100%);box-shadow:0 0 16px rgba(0,255,120,0.3);transition:top 0.016s linear}
        .hm-ripple{position:fixed;z-index:50;pointer-events:none;width:60px;height:60px;border-radius:50%;border:1px solid rgba(0,255,120,0.6);animation:hm-ripple 1.4s ease-out forwards}

        /* TERMINAL */
        .hm-terminal-wrap{flex:1;display:flex;align-items:center;justify-content:center;position:relative;z-index:10;padding:20px 16px}
        .hm-terminal{width:100%;max-width:520px;background:rgba(0,0,0,0.88);backdrop-filter:blur(16px);border:1px solid rgba(0,255,120,0.22);border-radius:6px;overflow:hidden;box-shadow:0 0 60px rgba(0,255,120,0.07)}
        .hm-term-header{display:flex;align-items:center;gap:7px;padding:10px 16px;border-bottom:1px solid rgba(0,255,120,0.1);background:rgba(0,255,120,0.03)}
        .hm-term-dot{width:11px;height:11px;border-radius:50%;display:inline-block}
        .hm-term-title{font-size:9px;color:rgba(255,255,255,0.25);letter-spacing:1px;margin-left:6px}
        .hm-term-body{padding:18px 20px 22px;min-height:140px}
        .hm-term-line{font-size:11px;line-height:2;letter-spacing:0.5px}
        .hm-cursor{color:#00ff78;animation:hm-cursor 0.8s step-end infinite;font-size:13px}

        /* CONTENT */
        .hm-content{
          position:relative;z-index:10;
          display:flex;flex-direction:column;align-items:center;text-align:center;
          padding:32px 20px 80px;
          max-width:960px;width:100%;margin:0 auto;flex:1;justify-content:center;gap:0;
        }

        /* Badge */
        .hm-badge{
          display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;
          border:1px solid rgba(0,255,120,0.2);background:rgba(0,255,120,0.03);
          padding:6px 16px;margin-bottom:28px;
        }
        .hm-badge-dot{width:6px;height:6px;border-radius:50%;background:#00ff78;display:inline-block;animation:hm-dot 1.8s ease-in-out infinite}
        .hm-badge-txt{font-size:8px;letter-spacing:2.5px;color:rgba(0,255,120,0.7);text-transform:uppercase}
        .hm-badge-sep{width:1px;height:11px;background:rgba(0,255,120,0.25)}

        /* Title */
        .hm-title-block{position:relative;margin-bottom:24px}
        .hm-deco-row{display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:6px}
        .hm-deco-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,120,0.45));max-width:100px}
        .hm-deco-sq{width:7px;height:7px;background:#00ff78;transform:rotate(45deg);box-shadow:0 0 10px #00ff78}
        .hm-deco-line-b{background:linear-gradient(90deg,transparent,rgba(0,200,255,0.4))}
        .hm-deco-sq-b{background:#00c8ff;box-shadow:0 0 10px #00c8ff}
        .hm-title-row1{position:relative;display:block;line-height:1;margin-bottom:2px}
        .hm-h1{
          font-family:'Orbitron',sans-serif;font-weight:900;
          font-size:clamp(28px,10vw,110px);
          letter-spacing:clamp(3px,2vw,12px);line-height:1;
          color:#fff;position:relative;z-index:1;display:block;
        }
        .hm-glitch{position:absolute;top:0;left:0;right:0;font-family:'Orbitron',sans-serif;font-weight:900;font-size:clamp(28px,10vw,110px);letter-spacing:clamp(3px,2vw,12px);pointer-events:none;user-select:none}
        .hm-glitch-r{color:rgba(255,0,80,0.5);transform:translate(3px,-2px);clip-path:inset(30% 0 40% 0)}
        .hm-glitch-b{color:rgba(0,220,255,0.5);transform:translate(-3px,2px);clip-path:inset(60% 0 10% 0)}
        .hm-title-row2{display:flex;align-items:center;justify-content:center;gap:2px}
        .hm-h2{
          font-family:'Orbitron',sans-serif;font-weight:900;
          font-size:clamp(28px,10vw,110px);
          letter-spacing:clamp(3px,2vw,12px);line-height:1;
          background:linear-gradient(100deg,#00ff78 0%,#00ffcc 40%,#00c8ff 100%);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          filter:drop-shadow(0 0 40px rgba(0,255,120,0.6));
        }
        .hm-cursor-blink{font-family:'Share Tech Mono',monospace;font-size:clamp(28px,10vw,110px);color:#00ff78;line-height:1;animation:hm-blink 1s step-end infinite;margin-left:-2px}

        /* Tagline */
        .hm-tagline{
          font-family:'Rajdhani',sans-serif;font-weight:300;
          font-size:clamp(14px,2.5vw,17px);
          color:rgba(255,255,255,0.32);line-height:1.9;
          max-width:480px;margin:20px 0 36px;padding:0 8px;
        }
        .hm-br-desktop{display:none}
        @media(min-width:600px){.hm-br-desktop{display:block}}

        /* Stats */
        .hm-stats{
          display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
          width:100%;max-width:640px;margin-bottom:40px;
        }
        @media(max-width:440px){.hm-stats{grid-template-columns:1fr;max-width:300px}}
        .hm-stat-card{
          padding:16px 14px 13px;
          border:1px solid rgba(0,255,120,0.09);background:rgba(0,0,0,0.5);
          backdrop-filter:blur(12px);text-align:left;position:relative;overflow:hidden;
          transition:border-color 0.3s;
        }
        .hm-stat-card:hover{border-color:rgba(0,255,120,0.28)}
        .hm-stat-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
        .hm-stat-icon{font-size:11px;color:rgba(0,255,120,0.3);margin-top:4px}
        .hm-stat-val{font-family:'Orbitron',sans-serif;font-size:clamp(20px,4vw,32px);font-weight:700;color:#00ff78;line-height:1;text-shadow:0 0 20px rgba(0,255,120,0.4)}
        .hm-stat-label{font-family:'Rajdhani',sans-serif;font-size:9px;color:rgba(255,255,255,0.22);letter-spacing:2.5px;text-transform:uppercase;margin-bottom:2px;display:block}
        .hm-stat-sub{font-size:9px;color:rgba(255,255,255,0.14);letter-spacing:0.8px;margin-bottom:12px;display:block}
        .hm-stat-bar{height:2px;background:rgba(0,255,120,0.06);overflow:hidden}
        .hm-stat-bar-fill{height:100%;background:linear-gradient(90deg,#00ff78,#00c8ff);transition:width 1.8s cubic-bezier(0.4,0,0.2,1)}
        .hm-card-tr{position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 18px 18px 0;border-color:transparent rgba(0,255,120,0.1) transparent transparent}
        .hm-card-bl{position:absolute;bottom:0;left:0;width:0;height:0;border-style:solid;border-width:18px 0 0 18px;border-color:transparent transparent transparent rgba(0,255,120,0.07)}

        /* CTA */
        .hm-cta{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;max-width:480px}
        .hm-btn{
          position:relative;cursor:pointer;outline:none;
          border:1px solid rgba(0,255,120,0.3);background:rgba(0,0,0,0.65);
          color:#00ff78;font-family:'Orbitron',sans-serif;
          font-size:clamp(9px,2.5vw,11px);font-weight:700;
          padding:18px 24px;width:100%;
          transition:all 0.35s cubic-bezier(0.4,0,0.2,1);
          overflow:hidden;letter-spacing:clamp(2px,1vw,4px);
          clip-path:polygon(14px 0%,100% 0%,calc(100% - 14px) 100%,0% 100%);
          -webkit-tap-highlight-color:transparent;
        }
        .hm-btn-hover,.hm-btn:hover{
          background:rgba(0,255,120,0.09);border-color:rgba(0,255,120,0.65);
          box-shadow:0 0 60px rgba(0,255,120,0.35),0 0 100px rgba(0,255,120,0.1),inset 0 0 40px rgba(0,255,120,0.04);
          animation:hm-glow 1.2s ease-in-out infinite;
        }
        .hm-btn-inner{display:flex;align-items:center;justify-content:center;gap:12px;position:relative;z-index:1}
        .hm-cta-note{display:flex;align-items:center;gap:8px;font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,0.15);flex-wrap:wrap;justify-content:center}
        .hm-note-sep{color:rgba(0,255,120,0.25)}

        /* Bottom bar */
        .hm-btm{
          position:fixed;bottom:0;left:0;right:0;z-index:40;
          height:32px;display:flex;align-items:center;justify-content:space-between;
          padding:0 16px;border-top:1px solid rgba(0,255,120,0.07);
          background:rgba(0,0,0,0.8);backdrop-filter:blur(20px);
        }
        .hm-btm-l{display:flex;align-items:center;gap:10px}
        .hm-btm-item{font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.2);text-transform:uppercase;white-space:nowrap}
        .hm-btm-sep{width:1px;height:12px;background:rgba(0,255,120,0.15)}
        .hm-btm-copy{font-size:8px;letter-spacing:1.5px;color:rgba(255,255,255,0.15)}
        @media(max-width:480px){
          .hm-btm-model{display:none}
          .hm-btm-sep-model{display:none}
        }
      `}</style>
    </div>
  );
}