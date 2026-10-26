import { Link } from "react-router-dom";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Icons ──────────────────────────────────────────────────
 * Small inline icon set (24×24, stroke-based, Lucide-style paths),
 * so no icon library dependency is needed.
 */
const ICON_PATHS = {
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18M6 6l12 12",
  "arrow-right": "M5 12h14M12 5l7 7-7 7",
  "chevron-down": "m6 9 6 6 6-6",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  image:
    "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM21 15l-3.09-3.09a2 2 0 0 0-2.82 0L6 21",
  target:
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  "bar-chart": "M12 20V10M18 20V4M6 20v-4",
  "shield-check":
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1ZM9 12l2 2 4-4",
  "alert-triangle":
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01",
  "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  "x-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM15 9l-6 6M9 9l6 6",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01",
  layers: "m12 2 10 5-10 5L2 7l10-5ZM2 17l10 5 10-5M2 12l10 5 10-5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  chip: "M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4",
  lock: "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM7 11V7a5 5 0 0 1 10 0v4",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  home: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM9 22V12h6v10",
};

export function Icon({ name, className = "h-5 w-5", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const iconTones = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-page text-body",
};

/** Small rounded tinted square holding an icon. */
export function IconBadge({ icon, tone = "primary", className }) {
  return (
    <span
      className={cx(
        "inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg",
        iconTones[tone],
        className
      )}
    >
      <Icon name={icon} className="h-5 w-5" />
    </span>
  );
}

/* ── Layout ─────────────────────────────────────────────── */

export function Container({ className, children }) {
  return (
    <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="animate-enter mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/** Consistent heading block for page sections. */
export function SectionHeading({ eyebrow, title, subtitle, className }) {
  return (
    <div className={cx("mb-8", className)}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold text-primary">{eyebrow}</p>
      )}
      <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-2xl text-base text-muted">{subtitle}</p>}
    </div>
  );
}

/* ── Surfaces ───────────────────────────────────────────── */

/** `interactive` adds a small lift + shadow change on hover. */
export function Card({ className, interactive, children, ...rest }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-line bg-surface shadow-card",
        interactive &&
          "transition duration-200 hover:shadow-raise motion-safe:hover:-translate-y-0.5",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Icon + big number + label, used for summaries. */
export function StatCard({ icon, tone = "primary", label, value, hint }) {
  return (
    <Card interactive className="p-5">
      <div className="flex items-start gap-4">
        <IconBadge icon={icon} tone={tone} />
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

/* ── Buttons ────────────────────────────────────────────── */

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none motion-safe:enabled:hover:-translate-y-px motion-safe:enabled:active:translate-y-0";
const buttonVariants = {
  primary: "bg-primary text-white shadow-card hover:bg-primary-hover hover:shadow-raise",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-card hover:bg-page hover:shadow-raise",
  ghost: "text-body hover:bg-black/5",
  danger: "bg-danger text-white shadow-card hover:opacity-90 hover:shadow-raise",
};
const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

/** Renders a <button>, or a router <Link> when `to` is given. */
export function Button({ variant = "primary", size = "md", to, className, children, ...rest }) {
  const classes = cx(buttonBase, buttonVariants[variant], buttonSizes[size], className);
  if (to) {
    return (
      <Link to={to} className={cx(classes, "motion-safe:hover:-translate-y-px")} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

/* ── Forms ──────────────────────────────────────────────── */

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}

export function Input({ className, invalid, ...rest }) {
  return (
    <input
      className={cx(
        "block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink shadow-card transition duration-150 placeholder:text-muted hover:border-muted focus:border-primary focus:ring-4 focus:ring-primary/10",
        invalid ? "border-danger" : "border-line-strong",
        className
      )}
      {...rest}
    />
  );
}

/* ── Feedback ───────────────────────────────────────────── */

const tones = {
  neutral: "border-line bg-page text-body",
  primary: "border-primary/20 bg-primary-soft text-primary",
  success: "border-success/20 bg-success-soft text-success",
  warning: "border-warning/20 bg-warning-soft text-warning",
  danger: "border-danger/20 bg-danger-soft text-danger",
};
const alertIcons = {
  neutral: "info",
  primary: "info",
  success: "check-circle",
  warning: "alert-triangle",
  danger: "x-circle",
};

export function Badge({ tone = "neutral", className, children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Inline alert used for errors, warnings and success messages on every page. */
export function Alert({ tone = "danger", className, children }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "animate-enter flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        tones[tone],
        className
      )}
    >
      <Icon name={alertIcons[tone]} className="mt-0.5 h-4 w-4 flex-none" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Spinner({ className, label }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-sm text-muted", className)} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line-strong border-t-primary" />
      {label}
    </span>
  );
}

export function FullPageSpinner({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}

/** Pulsing placeholder block shown while content is loading. */
export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-md bg-line", className)} aria-hidden="true" />;
}

export function EmptyState({ icon = "info", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <IconBadge icon={icon} tone="neutral" className="h-12 w-12" />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Horizontal progress / confidence bar. */
export function Meter({ value, tone = "primary" }) {
  const fill = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx("h-full rounded-full transition-all duration-500 ease-out", fill[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
