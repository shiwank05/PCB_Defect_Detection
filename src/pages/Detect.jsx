import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";
import {
  Alert, Badge, Button, Card, CardHeader, Container, Icon, IconBadge, Meter, PageHeader,
  Skeleton, Spinner,
} from "../components/ui";

const steps = [
  { label: "Preprocessing image", sub: "Normalizing pixel data" },
  { label: "Running the model", sub: "Forwarding through YOLOv8m layers" },
  { label: "Analyzing defect patterns", sub: "Comparing against learned patterns" },
  { label: "Generating report", sub: "Compiling confidence scores" },
];

const TIPS = [
  { icon: "image", title: "High resolution", text: "512×512 px or larger is recommended." },
  { icon: "target", title: "Clear focus", text: "Sharp edges make small defects easier to find." },
  { icon: "zap", title: "Even lighting", text: "Avoid glare and overexposed areas." },
];

const MODEL_INFO = [
  ["Model", "YOLOv8m"],
  ["mAP@0.5", "93.6%"],
  ["Defect classes", "6"],
];

function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;
}

export default function Detect() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const navigate = useNavigate();

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

    let step = 0;
    const si = setInterval(() => {
      step++;
      if (step < steps.length) setLoadStep(step);
      else clearInterval(si);
    }, 700);

    let pct = 0;
    const pi = setInterval(() => {
      pct += Math.random() * 2.5;
      if (pct >= 90) { pct = 90; clearInterval(pi); }
      setLoadPct(pct);
    }, 80);

    try {
      const formData = new FormData();
      formData.append("image", image);

      const token = localStorage.getItem("pcb_token");
      const response = await fetch(`${API_URL}/detect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
          ? "Cannot connect to backend. The server may be waking up — please wait 30 seconds and try again."
          : err.message
      );
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <Container className="py-8 sm:py-10">
          <PageHeader
            title="Inspect a circuit board"
            subtitle="Upload a PCB image and the YOLOv8m model will check it for manufacturing defects."
          />

          <div className="animate-enter grid gap-6 lg:grid-cols-3" style={{ animationDelay: "80ms" }}>
            {/* Upload column */}
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader title="Board image" description="PNG, JPG, WEBP, BMP or TIFF" />
                <div className="p-5">
                  {preview ? (
                    <div>
                      <div className="relative overflow-hidden rounded-lg border border-line bg-page">
                        <img
                          src={preview}
                          alt="Selected PCB preview"
                          className={`mx-auto max-h-[420px] w-auto object-contain transition duration-300 ${
                            loading ? "opacity-60" : ""
                          }`}
                        />
                        {loading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full bg-white/90 px-4 py-2 shadow-raise">
                              <Spinner label="Analyzing…" />
                            </span>
                          </div>
                        )}
                      </div>

                      {/* File row: thumbnail, name, size */}
                      <div className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-page p-3">
                        <img
                          src={preview}
                          alt=""
                          className="h-12 w-12 flex-none rounded-md border border-line object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{image?.name}</p>
                          <p className="text-sm text-muted">
                            {formatSize(image?.size)} · {image?.type?.split("/")[1]?.toUpperCase()}
                          </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={clearImage} disabled={loading}>
                          <Icon name="x" className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload a PCB image"
                      className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition duration-200 ${
                        dragging
                          ? "border-primary bg-primary-soft"
                          : "border-line-strong bg-page hover:border-primary hover:bg-primary-soft/60"
                      }`}
                      onClick={() => fileRef.current.click()}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileRef.current.click();
                        }
                      }}
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
                    >
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-full transition duration-200 ${
                          dragging
                            ? "bg-primary text-white"
                            : "bg-primary-soft text-primary motion-safe:group-hover:-translate-y-0.5"
                        }`}
                      >
                        <Icon name="upload" className="h-6 w-6" />
                      </span>
                      <p className="mt-4 text-base font-medium text-ink">
                        {dragging ? "Drop to upload" : "Drag and drop an image"}
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        or <span className="font-medium text-primary">browse files</span> · one image at a time
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              </Card>

              {error && <Alert>{error}</Alert>}

              {loading ? (
                <Card className="p-5" aria-live="polite">
                  <div className="flex items-center justify-between">
                    <Spinner label="Analyzing image…" />
                    <span className="text-sm font-medium text-ink">{Math.round(loadPct)}%</span>
                  </div>
                  <div className="mt-3">
                    <Meter value={loadPct} />
                  </div>
                  <ol className="mt-5 space-y-3">
                    {steps.map((step, i) => (
                      <li key={step.label} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border text-xs transition-colors duration-300 ${
                            i < loadStep
                              ? "border-success bg-success text-white"
                              : i === loadStep
                              ? "border-primary text-primary"
                              : "border-line-strong text-muted"
                          }`}
                        >
                          {i < loadStep ? <Icon name="check" className="h-3 w-3" /> : i + 1}
                        </span>
                        <div className={i > loadStep ? "opacity-50" : ""}>
                          <p className="text-sm font-medium text-ink">{step.label}</p>
                          {i === loadStep && <p className="text-sm text-muted">{step.sub}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {/* Placeholder for the report that is being prepared */}
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="mb-3 text-xs font-medium text-muted">Preparing your report</p>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                </Card>
              ) : (
                <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!image}>
                  <Icon name="target" className="h-5 w-5" />
                  Run defect analysis
                </Button>
              )}
            </div>

            {/* Info column */}
            <div className="space-y-4">
              <Card>
                <CardHeader title="Tips for best results" />
                <ul className="divide-y divide-line">
                  {TIPS.map(t => (
                    <li key={t.title} className="flex items-start gap-3 px-5 py-3">
                      <IconBadge icon={t.icon} className="h-8 w-8" />
                      <div>
                        <p className="text-sm font-medium text-ink">{t.title}</p>
                        <p className="text-sm text-muted">{t.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <CardHeader title="About the model" action={<Badge tone="success">Online</Badge>} />
                <dl className="divide-y divide-line">
                  {MODEL_INFO.map(([k, v]) => (
                    <div key={k} className="flex justify-between px-5 py-3 text-sm">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
