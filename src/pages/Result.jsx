import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Alert, Badge, Button, Card, CardHeader, Container, EmptyState, Icon, IconBadge, Meter,
  PageHeader, Select, StatCard,
} from "../components/ui";

// Box colors used on the annotated image (also used for the legend)
const CLASS_COLORS = {
  "Missing Hole":    "#2563eb",
  "Mouse Bite":      "#ea580c",
  "Open Circuit":    "#dc2626",
  "Short":           "#db2777",
  "Spur":            "#ca8a04",
  "Spurious Copper": "#7c3aed",
};
const FALLBACK_COLOR = "#4f46e5";
const colorFor = name => CLASS_COLORS[name] || FALLBACK_COLOR;

const LEVEL_TONE = { HIGH: "danger", MEDIUM: "warning", LOW: "neutral", EXCELLENT: "success" };
const LEVEL_METER = { HIGH: "danger", MEDIUM: "warning", LOW: "primary", EXCELLENT: "success" };

// Same thresholds the backend uses to label an analysis row
const levelFor = conf => (conf > 80 ? "HIGH" : conf > 55 ? "MEDIUM" : "LOW");

// Annotation sizes in on-screen pixels (divided by the image scale when drawn)
const BOX_LINE = 2;
const BOX_LINE_HOVER = 4;
const BADGE_SIZE = 16;
const BADGE_FONT = 10;
const MAX_IMG_HEIGHT = 480;

// Backend runs the model with conf=0.25, so 25% is the default filter
const DEFAULT_MIN_CONF = 25;
const CONF_OPTIONS = [
  { value: 0, label: "All" },
  { value: 25, label: "25%" },
  { value: 50, label: "50%" },
  { value: 70, label: "70%" },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

/** Small numbered badge shared by the canvas legend and the defect list. */
function NumberBadge({ n, color, active }) {
  return (
    <span
      className={`inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 transition duration-150 ${
        active ? "ring-primary" : "ring-white"
      }`}
      style={{ background: color }}
    >
      {n}
    </span>
  );
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const isDefect     = state.result === "defect";
  const fileName     = state.fileName     || "pcb_sample.jpg";
  const boardId      = state.boardId      || "PCB-UNKNOWN";
  const scanTime     = state.scanTime     || "1.84";
  const defectCount  = state.defectCount  ?? (isDefect ? 1 : 0);
  const affectedArea = state.affectedArea || (isDefect ? "N/A" : "0%");
  const analysis     = state.analysis     || [];
  const detections   = state.detections   || [];
  const imageUrl     = state.imageUrl     || null;
  const targetConf   = state.confidence   || (isDefect ? 89 : 97);

  const [bboxDrawn, setBboxDrawn] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [activeTab, setActiveTab] = useState("annotated"); // "annotated" | "original"
  const [minConf, setMinConf] = useState(DEFAULT_MIN_CONF);
  const [hoverN, setHoverN] = useState(null); // number of the highlighted detection

  const bboxCanvasRef = useRef(null);
  const imgRef = useRef(null);
  const [natural, setNatural] = useState(null); // natural image size
  const [displayW, setDisplayW] = useState(0);  // on-screen canvas width

  // Number detections in response order; the number stays fixed when filtering,
  // so the canvas badges and the list always match.
  const numbered = useMemo(
    () => (state.detections || []).map((d, i) => ({ ...d, n: i + 1 })),
    [state.detections]
  );
  const visible = useMemo(
    () => numbered.filter(d => d.confidence >= minConf),
    [numbered, minConf]
  );

  // ── Load the image once; remember its natural size ───────────
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => { setImgFailed(true); setBboxDrawn(true); };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Track the width the canvas is actually displayed at ──────
  useEffect(() => {
    const canvas = bboxCanvasRef.current;
    if (activeTab !== "annotated" || !natural || !canvas) return;
    const update = () => setDisplayW(canvas.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [activeTab, natural]);

  // ── Draw real bounding boxes + numbered badges ───────────────
  // The canvas is drawn at its on-screen size, so line width and badge size
  // are given in screen pixels and stay constant whatever the image size.
  useEffect(() => {
    const canvas = bboxCanvasRef.current;
    const img = imgRef.current;
    if (activeTab !== "annotated" || !natural || !displayW || !canvas || !img) return;
    const ctx = canvas.getContext("2d");
    // Draw at the displayed size (x device pixel ratio) so lines and badges stay
    // crisp even when the source image is tiny; box coordinates are scaled by k.
    const dpr = window.devicePixelRatio || 1;
    const W = Math.round(displayW * dpr);
    const H = Math.round((W * natural.h) / natural.w);
    const k = W / natural.w;
    const px = dpr;

    canvas.width  = W;
    canvas.height = H;
    ctx.drawImage(img, 0, 0, W, H);

    const d = BADGE_SIZE * px;
    const r = d / 2;
    const anyHover = hoverN !== null;

    // Boxes (hovered one is thicker and drawn last; the rest are dimmed)
    const boxOrder = [...visible].sort((a, b) => (a.n === hoverN) - (b.n === hoverN));
    boxOrder.forEach(det => {
      const { x1, y1, x2, y2 } = det.bbox;
      const hot = det.n === hoverN;
      ctx.globalAlpha = anyHover && !hot ? 0.35 : 1;
      ctx.strokeStyle = colorFor(det.class_name);
      ctx.lineWidth   = (hot ? BOX_LINE_HOVER : BOX_LINE) * px;
      ctx.strokeRect(x1 * k, y1 * k, (x2 - x1) * k, (y2 - y1) * k);
    });
    ctx.globalAlpha = 1;

    // Badge positions: top-left corner of each box, kept inside the canvas.
    // If it would overlap an earlier badge, nudge it down or right.
    const placed = [];
    const isFree = (cx, cy) => placed.every(p => Math.hypot(p.cx - cx, p.cy - cy) >= d * 0.95);
    visible.forEach(det => {
      let cx = clamp(det.bbox.x1 * k, r, W - r);
      let cy = clamp(det.bbox.y1 * k, r, H - r);
      if (!isFree(cx, cy)) {
        const step = d * 0.6;
        const baseX = cx;
        const baseY = cy;
        search: for (let k = 1; k <= 6; k++) {
          for (const [dx, dy] of [[0, 1], [1, 0], [1, 1]]) {
            const tx = clamp(baseX + dx * k * step, r, W - r);
            const ty = clamp(baseY + dy * k * step, r, H - r);
            if (isFree(tx, ty)) { cx = tx; cy = ty; break search; }
          }
        }
      }
      placed.push({ det, cx, cy });
    });

    // Draw badges, hovered one last so it is on top
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    [...placed]
      .sort((a, b) => (a.det.n === hoverN) - (b.det.n === hoverN))
      .forEach(({ det, cx, cy }) => {
        const hot = det.n === hoverN;
        ctx.globalAlpha = anyHover && !hot ? 0.5 : 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = colorFor(det.class_name);
        ctx.fill();
        ctx.lineWidth = (hot ? 2 : 1.5) * px;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = `700 ${BADGE_FONT * px}px Inter, system-ui, sans-serif`;
        ctx.fillText(String(det.n), cx, cy + 0.5 * px);
      });
    ctx.globalAlpha = 1;

    setBboxDrawn(true);
  }, [activeTab, natural, displayW, visible, hoverN]);

  // ── No state guard ───────────────────────────────────────────
  if (!location.state) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Container className="py-16">
          <Card className="animate-enter">
            <EmptyState
              icon="image"
              title="No scan data found"
              description="Results are not kept after a refresh. Run a detection to see them here."
              action={<Button onClick={() => navigate("/detect")}>Go to detect</Button>}
            />
          </Card>
        </Container>
      </div>
    );
  }

  // Hovering a box on the canvas highlights its row (smallest box under the cursor wins)
  const handleCanvasMove = e => {
    if (!natural) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * natural.w) / rect.width;
    const y = ((e.clientY - rect.top) * natural.h) / rect.height;
    let hit = null;
    let area = Infinity;
    visible.forEach(det => {
      const { x1, y1, x2, y2 } = det.bbox;
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        const a = (x2 - x1) * (y2 - y1);
        if (a < area) { area = a; hit = det.n; }
      }
    });
    setHoverN(prev => (prev === hit ? prev : hit));
  };

  // Show the image at most 2x its natural width (and no taller than the cap), centered
  const fitStyle = natural
    ? { width: "100%", maxWidth: Math.min(natural.w * 2, (MAX_IMG_HEIGHT * natural.w) / natural.h) }
    : undefined;

  const uniqueClasses = [...new Set(detections.map(d => d.class_name))];

  // Summary figures, derived from data we already have
  const classCounts = detections.reduce((acc, d) => {
    acc[d.class_name] = (acc[d.class_name] || 0) + 1;
    return acc;
  }, {});
  const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
  const avgConf = detections.length
    ? Math.round((detections.reduce((s, d) => s + d.confidence, 0) / detections.length) * 10) / 10
    : null;

  const meta = [
    ["Board ID", boardId],
    ["File", fileName],
    ["Scan time", `${scanTime}s`],
    ["Affected area", affectedArea],
    ["Model", "YOLOv8m"],
    ["Scanned at", new Date().toLocaleTimeString()],
  ];

  return (
    <div className="min-h-screen overflow-x-clip">
      <Navbar />

      <main>
        <Container className="py-8 sm:py-10">
          <PageHeader
            title="Inspection result"
            subtitle={
              <div className="flex min-w-0 flex-col items-start gap-1.5">
                <Badge tone="neutral">{boardId}</Badge>
                <p className="max-w-full truncate text-sm text-muted sm:max-w-lg" title={fileName}>
                  {fileName}
                </p>
              </div>
            }
            actions={
              <>
                <Button variant="secondary" onClick={() => navigate("/")}>
                  <Icon name="home" className="h-4 w-4" />
                  Home
                </Button>
                <Button onClick={() => navigate("/detect")}>
                  <Icon name="refresh" className="h-4 w-4" />
                  Scan another
                </Button>
              </>
            }
          />

          <div className="animate-enter space-y-6" style={{ animationDelay: "80ms" }}>
            {/* Verdict banner */}
            <Card
              className={`p-5 sm:p-6 ${
                isDefect ? "border-danger/30 bg-danger-soft" : "border-success/30 bg-success-soft"
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <IconBadge
                    icon={isDefect ? "alert-triangle" : "shield-check"}
                    tone={isDefect ? "danger" : "success"}
                    className="h-12 w-12 bg-white"
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-ink sm:text-2xl">
                      {isDefect
                        ? `${defectCount} defect${defectCount > 1 ? "s" : ""} found`
                        : "Board passed inspection"}
                    </h2>
                    <p className="mt-1 max-w-2xl break-words text-sm text-body">
                      {isDefect
                        ? `Defects cover ${affectedArea} of the scan area. The board requires inspection before deployment.`
                        : "No defects detected. The board meets all quality control standards."}
                    </p>
                    {isDefect && uniqueClasses.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {uniqueClasses.map(name => (
                          <Badge key={name} tone="danger" className="bg-white">{name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-none sm:text-right">
                  <p className="text-4xl font-semibold tracking-tight text-ink">{targetConf}%</p>
                  <p className="text-sm text-muted">Top confidence</p>
                </div>
              </div>
            </Card>

            {/* Summary stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon="list"
                tone={isDefect ? "danger" : "success"}
                label="Total defects"
                value={defectCount}
                hint={isDefect ? `${affectedArea} of scan area` : "Nothing flagged"}
              />
              <StatCard
                icon="target"
                tone="primary"
                label="Most frequent type"
                value={topClass ? topClass[0] : "—"}
                hint={topClass ? `${topClass[1]} detection${topClass[1] > 1 ? "s" : ""}` : "No defect types"}
              />
              <StatCard
                icon="bar-chart"
                tone="accent"
                label="Average confidence"
                value={avgConf !== null ? `${avgConf}%` : "—"}
                hint={avgConf !== null ? `Across ${detections.length} detection${detections.length > 1 ? "s" : ""}` : "No detections to average"}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left column: image + metadata */}
              <div className="min-w-0 space-y-6 lg:col-span-3">
                {imageUrl && (
                  <Card>
                    <CardHeader
                      title="Scan image"
                      action={
                        <div className="flex gap-1 rounded-lg bg-page p-1" role="tablist">
                          {[["annotated", "Annotated"], ["original", "Original"]].map(([id, label]) => (
                            <button
                              key={id}
                              role="tab"
                              aria-selected={activeTab === id}
                              onClick={() => setActiveTab(id)}
                              className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition duration-150 ${
                                activeTab === id
                                  ? "bg-surface text-ink shadow-card"
                                  : "text-muted hover:text-ink"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      }
                    />
                    <div className="p-5">
                      {imgFailed && (
                        <Alert tone="warning" className="mb-4">
                          The annotated image could not be rendered. Try the Original tab.
                        </Alert>
                      )}

                      {numbered.length > 0 && (
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm text-body">
                            Min confidence
                            <Select
                              value={minConf}
                              onChange={e => { setMinConf(Number(e.target.value)); setHoverN(null); }}
                            >
                              {CONF_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </Select>
                          </label>
                          <span className="text-sm text-muted">
                            Showing {visible.length} of {numbered.length}
                          </span>
                        </div>
                      )}

                      <div className="relative overflow-hidden rounded-lg border border-line bg-page">
                        {activeTab === "annotated" ? (
                          <>
                            <canvas
                              ref={bboxCanvasRef}
                              style={fitStyle}
                              className="mx-auto block h-auto w-full"
                              onMouseMove={handleCanvasMove}
                              onMouseLeave={() => setHoverN(null)}
                            />
                            {!bboxDrawn && (
                              <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-page/80 text-sm text-muted">
                                Rendering…
                              </div>
                            )}
                          </>
                        ) : (
                          <img src={imageUrl} alt="Original PCB" style={fitStyle} className="mx-auto block h-auto w-full" />
                        )}
                      </div>

                      {isDefect && uniqueClasses.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                          {uniqueClasses.map(name => (
                            <li key={name} className="flex items-center gap-2 text-sm text-body">
                              <span className="h-3 w-3 rounded-sm" style={{ background: colorFor(name) }} />
                              {name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>
                )}

                <Card>
                  <CardHeader title="Scan details" />
                  <dl className="divide-y divide-line">
                    {meta.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm">
                        <dt className="shrink-0 text-muted">{k}</dt>
                        <dd className="min-w-0 truncate font-medium text-ink" title={String(v)}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </div>

              {/* Right column: defect list, analysis, recommendation */}
              <div className="min-w-0 space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader
                    title={`Defect list${
                      numbered.length
                        ? ` (${visible.length}${visible.length !== numbered.length ? ` of ${numbered.length}` : ""})`
                        : ""
                    }`}
                    description="Numbers match the badges on the image"
                  />
                  {visible.length > 0 ? (
                    <ul className="divide-y divide-line" onMouseLeave={() => setHoverN(null)}>
                      {visible.map(det => {
                        const level = levelFor(det.confidence);
                        const active = hoverN === det.n;
                        return (
                          <li
                            key={det.n}
                            className={`px-5 py-4 transition-colors duration-150 ${active ? "bg-primary-soft" : ""}`}
                            onMouseEnter={() => setHoverN(det.n)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2.5">
                                <NumberBadge n={det.n} color={colorFor(det.class_name)} active={active} />
                                <span className="truncate text-sm font-medium text-ink" title={det.class_name}>
                                  {det.class_name}
                                </span>
                              </span>
                              <span className="flex flex-none items-center gap-2">
                                <Badge tone={LEVEL_TONE[level]}>{level}</Badge>
                                <span className="w-12 text-right text-sm font-medium text-ink">{det.confidence}%</span>
                              </span>
                            </div>
                            <div className="mt-2">
                              <Meter value={det.confidence} tone={LEVEL_METER[level]} />
                            </div>
                            <p className="mt-1.5 text-xs text-muted">
                              At {det.bbox.x1}, {det.bbox.y1} · {det.bbox.x2 - det.bbox.x1}×{det.bbox.y2 - det.bbox.y1} px
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  ) : numbered.length > 0 ? (
                    <EmptyState
                      icon="info"
                      title="No detections at this threshold"
                      description={`All ${numbered.length} detections are below ${minConf}% confidence.`}
                      action={
                        <Button variant="secondary" size="sm" onClick={() => setMinConf(0)}>
                          Show all
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon="check-circle"
                      title="No defects found"
                      description="Nothing was flagged across the 6 defect types the model checks."
                    />
                  )}
                </Card>

                {analysis.length > 0 && (
                  <Card>
                    <CardHeader title="Analysis breakdown" description="Highest confidence per defect type" />
                    <ul className="divide-y divide-line">
                      {analysis.map(item => (
                        <li key={item.label} className="px-5 py-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-medium text-ink" title={item.label}>
                              {item.label}
                            </span>
                            <span className="flex flex-none items-center gap-2">
                              <Badge tone={LEVEL_TONE[item.level] || "neutral"}>{item.level}</Badge>
                              <span className="w-10 text-right text-sm font-medium text-ink">{item.bar}%</span>
                            </span>
                          </div>
                          <Meter value={item.bar} tone={LEVEL_METER[item.level] || "primary"} />
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                <Card>
                  <CardHeader
                    title="Recommendation"
                    action={
                      <Badge tone={isDefect ? "warning" : "success"} className="whitespace-nowrap">
                        {isDefect ? "Action required" : "Approved"}
                      </Badge>
                    }
                  />
                  <p className="break-words px-5 py-4 text-sm text-body">
                    {isDefect
                      ? `Board ${boardId} flagged with ${defectCount} defect${defectCount > 1 ? "s" : ""} across ${affectedArea} of scan area. Remove from production line immediately. Perform visual inspection under 10× magnification. Log incident in QC system.`
                      : `Board ${boardId} passed all automated quality checks with ${targetConf}% confidence. Zero defects across all inspection layers. Cleared for next manufacturing stage. Log approval in QC system.`}
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
