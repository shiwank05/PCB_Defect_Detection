import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("pcb_token");
    const savedUser  = localStorage.getItem("pcb_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function login(tokenVal, userVal) {
    setToken(tokenVal);
    setUser(userVal);
    localStorage.setItem("pcb_token", tokenVal);
    localStorage.setItem("pcb_user", JSON.stringify(userVal));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("pcb_token");
    localStorage.removeItem("pcb_user");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}