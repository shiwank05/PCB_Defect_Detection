import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "https://shiwank05-pcb-backend.hf.space";

export default function Register() {
  const { login, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  useEffect(() => {
    if (token) navigate("/detect", { replace: true });
  }, [token]);

  useEffect(() => {
    const id = setInterval(() => setScanLine(p => (p >= 100 ? 0 : p + 0.6)), 20);
    return () => clearInterval(id);
  }, []);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_URL}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: form.name, email: form.email, password: form.password }),
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
    : form.password.length < 6  ? 1
    : form.password.length < 10 ? 2
    : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor = ["", "bg-red-500", "bg-yellow-400", "bg-cyan-400"];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "linear-gradient(#22d3ee 1px,transparent 1px),linear-gradient(90deg,#22d3ee 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px bg-cyan-400 opacity-30 pointer-events-none"
        style={{ top: `${scanLine}%` }} />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-400 opacity-40" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-400 opacity-40" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-400 opacity-40" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-400 opacity-40" />

      <div className="w-full max-w-md z-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-mono tracking-widest">NEW ACCOUNT</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm">Get access to PCB Defect Detection</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl relative">
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <span className="text-red-400 text-sm">⚠ {error}</span>
            </div>
          )}

          {/* Google OAuth */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold rounded-xl py-3 px-4 transition-all duration-200 mb-5 shadow">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-gray-500 text-xs font-mono">OR</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">FULL NAME</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} required
                placeholder="Shiwank Kumar"
                className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">EMAIL</label>
              <input
                type="email" name="email" value={form.email}
                onChange={handleChange} required
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">PASSWORD</label>
              <input
                type="password" name="password" value={form.password}
                onChange={handleChange} required
                placeholder="Min. 6 characters"
                className="w-full bg-gray-800 border border-gray-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all duration-200"
              />
              {/* Strength bar */}
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-gray-700"}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-mono ${strength === 1 ? "text-red-400" : strength === 2 ? "text-yellow-400" : "text-cyan-400"}`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-mono tracking-widest mb-2">CONFIRM PASSWORD</label>
              <input
                type="password" name="confirm" value={form.confirm}
                onChange={handleChange} required
                placeholder="••••••••"
                className={`w-full bg-gray-800 border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-all duration-200
                  ${form.confirm && form.confirm !== form.password
                    ? "border-red-500 focus:ring-1 focus:ring-red-500/30"
                    : "border-gray-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"}`}
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-red-400 text-xs mt-1 font-mono">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading || (form.confirm && form.confirm !== form.password)}
              className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-400/40 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl py-3 transition-all duration-200 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-sm">CREATING ACCOUNT...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center mt-5">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-sm transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}