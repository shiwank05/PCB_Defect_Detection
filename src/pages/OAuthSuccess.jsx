import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "../components/ui";

export default function OAuthSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Token arrives in the URL fragment so it is never sent to servers or logged
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const name  = params.get("name");
    const email = params.get("email");
    window.history.replaceState(null, "", window.location.pathname);

    if (token && email) {
      login(token, { name, email });
      navigate("/detect", { replace: true });
    } else {
      navigate("/login?error=oauth_failed", { replace: true });
    }
  }, []);

  return <FullPageSpinner label="Completing Google sign-in…" />;
}