import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "./ui";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner label="Checking your session…" />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
