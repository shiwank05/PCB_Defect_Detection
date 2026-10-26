import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Badge, Button, Card, Container } from "../components/ui";

const STATS = [
  { value: "93.6%", label: "mAP@0.5", note: "YOLOv8m on the test set" },
  { value: "14 ms", label: "Inference speed", note: "Per image on GPU" },
  { value: "6", label: "Defect classes", note: "Classified automatically" },
  { value: "693", label: "Training images", note: "Labeled PCB samples" },
];

const DEFECTS = [
  { name: "Missing Hole", text: "A drilled hole that is absent from the board." },
  { name: "Mouse Bite", text: "Small notches along the edge of a trace or board." },
  { name: "Open Circuit", text: "A break in a trace that interrupts the connection." },
  { name: "Short", text: "Unintended copper bridging two separate traces." },
  { name: "Spur", text: "A sharp copper protrusion extending from a trace." },
  { name: "Spurious Copper", text: "Leftover copper where there should be none." },
];

const STEPS = [
  { title: "Upload", text: "Add a photo of the board you want to inspect." },
  { title: "Analyze", text: "The YOLOv8m model scans it in a single forward pass." },
  { title: "Review", text: "See each defect with its class, location and confidence." },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-line bg-surface">
          <Container className="py-16 text-center sm:py-24">
            <Badge tone="primary">AI-powered inspection · YOLOv8m</Badge>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Detect PCB defects automatically
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
              Upload an image of a printed circuit board and get every defect
              located, classified and scored by a deep learning model.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate("/detect")}>
                Start inspection
              </Button>
              <Button size="lg" variant="secondary" to="/register">
                Create an account
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">Free to use. Sign in required to run a scan.</p>
          </Container>
        </section>

        {/* Stats */}
        <section>
          <Container className="py-12">
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {STATS.map((s) => (
                <Card key={s.label} className="p-5">
                  <dd className="text-3xl font-semibold tracking-tight text-ink">{s.value}</dd>
                  <dt className="mt-1 text-sm font-medium text-ink">{s.label}</dt>
                  <p className="mt-0.5 text-sm text-muted">{s.note}</p>
                </Card>
              ))}
            </dl>
          </Container>
        </section>

        {/* How it works */}
        <section>
          <Container className="pb-12">
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">How it works</h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <Card className="h-full p-5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted">{step.text}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Defect classes */}
        <section>
          <Container className="pb-16">
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">Defects it detects</h2>
            <p className="mt-1 text-sm text-muted sm:text-base">
              The model is trained to recognize six common manufacturing defects.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEFECTS.map((d) => (
                <li key={d.name}>
                  <Card className="h-full p-5 transition-shadow duration-150 hover:shadow-pop">
                    <h3 className="text-base font-semibold text-ink">{d.name}</h3>
                    <p className="mt-1 text-sm text-muted">{d.text}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-2 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2025 PCB Defect Detection</span>
          <span>Model: YOLOv8m · mAP@0.5 93.6%</span>
        </Container>
      </footer>
    </div>
  );
}
