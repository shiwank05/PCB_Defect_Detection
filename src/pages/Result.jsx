import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Badge, Button, Card, CardHeader, Container, EmptyState, Meter, PageHeader,
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

    img.onerror = () => { setBboxDrawn(true); };
    img.src = imageUrl;
  }, [activeTab, imageUrl, detections]);

  // ── No state guard ───────────────────────────────────────────
  if (!location.state) {
    return (
      <div className="min-h-screen bg-page">
        <Navbar />
        <Container className="py-16">
          <Card>
            <EmptyState
              title="No scan data found"
              description="Run a detection first to see results here."
              action={<Button onClick={() => navigate("/detect")}>Go to detect</Button>}
            />
          </Card>
        </Container>
      </div>
    );
  }

  const uniqueClasses = [...new Set(detections.map(d => d.class_name))];

  const meta = [
    ["Board ID", boardId],
    ["File", fileName],
    ["Scan time", `${scanTime}s`],
    ["Defects", String(defectCount)],
    ["Affected area", affectedArea],
    ["Model", "YOLOv8m"],
    ["Scanned at", new Date().toLocaleTimeString()],
  ];

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main>
        <Container className="py-8 sm:py-10">
          <PageHeader
            title="Inspection result"
            subtitle={`${boardId} · ${fileName}`}
            actions={
              <>
                <Button variant="secondary" onClick={() => navigate("/")}>Home</Button>
                <Button onClick={() => navigate("/detect")}>Scan another</Button>
              </>
            }
          />

          {/* Verdict */}
          <Card
            className={`mb-6 p-5 sm:p-6 ${
              isDefect ? "border-danger/30 bg-danger-soft" : "border-success/30 bg-success-soft"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Badge tone={isDefect ? "danger" : "success"}>
                  {isDefect ? "Fail" : "Pass"}
                </Badge>
                <h2 className="mt-3 text-xl font-semibold text-ink sm:text-2xl">
                  {isDefect ? "Defects detected" : "Board passed inspection"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-body">
                  {isDefect
                    ? `${defectCount} defect${defectCount > 1 ? "s" : ""} found across ${affectedArea} of the scan area. The board requires inspection before deployment.`
                    : "No defects detected. The board meets all quality control standards."}
                </p>
                {isDefect && uniqueClasses.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uniqueClasses.map(name => (
                      <Badge key={name} tone="danger">{name}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-none sm:text-right">
                <p className="text-4xl font-semibold tracking-tight text-ink">{targetConf}%</p>
                <p className="text-sm text-muted">Top confidence</p>
              </div>
            </div>
          </Card>

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
                            className={`cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150 ${
                              activeTab === id
                                ? "bg-surface text-ink shadow-sm"
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
                    <div className="relative overflow-hidden rounded-lg border border-line bg-page">
                      {activeTab === "annotated" ? (
                        <>
                          <canvas ref={bboxCanvasRef} className="mx-auto block h-auto max-h-[480px] w-full object-contain" />
                          {!bboxDrawn && (
                            <div className="absolute inset-0 flex items-center justify-center bg-page/80 text-sm text-muted">
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

            {/* Right column: analysis, detections, recommendation */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader title="Analysis breakdown" description="Confidence per defect type" />
                {analysis.length > 0 ? (
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
                ) : (
                  <EmptyState
                    title="All clear"
                    description="No defects detected across all 6 inspection categories."
                  />
                )}
              </Card>

              {detections.length > 0 && (
                <Card>
                  <CardHeader title={`Detections (${detections.length})`} />
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-page text-xs text-muted">
                        <tr>
                          <th scope="col" className="px-5 py-2 font-medium">Class</th>
                          <th scope="col" className="px-3 py-2 font-medium">Conf.</th>
                          <th scope="col" className="px-3 py-2 font-medium">Position</th>
                          <th scope="col" className="px-5 py-2 font-medium">Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {detections.map((det, i) => (
                          <tr key={i}>
                            <td className="whitespace-nowrap px-5 py-2.5 font-medium text-ink">{det.class_name}</td>
                            <td className="px-3 py-2.5">{det.confidence}%</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-muted">{det.bbox.x1}, {det.bbox.y1}</td>
                            <td className="whitespace-nowrap px-5 py-2.5 text-muted">
                              {det.bbox.x2 - det.bbox.x1}×{det.bbox.y2 - det.bbox.y1}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
        </Container>
      </main>
    </div>
  );
}
