import { useState, useEffect, useRef } from "react";
import './App.css';

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const TICKER = [
  "📈 94% match at Stripe — your resume is ready",
  "🆕 3 new roles match your profile today",
  "⚡ Linear posted Group PM just 1 day ago",
  "🎯 GitHub hiring Senior PM, Dev UX — 87% match",
  "📬 Notion — application viewed by recruiter",
  "💡 Add your summary to boost match score by 12%",
  "🚀 Twilio looking for PM, APIs — 91% fit",
];

const TODAY_MATCHES = [
  { id:1, logo:"💳", role:"Senior Product Manager", company:"Stripe",  location:"Remote", match:96, salary:"$170–210k", tags:["Payments","API"],     posted:"2d ago", isNew:true },
  { id:2, logo:"📝", role:"Product Manager II",     company:"Notion",  location:"SF, CA", match:88, salary:"$140–175k", tags:["Growth","SaaS"],      posted:"4d ago", isNew:true },
  { id:3, logo:"⚡", role:"Group PM, Growth",       company:"Linear",  location:"Remote", match:84, salary:"$160–195k", tags:["Dev Tools","Remote"], posted:"1d ago", isNew:true },
];

const READY_JOBS = [
  { id:4, logo:"📞", role:"PM, API Platform",  company:"Twilio", location:"Remote", match:91, salary:"$155–185k" },
  { id:5, logo:"🐙", role:"Senior PM, Dev UX", company:"GitHub", location:"Remote", match:87, salary:"$160–200k" },
];

const INIT_PROFILE = {
  id:           "uuid-placeholder",
  email:        "jane@smith.dev",
  name:         "Jane Smith",
  phone:        "(415) 555-0192",
  location:     "San Francisco, CA",
  linkedin_url: "linkedin.com/in/janesmith",
  github_url:   "github.com/janesmith",
  created_at:   "2025-01-15T00:00:00Z",
  education: [
    { id:1, degree:"BS Computer Science", school:"UC Berkeley", start:"2015", end:"2019", gpa:"3.8", notes:"Graduated with Honors" },
  ],
  experience: [
    { id:1, title:"Senior Product Manager", company:"Acme Corp", type:"Full-time", start:"Jan 2022", end:"Present",  location:"SF, CA", desc:"Led 0→1 launch of API platform serving 50k developers. Grew developer signups 3× through targeted onboarding redesign. Managed roadmap across 4 engineering teams." },
    { id:2, title:"Product Manager II",     company:"Beta Inc",  type:"Full-time", start:"Mar 2019", end:"Dec 2021", location:"Remote", desc:"Shipped payments v2, reducing fraud by 34%. Ran 40+ A/B experiments. Grew revenue by $8M ARR." },
  ],
  projects: [
    { id:1, name:"DevDash", url:"github.com/janesmith/devdash", desc:"Open-source developer metrics dashboard. 1.2k GitHub stars.", tags:["React","Python","OSS"] },
  ],
  skills: ["Product Strategy","Roadmapping","SQL","Figma","A/B Testing","Stakeholder Management","Go-to-Market","User Research","API Design"],
  headline:      "Senior Product Manager · Developer Tools & APIs",
  portfolio_url: "",
  twitter_url:   "",
  job_prefs: {
    roles:        "Senior PM, Group PM",
    work_type:    "Remote / Hybrid",
    job_type:     "Full-time",
    salary_min:   "$150k",
    locations:    "SF Bay Area, Remote",
    industries:   "Developer Tools, Fintech, SaaS",
    open_to:      "Open to relocation",
    availability: "2 weeks notice",
  },
  volunteering: [
    { id:1, role:"Mentor", org:"Out in Tech", start:"Jan 2023", end:"Present", desc:"Mentoring LGBTQ+ professionals transitioning into tech product roles." },
  ],
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function ScoreColor(n) {
  return n >= 90 ? "var(--green)" : n >= 80 ? "var(--amber)" : "var(--red)";
}

function Modal({ title, onClose, children, foot }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-fields">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL COMPONENTS
   (each is a proper component so hooks are
    never called conditionally)
───────────────────────────────────────────── */
function ContactModal({ profile, onClose, onSave }) {
  const [f, setF] = useState({ name: profile.name, email: profile.email, phone: profile.phone, location: profile.location, headline: profile.headline });
  return (
    <Modal title="Edit Contact Info" onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save changes</button></>}>
      {[["name","Full name","Jane Smith"],["email","Email","jane@example.com"],["phone","Phone","(415) 555-0192"],["location","Location","San Francisco, CA"],["headline","Headline","Senior PM · Developer Tools"]].map(([k,l,p]) => (
        <div className="field" key={k}><label className="lbl">{l}</label><input className="inp" placeholder={p} value={f[k]||""} onChange={e => setF(x => ({...x,[k]:e.target.value}))}/></div>
      ))}
    </Modal>
  );
}

function SocialModal({ profile, onClose, onSave }) {
  const [f, setF] = useState({ linkedin_url: profile.linkedin_url, github_url: profile.github_url, portfolio_url: profile.portfolio_url, twitter_url: profile.twitter_url });
  return (
    <Modal title="Edit Social Links" onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save changes</button></>}>
      {[["linkedin_url","LinkedIn URL","linkedin.com/in/yourname"],["github_url","GitHub URL","github.com/yourname"],["portfolio_url","Portfolio / Website","yoursite.com"],["twitter_url","Twitter / X","twitter.com/yourname"]].map(([k,l,p]) => (
        <div className="field" key={k}><label className="lbl">{l}</label><input className="inp" placeholder={p} value={f[k]||""} onChange={e => setF(x => ({...x,[k]:e.target.value}))}/></div>
      ))}
    </Modal>
  );
}

function ExperienceModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ title:"", company:"", type:"Full-time", start:"", end:"", location:"", desc:"", ...data });
  return (
    <Modal title={data.id ? "Edit Experience" : "Add Experience"} onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button></>}>
      <div className="g2">
        <div className="field"><label className="lbl">Job title</label><input className="inp" placeholder="Senior PM" value={f.title} onChange={e => setF(x=>({...x,title:e.target.value}))}/></div>
        <div className="field"><label className="lbl">Company</label><input className="inp" placeholder="Acme Corp" value={f.company} onChange={e => setF(x=>({...x,company:e.target.value}))}/></div>
      </div>
      <div className="g2">
        <div className="field"><label className="lbl">Start</label><input className="inp" placeholder="Jan 2022" value={f.start} onChange={e => setF(x=>({...x,start:e.target.value}))}/></div>
        <div className="field"><label className="lbl">End</label><input className="inp" placeholder="Present" value={f.end} onChange={e => setF(x=>({...x,end:e.target.value}))}/></div>
      </div>
      <div className="g2">
        <div className="field">
          <label className="lbl">Type</label>
          <select className="sel" value={f.type} onChange={e => setF(x=>({...x,type:e.target.value}))}>
            {["Full-time","Part-time","Contract","Internship","Freelance"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field"><label className="lbl">Location</label><input className="inp" placeholder="SF, CA / Remote" value={f.location} onChange={e => setF(x=>({...x,location:e.target.value}))}/></div>
      </div>
      <div className="field"><label className="lbl">Description / Bullets</label><textarea className="txta" rows={4} placeholder="Describe your impact, metrics, key projects…" value={f.desc} onChange={e => setF(x=>({...x,desc:e.target.value}))}/></div>
    </Modal>
  );
}

function EducationModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ degree:"", school:"", start:"", end:"", gpa:"", notes:"", ...data });
  return (
    <Modal title={data.id ? "Edit Education" : "Add Education"} onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button></>}>
      <div className="field"><label className="lbl">Degree / Credential</label><input className="inp" placeholder="BS Computer Science" value={f.degree} onChange={e => setF(x=>({...x,degree:e.target.value}))}/></div>
      <div className="field"><label className="lbl">School / Institution</label><input className="inp" placeholder="UC Berkeley" value={f.school} onChange={e => setF(x=>({...x,school:e.target.value}))}/></div>
      <div className="g2">
        <div className="field"><label className="lbl">Start year</label><input className="inp" placeholder="2015" value={f.start} onChange={e => setF(x=>({...x,start:e.target.value}))}/></div>
        <div className="field"><label className="lbl">End year</label><input className="inp" placeholder="2019" value={f.end} onChange={e => setF(x=>({...x,end:e.target.value}))}/></div>
      </div>
      <div className="g2">
        <div className="field"><label className="lbl">GPA (optional)</label><input className="inp" placeholder="3.8" value={f.gpa} onChange={e => setF(x=>({...x,gpa:e.target.value}))}/></div>
        <div className="field"><label className="lbl">Notes</label><input className="inp" placeholder="Honors, Dean's List…" value={f.notes} onChange={e => setF(x=>({...x,notes:e.target.value}))}/></div>
      </div>
    </Modal>
  );
}

function ProjectModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ name:"", url:"", desc:"", tags:"", ...data, tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags||"") });
  return (
    <Modal title={data.id ? "Edit Project" : "Add Project"} onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave({...f, tags: f.tags.split(",").map(t=>t.trim()).filter(Boolean)})}>Save</button></>}>
      <div className="field"><label className="lbl">Project name</label><input className="inp" placeholder="DevDash" value={f.name} onChange={e => setF(x=>({...x,name:e.target.value}))}/></div>
      <div className="field"><label className="lbl">URL / Link</label><input className="inp" placeholder="github.com/you/project" value={f.url} onChange={e => setF(x=>({...x,url:e.target.value}))}/></div>
      <div className="field"><label className="lbl">Description</label><textarea className="txta" rows={3} placeholder="What it does, impact, stars…" value={f.desc} onChange={e => setF(x=>({...x,desc:e.target.value}))}/></div>
      <div className="field"><label className="lbl">Tags (comma separated)</label><input className="inp" placeholder="React, Python, Open Source" value={f.tags} onChange={e => setF(x=>({...x,tags:e.target.value}))}/></div>
    </Modal>
  );
}

function VolunteeringModal({ data, onClose, onSave }) {
  const [f, setF] = useState({ role:"", org:"", start:"", end:"", desc:"", ...data });
  return (
    <Modal title={data.id ? "Edit Volunteering" : "Add Volunteering"} onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button></>}>
      <div className="g2">
        <div className="field"><label className="lbl">Role</label><input className="inp" placeholder="Mentor" value={f.role} onChange={e => setF(x=>({...x,role:e.target.value}))}/></div>
        <div className="field"><label className="lbl">Organization</label><input className="inp" placeholder="Out in Tech" value={f.org} onChange={e => setF(x=>({...x,org:e.target.value}))}/></div>
      </div>
      <div className="g2">
        <div className="field"><label className="lbl">Start</label><input className="inp" placeholder="Jan 2023" value={f.start} onChange={e => setF(x=>({...x,start:e.target.value}))}/></div>
        <div className="field"><label className="lbl">End</label><input className="inp" placeholder="Present" value={f.end} onChange={e => setF(x=>({...x,end:e.target.value}))}/></div>
      </div>
      <div className="field"><label className="lbl">Description</label><textarea className="txta" rows={3} value={f.desc} onChange={e => setF(x=>({...x,desc:e.target.value}))}/></div>
    </Modal>
  );
}

function PrefsModal({ prefs, onClose, onSave }) {
  const [f, setF] = useState({ ...prefs });
  return (
    <Modal title="Job Preferences" onClose={onClose}
      foot={<><button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button><button className="btn btn-grad btn-sm" onClick={() => onSave(f)}>Save</button></>}>
      {[
        ["roles","Target roles","Senior PM, Group PM, Director of Product"],
        ["industries","Industries","Developer Tools, Fintech, SaaS"],
        ["locations","Preferred locations","SF Bay Area, NYC, Remote"],
        ["salary_min","Minimum salary","$150k"],
        ["availability","Availability","2 weeks notice"],
        ["open_to","Open to relocation?","Yes / No / Specific cities"],
      ].map(([k,l,p]) => (
        <div className="field" key={k}><label className="lbl">{l}</label><input className="inp" placeholder={p} value={f[k]||""} onChange={e => setF(x=>({...x,[k]:e.target.value}))}/></div>
      ))}
      <div className="g2">
        <div className="field">
          <label className="lbl">Work type</label>
          <select className="sel" value={f.work_type||""} onChange={e => setF(x=>({...x,work_type:e.target.value}))}>
            {["Remote","Hybrid","On-site","Remote / Hybrid","Flexible"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="lbl">Job type</label>
          <select className="sel" value={f.job_type||""} onChange={e => setF(x=>({...x,job_type:e.target.value}))}>
            {["Full-time","Part-time","Contract","Internship"].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════ */
function Home({ onNav }) {
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

/* ═══════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════ */
function Profile() {
  const [profile, setProfile] = useState(INIT_PROFILE);
  const [modal, setModal]     = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const profileLoaded = useRef(false);

  // Load profile from backend on mount
  useEffect(() => {
    fetch(`/profile/${INIT_PROFILE.email}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setProfile(prev => ({ ...prev, ...data }));
        profileLoaded.current = true;
      })
      .catch(() => { profileLoaded.current = true; });
  }, []);

  // Auto-save to backend whenever profile changes (skips the initial load)
  useEffect(() => {
    if (!profileLoaded.current) return;
    fetch('/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    }).catch(err => console.error('Profile save failed:', err));
  }, [profile]);

  const close     = () => setModal(null);
  const openModal = (type, data = {}) => setModal({ type, data });

  function addSkill() {
    const s = skillInput.trim();
    if (s && !profile.skills.includes(s)) setProfile(p => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput("");
  }
  function removeSkill(s) { setProfile(p => ({ ...p, skills: p.skills.filter(x => x !== s) })); }
  function deleteItem(section, id) { setProfile(p => ({ ...p, [section]: p[section].filter(x => x.id !== id) })); }
  function saveItem(section, item) {
    setProfile(p => ({
      ...p,
      [section]: item.id && p[section].find(x => x.id === item.id)
        ? p[section].map(x => x.id === item.id ? item : x)
        : [...p[section], { ...item, id: Date.now() }],
    }));
    close();
  }
  function saveContact(data) { setProfile(p => ({ ...p, ...data })); close(); }
  function savePrefs(data)   { setProfile(p => ({ ...p, job_prefs: { ...p.job_prefs, ...data } })); close(); }
  function saveSocial(data)  { setProfile(p => ({ ...p, ...data })); close(); }

  function renderModal() {
    if (!modal) return null;
    const { type, data } = modal;
    if (type === "contact")      return <ContactModal     profile={profile} onClose={close} onSave={saveContact} />;
    if (type === "social")       return <SocialModal      profile={profile} onClose={close} onSave={saveSocial} />;
    if (type === "experience")   return <ExperienceModal  data={data} onClose={close} onSave={item => saveItem("experience", item)} />;
    if (type === "education")    return <EducationModal   data={data} onClose={close} onSave={item => saveItem("education", item)} />;
    if (type === "project")      return <ProjectModal     data={data} onClose={close} onSave={item => saveItem("projects", item)} />;
    if (type === "volunteering") return <VolunteeringModal data={data} onClose={close} onSave={item => saveItem("volunteering", item)} />;
    if (type === "prefs")        return <PrefsModal       prefs={profile.job_prefs} onClose={close} onSave={savePrefs} />;
    return null;
  }

  return (
    <div className="profile-page">
      {renderModal()}

      <div className="profile-hero u0">
        <div className="p-avatar">{(profile.name||"?")[0]}</div>
        <div className="p-info">
          <div className="p-name">{profile.name || "Your Name"}</div>
          <div className="p-headline">{profile.headline || <span style={{color:"var(--muted2)",fontStyle:"italic"}}>Add a headline</span>}</div>
          <div className="p-links">
            {profile.linkedin_url
              ? <a className="p-link" href={`https://${profile.linkedin_url}`} target="_blank" rel="noreferrer">🔗 LinkedIn</a>
              : <span className="p-link empty" onClick={() => openModal("social")}>+ Add LinkedIn</span>}
            {profile.github_url
              ? <a className="p-link gh" href={`https://${profile.github_url}`} target="_blank" rel="noreferrer">🐙 GitHub</a>
              : <span className="p-link empty" onClick={() => openModal("social")}>+ Add GitHub</span>}
            {profile.portfolio_url && <a className="p-link" href={`https://${profile.portfolio_url}`} target="_blank" rel="noreferrer">🌐 Portfolio</a>}
          </div>
        </div>
        <div className="p-edit-hero">
          <button className="btn btn-out btn-sm" onClick={() => openModal("contact")}>✏️ Edit</button>
        </div>
      </div>

      <div className="p-section u2">
        <div className="p-sec-head">
          <h3>Contact Information</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => openModal("contact")}>✏️ Edit</button>
        </div>
        <div className="contact-grid">
          {[
            ["Email",        profile.email],
            ["Phone",        profile.phone],
            ["Location",     profile.location],
            ["Member since", new Date(profile.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"})],
          ].map(([k,v]) => (
            <div key={k} className="contact-row">
              <div className="c-key">{k}</div>
              <div className={`c-val ${v?"":"empty"}`}>{v || "Not set"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-section u2">
        <div className="p-sec-head">
          <h3>Job Preferences</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => openModal("prefs")}>✏️ Edit</button>
        </div>
        <div className="prefs-grid">
          {[
            ["Target roles",   profile.job_prefs.roles],
            ["Work type",      profile.job_prefs.work_type],
            ["Job type",       profile.job_prefs.job_type],
            ["Min salary",     profile.job_prefs.salary_min],
            ["Locations",      profile.job_prefs.locations],
            ["Industries",     profile.job_prefs.industries],
            ["Open to reloc.", profile.job_prefs.open_to],
            ["Availability",   profile.job_prefs.availability],
          ].map(([l,v]) => (
            <div key={l} className="pref-item">
              <div className="pref-label">{l}</div>
              <div className={`pref-val ${v?"":"empty"}`}>{v || "Not set"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-section u3">
        <div className="p-sec-head">
          <h3>Work Experience</h3>
          <button className="btn btn-grad btn-sm" onClick={() => openModal("experience", {})}>+ Add</button>
        </div>
        {profile.experience.length === 0 && (
          <div style={{textAlign:"center",padding:"28px 0",color:"var(--muted2)",fontSize:13}}>No experience added yet</div>
        )}
        {profile.experience.map(exp => (
          <div key={exp.id} className="p-item">
            <div className="p-item-dot"/>
            <div className="p-item-body">
              <div className="p-item-title">{exp.title}</div>
              <div className="p-item-sub">{exp.company}{exp.location ? ` · ${exp.location}` : ""}{exp.type ? ` · ${exp.type}` : ""}</div>
              <div className="p-item-date">{exp.start} – {exp.end}</div>
              {exp.desc && <div className="p-item-desc">{exp.desc}</div>}
            </div>
            <div className="p-item-actions">
              <button className="ibt" onClick={() => openModal("experience", {...exp})}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("experience", exp.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.experience.length ? 12 : 0}} onClick={() => openModal("experience", {})}>+ Add experience</button>
      </div>

      <div className="p-section u3">
        <div className="p-sec-head">
          <h3>Education</h3>
          <button className="btn btn-grad btn-sm" onClick={() => openModal("education", {})}>+ Add</button>
        </div>
        {profile.education.map(ed => (
          <div key={ed.id} className="p-item">
            <div className="p-item-dot"/>
            <div className="p-item-body">
              <div className="p-item-title">{ed.degree}</div>
              <div className="p-item-sub">{ed.school}</div>
              <div className="p-item-date">{ed.start} – {ed.end}{ed.gpa ? ` · GPA ${ed.gpa}` : ""}</div>
              {ed.notes && <div className="p-item-desc">{ed.notes}</div>}
            </div>
            <div className="p-item-actions">
              <button className="ibt" onClick={() => openModal("education", {...ed})}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("education", ed.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.education.length ? 12 : 0}} onClick={() => openModal("education", {})}>+ Add education</button>
      </div>

      <div className="p-section u4">
        <div className="p-sec-head">
          <h3>Skills</h3>
          <span style={{fontSize:12,color:"var(--muted)"}}>{profile.skills.length} skills added</span>
        </div>
        <div className="skills-cloud" style={{marginBottom:14}}>
          {profile.skills.map(s => (
            <div key={s} className="skill-pill">
              {s}<span className="skill-x" onClick={() => removeSkill(s)}>✕</span>
            </div>
          ))}
          {profile.skills.length === 0 && <span style={{fontSize:13,color:"var(--muted2)",fontStyle:"italic"}}>No skills added yet</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input className="inp" style={{maxWidth:300}} placeholder="Add a skill (press Enter)" value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if(e.key === "Enter") { e.preventDefault(); addSkill(); }}}/>
          <button className="btn btn-out btn-sm" onClick={addSkill}>Add</button>
        </div>
      </div>

      <div className="p-section u4">
        <div className="p-sec-head">
          <h3>Projects</h3>
          <button className="btn btn-grad btn-sm" onClick={() => openModal("project", {})}>+ Add</button>
        </div>
        {profile.projects.map(proj => (
          <div key={proj.id} className="p-item">
            <div className="p-item-dot"/>
            <div className="p-item-body">
              <div className="p-item-title">{proj.name}</div>
              {proj.url && <div className="p-item-sub" style={{color:"var(--blue)"}}>{proj.url}</div>}
              {proj.desc && <div className="p-item-desc" style={{marginTop:4}}>{proj.desc}</div>}
              {proj.tags?.length > 0 && (
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>
                  {proj.tags.map(t => <span key={t} className="chip chip-b">{t}</span>)}
                </div>
              )}
            </div>
            <div className="p-item-actions">
              <button className="ibt" onClick={() => openModal("project", {...proj})}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("projects", proj.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.projects.length ? 12 : 0}} onClick={() => openModal("project", {})}>+ Add project</button>
      </div>

      <div className="p-section u5">
        <div className="p-sec-head">
          <h3>Volunteering</h3>
          <button className="btn btn-grad btn-sm" onClick={() => openModal("volunteering", {})}>+ Add</button>
        </div>
        {profile.volunteering?.map(v => (
          <div key={v.id} className="p-item">
            <div className="p-item-dot"/>
            <div className="p-item-body">
              <div className="p-item-title">{v.role}</div>
              <div className="p-item-sub">{v.org}</div>
              <div className="p-item-date">{v.start} – {v.end}</div>
              {v.desc && <div className="p-item-desc">{v.desc}</div>}
            </div>
            <div className="p-item-actions">
              <button className="ibt" onClick={() => openModal("volunteering", {...v})}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("volunteering", v.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.volunteering?.length ? 12 : 0}} onClick={() => openModal("volunteering", {})}>+ Add volunteering</button>
      </div>

      <div className="p-section u5">
        <div className="p-sec-head">
          <h3>Links & Social</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => openModal("social")}>✏️ Edit</button>
        </div>
        <div className="social-rows">
          {[
            { key:"linkedin_url",  icon:"🔗", cls:"si-li", label:"LinkedIn"  },
            { key:"github_url",    icon:"🐙", cls:"si-gh", label:"GitHub"    },
            { key:"portfolio_url", icon:"🌐", cls:"si-we", label:"Portfolio" },
            { key:"twitter_url",   icon:"🐦", cls:"si-tw", label:"Twitter/X" },
          ].map(row => (
            <div key={row.key} className="social-row">
              <div className={`social-icon ${row.cls}`}>{row.icon}</div>
              <div className="social-meta">
                <div className="social-platform">{row.label}</div>
                <div className={`social-url ${profile[row.key] ? "" : "empty"}`}>
                  {profile[row.key] || "Not added yet"}
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => openModal("social")}>
                {profile[row.key] ? "Edit" : "+ Add"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AGENT TEST PAGE
═══════════════════════════════════════════════ */
const STATUS_LABEL = { idle:"idle", thinking:"thinking", tool_calling:"calling tool", done:"done", error:"error" };

function AgentTest() {
  const [task, setTask]       = useState("");
  const [events, setEvents]   = useState([]);
  const [status, setStatus]   = useState("idle");
  const [running, setRunning] = useState(false);
  const bottomRef             = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [events]);

  async function handleRun(e) {
    e.preventDefault();
    if (!task.trim() || running) return;
    setEvents([]); setStatus("thinking"); setRunning(true);
    try {
      const res = await fetch("/run", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ task }) });
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
            if (ev.type === "status") setStatus(ev.content);
            else setEvents(p => [...p, { ...ev, id: crypto.randomUUID() }]);
          } catch {}
        }
      }
    } catch (err) {
      setEvents(p => [...p, { type:"error", content: err.message, id: crypto.randomUUID() }]);
      setStatus("error");
    } finally { setRunning(false); }
  }

  return (
    <div style={{ maxWidth:760, margin:"0 auto", padding:"40px 24px" }}>
      <h2 style={{ fontFamily:"var(--font-d)", fontSize:28, marginBottom:6 }}>NemoClaw Agent <em>test</em></h2>
      <p style={{ color:"var(--muted)", fontSize:13, marginBottom:24 }}>Type any task and watch the agent stream its reasoning live.</p>
      <form onSubmit={handleRun} style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <textarea className="task-input" rows={3} placeholder="e.g. What are the top 3 AI startups in 2025?"
          value={task} onChange={e => setTask(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleRun(e); }}
          disabled={running} style={{ width:"100%", resize:"vertical" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:12, color:"var(--muted)" }}>
            Status: <strong style={{ color: status === "error" ? "var(--red)" : status === "done" ? "var(--green)" : "var(--blue)" }}>
              {STATUS_LABEL[status] || status}
            </strong>
          </span>
          <button type="submit" className="btn btn-grad" disabled={running || !task.trim()}>
            {running ? "running…" : "run agent →"}
          </button>
        </div>
      </form>

      {events.length > 0 && (
        <div style={{ marginTop:24, display:"flex", flexDirection:"column", gap:6 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ padding:"10px 14px", borderRadius:8, background:"var(--surf2)", borderLeft:`3px solid ${
              ev.type === "final" ? "var(--green)" : ev.type === "error" ? "var(--red)" : ev.type === "tool_call" || ev.type === "tool_result" ? "var(--blue)" : "var(--border2)"
            }`, fontSize:13 }}>
              <span style={{ fontWeight:700, marginRight:8, textTransform:"uppercase", fontSize:10, letterSpacing:".08em", color:"var(--muted)" }}>{ev.type}</span>
              <span style={{ color:"var(--ink)", whiteSpace:"pre-wrap" }}>{ev.content ?? JSON.stringify(ev.args ?? ev)}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════ */
const NAV = [
  { id:"home",    label:"Home"    },
  { id:"profile", label:"Profile" },
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
