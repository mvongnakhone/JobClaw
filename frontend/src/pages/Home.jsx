import { useState, useEffect } from "react";
import { TICKER, TODAY_MATCHES, READY_JOBS } from "../data/mockData";
import { apiFetch } from "../lib/api";
import { useJobListings, normalizeAdzunaJob } from "../hooks/useJobListings";

function ScoreColor(n) {
  return n >= 90 ? "var(--green)" : n >= 80 ? "var(--amber)" : "var(--red)";
}

const STATUS_MSG = {
  thinking:     "Finding your matches…",
  tool_calling: "Searching job boards…",
  done:         null,
  error:        "Couldn't load live jobs — showing examples",
};

export default function Home({ onNav }) {
  const [liveJobs, setLiveJobs]       = useState(null);
  const [agentStatus, setAgentStatus] = useState("thinking");
  const { jobs: adzunaJobs, loading: adzunaLoading, newCount, refresh, clearNewCount } = useJobListings();

  useEffect(() => {
    apiFetch("/find-jobs")
      .then(async res => {
        if (!res.ok || !res.body) throw new Error(`server ${res.status}`);
        const reader = res.body.getReader();
        const dec    = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.type === "status") {
                setAgentStatus(ev.content);
              } else if (ev.type === "final") {
                try {
                  const parsed = JSON.parse(ev.content);
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    setLiveJobs(parsed.map((j, i) => ({ ...j, id: i + 1 })));
                  }
                } catch {}
              } else if (ev.type === "error") {
                setAgentStatus("error");
              }
            } catch {}
          }
        }
      })
      .catch(() => setAgentStatus("error"));
  }, []);

  const isLoading   = agentStatus === "thinking" || agentStatus === "tool_calling";
  const statusMsg   = STATUS_MSG[agentStatus] ?? null;
  const allJobs     = liveJobs ?? [];
  const matchJobs   = allJobs.length > 0 ? allJobs.slice(0, 3)    : TODAY_MATCHES;
  const readyJobs   = allJobs.length > 3 ? allJobs.slice(3)       : READY_JOBS;
  const usingLive   = liveJobs !== null && liveJobs.length > 0;

  return (
    <div>
      <div className="home-hero">
        <div className="hero-orbs">
          <div className="hero-orb ho1"/><div className="hero-orb ho2"/><div className="hero-orb ho3"/>
        </div>
        <div className="hero-inner u0">
          <div className="hero-eyebrow"><div className="hero-dot"/>JobClaw · AI-powered job search</div>
          <div className="hero-h1">Your Job Search<br/><em>on autopilot.</em></div>
          <div className="hero-sub">
            JobClaw applies to <strong style={{color:"#fff",fontWeight:700}}>10× more roles</strong> in the time it takes you to update one resume manually — matching your profile to the right jobs, tailoring every application, and tracking every move. Your next offer is closer than you think.
          </div>
          <div className="hero-stats-row">
            <div className="hero-stat"><span className="hero-stat-num">10×</span><span className="hero-stat-lbl">more applications sent</span></div>
            <div className="hero-stat-div"/>
            <div className="hero-stat"><span className="hero-stat-num">3×</span><span className="hero-stat-lbl">faster interview rate</span></div>
            <div className="hero-stat-div"/>
            <div className="hero-stat"><span className="hero-stat-num">94%</span><span className="hero-stat-lbl">avg. match score today</span></div>
          </div>
          <div className="hero-actions">
            <button className="hero-btn-solid">✨ See today's matches</button>
            <button className="hero-btn-ghost" onClick={() => onNav("profile")}>👤 Complete your profile</button>
          </div>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {[...TICKER, ...TICKER].map((t, i) => (
              <div key={i} className="ticker-item"><div className="ticker-pip"/>{t}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="home-body">
        <div className="stats-row u1">
          {[
            { n:5,     l:"Applications",  c:"sblue"   },
            { n:1,     l:"Interviews",    c:"spurple"  },
            { n:3,     l:"New matches",   c:"sgreen"   },
            { n:"62%", l:"Profile score", c:"samber"   },
          ].map(s => (
            <div key={s.l} className={`stat-card ${s.c}`}>
              <div className="stat-num">{s.n}</div>
              <div className="stat-lbl">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="u2">
          <div className="sec-head">
            <h2>✨ Today's matches</h2>
            {statusMsg && (
              <span style={{fontSize:12, color:"var(--muted)", display:"flex", alignItems:"center", gap:6}}>
                {isLoading && <span className="mc-new-dot" style={{animation:"pulse 1.2s ease-in-out infinite"}}/>}
                {statusMsg}
              </span>
            )}
            {usingLive && !isLoading && (
              <span style={{fontSize:12, color:"var(--green)"}}>✓ Live results</span>
            )}
          </div>
          <div className="match-grid">
            {isLoading && liveJobs === null
              ? [1,2,3].map(i => (
                  <div key={i} className="match-card" style={{opacity:0.5}}>
                    <div className="mc-top">
                      <div className="mc-logo" style={{background:"var(--border2)",borderRadius:8,width:40,height:40}}/>
                      <div style={{width:40,height:32,background:"var(--border2)",borderRadius:6}}/>
                    </div>
                    <div style={{height:14,background:"var(--border2)",borderRadius:4,marginBottom:6,width:"70%"}}/>
                    <div style={{height:12,background:"var(--border2)",borderRadius:4,width:"50%"}}/>
                  </div>
                ))
              : matchJobs.map(job => (
                  <div key={job.id} className="match-card">
                    <div className="mc-top">
                      <div className="mc-logo">{job.logo ?? "💼"}</div>
                      <div style={{textAlign:"right"}}>
                        <div className="mc-pct" style={{color: ScoreColor(job.match)}}>{job.match}%</div>
                        <div className="mc-pct-lbl">match</div>
                      </div>
                    </div>
                    <div className="mc-role">{job.role}</div>
                    <div className="mc-co">{job.company} · {job.location}</div>
                    <div className="mc-tags">
                      {(job.tags ?? []).map(t => <span key={t} className="chip chip-p">{t}</span>)}
                      {job.isNew && <span className="chip chip-g">New</span>}
                    </div>
                    <div className="mc-foot">
                      <span className="mc-sal">{job.salary}</span>
                      <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--muted)"}}>
                        <div className="mc-new-dot"/>{job.posted}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
          <div style={{marginBottom:32}}/>
        </div>

        <div className="u3">
          <div className="sec-head"><h2>🚀 Ready to apply</h2></div>
          <div className="apply-list">
            {readyJobs.map(job => (
              <div key={job.id} className="apply-card">
                <div className="apply-logo">{job.logo ?? "💼"}</div>
                <div className="apply-info">
                  <div className="apply-role">{job.role}</div>
                  <div className="apply-sub">{job.company} · {job.location} · {job.salary}</div>
                </div>
                <div className="apply-right">
                  <div className="apply-pct">{job.match}%</div>
                  <button className="apply-action">Apply now →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="u4">
          <div className="sec-head">
            <h2>
              📡 Live job feed
              {newCount > 0 && (
                <span
                  className="chip chip-g"
                  style={{ marginLeft: 8, cursor: "pointer", fontSize: 11 }}
                  onClick={clearNewCount}
                >
                  {newCount} new
                </span>
              )}
            </h2>
            <button
              className="hero-btn-ghost"
              style={{ fontSize: 12, padding: "4px 12px" }}
              onClick={refresh}
              disabled={adzunaLoading}
            >
              {adzunaLoading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {adzunaLoading && adzunaJobs.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13, padding: "16px 0" }}>
              <span className="mc-new-dot" style={{ marginRight: 6, display: "inline-block" }} />
              Fetching listings from Adzuna…
            </div>
          ) : adzunaJobs.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 13, padding: "16px 0" }}>
              No listings yet — add your Adzuna API keys and complete your profile to see live results.
            </div>
          ) : (
            <div className="apply-list">
              {adzunaJobs.slice(0, 10).map((job, i) => {
                const j = normalizeAdzunaJob(job, i);
                return (
                  <div key={job.id} className="apply-card">
                    <div className="apply-logo">💼</div>
                    <div className="apply-info">
                      <div className="apply-role">
                        {j.role}
                        {j.isNew && (
                          <span className="chip chip-g" style={{ marginLeft: 8, fontSize: 10 }}>New</span>
                        )}
                      </div>
                      <div className="apply-sub">{j.company} · {j.location} · {j.salary}</div>
                      <div className="mc-tags" style={{ marginTop: 4 }}>
                        {j.tags.map(t => <span key={t} className="chip chip-p">{t}</span>)}
                      </div>
                    </div>
                    <div className="apply-right">
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{j.posted}</div>
                      {j.url
                        ? <a href={j.url} target="_blank" rel="noopener noreferrer" className="apply-action">View →</a>
                        : <button className="apply-action" disabled>View →</button>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="see-all-foot"><span className="see-all" onClick={() => onNav("jobs")} style={{ cursor: "pointer" }}>see all job listings →</span></div>
        </div>
      </div>
    </div>
  );
}
