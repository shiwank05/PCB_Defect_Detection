import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Alert, Badge, Button, Card, CardHeader, Container, EmptyState, Icon, IconBadge, Meter,
  PageHeader, StatCard,
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

const LEVEL_TONE = { HIGH: "danger", MEDIUM: "warning", LOW: "neutral", EXCELLENT: "success" };
const LEVEL_METER = { HIGH: "danger", MEDIUM: "warning", LOW: "primary", EXCELLENT: "success" };

// Same thresholds the backend uses to label an analysis row
const levelFor = conf => (conf > 80 ? "HIGH" : conf > 55 ? "MEDIUM" : "LOW");

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

  const bboxCanvasRef = useRef(null);

  // ── Draw real bounding boxes ─────────────────────────────────
  useEffect(() => {
    if (activeTab !== "annotated" || !imageUrl || !bboxCanvasRef.current) return;
    const canvas = bboxCanvasRef.current;
    const ctx    = canvas.getContext("2d");
    const img    = new Image();

    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      if (detections.length === 0) { setBboxDrawn(true); return; }

      detections.forEach(det => {
        const { x1, y1, x2, y2 } = det.bbox;
        const w   = x2 - x1;
        const h   = y2 - y1;
        const col = CLASS_COLORS[det.class_name] || FALLBACK_COLOR;
        const lbl = `${det.class_name} ${det.confidence}%`;

        // Box
        ctx.strokeStyle = col;
        ctx.lineWidth   = Math.max(2, canvas.width / 320);
        ctx.strokeRect(x1, y1, w, h);

        // Label
        const fontSize = Math.max(11, canvas.width / 60);
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        const txtW = ctx.measureText(lbl).width;
        const lblH = fontSize + 8;
        const lblY = y1 - lblH < 0 ? y1 + 2 : y1 - lblH;

        ctx.fillStyle = col;
        ctx.fillRect(x1, lblY, txtW + 14, lblH);
        ctx.fillStyle = "#fff";
        ctx.fillText(lbl, x1 + 7, lblY + lblH - 6);
      });

      setBboxDrawn(true);
    };

    img.onerror = () => { setImgFailed(true); setBboxDrawn(true); };
    img.src = imageUrl;
  }, [activeTab, imageUrl, detections]);

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
    <div className="min-h-screen">
      <Navbar />

      <main>
        <Container className="py-8 sm:py-10">
          <PageHeader
            title="Inspection result"
            subtitle={`${boardId} · ${fileName}`}
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
                    <p className="mt-1 max-w-2xl text-sm text-body">
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
              <div className="space-y-6 lg:col-span-3">
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
                      <div className="relative overflow-hidden rounded-lg border border-line bg-page">
                        {activeTab === "annotated" ? (
                          <>
                            <canvas ref={bboxCanvasRef} className="mx-auto block h-auto max-h-[480px] w-full object-contain" />
                            {!bboxDrawn && (
                              <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-page/80 text-sm text-muted">
                                Rendering…
                              </div>
                            )}
                          </>
                        ) : (
                          <img src={imageUrl} alt="Original PCB" className="mx-auto block max-h-[480px] w-full object-contain" />
                        )}
                      </div>

                      {isDefect && uniqueClasses.length > 0 && (
                        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                          {uniqueClasses.map(name => (
                            <li key={name} className="flex items-center gap-2 text-sm text-body">
                              <span
                                className="h-3 w-3 rounded-sm"
                                style={{ background: CLASS_COLORS[name] || FALLBACK_COLOR }}
                              />
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
                        <dt className="text-muted">{k}</dt>
                        <dd className="truncate font-medium text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </div>

              {/* Right column: defect list, analysis, recommendation */}
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader
                    title={`Defect list${detections.length ? ` (${detections.length})` : ""}`}
                    description="Each detection with its severity and confidence"
                  />
                  {detections.length > 0 ? (
                    <ul className="divide-y divide-line">
                      {detections.map((det, i) => {
                        const level = levelFor(det.confidence);
                        return (
                          <li key={i} className="px-5 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2.5">
                                <span
                                  className="h-3 w-3 flex-none rounded-sm"
                                  style={{ background: CLASS_COLORS[det.class_name] || FALLBACK_COLOR }}
                                />
                                <span className="truncate text-sm font-medium text-ink">{det.class_name}</span>
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
                            <span className="text-sm font-medium text-ink">{item.label}</span>
                            <span className="flex items-center gap-2">
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
                      <Badge tone={isDefect ? "warning" : "success"}>
                        {isDefect ? "Action required" : "Approved"}
                      </Badge>
                    }
                  />
                  <p className="px-5 py-4 text-sm text-body">
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
