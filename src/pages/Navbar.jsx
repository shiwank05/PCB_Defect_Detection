import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

/* ─── PCB Logo SVG ─────────────────────────────────────────────────── */
function PCBLogo({ accent = "#00ff78", size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hex border */}
      <polygon
        points="24,2 44,13 44,35 24,46 4,35 4,13"
        stroke={accent}
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      {/* Inner hex */}
      <polygon
        points="24,8 38,16 38,32 24,40 10,32 10,16"
        stroke={accent}
        strokeWidth="0.8"
        fill={`${accent}08`}
        opacity="0.5"
      />
      {/* Circuit traces — horizontal */}
      <line x1="4" y1="24" x2="12" y2="24" stroke={accent} strokeWidth="1.5" opacity="0.7" />
      <line x1="36" y1="24" x2="44" y2="24" stroke={accent} strokeWidth="1.5" opacity="0.7" />
      {/* Circuit traces — angled top */}
      <line x1="14" y1="13" x2="10" y2="16" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      <line x1="34" y1="13" x2="38" y2="16" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      {/* Circuit traces — angled bottom */}
      <line x1="14" y1="35" x2="10" y2="32" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      <line x1="34" y1="35" x2="38" y2="32" stroke={accent} strokeWidth="1.2" opacity="0.5" />
      {/* Center IC chip body */}
      <rect x="16" y="18" width="16" height="12" rx="1" stroke={accent} strokeWidth="1" fill={`${accent}10`} />
      {/* IC pins — left */}
      <line x1="10" y1="21" x2="16" y2="21" stroke={accent} strokeWidth="1" opacity="0.8" />
      <line x1="10" y1="24" x2="16" y2="24" stroke={accent} strokeWidth="1" opacity="0.8" />
      <line x1="10" y1="27" x2="16" y2="27" stroke={accent} strokeWidth="1" opacity="0.8" />
      {/* IC pins — right */}
      <line x1="32" y1="21" x2="38" y2="21" stroke={accent} strokeWidth="1" opacity="0.8" />
      <line x1="32" y1="24" x2="38" y2="24" stroke={accent} strokeWidth="1" opacity="0.8" />
      <line x1="32" y1="27" x2="38" y2="27" stroke={accent} strokeWidth="1" opacity="0.8" />
      {/* Center dot — core */}
      <circle cx="24" cy="24" r="2.5" fill={accent} opacity="0.9" />
      <circle cx="24" cy="24" r="4.5" stroke={accent} strokeWidth="0.7" fill="none" opacity="0.4" />
      {/* Corner pads */}
      {[[18,20],[30,20],[18,28],[30,28]].map(([cx,cy],i) => (
        <rect key={i} x={cx-1.5} y={cy-1.5} width="3" height="3" fill={accent} opacity="0.35" rx="0.5" />
      ))}
    </svg>
  );
}

/* ─── Breadcrumb map ───────────────────────────────────────────────── */
const ROUTE_META = {
  "/":       { label: null,      breadcrumbs: [] },
  "/detect": { label: "DETECT",  breadcrumbs: ["HOME"] },
  "/result": { label: "RESULT",  breadcrumbs: ["HOME", "DETECT"] },
};

/* ─── Main Navbar ──────────────────────────────────────────────────── */
export default function Navbar({ accent = "#00ff78", resultState = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [scanX, setScanX] = useState(0);
  const [pulse, setPulse] = useState(true);
  const scanRef = useRef(null);

  const path = location.pathname;
  const meta = ROUTE_META[path] || ROUTE_META["/"];

  /* Animated scan line across top bar */
  useEffect(() => {
    scanRef.current = setInterval(() => {
      setScanX(x => (x + 1.2) % 102);
    }, 16);
    return () => clearInterval(scanRef.current);
  }, []);

  /* Pulse heartbeat */
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 900);
    return () => clearInterval(id);
  }, []);

  const navLinks = [
    { path: "/",       label: "HOME",   icon: "⌂" },
    { path: "/detect", label: "DETECT", icon: "◎" },
  ];

  const breadcrumbPaths = { "HOME": "/", "DETECT": "/detect" };

  const accentRgb = accent === "#00ff78" ? "0,255,120" : "255,68,85";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;600;700;900&display=swap');
        @keyframes navPulse {
          0%,100% { box-shadow: 0 0 4px ${accent}, 0 0 8px ${accent}; }
          50%      { box-shadow: 0 0 10px ${accent}, 0 0 22px ${accent}, 0 0 40px rgba(${accentRgb},0.3); }
        }
        @keyframes navShimmer {
          0%   { left: -80%; }
          100% { left: 120%; }
        }
        @keyframes navBlinkDot {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.25; }
        }
        .nav-link-item:hover .nav-link-line {
          width: 100% !important;
        }
        .nav-link-item:hover .nav-link-label {
          color: ${accent} !important;
          text-shadow: 0 0 12px rgba(${accentRgb},0.7);
        }
        .nav-link-item:hover .nav-link-icon {
          opacity: 1 !important;
          transform: scale(1.15);
        }
        .nav-breadcrumb-link:hover {
          color: rgba(255,255,255,0.65) !important;
        }
      `}</style>

      <header style={styles.root}>

        {/* Top scan line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg,
            transparent ${scanX - 10}%,
            rgba(${accentRgb},0.0) ${scanX - 8}%,
            rgba(${accentRgb},0.8) ${scanX}%,
            rgba(${accentRgb},0.0) ${scanX + 8}%,
            transparent ${scanX + 10}%)`,
          pointerEvents: "none", zIndex: 5,
        }} />

        {/* ── LEFT: Logo ── */}
        <div style={styles.logoBlock} onClick={() => navigate("/")} role="button" tabIndex={0}>
          {/* PCB icon */}
          <div style={{ ...styles.logoIconWrap, borderColor: `rgba(${accentRgb},0.3)` }}>
            <PCBLogo accent={accent} size={28} />
            {/* Animated glow ring behind icon */}
            <div style={{
              position: "absolute", inset: -4, borderRadius: 2,
              border: `1px solid rgba(${accentRgb},0.2)`,
              animation: "navPulse 2.4s ease-in-out infinite",
              pointerEvents: "none",
            }} />
          </div>

          {/* Word mark */}
          <div style={styles.logoText}>
            <span style={styles.logoWordPCB}>PCB</span>
            <span style={{ color: accent, fontFamily: "'Share Tech Mono',monospace", fontSize: 14, lineHeight: 1 }}>·</span>
            <span style={styles.logoWordInspect}>INSPECT</span>
            <div style={styles.logoBadge}>
              <span style={{ ...styles.logoBadgeDot, background: accent, animation: "navBlinkDot 1.6s ease-in-out infinite" }} />
              <span style={{ ...styles.logoBadgeText, color: accent }}>AI</span>
            </div>
          </div>

          {/* Shimmer on logo hover */}
          <div style={styles.logoShimmer} className="logo-shimmer" />
        </div>

        {/* ── CENTER: Breadcrumb ── */}
        <div style={styles.centerBlock}>
          {/* Circuit trace decoration */}
          <div style={{ ...styles.traceLine, background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.15), transparent)` }} />

          <div style={styles.breadcrumbRow}>
            {meta.breadcrumbs.map((crumb, i) => (
              <span key={crumb} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="nav-breadcrumb-link"
                  onClick={() => navigate(breadcrumbPaths[crumb])}
                  style={styles.breadLink}
                >
                  {crumb}
                </span>
                <span style={styles.breadSep}>›</span>
              </span>
            ))}
            {meta.label && (
              <span style={{ ...styles.breadActive, color: accent }}>
                {meta.label}
              </span>
            )}
            {!meta.label && meta.breadcrumbs.length === 0 && (
              <span style={{ ...styles.breadActive, color: `rgba(${accentRgb},0.5)` }}>
                HOME
              </span>
            )}
          </div>

          {/* Status chip */}
          <div style={{ ...styles.statusChip, borderColor: `rgba(${accentRgb},0.2)`, background: `rgba(${accentRgb},0.04)` }}>
            <span style={{ ...styles.statusDot, background: accent, animation: "navBlinkDot 1.2s ease-in-out infinite" }} />
            <span style={{ ...styles.statusText, color: `rgba(${accentRgb === "0,255,120" ? "0,255,120" : "255,68,85"},0.7)` }}>
              SYSTEM ONLINE
            </span>
            <span style={styles.statusSep} />
            <span style={styles.statusModel}>CNN-48L</span>
          </div>

          <div style={{ ...styles.traceLine, background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.15), transparent)` }} />
        </div>

        {/* ── RIGHT: Nav links ── */}
        <nav style={styles.navBlock}>
          {navLinks.map((link) => {
            const isActive = path === link.path;
            return (
              <div
                key={link.path}
                className="nav-link-item"
                onClick={() => navigate(link.path)}
                style={{
                  ...styles.navLink,
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseEnter={() => setHovered(link.path)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className="nav-link-icon"
                  style={{
                    ...styles.navIcon,
                    color: isActive ? accent : "rgba(255,255,255,0.3)",
                    opacity: isActive ? 1 : 0.5,
                    transition: "all 0.25s ease",
                  }}
                >
                  {link.icon}
                </span>
                <span
                  className="nav-link-label"
                  style={{
                    ...styles.navLabel,
                    color: isActive ? accent : "rgba(255,255,255,0.32)",
                    textShadow: isActive ? `0 0 12px rgba(${accentRgb},0.7)` : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  {link.label}
                </span>

                {/* Underline indicator */}
                <div
                  className="nav-link-line"
                  style={{
                    position: "absolute",
                    bottom: -4,
                    left: 0,
                    height: 1,
                    width: isActive ? "100%" : "0%",
                    background: isActive
                      ? `linear-gradient(90deg, transparent, ${accent}, transparent)`
                      : `linear-gradient(90deg, transparent, rgba(${accentRgb},0.5), transparent)`,
                    transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow: isActive ? `0 0 6px ${accent}` : "none",
                  }}
                />

                {/* Active dot */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    bottom: -8,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: accent,
                    boxShadow: `0 0 6px ${accent}`,
                  }} />
                )}
              </div>
            );
          })}

          {/* Vertical separator */}
          <div style={{ ...styles.navSep, background: `rgba(${accentRgb},0.15)` }} />

          {/* Signal strength indicator */}
          <div style={styles.signalBlock}>
            {[1, 0.6, 0.3].map((h, i) => (
              <div key={i} style={{
                width: 3,
                height: `${8 + h * 10}px`,
                borderRadius: 1,
                background: accent,
                opacity: 0.2 + h * 0.7,
                boxShadow: h === 1 ? `0 0 4px ${accent}` : "none",
              }} />
            ))}
          </div>
        </nav>

        {/* Bottom border with animated trace */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(${accentRgb},0.08) 20%,
            rgba(${accentRgb},0.2) 50%,
            rgba(${accentRgb},0.08) 80%,
            transparent 100%)`,
        }} />
      </header>
    </>
  );
}

const styles = {
  root: {
    position: "relative",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 62,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    overflow: "hidden",
    flexShrink: 0,
  },

  /* Logo */
  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    position: "relative",
    padding: "6px 10px 6px 0",
    userSelect: "none",
  },
  logoIconWrap: {
    position: "relative",
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid",
    borderRadius: 2,
    background: "rgba(0,0,0,0.5)",
    flexShrink: 0,
  },
  logoText: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    position: "relative",
  },
  logoWordPCB: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 15,
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "3px",
  },
  logoWordInspect: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 15,
    fontWeight: 400,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: "2px",
    marginLeft: 2,
  },
  logoBadge: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    marginLeft: 8,
    padding: "1px 6px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    borderRadius: 1,
  },
  logoBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: "50%",
    display: "inline-block",
  },
  logoBadgeText: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "1.5px",
  },
  logoShimmer: {
    position: "absolute",
    top: 0, bottom: 0,
    left: "-80%",
    width: "60%",
    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)",
    pointerEvents: "none",
  },

  /* Center */
  centerBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    flex: 1,
    maxWidth: 420,
  },
  traceLine: {
    height: 1,
    width: "80%",
  },
  breadcrumbRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 9,
    letterSpacing: "2.5px",
  },
  breadLink: {
    color: "rgba(255,255,255,0.22)",
    cursor: "pointer",
    textDecoration: "none",
    transition: "color 0.2s ease",
    fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: "2px",
  },
  breadSep: {
    color: "rgba(255,255,255,0.12)",
    fontSize: 10,
  },
  breadActive: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9,
    letterSpacing: "2.5px",
  },
  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 12px",
    border: "1px solid",
    fontSize: 8,
    letterSpacing: "2px",
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    display: "inline-block",
  },
  statusText: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 8,
    letterSpacing: "2px",
  },
  statusSep: {
    width: 1,
    height: 10,
    background: "rgba(255,255,255,0.1)",
  },
  statusModel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 8,
    letterSpacing: "1.5px",
    color: "rgba(255,255,255,0.2)",
  },

  /* Nav */
  navBlock: {
    display: "flex",
    alignItems: "center",
    gap: 28,
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingBottom: 4,
  },
  navIcon: {
    fontSize: 11,
    transition: "all 0.25s ease",
  },
  navLabel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9,
    letterSpacing: "2.5px",
    textTransform: "uppercase",
  },
  navSep: {
    width: 1,
    height: 18,
  },
  signalBlock: {
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 18,
  },
};