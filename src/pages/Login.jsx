import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config";
import AuthLayout, { GoogleButton, OrDivider } from "../components/AuthLayout";
import { Alert, Button, Field, Input } from "../components/ui";

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (token) navigate("/detect", { replace: true });
  }, [token]);

  // OAuth error
  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      setError("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
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

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Sign in to run a PCB inspection."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {error && <Alert className="mb-5">{error}</Alert>}

      <GoogleButton onClick={handleGoogle} />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Your password"
            autoComplete="current-password"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
