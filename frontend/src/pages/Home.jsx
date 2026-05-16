import { TICKER, TODAY_MATCHES, READY_JOBS } from "../data/mockData";

function ScoreColor(n) {
  return n >= 90 ? "var(--green)" : n >= 80 ? "var(--amber)" : "var(--red)";
}

export default function Home({ onNav }) {
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
          <div className="sec-head"><h2>✨ Today's matches</h2></div>
          <div className="match-grid">
            {TODAY_MATCHES.map(job => (
              <div key={job.id} className="match-card">
                <div className="mc-top">
                  <div className="mc-logo">{job.logo}</div>
                  <div style={{textAlign:"right"}}>
                    <div className="mc-pct" style={{color: ScoreColor(job.match)}}>{job.match}%</div>
                    <div className="mc-pct-lbl">match</div>
                  </div>
                </div>
                <div className="mc-role">{job.role}</div>
                <div className="mc-co">{job.company} · {job.location}</div>
                <div className="mc-tags">
                  {job.tags.map(t => <span key={t} className="chip chip-p">{t}</span>)}
                  {job.isNew && <span className="chip chip-g">New</span>}
                </div>
                <div className="mc-foot">
                  <span className="mc-sal">{job.salary}</span>
                  <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"var(--muted)"}}>
                    <div className="mc-new-dot"/>{job.posted}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:32}}/>
        </div>

        <div className="u3">
          <div className="sec-head"><h2>🚀 Ready to apply</h2></div>
          <div className="apply-list">
            {READY_JOBS.map(job => (
              <div key={job.id} className="apply-card">
                <div className="apply-logo">{job.logo}</div>
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
          <div className="see-all-foot"><span className="see-all">see all job listings →</span></div>
        </div>
      </div>
    </div>
  );
}
