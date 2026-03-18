import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home        from "./pages/Home";
import Login       from "./pages/Login";
import Register    from "./pages/Register";
import OAuthSuccess from "./pages/OAuthSuccess";
import Detect      from "./pages/Detect";
import Result      from "./pages/Result";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<Login />} />
          <Route path="/register"      element={<Register />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />

          {/* Protected — require login */}
          <Route path="/detect" element={
            <ProtectedRoute><Detect /></ProtectedRoute>
          } />
          <Route path="/result" element={
            <ProtectedRoute><Result /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}