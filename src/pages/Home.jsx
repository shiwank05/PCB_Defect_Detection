import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "./Navbar";

/* ─── Boot sequence lines ─────────────────────────────────────────── */
const BOOT_LINES = [
  "> INITIALIZING PCB-INSPECT AI SYSTEM...",
  "> LOADING NEURAL WEIGHTS [████████████] 100%",
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
  const [glitch, setGlitch] = useState(0);
  const [hoverBtn, setHoverBtn] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [counts, setCounts] = useState({ c1: 0, c2: 0, c3: 0 });
  const [vizBars, setVizBars] = useState(Array(20).fill(0));
  const [scanPos, setScanPos] = useState(0);

  /* ─── Boot sequence ── */
  useEffect(() => {
    let lineIdx = 0;
    const addLine = () => {
      if (lineIdx >= BOOT_LINES.length) {
        setTimeout(() => { setBootDone(true); setPhase("title"); }, 400);
        return;
      }
      setBootLines(p => [...p, BOOT_LINES[lineIdx]]);
      lineIdx++;
      setTimeout(addLine, 320 + Math.random() * 200);
    };
    setTimeout(addLine, 300);
  }, []);

  useEffect(() => {
    if (phase !== "title") return;
    setTimeout(() => setTitleVisible(true), 200);
    setTimeout(() => setStatsVisible(true), 900);
  }, [phase]);

  useEffect(() => {
    if (!statsVisible) return;
    const targets = { c1: 98.6, c2: 2, c3: 12 };
    const ids = Object.keys(targets).map(key => {
      let cur = 0;
      const step = targets[key] / 55;
      return setInterval(() => {
        cur += step;
        if (cur >= targets[key]) {
          setCounts(p => ({ ...p, [key]: targets[key] }));
        } else {
          setCounts(p => ({ ...p, [key]: parseFloat(cur.toFixed(key === "c1" ? 1 : 0)) }));
        }
      }, 22);
    });
    return () => ids.forEach(clearInterval);
  }, [statsVisible]);

  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(g => g + 1);
      setTimeout(() => setGlitch(g => g + 1), 120);
      setTimeout(() => setGlitch(g => g + 1), 240);
    }, 3800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setVizBars(prev => prev.map((_, i) =>
        Math.max(0.05, Math.min(1, prev[i] * 0.7 + Math.random() * 0.5))
      ));
    }, 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setScanPos(p => (p + 0.4) % 101);
    }, 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = e => {
      mouse.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const handleBgClick = useCallback((e) => {
    if (e.target.closest("button") || e.target.closest("header")) return;
    const id = Date.now();
    setRipples(r => [...r, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 1400);
  }, []);

  /* ─── Master canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId, t = 0;

    const HORIZON = H * 0.5;
    const VP = { x: W / 2, y: HORIZON };

    const hexSize = 32;
    const cols = Math.ceil(W / (hexSize * 1.75)) + 3;
    const rows = Math.ceil(H / (hexSize * 1.52)) + 3;
    const hexes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        hexes.push({
          x: c * hexSize * 1.75 - hexSize,
          y: r * hexSize * 1.52 + (c % 2 ? hexSize * 0.76 : 0) - hexSize,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.6,
          active: Math.random() > 0.65,
          hue: Math.random() > 0.8 ? 185 : 145,
        });
      }
    }

    const pts = Array.from({ length: 120 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      z: Math.random(),
      vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6,
      trail: [], life: Math.random(),
    }));

    const traces = Array.from({ length: 14 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      len: 80 + Math.random() * 160,
      angle: (Math.floor(Math.random() * 4) * Math.PI) / 2,
      speed: 0.6 + Math.random() * 1.2,
      progress: Math.random(),
      width: 1 + Math.random() * 1.5,
    }));

    const drawHex = (x, y, size, alpha, fill, hue) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        i === 0 ? ctx.moveTo(x + size * Math.cos(a), y + size * Math.sin(a))
          : ctx.lineTo(x + size * Math.cos(a), y + size * Math.sin(a));
      }
      ctx.closePath();
      if (fill) { ctx.fillStyle = `hsla(${hue},100%,55%,${alpha * 0.08})`; ctx.fill(); }
      ctx.strokeStyle = `hsla(${hue},100%,55%,${alpha})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    };

    const draw = () => {
      t += 0.007;
      ctx.clearRect(0, 0, W, H);

      const mx = mouse.current.x;
      const my = mouse.current.y;
      const vanishX = W * (0.3 + mx * 0.4);
      const vanishY = H * (0.35 + my * 0.15);
      const gridLines = 18;
      for (let i = 0; i <= gridLines; i++) {
        const frac = i / gridLines;
        const xBase = W * frac;
        const grad1 = ctx.createLinearGradient(xBase, H, vanishX, vanishY);
        grad1.addColorStop(0, "rgba(0,255,120,0.18)");
        grad1.addColorStop(0.5, "rgba(0,255,120,0.06)");
        grad1.addColorStop(1, "rgba(0,255,120,0)");
        ctx.beginPath();
        ctx.moveTo(xBase, H);
        ctx.lineTo(vanishX, vanishY);
        ctx.strokeStyle = grad1;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      for (let j = 0; j < 10; j++) {
        const yFrac = j / 10;
        const y = vanishY + (H - vanishY) * (yFrac * yFrac);
        const xLeft = vanishX - (W * 0.6) * (1 - yFrac);
        const xRight = vanishX + (W * 0.6) * (1 - yFrac);
        const alpha = (1 - yFrac) * 0.18;
        const grad2 = ctx.createLinearGradient(xLeft, y, xRight, y);
        grad2.addColorStop(0, `rgba(0,255,120,0)`);
        grad2.addColorStop(0.5, `rgba(0,255,120,${alpha})`);
        grad2.addColorStop(1, `rgba(0,255,120,0)`);
        ctx.beginPath();
        ctx.moveTo(xLeft, y);
        ctx.lineTo(xRight, y);
        ctx.strokeStyle = grad2;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      hexes.forEach(h => {
        const wave = Math.sin(t * h.speed + h.phase) * 0.5 + 0.5;
        const alpha = h.active ? wave * 0.28 + 0.04 : 0.028;
        drawHex(h.x, h.y, hexSize * 0.44, alpha, h.active && wave > 0.72, h.hue);
        if (h.active && wave > 0.9) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsl(${h.hue},100%,60%)`;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${h.hue},100%,70%)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      traces.forEach(tr => {
        tr.progress += tr.speed / tr.len * 0.8;
        if (tr.progress > 1.8) {
          tr.x = Math.random() * W; tr.y = Math.random() * H;
          tr.angle = (Math.floor(Math.random() * 4) * Math.PI) / 2;
          tr.len = 80 + Math.random() * 180; tr.progress = 0;
        }
        const head = Math.min(tr.progress, 1);
        const tail = Math.max(0, tr.progress - 0.6);
        const hx = tr.x + Math.cos(tr.angle) * tr.len * head;
        const hy = tr.y + Math.sin(tr.angle) * tr.len * head;
        const tx2 = tr.x + Math.cos(tr.angle) * tr.len * tail;
        const ty2 = tr.y + Math.sin(tr.angle) * tr.len * tail;
        if (head > tail) {
          const g = ctx.createLinearGradient(tx2, ty2, hx, hy);
          g.addColorStop(0, "rgba(0,255,120,0)");
          g.addColorStop(1, "rgba(0,255,180,0.7)");
          ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(hx, hy);
          ctx.strokeStyle = g; ctx.lineWidth = tr.width; ctx.stroke();
          ctx.shadowBlur = 12; ctx.shadowColor = "#00ff78";
          ctx.beginPath(); ctx.arc(hx, hy, tr.width + 1, 0, Math.PI * 2);
          ctx.fillStyle = "#00ffcc"; ctx.fill(); ctx.shadowBlur = 0;
        }
      });

      pts.forEach(p => {
        const speed = 1 - p.z * 0.6;
        p.x += p.vx * speed; p.y += p.vy * speed;
        p.life -= 0.002 * speed;
        if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = Math.random() * W; p.y = Math.random() * H;
          p.vx = (Math.random() - 0.5) * 1.6; p.vy = (Math.random() - 0.5) * 1.6;
          p.life = 0.7 + Math.random() * 0.3; p.trail = [];
        }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 22) p.trail.shift();
        if (p.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          p.trail.forEach(pt => ctx.lineTo(pt.x, pt.y));
          const g2 = ctx.createLinearGradient(p.trail[0].x, p.trail[0].y, p.x, p.y);
          const hue2 = p.z < 0.4 ? 165 : 195;
          g2.addColorStop(0, `hsla(${hue2},100%,60%,0)`);
          g2.addColorStop(1, `hsla(${hue2},100%,60%,${p.life * (1 - p.z * 0.5) * 0.6})`);
          ctx.strokeStyle = g2;
          ctx.lineWidth = (1 - p.z) * 2.5 + 0.3;
          ctx.stroke();
        }
        const sz = (1 - p.z) * 3 + 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.z < 0.4 ? `rgba(0,255,180,${p.life * 0.8})` : `rgba(0,200,255,${p.life * 0.4})`;
        ctx.fill();
      });

      for (let ri = 0; ri < 3; ri++) {
        const rr = ((t * 55 + ri * 140) % Math.hypot(W, H)) * 0.8;
        const ra = 1 - rr / (Math.hypot(W, H) * 0.8);
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ri % 2 ? "0,200,255" : "0,255,120"},${ra * 0.055})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  const isGlitching = glitch % 2 === 1;

  return (
    <div style={R.root} onClick={handleBgClick}>
      <canvas ref={canvasRef} style={R.canvas} />
      <div style={R.vignette} />
      <div style={R.noise} />
      <div style={{ ...R.scanline, top: `${scanPos}%` }} />

      {ripples.map(r => (
        <div key={r.id} style={{ ...R.ripple, left: r.x, top: r.y }} />
      ))}

      {/* ── SHARED NAVBAR ── */}
      <Navbar accent="#00ff78" />

      {/* ── MINI VIZ BAR (below navbar, right-aligned) ── */}
      <div style={R.vizStrip}>
        <div style={R.viz}>
          {vizBars.map((h, i) => (
            <div key={i} style={{ ...R.vizBar, height: `${8 + h * 22}px`, opacity: 0.4 + h * 0.6, background: i < 7 ? "#00ff78" : i < 14 ? "#00ffcc" : "#00c8ff" }} />
          ))}
        </div>
        <div style={R.vizSep} />
        <span style={R.vizLive}>LIVE</span>
      </div>

      {/* ── BOOT TERMINAL ── */}
      {phase === "boot" && (
        <div style={R.terminalWrap}>
          <div style={R.terminal}>
            <div style={R.termHeader}>
              <div style={{ ...R.termDot, background: "#ff5f57" }} />
              <div style={{ ...R.termDot, background: "#febc2e" }} />
              <div style={{ ...R.termDot, background: "#28c840" }} />
              <span style={R.termTitle}>PCB-INSPECT-AI — SYSTEM INIT</span>
            </div>
            <div style={R.termBody}>
              {bootLines.filter(Boolean).map((line, i) => (
                <div key={i} style={{ ...R.termLine, color: line.includes("✓") ? "#00ff78" : line.includes("100%") ? "#00c8ff" : "rgba(0,255,120,0.7)" }}>
                  {line}
                </div>
              ))}
              {!bootDone && <div style={R.termCursor}>█</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {phase === "title" && (
        <div style={{
          ...R.content,
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "translateY(0)" : "translateY(30px)",
          transition: "all 1.2s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <div style={R.sideL}>
            <div style={R.sideRule} />
            <span style={R.sideTxt}>◈ POWERED BY AI ◈</span>
            <div style={R.sideRule} />
          </div>
          <div style={{ ...R.sideL, ...R.sideR }}>
            <div style={R.sideRule} />
            <span style={R.sideTxt}>◈ ML VISION MODEL ◈</span>
            <div style={R.sideRule} />
          </div>

          <div style={R.badge}>
            <span style={R.badgePulse} />
            <span style={R.badgeTxt}>AI-POWERED INSPECTION SYSTEM</span>
            <span style={R.badgeDivider} />
            <span style={{ ...R.badgeTxt, color: "#00c8ff" }}>v2.4.0</span>
            <span style={R.badgeDivider} />
            <span style={{ ...R.badgeTxt, color: "rgba(0,255,120,0.5)" }}>2025</span>
          </div>

          <div style={R.titleBlock}>
            <div style={R.titleTopDeco}>
              <div style={R.decoLine} />
              <div style={R.decoSquare} />
              <div style={R.decoLine} />
            </div>

            <div style={R.titleRow1}>
              {isGlitching && (
                <>
                  <span style={{ ...R.glitchLayer, color: "rgba(255,0,80,0.55)", left: 3, top: -2, clipPath: "inset(30% 0 40% 0)" }}>PCB DEFECT</span>
                  <span style={{ ...R.glitchLayer, color: "rgba(0,220,255,0.55)", left: -3, top: 2, clipPath: "inset(60% 0 10% 0)" }}>PCB DEFECT</span>
                  <span style={{ ...R.glitchLayer, color: "rgba(255,0,80,0.3)", left: 6, top: 0, clipPath: "inset(10% 0 70% 0)" }}>PCB DEFECT</span>
                </>
              )}
              <h1 style={R.h1}>PCB DEFECT</h1>
            </div>

            <div style={R.titleRow2}>
              <span style={R.h2}>DETECTION</span>
              <span style={R.blinkCursor}>_</span>
            </div>

            <div style={{ ...R.titleTopDeco, marginTop: 12 }}>
              <div style={{ ...R.decoLine, background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.4))" }} />
              <div style={{ ...R.decoSquare, background: "#00c8ff", boxShadow: "0 0 8px #00c8ff" }} />
              <div style={{ ...R.decoLine, background: "linear-gradient(90deg, rgba(0,200,255,0.4), transparent)" }} />
            </div>

            <div style={R.circuitArmL}>
              {[80, 40, 20].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ ...R.cNode, width: i === 0 ? 7 : 5, height: i === 0 ? 7 : 5, opacity: 1 - i * 0.25 }} />
                  <div style={{ ...R.cLine, width: w, opacity: 1 - i * 0.3 }} />
                </div>
              ))}
            </div>
            <div style={{ ...R.circuitArmL, ...R.circuitArmR }}>
              {[20, 40, 80].map((w, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ ...R.cLine, width: w, opacity: 1 - (2 - i) * 0.3, background: "linear-gradient(90deg, rgba(0,255,120,0.1), rgba(0,255,120,0.5))" }} />
                  <div style={{ ...R.cNode, width: i === 2 ? 7 : 5, height: i === 2 ? 7 : 5, opacity: 1 - (2 - i) * 0.25 }} />
                </div>
              ))}
            </div>
          </div>

          <p style={R.tagline}>
            Industrial-grade PCB defect detection powered by deep learning.
            <br />
            Upload. Analyze. Decide — in under 2 seconds.
          </p>

          <div style={{ ...R.statsRow, opacity: statsVisible ? 1 : 0, transform: statsVisible ? "translateY(0)" : "translateY(16px)", transition: "all 0.9s ease 0.2s" }}>
            {[
              { val: counts.c1 > 0 ? `${counts.c1}%` : "—", label: "Accuracy", sub: "On benchmark dataset", icon: "◉" },
              { val: counts.c2 > 0 ? `<${counts.c2}s` : "—", label: "Scan Speed", sub: "Per board image", icon: "◈" },
              { val: counts.c3 > 0 ? `${counts.c3}+` : "—", label: "Defect Types", sub: "Classified automatically", icon: "◆" },
            ].map((s, i) => (
              <div key={i} style={R.statCard} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,255,120,0.3)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(0,255,120,0.08)"}>
                <div style={R.statCardTop}>
                  <span style={R.statIcon}>{s.icon}</span>
                  <span style={{ ...R.statVal, textShadow: `0 0 30px rgba(0,255,120,${0.3 + (counts.c1 / 100) * 0.5})` }}>{s.val}</span>
                </div>
                <div style={R.statLabel}>{s.label}</div>
                <div style={R.statSub}>{s.sub}</div>
                <div style={R.statBarTrack}>
                  <div style={{ ...R.statBarFill, width: counts.c1 > 0 ? "100%" : "0%", transitionDelay: `${0.6 + i * 0.18}s` }} />
                </div>
                <div style={R.cardCornerTR} />
                <div style={R.cardCornerBL} />
              </div>
            ))}
          </div>

          <div style={R.ctaWrap}>
            <div style={{ ...R.ctaRing, opacity: hoverBtn ? 1 : 0 }} />
            <button
              style={{ ...R.btn, ...(hoverBtn ? R.btnHover : {}) }}
              onClick={() => navigate("/detect")}
              onMouseEnter={() => setHoverBtn(true)}
              onMouseLeave={() => setHoverBtn(false)}
            >
              {[["tl"], ["tr"], ["bl"], ["br"]].map(([id]) => (
                <span key={id} style={{
                  ...R.btnCorner,
                  top: id.startsWith("t") ? -1 : "auto",
                  bottom: id.startsWith("b") ? -1 : "auto",
                  left: id.endsWith("l") ? -1 : "auto",
                  right: id.endsWith("r") ? -1 : "auto",
                  borderTopWidth: id.startsWith("t") ? 2 : 0,
                  borderBottomWidth: id.startsWith("b") ? 2 : 0,
                  borderLeftWidth: id.endsWith("l") ? 2 : 0,
                  borderRightWidth: id.endsWith("r") ? 2 : 0,
                  transform: hoverBtn
                    ? id === "tl" ? "translate(-5px,-5px)" : id === "tr" ? "translate(5px,-5px)"
                      : id === "bl" ? "translate(-5px,5px)" : "translate(5px,5px)"
                    : "translate(0,0)",
                  opacity: hoverBtn ? 1 : 0.2,
                }} />
              ))}
              {hoverBtn && <span style={R.btnShine} />}
              <span style={R.btnContent}>
                <span style={R.btnHexL}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,1 17,5.5 17,12.5 9,17 1,12.5 1,5.5" fill="none" stroke="#00ff78" strokeWidth="1.5" /><polygon points="9,5 13,7.5 13,10.5 9,13 5,10.5 5,7.5" fill="rgba(0,255,120,0.15)" stroke="#00ff78" strokeWidth="1" /></svg>
                </span>
                <span style={{ letterSpacing: hoverBtn ? "7px" : "4px", transition: "letter-spacing 0.4s cubic-bezier(0.4,0,0.2,1)" }}>
                  INITIATE SCAN SEQUENCE
                </span>
                <span style={R.btnHexL}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,1 17,5.5 17,12.5 9,17 1,12.5 1,5.5" fill="none" stroke="#00ff78" strokeWidth="1.5" /><polygon points="9,5 13,7.5 13,10.5 9,13 5,10.5 5,7.5" fill="rgba(0,255,120,0.15)" stroke="#00ff78" strokeWidth="1" /></svg>
                </span>
              </span>
            </button>
            <div style={R.ctaNote}>
              <span style={R.ctaNoteItem}>✓ No account required</span>
              <span style={R.ctaNoteSep}>·</span>
              <span style={R.ctaNoteItem}>✓ Instant results</span>
              <span style={R.ctaNoteSep}>·</span>
              <span style={R.ctaNoteItem}>✓ Secure processing</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      <div style={R.btmBar}>
        <div style={R.btmBarL}>
          <span style={R.btmItem}>STATUS: <span style={{ color: "#00ff78" }}>OPERATIONAL</span></span>
          <div style={R.btmSep} />
          <span style={R.btmItem}>MODEL: <span style={{ color: "#00c8ff" }}>CNN-RESNET-48L</span></span>
          <div style={R.btmSep} />
          <span style={R.btmItem}>ACCURACY: <span style={{ color: "#00ff78" }}>98.6%</span></span>
        </div>
        <div style={R.btmBarR}>
          <span style={R.btmItem}>© 2025 PCB INSPECT AI</span>
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes blinkCursor  { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes pdot         { 0%,100%{box-shadow:0 0 5px #00ff78,0 0 14px #00ff78;transform:scale(1)}50%{box-shadow:0 0 10px #00ff78,0 0 28px #00ff78,0 0 50px rgba(0,255,120,0.3);transform:scale(1.4)} }
  @keyframes shimmer      { 0%{left:-100%}100%{left:230%} }
  @keyframes noise        { 0%,100%{background-position:0 0}10%{background-position:-5% -10%}30%{background-position:7% -25%}50%{background-position:-15% 10%}70%{background-position:0 15%}90%{background-position:-10% 10%} }
  @keyframes scanMove     { 0%{opacity:0} 5%{opacity:1} 90%{opacity:0.8} 100%{opacity:0} }
  @keyframes rippleAnim   { 0%{transform:translate(-50%,-50%) scale(0);opacity:0.5} 100%{transform:translate(-50%,-50%) scale(8);opacity:0} }
  @keyframes termBlink    { 0%,100%{opacity:1}50%{opacity:0} }
  @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glowPulse    { 0%,100%{box-shadow:0 0 40px rgba(0,255,120,0.2),0 0 80px rgba(0,255,120,0.08)} 50%{box-shadow:0 0 80px rgba(0,255,120,0.5),0 0 160px rgba(0,255,120,0.2)} }
  @keyframes ringExpand   { 0%{transform:translate(-50%,-50%) scale(1);opacity:0.5} 100%{transform:translate(-50%,-50%) scale(2.5);opacity:0} }
`;

const R = {
  root: { minHeight: "100vh", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 20% 40%, #031410 0%, #010c0a 30%, #010608 60%, #000408 100%)", fontFamily: "'Share Tech Mono', monospace", display: "flex", flexDirection: "column", alignItems: "stretch", color: "#fff", cursor: "crosshair" },
  canvas: { position: "fixed", inset: 0, zIndex: 0 },
  vignette: { position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.88) 100%)" },
  noise: { position: "fixed", inset: 0, zIndex: 3, opacity: 0.028, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "160px 160px", animation: "noise 0.35s steps(1) infinite" },
  scanline: { position: "fixed", left: 0, right: 0, height: 2, zIndex: 20, pointerEvents: "none", background: "linear-gradient(90deg, transparent 0%, rgba(0,255,120,0.03) 10%, rgba(0,255,120,0.5) 50%, rgba(0,255,120,0.03) 90%, transparent 100%)", boxShadow: "0 0 20px rgba(0,255,120,0.35)", transition: "top 0.016s linear" },
  ripple: { position: "fixed", zIndex: 50, pointerEvents: "none", width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(0,255,120,0.6)", animation: "rippleAnim 1.4s ease-out forwards" },

  vizStrip: { position: "fixed", top: 62, right: 32, zIndex: 40, display: "flex", alignItems: "center", gap: 10, padding: "4px 12px", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(0,255,120,0.1)", borderTop: "none" },
  viz: { display: "flex", alignItems: "flex-end", gap: 2, height: 20 },
  vizBar: { width: 3, borderRadius: "1px 1px 0 0", minHeight: 3, transition: "height 0.08s ease" },
  vizSep: { width: 1, height: 12, background: "rgba(0,255,120,0.15)" },
  vizLive: { fontSize: 8, letterSpacing: "2.5px", color: "rgba(0,255,120,0.5)" },

  terminalWrap: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10 },
  terminal: { position: "relative", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(0,255,120,0.2)", borderRadius: 8, overflow: "hidden", width: 520, maxWidth: "90vw", boxShadow: "0 0 80px rgba(0,255,120,0.08), 0 40px 80px rgba(0,0,0,0.6)" },
  termHeader: { display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", borderBottom: "1px solid rgba(0,255,120,0.1)", background: "rgba(0,255,120,0.03)" },
  termDot: { width: 12, height: 12, borderRadius: "50%" },
  termTitle: { fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "1px", marginLeft: 6 },
  termBody: { padding: "20px 24px 24px", minHeight: 160 },
  termLine: { fontSize: 12, lineHeight: 2, letterSpacing: "0.5px", fontFamily: "'Share Tech Mono', monospace" },
  termCursor: { display: "inline-block", color: "#00ff78", animation: "termBlink 0.8s step-end infinite", fontSize: 14 },

  content: { position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 48px 64px", maxWidth: 980, width: "100%", margin: "0 auto", flex: 1, justifyContent: "center" },

  sideL: { position: "absolute", left: -120, top: "50%", transform: "translateY(-50%) rotate(-90deg)", display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" },
  sideR: { left: "auto", right: -120, transform: "translateY(-50%) rotate(90deg)" },
  sideRule: { width: 36, height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,120,0.25))" },
  sideTxt: { fontSize: 8, letterSpacing: "3px", color: "rgba(0,255,120,0.25)", textTransform: "uppercase" },

  badge: { display: "inline-flex", alignItems: "center", gap: 12, border: "1px solid rgba(0,255,120,0.18)", background: "rgba(0,255,120,0.03)", backdropFilter: "blur(10px)", padding: "7px 20px", marginBottom: 40, animation: "fadeSlideUp 0.8s ease both", animationDelay: "0.1s" },
  badgePulse: { width: 6, height: 6, borderRadius: "50%", background: "#00ff78", display: "inline-block", animation: "pdot 1.8s ease-in-out infinite" },
  badgeTxt: { fontSize: 8.5, letterSpacing: "3px", color: "rgba(0,255,120,0.7)", textTransform: "uppercase" },
  badgeDivider: { width: 1, height: 12, background: "rgba(0,255,120,0.2)" },

  titleBlock: { position: "relative", marginBottom: 32, animation: "fadeSlideUp 1s ease both", animationDelay: "0.25s" },
  titleTopDeco: { display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 6 },
  decoLine: { flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(0,255,120,0.45))", maxWidth: 120 },
  decoSquare: { width: 7, height: 7, background: "#00ff78", transform: "rotate(45deg)", boxShadow: "0 0 12px #00ff78" },
  titleRow1: { position: "relative", display: "block", lineHeight: 1, marginBottom: 4 },
  h1: { fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(48px, 9vw, 112px)", fontWeight: 900, color: "#fff", letterSpacing: "12px", lineHeight: 1, textShadow: "0 0 100px rgba(255,255,255,0.06), 0 0 40px rgba(255,255,255,0.04)", position: "relative", zIndex: 1, display: "block" },
  glitchLayer: { position: "absolute", top: 0, fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(48px, 9vw, 112px)", fontWeight: 900, letterSpacing: "12px", lineHeight: 1, display: "block", pointerEvents: "none", userSelect: "none" },
  titleRow2: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4 },
  h2: { fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(48px, 9vw, 112px)", fontWeight: 900, letterSpacing: "12px", lineHeight: 1, background: "linear-gradient(100deg, #00ff78 0%, #00ffcc 35%, #00e5ff 65%, #00c8ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 50px rgba(0,255,120,0.65))" },
  blinkCursor: { fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(48px, 9vw, 112px)", color: "#00ff78", lineHeight: 1, animation: "blinkCursor 1s step-end infinite", marginLeft: -4 },

  circuitArmL: { position: "absolute", left: -100, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  circuitArmR: { left: "auto", right: -100, alignItems: "flex-start" },
  cNode: { width: 6, height: 6, borderRadius: "50%", background: "#00ff78", boxShadow: "0 0 8px #00ff78", flexShrink: 0 },
  cLine: { height: 1, background: "linear-gradient(90deg, rgba(0,255,120,0.5), rgba(0,255,120,0.1))" },

  tagline: { fontFamily: "'Rajdhani', sans-serif", fontWeight: 300, fontSize: 17, color: "rgba(255,255,255,0.33)", lineHeight: 1.95, letterSpacing: "0.6px", maxWidth: 520, marginBottom: 52, animation: "fadeSlideUp 1s ease both", animationDelay: "0.5s" },

  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, width: "100%", maxWidth: 700, marginBottom: 56, animation: "fadeSlideUp 1s ease both", animationDelay: "0.65s" },
  statCard: { padding: "22px 20px 16px", border: "1px solid rgba(0,255,120,0.08)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", textAlign: "left", position: "relative", overflow: "hidden", transition: "border-color 0.3s ease, box-shadow 0.3s ease" },
  statCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  statIcon: { fontSize: 13, color: "rgba(0,255,120,0.3)", marginTop: 6 },
  statVal: { fontFamily: "'Orbitron', sans-serif", fontSize: 34, fontWeight: 700, color: "#00ff78", display: "block", lineHeight: 1 },
  statLabel: { fontFamily: "'Rajdhani', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 2, display: "block" },
  statSub: { fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "1px", marginBottom: 14, display: "block" },
  statBarTrack: { height: 2, background: "rgba(0,255,120,0.06)", overflow: "hidden" },
  statBarFill: { height: "100%", background: "linear-gradient(90deg, #00ff78, #00c8ff)", transition: "width 1.8s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 0 10px rgba(0,255,120,0.5)" },
  cardCornerTR: { position: "absolute", top: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 20px 20px 0", borderColor: "transparent rgba(0,255,120,0.12) transparent transparent" },
  cardCornerBL: { position: "absolute", bottom: 0, left: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "20px 0 0 20px", borderColor: "transparent transparent transparent rgba(0,255,120,0.08)" },

  ctaWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative", animation: "fadeSlideUp 1s ease both", animationDelay: "0.85s" },
  ctaRing: { position: "absolute", top: "50%", left: "50%", width: 400, height: 80, borderRadius: "50%", border: "1px solid rgba(0,255,120,0.25)", animation: "ringExpand 1.5s ease-in-out infinite", pointerEvents: "none" },
  btn: { position: "relative", cursor: "pointer", outline: "none", border: "1px solid rgba(0,255,120,0.28)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", color: "#00ff78", fontFamily: "'Orbitron', sans-serif", fontSize: 12, fontWeight: 700, padding: "22px 80px", transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", clipPath: "polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)" },
  btnHover: { background: "rgba(0,255,120,0.08)", borderColor: "rgba(0,255,120,0.7)", boxShadow: "0 0 80px rgba(0,255,120,0.4), 0 0 160px rgba(0,255,120,0.15), inset 0 0 60px rgba(0,255,120,0.05)", animation: "glowPulse 1.2s ease-in-out infinite" },
  btnCorner: { position: "absolute", width: 14, height: 14, borderColor: "#00ff78", borderStyle: "solid", transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease", pointerEvents: "none" },
  btnShine: { position: "absolute", top: 0, left: "-100%", width: "50%", height: "100%", background: "linear-gradient(105deg, transparent 38%, rgba(0,255,120,0.12) 50%, rgba(0,255,200,0.06) 55%, transparent 62%)", animation: "shimmer 0.6s ease forwards", pointerEvents: "none" },
  btnContent: { display: "flex", alignItems: "center", justifyContent: "center", gap: 20, position: "relative", zIndex: 1 },
  btnHexL: { display: "flex", alignItems: "center", opacity: 0.7 },
  ctaNote: { display: "flex", alignItems: "center", gap: 10, fontSize: 9, letterSpacing: "1.5px", color: "rgba(255,255,255,0.15)" },
  ctaNoteItem: {},
  ctaNoteSep: { color: "rgba(0,255,120,0.25)" },

  btmBar: { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, height: 34, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderTop: "1px solid rgba(0,255,120,0.07)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)" },
  btmBarL: { display: "flex", alignItems: "center", gap: 14 },
  btmBarR: {},
  btmSep: { width: 1, height: 14, background: "rgba(0,255,120,0.15)" },
  btmItem: { fontSize: 8.5, letterSpacing: "2px", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" },
};