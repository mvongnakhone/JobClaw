import { useState, useEffect, useRef } from "react";
import { INIT_PROFILE } from "../data/mockData";
import { apiFetch } from "../lib/api";
import ContactModal    from "../components/modals/ContactModal";
import SocialModal     from "../components/modals/SocialModal";
import ExperienceModal from "../components/modals/ExperienceModal";
import EducationModal  from "../components/modals/EducationModal";
import ProjectModal    from "../components/modals/ProjectModal";
import VolunteeringModal from "../components/modals/VolunteeringModal";
import PrefsModal      from "../components/modals/PrefsModal";

export default function Profile() {
  const [profile, setProfile] = useState(INIT_PROFILE);
  const [modal, setModal]     = useState(null);
  const [skillInput, setSkillInput] = useState("");
  const profileLoaded = useRef(false);

  useEffect(() => {
    apiFetch("/profile")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setProfile(prev => ({ ...prev, ...data }));
        profileLoaded.current = true;
      })
      .catch(() => { profileLoaded.current = true; });
  }, []);

  useEffect(() => {
    if (!profileLoaded.current) return;
    apiFetch('/profile', {
      method: 'POST',
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
  function removeSkill(s)       { setProfile(p => ({ ...p, skills: p.skills.filter(x => x !== s) })); }
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
        <div className="p-avatar">{(profile.name || "?")[0]}</div>
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
          ].map(([k, v]) => (
            <div key={k} className="contact-row">
              <div className="c-key">{k}</div>
              <div className={`c-val ${v ? "" : "empty"}`}>{v || "Not set"}</div>
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
          ].map(([l, v]) => (
            <div key={l} className="pref-item">
              <div className="pref-label">{l}</div>
              <div className={`pref-val ${v ? "" : "empty"}`}>{v || "Not set"}</div>
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
              <button className="ibt" onClick={() => openModal("experience", { ...exp })}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("experience", exp.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.experience.length ? 12 : 0}}
          onClick={() => openModal("experience", {})}>+ Add experience</button>
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
              <button className="ibt" onClick={() => openModal("education", { ...ed })}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("education", ed.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.education.length ? 12 : 0}}
          onClick={() => openModal("education", {})}>+ Add education</button>
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
          <input className="inp" style={{maxWidth:300}} placeholder="Add a skill (press Enter)"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); }}} />
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
              <button className="ibt" onClick={() => openModal("project", { ...proj })}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("projects", proj.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.projects.length ? 12 : 0}}
          onClick={() => openModal("project", {})}>+ Add project</button>
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
              <button className="ibt" onClick={() => openModal("volunteering", { ...v })}>✏️</button>
              <button className="ibt red" onClick={() => deleteItem("volunteering", v.id)}>🗑️</button>
            </div>
          </div>
        ))}
        <button className="add-row" style={{marginTop: profile.volunteering?.length ? 12 : 0}}
          onClick={() => openModal("volunteering", {})}>+ Add volunteering</button>
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
