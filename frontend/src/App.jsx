import { useState } from "react";
import './App.css';
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home      from "./pages/Home";
import Login     from "./pages/Login";
import Profile   from "./pages/Profile";
import AgentTest from "./pages/AgentTest";

const NAV = [
  { id:"home",    label:"Home"     },
  { id:"profile", label:"Profile"  },
  { id:"agent",   label:"Agent ⚡" },
];

function Shell() {
  const [page, setPage] = useState("home");
  const { user, loading, signOut } = useAuth();

  if (loading) return <div className="shell" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", color:"var(--muted)" }}>Loading…</div>;
  if (!user)   return <Login />;

  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav-brand" onClick={() => setPage("home")}>
          <div className="nav-logo">🐾</div>
          <span className="nav-name">Job<span>Claw</span></span>
        </div>
        <div className="nav-links">
          {NAV.map(n => (
            <button key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
              {n.label}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <div className="nav-avatar" onClick={() => setPage("profile")} title={user.email}>
            {user.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <button className="nav-link" onClick={signOut} style={{ fontSize: 13 }}>Sign out</button>
        </div>
      </nav>
      {page === "home"    && <Home      onNav={setPage} />}
      {page === "profile" && <Profile />}
      {page === "agent"   && <AgentTest />}
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
