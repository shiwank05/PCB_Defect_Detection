import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const name  = searchParams.get("name");
    const email = searchParams.get("email");

    if (token && email) {
      login(token, { name, email });
      navigate("/detect", { replace: true });
    } else {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-cyan-400 font-mono text-sm tracking-widest">VERIFYING IDENTITY...</p>
          <p className="text-gray-500 text-xs mt-1">Completing Google Sign-In</p>
        </div>
      </div>
    </div>
  );
}