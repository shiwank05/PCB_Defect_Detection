import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Container } from "./ui";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-lg">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" />
          <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
        </svg>
      </span>
      <span className="text-base font-semibold text-ink">
        PCB Defect Detection
      </span>
    </Link>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate("/");
    setMenuOpen(false);
  }

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
          {user ? (
            <>
              <Link
                to="/detect"
                aria-current={isActive("/detect") ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive("/detect")
                    ? "bg-primary-soft text-primary"
                    : "text-body hover:bg-black/5"
                }`}
              >
                Detect
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 hover:bg-black/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="hidden text-sm font-medium text-ink sm:inline">
                    {user.name?.split(" ")[0]}
                  </span>
                  <svg
                    className={`h-4 w-4 text-muted transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
                  >
                    <div className="border-b border-line px-4 py-3">
                      <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                      <p className="truncate text-sm text-muted">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        to="/detect"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-body transition-colors duration-150 hover:bg-page"
                      >
                        Run detection
                      </Link>
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors duration-150 hover:bg-danger-soft"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button to="/login" variant="ghost">
                Sign in
              </Button>
              <Button to="/register">Get started</Button>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}
