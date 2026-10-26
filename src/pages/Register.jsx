import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";
import AuthLayout, { GoogleButton, OrDivider } from "../components/AuthLayout";
import { Alert, Button, Field, Input } from "../components/ui";

export default function Register() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate("/detect", { replace: true });
  }, [token]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      login(data.token, data.user);
      navigate("/detect");
    } catch {
      setError("Cannot reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = `${API_URL}/auth/google`;
  }

  // Password strength
  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2
    : 3;
  const strengthLabel = ["", "Weak", "Moderate", "Strong"];
  const strengthBar = ["", "bg-danger", "bg-warning", "bg-success"];
  const strengthText = ["", "text-danger", "text-warning", "text-success"];

  const passwordMismatch = form.confirm && form.confirm !== form.password;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start inspecting PCB images."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && <Alert className="mb-5">{error}</Alert>}

      <GoogleButton onClick={handleGoogle} />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input
            id="name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Jane Doe"
            autoComplete="name"
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Password" htmlFor="password" hint="At least 6 characters.">
          <Input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Create a password"
            autoComplete="new-password"
          />
          {form.password && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map(i => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength ? strengthBar[strength] : "bg-line"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${strengthText[strength]}`}>
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirm"
          error={passwordMismatch ? "Passwords do not match" : undefined}
        >
          <Input
            id="confirm"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={handleChange}
            required
            invalid={!!passwordMismatch}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || !!passwordMismatch}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
