import { useState, useEffect } from "react";
import './App.css';
import { AuthProvider, useAuth } from "./context/AuthContext";
import { apiFetch } from "./lib/api";
import { isProfileComplete } from "./data/mockData";
import Home      from "./pages/Home";
import Login     from "./pages/Login";
import Profile   from "./pages/Profile";
import AgentTest from "./pages/AgentTest";

const NAV = [
  { id:"home",    label:"Home"     },
  { id:"profile", label:"Profile"  },
  { id:"agent",   label:"Agent ⚡" },
];

const Spinner = () => (
  <div className="shell" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", color:"var(--muted)" }}>
    Loading…
  </div>
);

function Shell() {
  const [page, setPage]                   = useState("home");
  const [profileComplete, setProfileComplete] = useState(null); // null = checking
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;
    apiFetch("/profile")
      .then(res => res.ok ? res.json() : null)
      .then(data => setProfileComplete(data ? isProfileComplete(data) : false))
      .catch(() => setProfileComplete(false));
  }, [user]);

  if (loading || (user && profileComplete === null)) return <Spinner />;
  if (!user) return <Login />;

  const navBar = (locked = false) => (
    <nav className="nav">
      <div className="nav-brand" onClick={() => !locked && setPage("home")}>
        <div className="nav-logo">🐾</div>
        <span className="nav-name">Job<span>Claw</span></span>
      </div>
      {!locked && (
        <div className="nav-links">
          {NAV.map(n => (
            <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
              {n.label}
            </button>
          ))}
        </div>
      )}
      <div className="nav-right">
        {!locked && (
          <div className="nav-avatar" onClick={() => setPage("profile")} title={user.email}>
            {user.email?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <button className="nav-link" onClick={signOut} style={{ fontSize: 13 }}>Sign out</button>
      </div>
    </nav>
  );

  const locked = !profileComplete;
  const onComplete = () => { setProfileComplete(true); setPage("profile"); };

  return (
    <div className="shell">
      {navBar(locked)}
      {(locked || page === "profile") && <Profile isLocked={locked} onComplete={onComplete} />}
      {!locked && page === "home"    && <Home onNav={setPage} />}
      {!locked && page === "agent"   && <AgentTest />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
