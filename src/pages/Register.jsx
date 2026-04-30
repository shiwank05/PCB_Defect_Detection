import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "https://shiwank05-pcb-backend.hf.space";

export default function Register() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanY, setScanY] = useState(0);
  const [focusField, setFocusField] = useState(null);
  const [bootDone, setBootDone] = useState(false);
  const [bootLines, setBootLines] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [glitch, setGlitch] = useState(false);

  const canvasRef = useRef(null);

  const BOOT = [
    "> INITIALIZING REGISTRATION MODULE...",
    "> IDENTITY VERIFICATION: READY ✓",
    "> ENCRYPTION LAYER: AES-256-GCM ✓",
    "> AWAITING NEW OPERATOR CREDENTIALS_",
  ];

  useEffect(() => {
    if (token) navigate("/detect", { replace: true });
  }, [token]);

  // Boot sequence
  useEffect(() => {
    let i = 0;
    const add = () => {
      if (i >= BOOT.length) {
        setTimeout(() => { setBootDone(true); setRevealed(true); }, 350);
        return;
      }
      setBootLines(p => [...p, BOOT[i++]]);
      setTimeout(add, 220 + Math.random() * 160);
    };
    setTimeout(add, 200);
  }, []);

  // Scan line
  useEffect(() => {
    const id = setInterval(() => setScanY(p => (p + 0.4) % 101), 16);
    return () => clearInterval(id);
  }, []);

  // Glitch
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 160);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  // Background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId;

    const traces = Array.from({ length: 18 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      len: 40 + Math.random() * 120,
      angle: (Math.floor(Math.random() * 4) * Math.PI) / 2,
      speed: 0.3 + Math.random() * 0.7,
      progress: Math.random(),
      width: 0.5 + Math.random() * 1,
    }));

    const pts = Array.from({ length: 30 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      life: Math.random(), z: Math.random(),
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      traces.forEach(tr => {
        tr.progress += tr.speed / tr.len * 0.6;
        if (tr.progress > 1.8) {
          tr.x = Math.random() * W; tr.y = Math.random() * H;
          tr.angle = (Math.floor(Math.random() * 4) * Math.PI) / 2;
          tr.len = 40 + Math.random() * 120; tr.progress = 0;
        }
        const head = Math.min(tr.progress, 1), tail = Math.max(0, tr.progress - 0.5);
        if (head > tail) {
          const hx = tr.x + Math.cos(tr.angle) * tr.len * head;
          const hy = tr.y + Math.sin(tr.angle) * tr.len * head;
          const tx = tr.x + Math.cos(tr.angle) * tr.len * tail;
          const ty = tr.y + Math.sin(tr.angle) * tr.len * tail;
          const g = ctx.createLinearGradient(tx, ty, hx, hy);
          g.addColorStop(0, "rgba(0,255,120,0)");
          g.addColorStop(1, "rgba(0,255,180,0.35)");
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy);
          ctx.strokeStyle = g; ctx.lineWidth = tr.width; ctx.stroke();
          ctx.shadowBlur = 6; ctx.shadowColor = "#00ff78";
          ctx.beginPath(); ctx.arc(hx, hy, tr.width + 0.3, 0, Math.PI * 2);
          ctx.fillStyle = "#00ffcc"; ctx.fill(); ctx.shadowBlur = 0;
        }
      });

      pts.forEach(p => {
        const sp = 1 - p.z * 0.5;
        p.x += p.vx * sp; p.y += p.vy * sp; p.life -= 0.003;
        if (p.life <= 0 || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          p.x = Math.random() * W; p.y = Math.random() * H;
          p.vx = (Math.random() - 0.5) * 0.6; p.vy = (Math.random() - 0.5) * 0.6;
          p.life = 0.6 + Math.random() * 0.4;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - p.z) * 1.8 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,180,${p.life * 0.35})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      login(data.token, data.user);
      navigate("/detect");
    } catch {
      setError("Cannot reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = `${API_URL}/auth/google`;
  }

  // Password strength
  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : 3;
  const strengthLabel = ["", "WEAK", "MODERATE", "STRONG"];
  const strengthColor = ["", "#ff4455", "#febc2e", "#00ff78"];

  const passwordMismatch = form.confirm && form.confirm !== form.password;

  return (
    <div className="rg-root">
      <canvas ref={canvasRef} className="rg-canvas" />
      <div className="rg-vignette" />
      <div className="rg-noise" />
      <div className="rg-grid" />
      <div className="rg-scanline" style={{ top: `${scanY}%` }} />

      {/* Corner decorations */}
      <div className="rg-corner rg-c-tl" />
      <div className="rg-corner rg-c-tr" />
      <div className="rg-corner rg-c-bl" />
      <div className="rg-corner rg-c-br" />

      <div className="rg-container">

        {/* Boot terminal */}
        {!bootDone && (
          <div className="rg-boot">
            <div className="rg-boot-header">
              <span className="rg-boot-dot" style={{ background: "#ff5f57" }} />
              <span className="rg-boot-dot" style={{ background: "#febc2e" }} />
              <span className="rg-boot-dot" style={{ background: "#28c840" }} />
              <span className="rg-boot-title">REG-MODULE v1.2</span>
            </div>
            <div className="rg-boot-body">
              {bootLines.map((line, i) => (
                <div key={i} className="rg-boot-line" style={{
                  color: line.includes("✓") ? "#00ff78" : "rgba(0,255,120,0.6)"
                }}>{line}</div>
              ))}
              <span className="rg-cursor">█</span>
            </div>
          </div>
        )}

        {/* Main register card */}
        {bootDone && (
          <div className="rg-card" style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.9s cubic-bezier(0.22,1,0.36,1)"
          }}>
            <div className="rg-card-accent" />
            <div className="rg-card-accent-b" />

            {/* Header */}
            <div className="rg-header">
              <div className="rg-badge">
                <span className="rg-badge-dot" />
                <span className="rg-badge-txt">NEW OPERATOR</span>
                <span className="rg-badge-sep" />
                <span className="rg-badge-txt" style={{ color: "#00c8ff" }}>REGISTRATION</span>
              </div>

              <div className="rg-title-block">
                <div className="rg-deco-row">
                  <div className="rg-deco-line" /><div className="rg-deco-sq" /><div className="rg-deco-line" />
                </div>
                <div className="rg-title-row">
                  {glitch && <span className="rg-glitch-r">ENROLL</span>}
                  {glitch && <span className="rg-glitch-b">ENROLL</span>}
                  <h1 className="rg-h1">ENROLL</h1>
                </div>
                <div className="rg-deco-row">
                  <div className="rg-deco-line rg-deco-line-b" /><div className="rg-deco-sq rg-deco-sq-b" /><div className="rg-deco-line rg-deco-line-b" />
                </div>
              </div>

              <p className="rg-subtitle">Create your PCB Defect Detection account</p>
            </div>

            {/* Error */}
            {error && (
              <div className="rg-error">
                <span className="rg-error-icon">⚠</span>
                <span className="rg-error-txt">{error}</span>
              </div>
            )}

            {/* Google OAuth */}
            <button onClick={handleGoogle} className="rg-google-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="rg-divider">
              <div className="rg-div-line" />
              <span className="rg-div-txt">OR</span>
              <div className="rg-div-line" />
            </div>

            {/* Form */}
            <div className="rg-form">

              {/* Name */}
              <div className={`rg-field${focusField === "name" ? " rg-field-focus" : ""}`}>
                <div className="rg-field-header">
                  <span className="rg-field-label">OPERATOR NAME</span>
                  <span className="rg-field-indicator">{focusField === "name" ? "●" : "○"}</span>
                </div>
                <div className="rg-input-wrap">
                  <span className="rg-input-prefix">→</span>
                  <input
                    type="text" name="name" value={form.name}
                    onChange={handleChange}
                    onFocus={() => setFocusField("name")}
                    onBlur={() => setFocusField(null)}
                    required
                    placeholder="Shiwank Kumar"
                    className="rg-input"
                    autoComplete="name"
                  />
                </div>
                <div className="rg-field-bar"><div className="rg-field-bar-fill" style={{ width: focusField === "name" ? "100%" : "0%" }} /></div>
              </div>

              {/* Email */}
              <div className={`rg-field${focusField === "email" ? " rg-field-focus" : ""}`}>
                <div className="rg-field-header">
                  <span className="rg-field-label">EMAIL</span>
                  <span className="rg-field-indicator">{focusField === "email" ? "●" : "○"}</span>
                </div>
                <div className="rg-input-wrap">
                  <span className="rg-input-prefix">→</span>
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleChange}
                    onFocus={() => setFocusField("email")}
                    onBlur={() => setFocusField(null)}
                    required
                    placeholder="operator@pcb-inspect.ai"
                    className="rg-input"
                    autoComplete="email"
                  />
                </div>
                <div className="rg-field-bar"><div className="rg-field-bar-fill" style={{ width: focusField === "email" ? "100%" : "0%" }} /></div>
              </div>

              {/* Password */}
              <div className={`rg-field${focusField === "password" ? " rg-field-focus" : ""}`}>
                <div className="rg-field-header">
                  <span className="rg-field-label">PASSWORD</span>
                  <span className="rg-field-indicator">{focusField === "password" ? "●" : "○"}</span>
                </div>
                <div className="rg-input-wrap">
                  <span className="rg-input-prefix">→</span>
                  <input
                    type="password" name="password" value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusField("password")}
                    onBlur={() => setFocusField(null)}
                    required
                    placeholder="Min. 6 characters"
                    className="rg-input"
                    autoComplete="new-password"
                  />
                </div>
                {/* Strength bar */}
                {form.password ? (
                  <div className="rg-strength">
                    <div className="rg-strength-bars">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="rg-strength-seg" style={{
                          background: i <= strength ? strengthColor[strength] : "rgba(255,255,255,0.06)",
                          boxShadow: i <= strength ? `0 0 6px ${strengthColor[strength]}55` : "none",
                          transition: "all 0.3s ease"
                        }} />
                      ))}
                    </div>
                    <span className="rg-strength-label" style={{ color: strengthColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                  </div>
                ) : (
                  <div className="rg-field-bar"><div className="rg-field-bar-fill" style={{ width: focusField === "password" ? "100%" : "0%" }} /></div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={`rg-field${focusField === "confirm" ? " rg-field-focus" : ""}${passwordMismatch ? " rg-field-error" : ""}`}>
                <div className="rg-field-header">
                  <span className="rg-field-label">CONFIRM PASSWORD</span>
                  <span className="rg-field-indicator" style={{ color: passwordMismatch ? "#ff4455" : undefined }}>
                    {passwordMismatch ? "✗" : focusField === "confirm" ? "●" : "○"}
                  </span>
                </div>
                <div className="rg-input-wrap">
                  <span className="rg-input-prefix" style={{ color: passwordMismatch ? "rgba(255,68,85,0.5)" : undefined }}>→</span>
                  <input
                    type="password" name="confirm" value={form.confirm}
                    onChange={handleChange}
                    onFocus={() => setFocusField("confirm")}
                    onBlur={() => setFocusField(null)}
                    required
                    placeholder="••••••••••••"
                    className="rg-input"
                    autoComplete="new-password"
                  />
                </div>
                {passwordMismatch && (
                  <div className="rg-mismatch">PASSWORDS DO NOT MATCH</div>
                )}
                <div className="rg-field-bar">
                  <div className="rg-field-bar-fill" style={{
                    width: focusField === "confirm" ? "100%" : "0%",
                    background: passwordMismatch ? "linear-gradient(90deg,#ff4455,#ff8899)" : undefined
                  }} />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || passwordMismatch}
                className={`rg-submit${loading ? " rg-submit-loading" : ""}${passwordMismatch ? " rg-submit-disabled" : ""}`}
              >
                {loading ? (
                  <span className="rg-submit-inner">
                    <span className="rg-load-dot" />
                    <span>CREATING ACCOUNT...</span>
                    <span className="rg-load-pct">...</span>
                  </span>
                ) : (
                  <span className="rg-submit-inner">
                    <svg width="14" height="14" viewBox="0 0 16 16" style={{ opacity: 0.7 }}>
                      <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="none" stroke="#00ff78" strokeWidth="1.3" />
                    </svg>
                    <span>INITIALIZE ACCOUNT</span>
                    <span style={{ opacity: 0.4 }}>→</span>
                  </span>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="rg-footer">
              <span className="rg-footer-txt">Already registered?</span>
              <Link to="/login" className="rg-footer-link">
                <span className="rg-footer-bracket">[</span>
                SIGN IN
                <span className="rg-footer-bracket">]</span>
              </Link>
            </div>

            <Link to="/" className="rg-back">
              <span style={{ opacity: 0.4 }}>←</span>
              <span>RETURN TO BASE</span>
            </Link>

            {/* Bottom status */}
            <div className="rg-card-btm">
              <span className="rg-btm-item">STATUS: <span style={{ color: "#00ff78" }}>SECURE</span></span>
              <span className="rg-btm-sep" />
              <span className="rg-btm-item">TLS 1.3</span>
              <span className="rg-btm-sep" />
              <span className="rg-btm-item">AES-256</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes rg-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        @keyframes rg-dot-pulse{0%,100%{box-shadow:0 0 4px #00ff78}50%{box-shadow:0 0 12px #00ff78,0 0 24px rgba(0,255,120,0.3)}}
        @keyframes rg-noise{0%,100%{background-position:0 0}10%{background-position:-5% -10%}50%{background-position:-15% 10%}}
        @keyframes rg-glow{0%,100%{box-shadow:0 0 20px rgba(0,255,120,0.15)}50%{box-shadow:0 0 50px rgba(0,255,120,0.3),0 0 100px rgba(0,255,120,0.08)}}
        @keyframes rg-pulse{0%,100%{opacity:1}50%{opacity:0.3}}

        .rg-root{
          min-height:100vh;position:relative;overflow:hidden;
          background:radial-gradient(ellipse at 30% 30%,#031410 0%,#010c0a 35%,#010608 65%,#000408 100%);
          font-family:'Share Tech Mono',monospace;color:#fff;
          display:flex;align-items:center;justify-content:center;
        }
        .rg-canvas{position:fixed;inset:0;z-index:0}
        .rg-vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(ellipse at center,transparent 15%,rgba(0,0,0,0.9) 100%)}
        .rg-grid{position:fixed;inset:0;z-index:1;pointer-events:none;background-image:linear-gradient(rgba(0,255,120,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,120,0.018) 1px,transparent 1px);background-size:44px 44px}
        .rg-noise{position:fixed;inset:0;z-index:2;opacity:0.02;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:160px 160px;animation:rg-noise 0.35s steps(1) infinite}
        .rg-scanline{position:fixed;left:0;right:0;height:1px;z-index:20;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(0,255,120,0.35) 50%,transparent 100%);box-shadow:0 0 12px rgba(0,255,120,0.2)}

        .rg-corner{position:fixed;width:20px;height:20px;z-index:10;pointer-events:none}
        .rg-c-tl{top:16px;left:16px;border-top:2px solid rgba(0,255,120,0.25);border-left:2px solid rgba(0,255,120,0.25)}
        .rg-c-tr{top:16px;right:16px;border-top:2px solid rgba(0,255,120,0.25);border-right:2px solid rgba(0,255,120,0.25)}
        .rg-c-bl{bottom:16px;left:16px;border-bottom:2px solid rgba(0,255,120,0.25);border-left:2px solid rgba(0,255,120,0.25)}
        .rg-c-br{bottom:16px;right:16px;border-bottom:2px solid rgba(0,255,120,0.25);border-right:2px solid rgba(0,255,120,0.25)}

        .rg-container{position:relative;z-index:10;width:100%;max-width:440px;padding:20px 16px;display:flex;align-items:center;justify-content:center;min-height:100vh}

        /* Boot */
        .rg-boot{width:100%;background:rgba(0,0,0,0.85);border:1px solid rgba(0,255,120,0.2);backdrop-filter:blur(16px);overflow:hidden;box-shadow:0 0 40px rgba(0,255,120,0.05)}
        .rg-boot-header{display:flex;align-items:center;gap:7px;padding:10px 16px;border-bottom:1px solid rgba(0,255,120,0.1);background:rgba(0,255,120,0.03)}
        .rg-boot-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
        .rg-boot-title{font-size:9px;color:rgba(255,255,255,0.2);letter-spacing:1px;margin-left:6px}
        .rg-boot-body{padding:18px 20px 22px;min-height:100px}
        .rg-boot-line{font-size:11px;line-height:2;letter-spacing:0.5px}
        .rg-cursor{color:#00ff78;animation:rg-blink 0.8s step-end infinite;font-size:12px}

        /* Card */
        .rg-card{
          width:100%;
          background:rgba(4,12,10,0.88);
          border:1px solid rgba(0,255,120,0.12);
          backdrop-filter:blur(20px);
          box-shadow:0 0 60px rgba(0,255,120,0.04),0 20px 60px rgba(0,0,0,0.5);
          padding:28px 24px 20px;
          position:relative;overflow:hidden;
          display:flex;flex-direction:column;gap:0;
        }
        .rg-card-accent{position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00ff78 30%,#00c8ff 70%,transparent)}
        .rg-card-accent-b{position:absolute;bottom:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,120,0.15),transparent)}

        /* Header */
        .rg-header{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:24px}
        .rg-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(0,255,120,0.15);background:rgba(0,255,120,0.03);padding:5px 14px;margin-bottom:18px}
        .rg-badge-dot{width:5px;height:5px;border-radius:50%;background:#00ff78;animation:rg-dot-pulse 2s ease-in-out infinite}
        .rg-badge-txt{font-size:7px;letter-spacing:2.5px;color:rgba(0,255,120,0.6);text-transform:uppercase}
        .rg-badge-sep{width:1px;height:10px;background:rgba(0,255,120,0.2)}

        .rg-title-block{position:relative;margin-bottom:12px}
        .rg-deco-row{display:flex;align-items:center;gap:10px;justify-content:center;margin:4px 0}
        .rg-deco-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,120,0.35));max-width:70px}
        .rg-deco-sq{width:5px;height:5px;background:#00ff78;transform:rotate(45deg);box-shadow:0 0 8px #00ff78}
        .rg-deco-line-b{background:linear-gradient(90deg,transparent,rgba(0,200,255,0.3))}
        .rg-deco-sq-b{background:#00c8ff;box-shadow:0 0 8px #00c8ff}
        .rg-title-row{position:relative;display:block;line-height:1;margin:4px 0}
        .rg-h1{
          font-family:'Orbitron',sans-serif;font-weight:900;
          font-size:clamp(18px,6vw,28px);letter-spacing:clamp(2px,1vw,6px);
          line-height:1;color:#fff;position:relative;z-index:1;
        }
        .rg-glitch-r,.rg-glitch-b{position:absolute;top:0;left:0;right:0;font-family:'Orbitron',sans-serif;font-weight:900;font-size:clamp(18px,6vw,28px);letter-spacing:clamp(2px,1vw,6px);pointer-events:none;user-select:none}
        .rg-glitch-r{color:rgba(255,0,80,0.45);transform:translate(2px,-1px);clip-path:inset(30% 0 40% 0)}
        .rg-glitch-b{color:rgba(0,220,255,0.4);transform:translate(-2px,1px);clip-path:inset(60% 0 10% 0)}
        .rg-subtitle{font-family:'Rajdhani',sans-serif;font-weight:300;font-size:12px;color:rgba(255,255,255,0.25);letter-spacing:0.5px}

        /* Error */
        .rg-error{display:flex;align-items:center;gap:10px;padding:11px 14px;border:1px solid rgba(255,68,85,0.3);background:rgba(255,68,85,0.06);margin-bottom:16px}
        .rg-error-icon{color:#ff4455;font-size:13px;flex-shrink:0}
        .rg-error-txt{font-size:10px;letter-spacing:0.5px;color:rgba(255,100,110,0.85);line-height:1.5}

        /* Google */
        .rg-google-btn{
          display:flex;align-items:center;justify-content:center;gap:10px;
          width:100%;padding:13px 16px;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.12);
          color:rgba(255,255,255,0.7);
          font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:500;letter-spacing:0.5px;
          cursor:pointer;transition:all 0.25s ease;
          -webkit-tap-highlight-color:transparent;
          margin-bottom:16px;
        }
        .rg-google-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.25)}

        /* Divider */
        .rg-divider{display:flex;align-items:center;gap:12px;margin-bottom:18px}
        .rg-div-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(0,255,120,0.12))}
        .rg-div-txt{font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.15)}

        /* Form */
        .rg-form{display:flex;flex-direction:column;gap:14px;margin-bottom:20px}
        .rg-field{
          border:1px solid rgba(0,255,120,0.08);
          background:rgba(0,0,0,0.35);
          padding:10px 14px 6px;
          transition:all 0.3s ease;
          position:relative;
        }
        .rg-field-focus{border-color:rgba(0,255,120,0.3);background:rgba(0,255,120,0.02);box-shadow:0 0 20px rgba(0,255,120,0.05)}
        .rg-field-error{border-color:rgba(255,68,85,0.35)!important;background:rgba(255,68,85,0.03)!important}
        .rg-field-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .rg-field-label{font-size:8px;letter-spacing:2.5px;color:rgba(0,255,120,0.4)}
        .rg-field-indicator{font-size:6px;color:rgba(0,255,120,0.4);transition:color 0.2s}
        .rg-field-focus .rg-field-indicator{color:#00ff78}
        .rg-input-wrap{display:flex;align-items:center;gap:8px}
        .rg-input-prefix{font-size:11px;color:rgba(0,255,120,0.2);flex-shrink:0;transition:color 0.2s}
        .rg-field-focus .rg-input-prefix{color:rgba(0,255,120,0.5)}
        .rg-input{
          width:100%;background:none;border:none;outline:none;
          font-family:'Share Tech Mono',monospace;
          font-size:13px;color:rgba(255,255,255,0.8);
          padding:4px 0 6px;letter-spacing:0.5px;
        }
        .rg-input::placeholder{color:rgba(255,255,255,0.12)}
        .rg-field-bar{height:1px;background:rgba(0,255,120,0.06);margin-top:4px;overflow:hidden}
        .rg-field-bar-fill{height:100%;background:linear-gradient(90deg,#00ff78,#00c8ff);transition:width 0.4s cubic-bezier(0.4,0,0.2,1)}

        /* Password strength */
        .rg-strength{display:flex;align-items:center;gap:8px;margin-top:8px}
        .rg-strength-bars{display:flex;gap:4px;flex:1}
        .rg-strength-seg{height:2px;flex:1}
        .rg-strength-label{font-size:7px;letter-spacing:2px;min-width:60px;text-align:right}

        /* Mismatch */
        .rg-mismatch{font-size:7px;letter-spacing:1.5px;color:rgba(255,68,85,0.7);margin-top:5px}

        /* Submit */
        .rg-submit{
          position:relative;cursor:pointer;
          font-family:'Orbitron',sans-serif;font-size:10px;font-weight:700;
          color:#00ff78;background:rgba(0,255,120,0.05);
          border:1px solid rgba(0,255,120,0.3);
          padding:16px 20px;width:100%;
          transition:all 0.3s ease;
          letter-spacing:3px;
          clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
          overflow:hidden;
          -webkit-tap-highlight-color:transparent;
          margin-top:4px;
        }
        .rg-submit:hover:not(:disabled){
          background:rgba(0,255,120,0.1);
          border-color:rgba(0,255,120,0.6);
          box-shadow:0 0 40px rgba(0,255,120,0.2);
          animation:rg-glow 1.2s ease-in-out infinite;
        }
        .rg-submit:disabled,.rg-submit-disabled{opacity:0.4;cursor:not-allowed}
        .rg-submit-inner{display:flex;align-items:center;justify-content:center;gap:10px;position:relative;z-index:1}
        .rg-load-dot{width:6px;height:6px;border-radius:50%;background:#00ff78;animation:rg-pulse 0.7s ease-in-out infinite}
        .rg-load-pct{font-size:9px;color:rgba(0,255,120,0.5)}

        /* Footer */
        .rg-footer{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px}
        .rg-footer-txt{font-size:10px;color:rgba(255,255,255,0.2)}
        .rg-footer-link{
          text-decoration:none;font-size:10px;letter-spacing:1.5px;
          color:#00ff78;display:flex;align-items:center;gap:4px;
          transition:all 0.2s;
        }
        .rg-footer-link:hover{text-shadow:0 0 10px rgba(0,255,120,0.5)}
        .rg-footer-bracket{color:rgba(0,255,120,0.3);font-size:12px}

        .rg-back{
          display:flex;align-items:center;justify-content:center;gap:8px;
          text-decoration:none;font-size:9px;letter-spacing:2px;
          color:rgba(255,255,255,0.18);
          padding:8px 0;margin-bottom:14px;
          transition:color 0.2s;
        }
        .rg-back:hover{color:rgba(255,255,255,0.4)}

        /* Bottom bar */
        .rg-card-btm{
          display:flex;align-items:center;justify-content:center;gap:10px;
          padding:10px 0 0;
          border-top:1px solid rgba(0,255,120,0.06);
        }
        .rg-btm-item{font-size:7px;letter-spacing:1.5px;color:rgba(255,255,255,0.15);text-transform:uppercase}
        .rg-btm-sep{width:1px;height:10px;background:rgba(0,255,120,0.1)}
      `}</style>
    </div>
  );
}