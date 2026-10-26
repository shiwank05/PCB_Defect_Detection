import { Link } from "react-router-dom";
import Logo from "./Logo";
import { Button, Icon } from "./ui";

const BENEFITS = [
  "Six defect types detected automatically",
  "Defects located on your image, with confidence scores",
  "Sign in with email or Google",
];

/** Branded side panel — hidden on mobile. */
function BrandPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden bg-primary-strong p-10 text-white lg:flex"
      style={{
        backgroundImage:
          "linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <Link to="/" className="flex items-center gap-2.5 rounded-lg">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
          <Icon name="chip" className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-tight">PCB Defect Detection</span>
      </Link>

      <div>
        <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white">
          Inspect circuit boards with a trained vision model.
        </h2>
        <p className="mt-3 max-w-sm text-primary-200">
          Upload a board photo and see every defect found, classified and scored.
        </p>
        <ul className="mt-8 space-y-3">
          {BENEFITS.map(b => (
            <li key={b} className="flex items-start gap-3 text-sm text-white/90">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/15">
                <Icon name="check" className="h-3 w-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-primary-200">YOLOv8m · 6 defect classes</p>
    </aside>
  );
}

/** Split layout shared by the Login and Register pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="flex flex-col items-center justify-center px-4 py-10">
        <div className="mb-8 lg:hidden">
          <Logo size="lg" />
        </div>

        <div className="animate-enter w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted sm:text-base">{subtitle}</p>}
          <div className="mt-8 rounded-xl border border-line bg-surface p-6 shadow-raise sm:p-7">
            {children}
          </div>
        </div>

        {footer && <p className="mt-6 text-sm text-muted">{footer}</p>}

        <Link
          to="/"
          className="mt-3 inline-flex items-center gap-1.5 rounded text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          <Icon name="home" className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}

export function GoogleButton({ onClick }) {
  return (
    <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onClick}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-muted" role="separator">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
