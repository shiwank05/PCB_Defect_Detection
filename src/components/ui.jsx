import { Link } from "react-router-dom";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Layout ─────────────────────────────────────────────── */

export function Container({ className, children }) {
  return (
    <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ── Surfaces ───────────────────────────────────────────── */

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cx("rounded-xl border border-line bg-surface shadow-card", className)}
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

/* ── Buttons ────────────────────────────────────────────── */

const buttonBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
const buttonVariants = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-page",
  ghost: "text-body hover:bg-black/5",
  danger: "bg-danger text-white hover:opacity-90",
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
      <Link to={to} className={classes} {...rest}>
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
        "block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink transition-colors duration-150 placeholder:text-muted hover:border-muted focus:border-primary",
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

export function Alert({ tone = "danger", className, children }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("rounded-lg border px-4 py-3 text-sm", tones[tone], className)}
    >
      {children}
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
    <div className="flex min-h-screen items-center justify-center bg-page">
      <Spinner label={label} />
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
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
        className={cx("h-full rounded-full transition-all duration-300", fill[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
