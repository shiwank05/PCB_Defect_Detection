import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scanPos, setScanPos] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setScanPos(p => (p >= 100 ? 0 : p + 1.2)), 30);
    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    logout();
    navigate("/");
    setMenuOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-900/95 border-b border-gray-700 backdrop-blur-md sticky top-0 z-50">
      {/* Scan line */}
      <div className="absolute bottom-0 left-0 h-px bg-cyan-400/40 transition-none pointer-events-none"
        style={{ width: `${scanPos}%` }} />

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 border border-cyan-400 rounded flex items-center justify-center group-hover:bg-cyan-400/10 transition-all">
            <span className="text-cyan-400 text-xs font-bold">PCB</span>
          </div>
          <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
            DEFECT<span className="text-cyan-400">DETECT</span>
          </span>
        </Link>

        {/* Center — model chip */}
        <div className="hidden md:flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-gray-400 text-xs font-mono">YOLOv8m</span>
          <span className="text-cyan-400 text-xs font-mono">ACTIVE</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {user ? (
            <>
              {/* Nav links */}
              <Link to="/detect"
                className={`hidden sm:block text-xs font-mono px-3 py-1.5 rounded-lg transition-all ${
                  isActive("/detect") ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/40"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"}`}>
                DETECT
              </Link>

              {/* User chip */}
              <div className="relative">
                <button onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full pl-1 pr-3 py-1 transition-all">
                  <div className="w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center text-gray-900 text-xs font-bold">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-white text-xs font-mono hidden sm:block max-w-[100px] truncate">
                    {user.name?.split(" ")[0]}
                  </span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-gray-500 text-xs truncate">{user.email}</p>
                    </div>
                    <Link to="/detect" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 text-sm transition-all">
                      <span>🔍</span> Run Detection
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm transition-all border-t border-gray-700">
                      <span>⏻</span> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                className="text-xs font-mono text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
                SIGN IN
              </Link>
              <Link to="/register"
                className="text-xs font-mono bg-cyan-400 hover:bg-cyan-300 text-gray-900 font-bold px-4 py-1.5 rounded-lg transition-all">
                REGISTER
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}