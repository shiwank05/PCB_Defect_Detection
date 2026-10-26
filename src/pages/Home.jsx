import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import {
  Badge, Button, Card, Container, Icon, IconBadge, SectionHeading, StatCard,
} from "../components/ui";

const STATS = [
  { icon: "target", tone: "primary", value: "93.6%", label: "mAP@0.5", hint: "YOLOv8m, on held-out images" },
  { icon: "layers", tone: "accent", value: "693", label: "Training images", hint: "Labeled PCB samples" },
  { icon: "list", tone: "warning", value: "6", label: "Defect classes", hint: "Classified automatically" },
];

const STEPS = [
  { icon: "upload", title: "Upload", text: "Add a photo of the board you want to inspect." },
  { icon: "chip", title: "Analyze", text: "The YOLOv8m model scans it in a single forward pass." },
  { icon: "check-circle", title: "Review", text: "See each defect with its class, location and confidence." },
];

const FEATURES = [
  { icon: "target", tone: "primary", title: "Six defect classes", text: "Missing holes, mouse bites, open circuits, shorts, spurs and spurious copper." },
  { icon: "image", tone: "accent", title: "Located on the image", text: "Every detection is drawn as a labeled bounding box on your original photo." },
  { icon: "bar-chart", tone: "warning", title: "Confidence scores", text: "Each finding comes with a confidence value and a severity level." },
  { icon: "lock", tone: "success", title: "Account sign-in", text: "Use email and password or Google; scans require a signed-in account." },
];

const DEFECTS = [
  { name: "Missing Hole", color: "#2563eb", text: "A drilled hole that is absent from the board." },
  { name: "Mouse Bite", color: "#ea580c", text: "Small notches along the edge of a trace or board." },
  { name: "Open Circuit", color: "#dc2626", text: "A break in a trace that interrupts the connection." },
  { name: "Short", color: "#db2777", text: "Unintended copper bridging two separate traces." },
  { name: "Spur", color: "#ca8a04", text: "A sharp copper protrusion extending from a trace." },
  { name: "Spurious Copper", color: "#7c3aed", text: "Leftover copper where there should be none." },
];

/** Illustrative mock of a result: a stylised board with a few labeled boxes. No real data. */
function PreviewCard() {
  const boxes = [
    { label: "Short", color: "#db2777", style: { top: "22%", left: "14%", width: "24%", height: "18%" } },
    { label: "Open Circuit", color: "#dc2626", style: { top: "52%", left: "50%", width: "28%", height: "16%" } },
    { label: "Mouse Bite", color: "#ea580c", style: { top: "70%", left: "16%", width: "18%", height: "14%" } },
  ];
  return (
    <Card className="mx-auto max-w-4xl overflow-hidden shadow-pop">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          <p className="text-sm font-medium text-ink">Inspection result</p>
        </div>
        <Badge tone="neutral">Illustrative example</Badge>
      </div>

      <div className="grid gap-0 md:grid-cols-5">
        {/* Stylised board */}
        <div className="p-5 md:col-span-3">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line"
            style={{
              backgroundColor: "#166534",
              backgroundImage:
                "linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            role="img"
            aria-label="Illustration of a circuit board with three highlighted defects"
          >
            {/* chip + pads */}
            <div className="absolute left-[40%] top-[30%] h-[28%] w-[22%] rounded-sm bg-slate-800/90" />
            {[18, 30, 42, 54, 66, 78].map(x => (
              <span key={x} className="absolute top-[12%] h-2 w-2 rounded-full bg-amber-200/80" style={{ left: `${x}%` }} />
            ))}
            {[20, 36, 52, 68].map(x => (
              <span key={x} className="absolute bottom-[10%] h-2 w-2 rounded-full bg-amber-200/80" style={{ left: `${x}%` }} />
            ))}
            {boxes.map(b => (
              <div key={b.label} className="absolute rounded-sm border-2" style={{ ...b.style, borderColor: b.color }}>
                <span
                  className="absolute -top-5 left-[-2px] whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ background: b.color }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock findings */}
        <div className="border-t border-line p-5 md:col-span-2 md:border-l md:border-t-0">
          <Badge tone="danger">Defects found</Badge>
          <p className="mt-3 text-lg font-semibold text-ink">3 defects on this board</p>
          <p className="mt-1 text-sm text-muted">Each finding lists its class and where it is on the image.</p>
          <ul className="mt-4 space-y-2.5">
            {boxes.map(b => (
              <li key={b.label} className="flex items-center gap-2.5 text-sm text-body">
                <span className="h-3 w-3 rounded-sm" style={{ background: b.color }} />
                {b.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative">
          <Container className="pb-12 pt-16 text-center sm:pb-16 sm:pt-24">
            <div className="animate-enter">
              <Badge tone="primary" className="bg-white">
                <Icon name="zap" className="h-3 w-3" />
                AI-powered inspection · YOLOv8m
              </Badge>
            </div>
            <h1
              className="animate-enter mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-6xl"
              style={{ animationDelay: "60ms" }}
            >
              Catch PCB defects <span className="text-primary">before they ship</span>
            </h1>
            <p
              className="animate-enter mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg"
              style={{ animationDelay: "120ms" }}
            >
              Upload a photo of a printed circuit board and get every defect located,
              classified and scored by a deep learning model.
            </p>
            <div
              className="animate-enter mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "180ms" }}
            >
              <Button size="lg" onClick={() => navigate("/detect")}>
                Start inspection
                <Icon name="arrow-right" className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="secondary" to="/register">
                Create an account
              </Button>
            </div>
            <p className="animate-enter mt-4 text-sm text-muted" style={{ animationDelay: "220ms" }}>
              Sign in required to run a scan.
            </p>
          </Container>

          <Container className="pb-16 sm:pb-20">
            <div className="animate-enter" style={{ animationDelay: "280ms" }}>
              <PreviewCard />
            </div>
          </Container>
        </section>

        {/* Stats */}
        <section>
          <Container className="pb-16 sm:pb-20">
            <div className="grid gap-4 sm:grid-cols-3">
              {STATS.map(s => (
                <StatCard key={s.label} icon={s.icon} tone={s.tone} label={s.label} value={s.value} hint={s.hint} />
              ))}
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-surface">
          <Container className="py-16 sm:py-20">
            <SectionHeading
              eyebrow="How it works"
              title="From photo to report in three steps"
              subtitle="No setup and nothing to install — everything runs in the browser against the hosted model."
            />
            <ol className="relative grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <Card interactive className="h-full p-6">
                    <div className="flex items-center justify-between">
                      <IconBadge icon={step.icon} />
                      <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted">{step.text}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Features */}
        <section>
          <Container className="py-16 sm:py-20">
            <SectionHeading
              eyebrow="Features"
              title="What you get"
              subtitle="A focused tool for checking boards, with results you can read at a glance."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(f => (
                <Card key={f.title} interactive className="p-5">
                  <IconBadge icon={f.icon} tone={f.tone} />
                  <h3 className="mt-4 text-base font-semibold text-ink">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.text}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Defect classes */}
        <section className="border-t border-line bg-surface">
          <Container className="py-16 sm:py-20">
            <SectionHeading
              eyebrow="Defect types"
              title="Defects it detects"
              subtitle="The model is trained to recognize six common manufacturing defects. Each has its own color on the annotated image."
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEFECTS.map(d => (
                <li key={d.name}>
                  <Card interactive className="h-full p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                      <h3 className="text-base font-semibold text-ink">{d.name}</h3>
                    </div>
                    <p className="mt-2 text-sm text-muted">{d.text}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted">Automated PCB defect detection with YOLOv8m.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <Link to="/detect" className="hover:text-ink">Detect</Link>
            <Link to="/login" className="hover:text-ink">Sign in</Link>
            <Link to="/register" className="hover:text-ink">Create account</Link>
            <a
              href="https://github.com/shiwank05/PCB_Defect_Detection"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              GitHub
            </a>
          </nav>
        </Container>
        <div className="border-t border-line">
          <Container className="py-4 text-sm text-muted">© 2025 PCB Defect Detection</Container>
        </div>
      </footer>
    </div>
  );
}
