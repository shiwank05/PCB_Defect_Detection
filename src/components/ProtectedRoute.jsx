import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "./ui";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageSpinner label="Checking your session…" />;
  }

  if (!token) {
    // Remember where the user was going so login can send them back
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
