import { useState } from "react";
import './App.css';
import Home      from "./pages/Home";
import Profile   from "./pages/Profile";
import AgentTest from "./pages/AgentTest";

const NAV = [
  { id:"home",    label:"Home"     },
  { id:"profile", label:"Profile"  },
  { id:"agent",   label:"Agent ⚡" },
];

export default function App() {
  const [page, setPage] = useState("home");
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
          <div className="nav-avatar" onClick={() => setPage("profile")}>J</div>
        </div>
      </nav>
      {page === "home"    && <Home      onNav={setPage} />}
      {page === "profile" && <Profile />}
      {page === "agent"   && <AgentTest />}
    </div>
  );
}
