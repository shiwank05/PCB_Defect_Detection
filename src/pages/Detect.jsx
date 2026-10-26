import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_URL } from "../config";
import { Alert, Badge, Button, Card, CardHeader, Container, Meter, PageHeader } from "../components/ui";

const steps = [
  { label: "Preprocessing image", sub: "Normalizing pixel data" },
  { label: "Running the model", sub: "Forwarding through YOLOv8m layers" },
  { label: "Analyzing defect patterns", sub: "Comparing against learned patterns" },
  { label: "Generating report", sub: "Compiling confidence scores" },
];

const TIPS = [
  { title: "High resolution", text: "512×512 px or larger is recommended." },
  { title: "Clear focus", text: "Sharp edges make small defects easier to find." },
  { title: "Even lighting", text: "Avoid glare and overexposed areas." },
];

const MODEL_INFO = [
  ["Model", "YOLOv8m"],
  ["mAP@0.5", "93.6%"],
  ["Defect classes", "6"],
  ["Inference", "~14 ms / image"],
];

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
    <div className="min-h-screen bg-page">
      <Navbar />

      <main>
        <Container className="py-8 sm:py-10">
          <PageHeader
            title="Inspect a circuit board"
            subtitle="Upload a PCB image and the YOLOv8m model will check it for manufacturing defects."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload column */}
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader title="Board image" description="PNG, JPG, WEBP, BMP or TIFF" />
                <div className="p-5">
                  {preview ? (
                    <div>
                      <div className="overflow-hidden rounded-lg border border-line bg-page">
                        <img
                          src={preview}
                          alt="Selected PCB preview"
                          className="mx-auto max-h-[420px] w-auto object-contain"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{image?.name}</p>
                          <p className="text-sm text-muted">
                            {(image?.size / 1024).toFixed(1)} KB · {image?.type?.split("/")[1]?.toUpperCase()}
                          </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={clearImage} disabled={loading}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload a PCB image"
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors duration-150 ${
                        dragging
                          ? "border-primary bg-primary-soft"
                          : "border-line-strong bg-page hover:border-primary hover:bg-primary-soft"
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
                      <svg className="h-10 w-10 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      </svg>
                      <p className="mt-3 text-sm font-medium text-ink">
                        Drag and drop an image, or <span className="text-primary">browse files</span>
                      </p>
                      <p className="mt-1 text-sm text-muted">One image at a time</p>
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
                    <p className="text-sm font-medium text-ink">Analyzing image…</p>
                    <span className="text-sm text-muted">{Math.round(loadPct)}%</span>
                  </div>
                  <div className="mt-3">
                    <Meter value={loadPct} />
                  </div>
                  <ol className="mt-5 space-y-3">
                    {steps.map((step, i) => (
                      <li key={step.label} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border text-xs ${
                            i < loadStep
                              ? "border-success bg-success text-white"
                              : i === loadStep
                              ? "border-primary text-primary"
                              : "border-line-strong text-muted"
                          }`}
                        >
                          {i < loadStep ? "✓" : i + 1}
                        </span>
                        <div className={i > loadStep ? "opacity-50" : ""}>
                          <p className="text-sm font-medium text-ink">{step.label}</p>
                          {i === loadStep && <p className="text-sm text-muted">{step.sub}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Card>
              ) : (
                <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!image}>
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
                    <li key={t.title} className="px-5 py-3">
                      <p className="text-sm font-medium text-ink">{t.title}</p>
                      <p className="text-sm text-muted">{t.text}</p>
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
